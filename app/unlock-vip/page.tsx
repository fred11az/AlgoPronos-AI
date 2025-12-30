'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Logo } from '@/components/shared/Logo';
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher';
import { useI18n } from '@/lib/i18n/context';
import { supabase } from '@/lib/supabase/client';
import {
  ExternalLink,
  FileCheck,
  CheckCircle,
  Copy,
  Check,
  Loader2,
  Send,
  AlertCircle,
  Upload,
  Crown,
  Gift,
  Percent,
  Users,
  Shield,
  Clock,
  Star,
  ArrowLeft,
  HelpCircle,
} from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import toast from 'react-hot-toast';

const PROMO_CODE = process.env.NEXT_PUBLIC_1XBET_PROMO_CODE || 'ALGOPRONO2025';

export default function UnlockVIPPage() {
  const router = useRouter();
  const { t } = useI18n();

  const [user, setUser] = useState<{ id: string; tier: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // Form state
  const [identifier, setIdentifier] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [attested, setAttested] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function checkUser() {
      const { data: { user: authUser } } = await supabase.auth.getUser();

      if (!authUser) {
        router.push('/register?intent=vip');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('id, tier')
        .eq('id', authUser.id)
        .single();

      if (profile?.tier === 'vip_lifetime') {
        router.push('/dashboard');
        return;
      }

      setUser(profile);
      setLoading(false);
    }

    checkUser();
  }, [router]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(PROMO_CODE);
    setCopied(true);
    toast.success(t('common.copied'));
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File too large (max 5MB)');
        return;
      }
      setScreenshot(file);
    }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!identifier.trim()) {
      toast.error(t('vip.unlock.form.identifier.label'));
      return;
    }

    if (!attested) {
      toast.error(t('auth.register.acceptTermsRequired'));
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

      toast.success(t('vip.unlock.form.success'));
      router.push('/dashboard?verification=pending');
    } catch (error) {
      console.error('Submission error:', error);
      toast.error(t('errors.generic'));
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-surface-light">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t('common.back')}
              </Link>
            </Button>
            <Logo size="sm" />
          </div>
          <LanguageSwitcher />
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Title */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            {t('vip.unlock.title')}
          </h1>
          <p className="text-xl text-text-secondary">
            {t('vip.unlock.subtitle')}
          </p>
        </div>

        {/* Process Steps */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <ProcessStep
            number="1"
            icon={<ExternalLink className="h-6 w-6" />}
            title={t('vip.unlock.step1.title')}
            description={t('vip.unlock.step1.description')}
          />
          <ProcessStep
            number="2"
            icon={<FileCheck className="h-6 w-6" />}
            title={t('vip.unlock.step2.title')}
            description={t('vip.unlock.step2.description')}
          />
          <ProcessStep
            number="3"
            icon={<CheckCircle className="h-6 w-6" />}
            title={t('vip.unlock.step3.title')}
            description={t('vip.unlock.step3.description')}
          />
        </div>

        {/* Main Card */}
        <Card className="border-surface-light">
          <CardContent className="p-8">
            {/* Promo Code */}
            <div className="bg-gradient-to-r from-primary/20 to-secondary/20 rounded-2xl p-6 mb-8 border-2 border-primary/30">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-sm text-text-secondary mb-1">
                    {t('vip.unlock.promoCode.label')}
                  </div>
                  <div className="text-3xl font-bold text-white tracking-wider">
                    {PROMO_CODE}
                  </div>
                </div>
                <Button variant="outline" onClick={copyToClipboard}>
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      {t('common.copied')}
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      {t('common.copyToClipboard')}
                    </>
                  )}
                </Button>
              </div>
              <p className="text-sm text-text-secondary">
                {t('vip.unlock.promoCode.warning')}
              </p>
            </div>

            {/* 1xBet CTA */}
            <a
              href={`https://1xbet.com/fr/registration?promo=${PROMO_CODE}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full bg-gradient-to-r from-primary to-primary-dark text-white font-bold py-6 rounded-2xl hover:opacity-90 transition-opacity mb-8 text-center text-xl"
            >
              {t('vip.unlock.createAccount')}
              <ExternalLink className="inline-block ml-2 h-5 w-5" />
            </a>

            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-surface-light"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="bg-surface px-4 text-text-secondary">
                  {t('vip.unlock.afterCreation')}
                </span>
              </div>
            </div>

            {/* Verification Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="identifier">
                  {t('vip.unlock.form.identifier.label')}{' '}
                  <span className="text-error">*</span>
                </Label>
                <Input
                  id="identifier"
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={t('vip.unlock.form.identifier.placeholder')}
                />
                <p className="text-sm text-text-muted">
                  {t('vip.unlock.form.identifier.help')}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="screenshot">
                  {t('vip.unlock.form.screenshot.label')}
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
                          Click to upload screenshot
                        </p>
                      </div>
                    )}
                  </label>
                </div>
                <p className="text-sm text-text-muted">
                  {t('vip.unlock.form.screenshot.help')}
                </p>
              </div>

              <div className="bg-warning/10 border border-warning/30 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-text-secondary">
                    <strong className="text-warning">Important :</strong>{' '}
                    {t('vip.unlock.form.warning', { code: PROMO_CODE })}
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-2">
                <Checkbox
                  id="attest"
                  checked={attested}
                  onCheckedChange={(checked) => setAttested(checked as boolean)}
                  className="mt-1"
                />
                <label
                  htmlFor="attest"
                  className="text-sm text-text-secondary cursor-pointer"
                >
                  {t('vip.unlock.form.attestation', { code: PROMO_CODE })}
                </label>
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
                    {t('vip.unlock.form.submitting')}
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-5 w-5" />
                    {t('vip.unlock.form.submit')}
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Benefits Reminder */}
        <div className="mt-12 grid md:grid-cols-4 gap-4">
          <BenefitCard
            icon={<Crown className="h-6 w-6" />}
            title={t('vip.widget.benefits.vip.title')}
            value={t('vip.widget.benefits.vip.value', { amount: '208,000' })}
          />
          <BenefitCard
            icon={<Gift className="h-6 w-6" />}
            title={t('vip.widget.benefits.bonus.title')}
            value={t('vip.widget.benefits.bonus.value', { amount: '50,000' })}
          />
          <BenefitCard
            icon={<Percent className="h-6 w-6" />}
            title={t('vip.widget.benefits.cashback.title')}
            value={t('vip.widget.benefits.cashback.value')}
          />
          <BenefitCard
            icon={<Users className="h-6 w-6" />}
            title={t('vip.widget.benefits.referral.title')}
            value={t('vip.widget.benefits.referral.value', { amount: '500' })}
          />
        </div>

        {/* FAQ */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-white mb-8 text-center flex items-center justify-center gap-2">
            <HelpCircle className="h-6 w-6 text-primary" />
            {t('faq.title')}
          </h2>
          <Accordion type="single" collapsible className="space-y-4">
            <AccordionItem
              value="item-1"
              className="bg-surface rounded-xl px-6 border border-surface-light"
            >
              <AccordionTrigger>
                {t('vip.faq.verificationTime.question')}
              </AccordionTrigger>
              <AccordionContent>
                {t('vip.faq.verificationTime.answer')}
              </AccordionContent>
            </AccordionItem>
            <AccordionItem
              value="item-2"
              className="bg-surface rounded-xl px-6 border border-surface-light"
            >
              <AccordionTrigger>
                {t('vip.faq.depositRequired.question')}
              </AccordionTrigger>
              <AccordionContent>
                {t('vip.faq.depositRequired.answer')}
              </AccordionContent>
            </AccordionItem>
            <AccordionItem
              value="item-3"
              className="bg-surface rounded-xl px-6 border border-surface-light"
            >
              <AccordionTrigger>
                {t('vip.faq.reallyFree.question')}
              </AccordionTrigger>
              <AccordionContent>
                {t('vip.faq.reallyFree.answer')}
              </AccordionContent>
            </AccordionItem>
            <AccordionItem
              value="item-4"
              className="bg-surface rounded-xl px-6 border border-surface-light"
            >
              <AccordionTrigger>
                {t('vip.faq.premiumAndVip.question')}
              </AccordionTrigger>
              <AccordionContent>
                {t('vip.faq.premiumAndVip.answer')}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        {/* Trust Indicators */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm text-text-muted">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <span>{t('vip.widget.trust.activeVip', { count: '2,847' })}</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <span>{t('vip.widget.trust.secure')}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <span>{t('vip.widget.trust.activation', { time: '5 min' })}</span>
          </div>
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
            <span>{t('vip.widget.trust.rating', { rating: '4.9' })}</span>
          </div>
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

function BenefitCard({
  icon,
  title,
  value,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
}) {
  return (
    <div className="bg-surface rounded-xl p-4 border border-surface-light">
      <div className="flex items-center gap-3 mb-2">
        <div className="text-primary">{icon}</div>
        <div className="text-xs text-text-secondary">{title}</div>
      </div>
      <div className="text-sm font-semibold text-primary">{value}</div>
    </div>
  );
}
