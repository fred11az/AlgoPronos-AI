'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, CheckCircle2, ArrowDownCircle, ArrowUpCircle, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';

const BOOKMAKERS = [
  { id: '1xbet',      name: '1xBet'      },
  { id: 'melbet',     name: 'Melbet'     },
  { id: 'betwinner',  name: 'Betwinner'  },
  { id: 'betway',     name: 'Betway'     },
  { id: 'premierbet', name: 'PremierBet' },
];

type RequestType = 'depot' | 'retrait';

interface FormState {
  type: RequestType;
  amount: string;
  bookmaker: string;
  bookmaker_id: string;
  phone: string;
  full_name: string;
  email: string;
  notes: string;
}

export function MobcashForm() {
  const [form, setForm] = useState<FormState>({
    type: 'depot',
    amount: '',
    bookmaker: '1xbet',
    bookmaker_id: '',
    phone: '',
    full_name: '',
    email: '',
    notes: '',
  });
  const [loading, setLoading]     = useState(false);
  const [success, setSuccess]     = useState(false);
  const [bmOpen, setBmOpen]       = useState(false);

  const set = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }));

  const selectedBM = BOOKMAKERS.find(b => b.id === form.bookmaker);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.amount || !form.bookmaker_id.trim() || !form.phone.trim() || !form.full_name.trim()) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }
    const amount = parseFloat(form.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Montant invalide');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/mobcash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: form.type,
          amount,
          bookmaker: form.bookmaker,
          bookmaker_id: form.bookmaker_id.trim(),
          phone: form.phone.trim(),
          full_name: form.full_name.trim(),
          email: form.email.trim() || undefined,
          notes: form.notes.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur');
      setSuccess(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur inattendue');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <Card className="border-success/30 bg-surface">
        <CardContent className="p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-success/10 border border-success/20 mb-5">
            <CheckCircle2 className="h-8 w-8 text-success" />
          </div>
          <h2 className="text-white text-xl font-bold mb-2">Demande envoyée !</h2>
          <p className="text-text-secondary text-sm mb-6">
            Votre demande de {form.type === 'depot' ? 'dépôt' : 'retrait'} a bien été reçue.
            Notre équipe va la traiter très rapidement et vous contactera sur le numéro fourni.
          </p>
          <Button
            variant="outline"
            onClick={() => { setSuccess(false); setForm(f => ({ ...f, amount: '', bookmaker_id: '', notes: '' })); }}
          >
            Faire une nouvelle demande
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-surface-light bg-surface">
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Type : Dépôt / Retrait */}
          <div className="grid grid-cols-2 gap-3">
            {(['depot', 'retrait'] as RequestType[]).map(t => {
              const Icon = t === 'depot' ? ArrowDownCircle : ArrowUpCircle;
              const active = form.type === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, type: t }))}
                  className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 font-semibold text-sm transition-all ${
                    active
                      ? t === 'depot'
                        ? 'border-success bg-success/10 text-success'
                        : 'border-orange-400 bg-orange-400/10 text-orange-400'
                      : 'border-surface-light text-text-muted hover:border-primary/40'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {t === 'depot' ? 'Dépôt' : 'Retrait'}
                </button>
              );
            })}
          </div>

          {/* Montant */}
          <div className="space-y-1.5">
            <Label htmlFor="amount">Montant (FCFA) *</Label>
            <Input
              id="amount"
              type="number"
              placeholder="Ex: 5000"
              value={form.amount}
              onChange={set('amount')}
              min={100}
              required
            />
          </div>

          {/* Bookmaker */}
          <div className="space-y-1.5">
            <Label>Bookmaker *</Label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setBmOpen(v => !v)}
                className="w-full flex items-center justify-between px-4 py-2.5 bg-background border border-surface-light rounded-xl text-left hover:border-primary/40 transition-colors"
              >
                <span className={selectedBM ? 'text-white font-medium' : 'text-text-muted'}>
                  {selectedBM?.name ?? 'Choisir un bookmaker…'}
                </span>
                <ChevronDown className={`h-4 w-4 text-text-muted transition-transform ${bmOpen ? 'rotate-180' : ''}`} />
              </button>
              {bmOpen && (
                <div className="absolute z-20 top-full mt-1 left-0 right-0 bg-surface border border-surface-light rounded-xl shadow-lg overflow-hidden">
                  {BOOKMAKERS.map(bm => (
                    <button
                      key={bm.id}
                      type="button"
                      onClick={() => { setForm(f => ({ ...f, bookmaker: bm.id })); setBmOpen(false); }}
                      className="w-full flex items-center px-4 py-3 text-left hover:bg-surface-light transition-colors text-white text-sm"
                    >
                      {bm.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ID Bookmaker */}
          <div className="space-y-1.5">
            <Label htmlFor="bookmaker_id">Votre ID {selectedBM?.name ?? 'Bookmaker'} *</Label>
            <Input
              id="bookmaker_id"
              placeholder="Ex: 123456789"
              value={form.bookmaker_id}
              onChange={set('bookmaker_id')}
              required
            />
            <p className="text-xs text-text-muted">Retrouvez votre ID dans votre profil bookmaker.</p>
          </div>

          {/* Téléphone */}
          <div className="space-y-1.5">
            <Label htmlFor="phone">Numéro de téléphone MobCash *</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="Ex: +22996123456"
              value={form.phone}
              onChange={set('phone')}
              required
            />
          </div>

          {/* Nom */}
          <div className="space-y-1.5">
            <Label htmlFor="full_name">Nom complet *</Label>
            <Input
              id="full_name"
              placeholder="Prénom et nom"
              value={form.full_name}
              onChange={set('full_name')}
              required
            />
          </div>

          {/* Email (optionnel) */}
          <div className="space-y-1.5">
            <Label htmlFor="email">Email (optionnel)</Label>
            <Input
              id="email"
              type="email"
              placeholder="Pour recevoir une confirmation"
              value={form.email}
              onChange={set('email')}
            />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes (optionnel)</Label>
            <Input
              id="notes"
              placeholder="Informations supplémentaires…"
              value={form.notes}
              onChange={set('notes')}
            />
          </div>

          <Button
            type="submit"
            variant="gradient"
            className="w-full"
            size="lg"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : form.type === 'depot' ? (
              <ArrowDownCircle className="h-4 w-4 mr-2" />
            ) : (
              <ArrowUpCircle className="h-4 w-4 mr-2" />
            )}
            {loading ? 'Envoi en cours…' : `Envoyer ma demande de ${form.type === 'depot' ? 'dépôt' : 'retrait'}`}
          </Button>

          <p className="text-center text-xs text-text-muted">
            🔒 Données sécurisées — Notre équipe vous contactera sous peu.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
