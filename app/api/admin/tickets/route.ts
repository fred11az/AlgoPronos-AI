import { NextRequest, NextResponse } from 'next/server';
import { createClient, getCurrentUser, checkIsAdmin } from '@/lib/supabase/server';
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

  const supabase = await createClient();

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

  const supabase = await createClient();

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

  // Notifier les utilisateurs inscrits si demandé
  let notified = 0;

  if (notify_users) {
    // Récupérer les profils avec notification résultats activée
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, email, full_name, phone, metadata')
      .not('email', 'is', null);

    if (profiles && profiles.length > 0) {
      const matches: TicketMatch[] = (ticket.matches || []).map((m: {
        home_team: string;
        away_team: string;
        prediction?: string;
        recommended_bet?: string;
        total_odds?: number;
        odds?: number;
      }) => ({
        home_team: m.home_team,
        away_team: m.away_team,
        prediction: m.prediction || m.recommended_bet || '',
        odds: m.total_odds || m.odds || 0,
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
