'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/lib/i18n/context';
import {
  CreditCard,
  CheckCircle2,
  Loader2,
  Shield,
  Zap,
  ArrowLeft,
  AlertCircle,
  Crown,
  Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function PremiumCheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useI18n();

  const paymentCancelled = searchParams.get('payment') === 'cancelled';

  const [loading, setLoading] = useState(false);

  const plan = {
    id: 'premium_weekly',
    name: 'Premium',
    price: 1000,
    period: t('pricing.premium.period'),
    features: [
      t('pricing.premium.features.0'),
      t('pricing.premium.features.1'),
      t('pricing.premium.features.2'),
      t('pricing.premium.features.3'),
      t('pricing.premium.features.4'),
      t('pricing.premium.features.5'),
      t('pricing.premium.features.6'),
      t('pricing.premium.features.7'),
    ],
  };

  async function handleCheckout() {
    setLoading(true);

    try {
      const response = await fetch('/api/payments/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: plan.id }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Checkout failed');
      }

      const { checkoutUrl } = await response.json();

      // Redirect to FedaPay checkout
      window.location.href = checkoutUrl;
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error(t('errors.generic'));
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Back Button */}
      <Button variant="ghost" className="mb-6" asChild>
        <Link href="/dashboard">
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('common.back')}
        </Link>
      </Button>

      {/* Payment Cancelled Alert */}
      {paymentCancelled && (
        <div className="mb-6 bg-warning/10 border border-warning/30 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-warning">{t('checkout.paymentCancelled.title')}</p>
            <p className="text-sm text-text-secondary">
              {t('checkout.paymentCancelled.description')}
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="text-center mb-8">
        <Badge variant="premium" className="mb-4">
          <Sparkles className="h-3 w-3 mr-1" />
          {t('checkout.header.badge')}
        </Badge>
        <h1 className="text-3xl font-bold text-white mb-2">
          {t('checkout.header.title')}
        </h1>
        <p className="text-text-secondary">
          {t('checkout.header.subtitle')}
        </p>
      </div>

      {/* Plan Card */}
      <Card className="mb-6">
        <CardHeader className="text-center pb-2">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Crown className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl">{plan.name}</CardTitle>
          <div className="flex items-baseline justify-center gap-1 mt-2">
            <span className="text-4xl font-bold text-white">
              {plan.price.toLocaleString()}
            </span>
            <span className="text-text-muted">FCFA</span>
          </div>
          <CardDescription>{plan.period}</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3 mb-6">
            {plan.features.map((feature, index) => (
              <li key={index} className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                <span className="text-text-secondary">{feature}</span>
              </li>
            ))}
          </ul>

          <Button
            size="xl"
            variant="gradient"
            className="w-full"
            onClick={handleCheckout}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                {t('checkout.redirecting')}
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-5 w-5" />
                {t('checkout.payButton', { amount: plan.price.toLocaleString() })}
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Payment Methods */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-text-muted">
              <Shield className="h-4 w-4 text-primary" />
              <span>{t('checkout.securePayment')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">Mobile Money</Badge>
              <Badge variant="outline">Carte</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* VIP Alternative */}
      <Card className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/30">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Zap className="h-6 w-6 text-yellow-500" />
            </div>
            <div>
              <h3 className="font-bold text-white mb-1">
                {t('checkout.vipAlternative.title')}
              </h3>
              <p className="text-sm text-text-secondary mb-4">
                {t('checkout.vipAlternative.description')}
              </p>
              <Button variant="outline" asChild>
                <Link href="/unlock-vip">
                  <Crown className="mr-2 h-4 w-4" />
                  {t('checkout.vipAlternative.cta')}
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trust Indicators */}
      <div className="mt-8 text-center text-sm text-text-muted">
        <p className="flex items-center justify-center gap-2">
          <Shield className="h-4 w-4" />
          {t('checkout.trust')}
        </p>
      </div>
    </div>
  );
}
