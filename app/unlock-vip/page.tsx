'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Logo } from '@/components/shared/Logo';
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher';
import { useI18n } from '@/lib/i18n/context';
import { supabase } from '@/lib/supabase/client';
import {
  ExternalLink,
  FileCheck,
  CheckCircle,
  Loader2,
  Send,
  Upload,
  Gift,
  Zap,
  Clock,
  ArrowLeft,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import toast from 'react-hot-toast';

const AFFILIATE_URL =
  process.env.NEXT_PUBLIC_1XBET_AFFILIATE_URL ||
  'https://refpa58144.com/L?tag=d_5093549m_1599c_&site=5093549&ad=1599';

export default function ActivatePage() {
  const router = useRouter();
  const { t } = useI18n();

  const [user, setUser] = useState<{ id: string; tier: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingVerification, setPendingVerification] = useState(false);

  // Form state
  const [identifier, setIdentifier] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function checkUser() {
      const { data: { user: authUser } } = await supabase.auth.getUser();

      if (!authUser) {
        router.push('/onboarding');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('id, tier')
        .eq('id', authUser.id)
        .single();

      if (profile?.tier === 'verified') {
        router.push('/dashboard');
        return;
      }

      // Check if there's a pending verification
      const { data: verification } = await supabase
        .from('vip_verifications')
        .select('status')
        .eq('user_id', authUser.id)
        .eq('status', 'pending')
        .single();

      if (verification) {
        setPendingVerification(true);
      }

      setUser(profile);
      setLoading(false);
    }

    checkUser();
  }, [router]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Fichier trop volumineux (max 5MB)');
        return;
      }
      setScreenshot(file);
    }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!identifier.trim()) {
      toast.error('Veuillez entrer votre ID ou email 1xBet');
      return;
    }

    setSubmitting(true);

    try {
      let screenshotUrl = null;

      // Upload screenshot if provided
      if (screenshot && user) {
        const fileExt = screenshot.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;

        const { data, error } = await supabase.storage
          .from('vip-verifications')
          .upload(fileName, screenshot);

        if (error) {
          console.error('Upload error:', error);
        } else {
          screenshotUrl = data.path;
        }
      }

      // Create verification request
      const { error } = await supabase.from('vip_verifications').insert({
        user_id: user?.id,
        bookmaker_identifier: identifier.trim(),
        screenshot_url: screenshotUrl,
        status: 'pending',
      });

      if (error) throw error;

      toast.success('Demande envoyée ! Vérification sous 24h maximum.');
      setPendingVerification(true);
    } catch (error) {
      console.error('Submission error:', error);
      toast.error('Erreur lors de l\'envoi');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show pending verification state
  if (pendingVerification) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-surface-light">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Retour
                </Link>
              </Button>
              <Logo size="sm" />
            </div>
            <LanguageSwitcher />
          </div>
        </header>

        <div className="max-w-2xl mx-auto px-4 py-16">
          <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-secondary/5">
            <CardContent className="p-8 text-center">
              <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Clock className="h-10 w-10 text-primary" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-4">
                Vérification en cours
              </h1>
              <p className="text-text-secondary text-lg mb-6">
                Votre demande a été reçue ! Notre équipe vérifie votre compte 1xBet.
                <br />
                <strong className="text-primary">Délai maximum : 24 heures</strong>
              </p>
              <div className="bg-surface-light rounded-xl p-4 mb-6">
                <p className="text-sm text-text-muted">
                  Vous recevrez une notification dès que votre compte sera activé.
                  En attendant, vous pouvez explorer l&apos;application.
                </p>
              </div>
              <Button asChild>
                <Link href="/dashboard">
                  Aller au tableau de bord
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-surface-light">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Link>
            </Button>
            <Logo size="sm" />
          </div>
          <LanguageSwitcher />
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-primary/20 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Sparkles className="h-4 w-4" />
            100% GRATUIT
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Activez AlgoPronos AI
          </h1>
          <p className="text-xl text-text-secondary">
            Une seule étape pour accéder à toutes les fonctionnalités
          </p>
        </div>

        {/* ⚠️ Avertissement compte existant */}
        <div className="bg-warning/5 border border-warning/25 rounded-2xl p-5 mb-8 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="text-3xl shrink-0">⚠️</div>
          <div className="flex-1">
            <p className="text-warning font-semibold text-sm mb-1">
              Vous avez déjà un compte chez un bookmaker partenaire ?
            </p>
            <p className="text-text-secondary text-sm leading-relaxed">
              Les comptes existants sont généralement <strong className="text-white">non optimisés IA</strong>.
              Pour en bénéficier pleinement, il faut probablement créer un nouveau compte
              en suivant les étapes ci-dessous. Vérifiez d&apos;abord si le vôtre est éligible.
            </p>
          </div>
          <Link
            href="/verificateur-compte"
            className="shrink-0 flex items-center gap-1.5 text-sm font-semibold text-primary bg-primary/10 hover:bg-primary/20 border border-primary/30 rounded-xl px-4 py-2 transition-colors whitespace-nowrap"
          >
            <HelpCircle className="h-4 w-4" />
            Vérifier mon compte
          </Link>
        </div>

        {/* What you get */}
        <div className="grid md:grid-cols-3 gap-4 mb-12">
          <div className="bg-surface rounded-xl p-6 border border-surface-light text-center">
            <Zap className="h-8 w-8 text-primary mx-auto mb-3" />
            <h3 className="font-bold text-white mb-2">2 Coupons/Jour</h3>
            <p className="text-sm text-text-muted">Analyses IA illimitées chaque jour</p>
          </div>
          <div className="bg-surface rounded-xl p-6 border border-surface-light text-center">
            <Gift className="h-8 w-8 text-secondary mx-auto mb-3" />
            <h3 className="font-bold text-white mb-2">Bonus 1xBet</h3>
            <p className="text-sm text-text-muted">Jusqu&apos;à 208,000 FCFA de bonus</p>
          </div>
          <div className="bg-surface rounded-xl p-6 border border-surface-light text-center">
            <CheckCircle className="h-8 w-8 text-success mx-auto mb-3" />
            <h3 className="font-bold text-white mb-2">Accès Complet</h3>
            <p className="text-sm text-text-muted">Toutes les ligues, tous les marchés</p>
          </div>
        </div>

        {/* Process Steps */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <ProcessStep
            number="1"
            icon={<ExternalLink className="h-6 w-6" />}
            title="Créez un compte 1xBet"
            description="Cliquez sur le bouton ci-dessous et inscrivez-vous via notre lien partenaire"
          />
          <ProcessStep
            number="2"
            icon={<FileCheck className="h-6 w-6" />}
            title="Soumettez votre ID"
            description="Entrez l'ID ou l'email utilisé pour créer votre compte 1xBet"
          />
          <ProcessStep
            number="3"
            icon={<CheckCircle className="h-6 w-6" />}
            title="Attendez 24h max"
            description="Notre équipe vérifie et active votre compte gratuitement"
          />
        </div>

        {/* Main Card */}
        <Card className="border-surface-light">
          <CardContent className="p-8">
              {/* 1xBet CTA */}
            <a
              href={AFFILIATE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full bg-gradient-to-r from-primary to-primary-dark text-white font-bold py-6 rounded-2xl hover:opacity-90 transition-opacity mb-8 text-center text-xl"
            >
              Créer mon compte 1xBet
              <ExternalLink className="inline-block ml-2 h-5 w-5" />
            </a>

            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-surface-light"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="bg-surface px-4 text-text-secondary">
                  Après création du compte
                </span>
              </div>
            </div>

            {/* Verification Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="identifier">
                  ID ou Email 1xBet <span className="text-error">*</span>
                </Label>
                <Input
                  id="identifier"
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Ex: 123456789 ou votre@email.com"
                />
                <p className="text-sm text-text-muted">
                  Entrez l&apos;identifiant ou l&apos;email utilisé pour créer votre compte 1xBet
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="screenshot">
                  Capture d&apos;écran (optionnel)
                </Label>
                <div className="border-2 border-dashed border-surface-light rounded-xl p-6 text-center hover:border-primary/50 transition-colors">
                  <input
                    id="screenshot"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label htmlFor="screenshot" className="cursor-pointer">
                    {screenshot ? (
                      <div className="flex items-center justify-center gap-2 text-primary">
                        <CheckCircle className="h-5 w-5" />
                        <span>{screenshot.name}</span>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="h-8 w-8 mx-auto text-text-muted" />
                        <p className="text-text-secondary">
                          Cliquez pour uploader une capture
                        </p>
                      </div>
                    )}
                  </label>
                </div>
                <p className="text-sm text-text-muted">
                  Une capture d&apos;écran de votre compte accélère la vérification
                </p>
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-5 w-5" />
                    Soumettre pour vérification
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* FAQ */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-white mb-8 text-center flex items-center justify-center gap-2">
            <HelpCircle className="h-6 w-6 text-primary" />
            Questions fréquentes
          </h2>
          <Accordion type="single" collapsible className="space-y-4">
            <AccordionItem
              value="item-1"
              className="bg-surface rounded-xl px-6 border border-surface-light"
            >
              <AccordionTrigger>
                Combien de temps dure la vérification ?
              </AccordionTrigger>
              <AccordionContent>
                La vérification prend généralement quelques heures, mais peut aller jusqu&apos;à 24 heures maximum.
                Vous recevrez une notification dès que votre compte sera activé.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem
              value="item-2"
              className="bg-surface rounded-xl px-6 border border-surface-light"
            >
              <AccordionTrigger>
                Dois-je faire un dépôt sur 1xBet ?
              </AccordionTrigger>
              <AccordionContent>
                Non, aucun dépôt n&apos;est requis pour activer AlgoPronos AI.
                Créez simplement le compte 1xBet et soumettez votre ID.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem
              value="item-3"
              className="bg-surface rounded-xl px-6 border border-surface-light"
            >
              <AccordionTrigger>
                C&apos;est vraiment 100% gratuit ?
              </AccordionTrigger>
              <AccordionContent>
                Oui ! AlgoPronos AI est entièrement gratuit. Vous bénéficiez d&apos;analyses IA
                sans jamais payer. La seule condition est de créer un compte 1xBet via notre lien.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem
              value="item-4"
              className="bg-surface rounded-xl px-6 border border-surface-light"
            >
              <AccordionTrigger>
                Pourquoi demander un compte 1xBet ?
              </AccordionTrigger>
              <AccordionContent>
                1xBet est notre partenaire. Grâce à ce partenariat, nous pouvons offrir AlgoPronos AI
                gratuitement tout en vous faisant bénéficier de bonus exclusifs jusqu&apos;à 208,000 FCFA.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </div>
  );
}

function ProcessStep({
  number,
  icon,
  title,
  description,
}: {
  number: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="relative text-center">
      <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center text-white mx-auto mb-4 shadow-lg shadow-primary/25">
        <span className="text-2xl font-bold">{number}</span>
      </div>
      <div className="w-12 h-12 bg-surface-light rounded-full flex items-center justify-center text-primary mx-auto mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
      <p className="text-text-secondary text-sm">{description}</p>
    </div>
  );
}
