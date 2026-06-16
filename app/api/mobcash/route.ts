import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { notifyMobcashRequest } from '@/lib/services/notification-service';
import { initiateDeposit, FEDAPAY_COLLECTION_MODES } from '@/lib/fedapay-client';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, amount, bookmaker_id, phone, network, full_name, withdraw_code, notes } = body as {
      type?: string;
      amount?: number;
      bookmaker_id?: string;
      phone?: string;
      network?: string;
      full_name?: string;
      withdraw_code?: string;
      notes?: string;
    };

    if (!type || !amount || !bookmaker_id?.trim() || !phone?.trim() || !full_name?.trim() || !network?.trim()) {
      return NextResponse.json(
        { error: 'type, montant, ID 1xBet, telephone, reseau et nom requis' },
        { status: 400 }
      );
    }

    if (type === 'retrait' && !withdraw_code?.trim()) {
      return NextResponse.json(
        { error: 'Le code de retrait 1xBet est obligatoire' },
        { status: 400 }
      );
    }

    if (!['depot', 'retrait'].includes(type)) {
      return NextResponse.json({ error: 'Type invalide' }, { status: 400 });
    }

    if (amount <= 0 || amount > 10_000_000) {
      return NextResponse.json({ error: 'Montant invalide' }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('mobcash_requests')
      .insert({
        type,
        amount,
        bookmaker: '1xbet',
        bookmaker_id: bookmaker_id.trim(),
        phone: phone.trim(),
        network: network.trim(),
        full_name: full_name.trim(),
        withdraw_code: type === 'retrait' ? withdraw_code?.trim() : null,
        notes: notes?.trim() || null,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      console.error('[MobCash] DB Error:', error);
      return NextResponse.json({ error: "Erreur lors de l'enregistrement" }, { status: 500 });
    }

    // For deposits on supported networks (MTN/Moov/Orange/Celtis Cash), trigger FedaPay USSD push
    let fedapay_initiated = false;
    if (type === 'depot' && FEDAPAY_COLLECTION_MODES[network.trim()]) {
      try {
        const fedapayTx = await initiateDeposit({
          amount,
          fullName: full_name.trim(),
          phone: phone.trim(),
          network: network.trim(),
          requestId: data.id,
        });
        await supabase
          .from('mobcash_requests')
          .update({ fedapay_transaction_id: String(fedapayTx.id) })
          .eq('id', data.id);
        fedapay_initiated = true;
      } catch (fedaErr) {
        // Non-blocking: log but let admin handle manually if FedaPay fails
        console.error('[MobCash] FedaPay deposit initiation failed:', fedaErr);
      }
    }

    await notifyMobcashRequest({
      requestId: data.id,
      type: type as 'depot' | 'retrait',
      amount,
      bookmaker: '1xbet',
      bookmakerId: bookmaker_id.trim(),
      phone: phone.trim(),
      network: network.trim(),
      fullName: full_name.trim(),
      withdrawCode: withdraw_code?.trim(),
    });

    return NextResponse.json({ success: true, id: data.id, fedapay_initiated });
  } catch (err) {
    console.error('[MobCash] Unexpected error:', err);
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}
