import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getCurrentUser, checkIsAdmin, createAdminClient } from '@/lib/supabase/server';
import { notifyTicketResult, TicketMatch } from '@/lib/services/notification-service';

export const dynamic = 'force-dynamic';

// ─── GET — liste des tickets ────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const isAdmin = await checkIsAdmin(user.id);
  if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') || 'all';
  const limit  = parseInt(searchParams.get('limit') || '30');

  const supabase = createAdminClient();

  let query = supabase
    .from('daily_ticket')
    .select('*')
    .order('date', { ascending: false })
    .limit(limit);

  if (status !== 'all') {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ tickets: data || [] });
}

// ─── POST — créer un ticket manuellement ────────────────────────────────────
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const isAdmin = await checkIsAdmin(user.id);
  if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const { date, matches, confidence_pct, risk_level, replace } = body as {
    date: string;
    matches: Array<{
      home_team: string;
      away_team: string;
      league?: string;
      prediction: string;
      odds: number;
    }>;
    confidence_pct?: number;
    risk_level?: string;
    replace?: boolean;
  };

  if (!date || !matches || matches.length === 0) {
    return NextResponse.json({ error: 'date et matches (min 1) requis' }, { status: 400 });
  }

  // Valider les matchs
  for (const m of matches) {
    if (!m.home_team || !m.away_team || !m.prediction || !m.odds) {
      return NextResponse.json(
        { error: 'Chaque match doit avoir home_team, away_team, prediction et odds' },
        { status: 400 }
      );
    }
    if (m.odds <= 0) {
      return NextResponse.json({ error: 'Les cotes doivent être > 0' }, { status: 400 });
    }
  }

  // Calculer la cote totale
  const total_odds = parseFloat(
    matches.reduce((acc, m) => acc * m.odds, 1).toFixed(2)
  );

  const supabase = createAdminClient();

  // Vérifier si un ticket existe déjà pour cette date
  const { data: existing } = await supabase
    .from('daily_ticket')
    .select('id')
    .eq('date', date)
    .maybeSingle();

  if (existing && !replace) {
    return NextResponse.json(
      { error: `Un ticket existe déjà pour le ${date}. Utilisez replace:true pour le remplacer.`, existing_id: existing.id },
      { status: 409 }
    );
  }

  if (existing && replace) {
    await supabase.from('daily_ticket').delete().eq('date', date);
  }

  // Formater les matchs pour le stockage
  const formattedMatches = matches.map(m => ({
    home_team: m.home_team,
    away_team: m.away_team,
    league: m.league || '',
    prediction: m.prediction,
    odds: m.odds,
    // Compatibilité avec l'affichage côté client
    homeTeam: m.home_team,
    awayTeam: m.away_team,
    selection: { value: m.prediction, odds: m.odds },
  }));

  const { data: ticket, error } = await supabase
    .from('daily_ticket')
    .insert({
      date,
      matches: formattedMatches,
      total_odds,
      confidence_pct: confidence_pct ?? 75,
      risk_level: risk_level || 'balanced',
      status: 'pending',
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, ticket }, { status: 201 });
}

// ─── PATCH — résoudre un ticket + notifier les users ───────────────────────
export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const isAdmin = await checkIsAdmin(user.id);
  if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const { id, status, result_notes, notify_users } = body as {
    id: string;
    status: 'won' | 'lost' | 'void';
    result_notes?: string;
    notify_users?: boolean;
  };

  if (!id || !['won', 'lost', 'void'].includes(status)) {
    return NextResponse.json({ error: 'id et status (won|lost|void) requis' }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Récupérer le ticket avant mise à jour
  const { data: ticket, error: fetchErr } = await supabase
    .from('daily_ticket')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchErr || !ticket) {
    return NextResponse.json({ error: 'Ticket introuvable' }, { status: 404 });
  }

  // Mettre à jour le statut
  const { error: updateErr } = await supabase
    .from('daily_ticket')
    .update({
      status,
      result_notes: result_notes || null,
      resolved_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  // Forcer la revalidation des pages publiques qui affichent le statut du ticket
  revalidatePath('/');
  revalidatePath('/classement');
  revalidatePath('/historique');

  // Notifier les utilisateurs inscrits si demandé
  let notified = 0;

  if (notify_users) {
    // Récupérer les profils avec notification résultats activée
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, email, full_name, phone, metadata')
      .not('email', 'is', null);

    if (profiles && profiles.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const matches: TicketMatch[] = (ticket.matches || []).map((m: any) => ({
        // Tickets IA stockent homeTeam/awayTeam (camelCase), tickets admin stockent home_team/away_team
        home_team: m.home_team || m.homeTeam || '',
        away_team: m.away_team || m.awayTeam || '',
        prediction: m.prediction || m.recommended_bet ||
          (m.selection ? `${m.selection.type} ${m.selection.value}` : '') || '',
        odds: m.odds || m.total_odds || m.selection?.odds || 0,
      }));

      // Notifier en parallèle (max 10 à la fois pour éviter rate limits)
      const eligible = profiles.filter(p => {
        const meta = p.metadata as Record<string, unknown> | null;
        // Par défaut on notifie si la pref n'est pas explicitement désactivée
        return !meta || meta.notify_results !== false;
      });

      const batches: typeof eligible[] = [];
      for (let i = 0; i < eligible.length; i += 10) {
        batches.push(eligible.slice(i, i + 10));
      }

      for (const batch of batches) {
        await Promise.all(
          batch.map(p =>
            notifyTicketResult({
              userEmail: p.email,
              userName: p.full_name,
              userPhone: p.phone,
              date: ticket.date,
              status,
              totalOdds: ticket.total_odds || 0,
              matches,
              resultNotes: result_notes,
            })
          )
        );
        notified += batch.length;
      }
    }
  }

  return NextResponse.json({
    success: true,
    status,
    notified,
  });
}
