'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
  Loader2, CheckCircle2, ArrowDownCircle, ArrowUpCircle, ChevronDown,
  Smartphone, Hash, User, Banknote, Info, Mail, Lock,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';

// Réseaux disponibles selon le type
const DEPOSIT_NETWORKS = [
  { id: 'mtn',     name: 'MTN Mobile Money' },
  { id: 'moov',    name: 'Moov Money'        },
  { id: 'celcash', name: 'Celtis Cash'       },
  { id: 'orange',  name: 'Orange Money'      },
  { id: 'other',   name: 'Autre réseau'      },
];

// Pour les retraits : uniquement les réseaux supportés par FedaPay payout au Bénin
const WITHDRAWAL_NETWORKS = [
  { id: 'mtn',  name: 'MTN Mobile Money' },
  { id: 'moov', name: 'Moov Money'       },
];

type RequestType = 'depot' | 'retrait';

export function MobcashForm() {
  const [type, setType]                 = useState<RequestType>('depot');
  const [amount, setAmount]             = useState('');
  const [bookmarkerId, setBookmarkerId] = useState('');
  const [phone, setPhone]               = useState('');
  const [network, setNetwork]           = useState('');
  const [fullName, setFullName]         = useState('');
  const [email, setEmail]               = useState('');
  const [withdrawCode, setWithdrawCode] = useState('');
  const [networkOpen, setNetworkOpen]   = useState(false);
  const [loading, setLoading]           = useState(false);
  const [success, setSuccess]           = useState(false);
  const [fedapayInitiated, setFedapayInitiated] = useState(false);

  // Auth state for withdrawal gate
  const [authChecked, setAuthChecked] = useState(false);
  const [isLoggedIn, setIsLoggedIn]   = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setIsLoggedIn(true);
        if (!email) setEmail(data.user.email || '');
        if (!fullName && data.user.user_metadata?.full_name) {
          setFullName(data.user.user_metadata.full_name);
        }
      }
      setAuthChecked(true);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const NETWORKS = type === 'retrait' ? WITHDRAWAL_NETWORKS : DEPOSIT_NETWORKS;
  const selectedNetwork = NETWORKS.find(n => n.id === network);

  function handleTypeChange(t: RequestType) {
    setType(t);
    const nets = t === 'retrait' ? WITHDRAWAL_NETWORKS : DEPOSIT_NETWORKS;
    if (network && !nets.find(n => n.id === network)) setNetwork('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!amount || !bookmarkerId.trim() || !phone.trim() || !fullName.trim() || !network) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }
    if (!email.trim()) {
      toast.error('L\'adresse email est obligatoire pour recevoir la confirmation');
      return;
    }
    if (type === 'retrait' && !withdrawCode.trim()) {
      toast.error('Le code de retrait 1xBet est obligatoire');
      return;
    }
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      toast.error('Montant invalide');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/mobcash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          amount: amt,
          bookmaker: '1xbet',
          bookmaker_id: bookmarkerId.trim(),
          phone: phone.trim(),
          network,
          full_name: fullName.trim(),
          email: email.trim(),
          withdraw_code: type === 'retrait' ? withdrawCode.trim() : undefined,
          notes: `Réseau: ${selectedNetwork?.name || network}`,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur');
      setFedapayInitiated(!!data.fedapay_initiated);
      setSuccess(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur inattendue');
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setSuccess(false);
    setFedapayInitiated(false);
    setAmount('');
    setBookmarkerId('');
    setPhone('');
    setNetwork('');
    setWithdrawCode('');
    if (!isLoggedIn) {
      setFullName('');
      setEmail('');
    }
  }

  if (success) {
    return (
      <Card className="border-success/30 bg-surface">
        <CardContent className="p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-success/10 border border-success/20 mb-5">
            <CheckCircle2 className="h-8 w-8 text-success" />
          </div>
          <h2 className="text-white text-xl font-bold mb-2">Demande envoyée ✅</h2>
          <p className="text-text-secondary text-sm mb-2">
            Votre demande de <strong className="text-white">{type === 'depot' ? 'dépôt' : 'retrait'}</strong> de{' '}
            <strong className="text-white">{parseFloat(amount).toLocaleString('fr-FR')} FCFA</strong> a bien été reçue.
          </p>
          <p className="text-text-muted text-xs mb-4">
            Vous recevrez une confirmation par email à <strong className="text-white">{email}</strong> dès que votre demande est traitée.
          </p>

          {type === 'depot' ? (
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 my-4 text-left text-sm">
              <p className="text-primary font-semibold mb-2">📲 Étapes suivantes :</p>
              {fedapayInitiated ? (
                <ol className="text-text-secondary space-y-1.5 list-decimal list-inside">
                  <li>
                    <strong className="text-white">Confirmez le paiement</strong> sur votre téléphone — vous recevez une notification {selectedNetwork?.name} maintenant
                  </li>
                  <li>Dès confirmation, notre équipe crédite votre compte 1xBet</li>
                  <li>Délai estimé : quelques minutes</li>
                </ol>
              ) : (
                <ol className="text-text-secondary space-y-1.5 list-decimal list-inside">
                  <li>Envoyez <strong className="text-white">{parseFloat(amount).toLocaleString('fr-FR')} FCFA</strong> sur notre numéro MobCash</li>
                  <li>Notre équipe crédite votre compte 1xBet sous peu</li>
                  <li>Vous recevrez une confirmation sur votre téléphone</li>
                </ol>
              )}
            </div>
          ) : (
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 my-4 text-left text-sm">
              <p className="text-primary font-semibold mb-2">📲 Étapes suivantes :</p>
              <ol className="text-text-secondary space-y-1.5 list-decimal list-inside">
                <li>Notre équipe traite votre retrait 1xBet</li>
                <li>L&apos;argent est envoyé sur votre numéro {selectedNetwork?.name}</li>
                <li>Délai estimé : quelques minutes à 1h</li>
              </ol>
            </div>
          )}

          <Button variant="outline" onClick={handleReset}>
            Faire une nouvelle demande
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Gate : retrait nécessite un compte AlgoPronos
  if (type === 'retrait' && authChecked && !isLoggedIn) {
    return (
      <Card className="border-surface-light bg-surface">
        <CardContent className="p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-orange-400/10 border border-orange-400/20 mb-5">
            <Lock className="h-8 w-8 text-orange-400" />
          </div>
          <h2 className="text-white text-xl font-bold mb-2">Compte requis pour les retraits</h2>
          <p className="text-text-secondary text-sm mb-6 max-w-xs mx-auto">
            Pour effectuer un retrait, vous devez avoir un compte AlgoPronos AI. C&apos;est gratuit et prend moins d&apos;une minute.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="gradient" asChild>
              <Link href="/login?redirect=/depot-retrait">Créer un compte</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/login?redirect=/depot-retrait">Se connecter</Link>
            </Button>
          </div>
          <button
            className="mt-5 text-xs text-text-muted underline underline-offset-2 hover:text-white transition-colors"
            onClick={() => handleTypeChange('depot')}
          >
            Revenir au dépôt (sans compte)
          </button>
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
              const active = type === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => handleTypeChange(t)}
                  className={`flex flex-col items-center justify-center gap-1.5 py-4 px-4 rounded-xl border-2 font-semibold text-sm transition-all ${
                    active
                      ? t === 'depot'
                        ? 'border-success bg-success/10 text-success'
                        : 'border-orange-400 bg-orange-400/10 text-orange-400'
                      : 'border-surface-light text-text-muted hover:border-primary/40'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{t === 'depot' ? 'Dépôt 1xBet' : 'Retrait 1xBet'}</span>
                  <span className="text-xs font-normal opacity-70">
                    {t === 'depot' ? 'Je veux recharger' : 'Je veux retirer'}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Explication contextuelle */}
          <div className={`rounded-xl p-3 text-xs border flex items-start gap-2 ${
            type === 'depot'
              ? 'bg-success/5 border-success/20 text-success/80'
              : 'bg-orange-400/5 border-orange-400/20 text-orange-300'
          }`}>
            <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            {type === 'depot'
              ? 'Vous nous envoyez de l\'argent via mobile money → nous créditons votre compte 1xBet'
              : 'Nous débitons votre compte 1xBet → vous recevez l\'argent sur votre téléphone'}
          </div>

          {/* Montant */}
          <div className="space-y-1.5">
            <Label htmlFor="amount" className="flex items-center gap-1.5">
              <Banknote className="h-3.5 w-3.5" /> Montant (FCFA) *
            </Label>
            <Input
              id="amount"
              type="number"
              placeholder="Ex: 5000"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              min={type === 'retrait' ? 900 : 200}
              required
            />
            <p className="text-xs text-text-muted">
              Minimum : {type === 'retrait' ? '900' : '200'} FCFA
            </p>
          </div>

          {/* ID 1xBet */}
          <div className="space-y-1.5">
            <Label htmlFor="bookmaker_id" className="flex items-center gap-1.5">
              <Hash className="h-3.5 w-3.5" /> Votre ID 1xBet *
            </Label>
            <Input
              id="bookmaker_id"
              placeholder="Ex: 123456789"
              value={bookmarkerId}
              onChange={e => setBookmarkerId(e.target.value)}
              required
            />
            <p className="text-xs text-text-muted">Retrouvez-le dans votre profil 1xBet → Mon compte → ID</p>
          </div>

          {/* Nom complet */}
          <div className="space-y-1.5">
            <Label htmlFor="full_name" className="flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" /> Nom complet *
            </Label>
            <Input
              id="full_name"
              placeholder="Prénom et Nom"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              required
            />
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <Label htmlFor="email" className="flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5" /> Email de confirmation *
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="votre@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              readOnly={isLoggedIn}
              className={isLoggedIn ? 'opacity-70 cursor-default' : ''}
            />
            <p className="text-xs text-text-muted">
              Vous recevrez un email dès que votre demande est traitée.
            </p>
          </div>

          {/* Réseau mobile money */}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5">
              <Smartphone className="h-3.5 w-3.5" />
              {type === 'depot' ? 'Réseau de paiement *' : 'Réseau de réception *'}
            </Label>
            {type === 'retrait' && (
              <p className="text-xs text-orange-300/80">Virements disponibles uniquement sur MTN et Moov au Bénin.</p>
            )}
            <div className="relative">
              <button
                type="button"
                onClick={() => setNetworkOpen(v => !v)}
                className="w-full flex items-center justify-between px-4 py-2.5 bg-background border border-surface-light rounded-xl text-left hover:border-primary/40 transition-colors"
              >
                <span className={selectedNetwork ? 'text-white font-medium' : 'text-text-muted'}>
                  {selectedNetwork?.name ?? 'Choisir un réseau…'}
                </span>
                <ChevronDown className={`h-4 w-4 text-text-muted transition-transform ${networkOpen ? 'rotate-180' : ''}`} />
              </button>
              {networkOpen && (
                <div className="absolute z-20 top-full mt-1 left-0 right-0 bg-surface border border-surface-light rounded-xl shadow-lg overflow-hidden">
                  {NETWORKS.map(n => (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => { setNetwork(n.id); setNetworkOpen(false); }}
                      className="w-full flex items-center px-4 py-3 text-left hover:bg-surface-light transition-colors text-white text-sm"
                    >
                      {n.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Numéro de téléphone */}
          <div className="space-y-1.5">
            <Label htmlFor="phone" className="flex items-center gap-1.5">
              <Smartphone className="h-3.5 w-3.5" />
              {type === 'depot' ? 'Numéro qui sera débité *' : 'Numéro de réception *'}
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="Ex: 96 00 00 00"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              required
            />
            <p className="text-xs text-text-muted">
              {type === 'depot'
                ? 'Le montant sera prélevé sur ce numéro'
                : "L'argent sera envoyé sur ce numéro"}
            </p>
          </div>

          {/* Code de retrait 1xBet — uniquement pour les retraits */}
          {type === 'retrait' && (
            <div className="space-y-1.5">
              <Label htmlFor="withdraw_code" className="flex items-center gap-1.5">
                <Hash className="h-3.5 w-3.5" />
                Code de retrait 1xBet *
              </Label>
              <Input
                id="withdraw_code"
                placeholder="Code généré depuis votre compte 1xBet"
                value={withdrawCode}
                onChange={e => setWithdrawCode(e.target.value)}
                required={type === 'retrait'}
                className="font-mono tracking-widest"
              />
              <div className="bg-orange-400/5 border border-orange-400/20 rounded-lg p-3 text-xs text-orange-300 space-y-1">
                <p className="font-semibold">Comment obtenir votre code ?</p>
                <ol className="list-decimal list-inside space-y-0.5 text-orange-200/80">
                  <li>Connectez-vous sur 1xBet et allez dans votre section <strong>Retrait</strong></li>
                  <li>Recherchez <strong>MobCash</strong> dans les méthodes de retrait</li>
                  <li>Remplissez les champs demandés (montant, etc.)</li>
                  <li>Copiez le <strong>code généré</strong> par 1xBet et collez-le ici</li>
                </ol>
                <p className="text-orange-200/60 mt-1">Ce code nous permet de valider et traiter votre retrait.</p>
              </div>
            </div>
          )}

          <Button
            type="submit"
            variant="gradient"
            className="w-full"
            size="lg"
            disabled={loading || (type === 'retrait' && !authChecked)}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : type === 'depot' ? (
              <ArrowDownCircle className="h-4 w-4 mr-2" />
            ) : (
              <ArrowUpCircle className="h-4 w-4 mr-2" />
            )}
            {loading
              ? 'Envoi en cours…'
              : type === 'depot'
              ? 'Envoyer ma demande de dépôt'
              : 'Envoyer ma demande de retrait'}
          </Button>

          <p className="text-center text-xs text-text-muted">
            🔒 Données sécurisées · Traitement rapide par notre équipe
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
