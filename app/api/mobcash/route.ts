import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { notifyMobcashRequest } from '@/lib/services/notification-service';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, amount, bookmaker, bookmaker_id, phone, full_name, email, notes } = body as {
      type?: string;
      amount?: number;
      bookmaker?: string;
      bookmaker_id?: string;
      phone?: string;
      full_name?: string;
      email?: string;
      notes?: string;
    };

    if (!type || !amount || !bookmaker_id?.trim() || !phone?.trim() || !full_name?.trim()) {
      return NextResponse.json(
        { error: 'type, montant, ID bookmaker, téléphone et nom requis' },
        { status: 400 }
      );
    }

    if (!['depot', 'retrait'].includes(type)) {
      return NextResponse.json({ error: 'Type invalide' }, { status: 400 });
    }

    if (amount <= 0 || amount > 1_000_000) {
      return NextResponse.json({ error: 'Montant invalide' }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('mobcash_requests')
      .insert({
        type,
        amount,
        bookmaker: bookmaker || '1xbet',
        bookmaker_id: bookmaker_id.trim(),
        phone: phone.trim(),
        full_name: full_name.trim(),
        email: email?.trim() || null,
        notes: notes?.trim() || null,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      console.error('[MobCash] DB Error:', error);
      return NextResponse.json({ error: 'Erreur lors de l\'enregistrement' }, { status: 500 });
    }

    // Notifier l'admin par email
    await notifyMobcashRequest({
      requestId: data.id,
      type: type as 'depot' | 'retrait',
      amount,
      bookmaker: bookmaker || '1xbet',
      bookmakerId: bookmaker_id.trim(),
      phone: phone.trim(),
      fullName: full_name.trim(),
      email: email?.trim(),
      notes: notes?.trim(),
    });

    return NextResponse.json({ success: true, id: data.id });
  } catch (err) {
    console.error('[MobCash] Unexpected error:', err);
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}
