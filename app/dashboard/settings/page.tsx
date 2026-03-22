'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import PushNotifToggle from '@/components/dashboard/PushNotifToggle';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher';
import { supabase } from '@/lib/supabase/client';
import { useI18n } from '@/lib/i18n/context';
import {
  User,
  Mail,
  Phone,
  Globe,
  Bell,
  Shield,
  Crown,
  Loader2,
  Save,
  LogOut,
} from 'lucide-react';
import { getInitials, getCountryName } from '@/lib/utils';
import toast from 'react-hot-toast';
import type { Profile } from '@/types';

export default function SettingsPage() {
  const { t } = useI18n();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    country: '',
  });

  const [notifications, setNotifications] = useState({
    email: true,
    newCombines: true,
    results: true,
    promotions: false,
  });

  useEffect(() => {
    async function fetchProfile() {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return;

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (data) {
        setProfile(data);
        setFormData({
          full_name: data.full_name || '',
          phone: data.phone || '',
          country: data.country || 'BJ',
        });
        // Charger les préférences de notification depuis metadata
        const meta = (data.metadata as Record<string, unknown>) || {};
        setNotifications({
          email: meta.notify_email !== false,
          newCombines: meta.notify_new_combines !== false,
          results: meta.notify_results !== false,
          promotions: meta.notify_promotions === true,
        });
      }

      setLoading(false);
    }

    fetchProfile();
  }, []);

  async function handleSave() {
    if (!profile) return;

    setSaving(true);

    try {
      const currentMeta = (profile.metadata as Record<string, unknown>) || {};
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
          country: formData.country,
          metadata: {
            ...currentMeta,
            notify_email: notifications.email,
            notify_results: notifications.results,
            notify_new_combines: notifications.newCombines,
            notify_promotions: notifications.promotions,
          },
        })
        .eq('id', profile.id);

      if (error) throw error;

      toast.success(t('common.success'));
      setProfile({ ...profile, ...formData });
    } catch (error) {
      toast.error(t('errors.generic'));
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = '/';
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-white">
          {t('settings.title')}
        </h1>
        <p className="text-text-secondary">
          {t('settings.subtitle')}
        </p>
      </div>

      {/* Profile Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            {t('settings.profile.title')}
          </CardTitle>
          <CardDescription>
            {t('settings.profile.description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar & Status */}
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarFallback className="text-2xl bg-gradient-to-br from-primary to-secondary">
                {getInitials(profile?.full_name || profile?.email || 'U')}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-lg font-semibold text-white">
                {profile?.full_name || t('settings.profile.defaultName')}
              </h3>
              <p className="text-sm text-text-muted">{profile?.email}</p>
              <div className="mt-2">
                {profile?.tier === 'verified' ? (
                  <Badge variant="success">
                    <Crown className="h-3 w-3 mr-1" />
                    Compte Activé
                  </Badge>
                ) : (
                  <Badge variant="outline">Non activé</Badge>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Form Fields */}
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">{t('auth.register.fullName')}</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) =>
                    setFormData({ ...formData, full_name: e.target.value })
                  }
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">{t('auth.register.email')}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                <Input
                  id="email"
                  value={profile?.email || ''}
                  disabled
                  className="pl-10 opacity-60"
                />
              </div>
              <p className="text-xs text-text-muted">
                {t('settings.profile.emailNote')}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">{t('auth.register.phone')}</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="pl-10"
                  placeholder="+229 97 00 00 00"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t('auth.register.country')}</Label>
              <p className="text-sm text-text-secondary">
                {getCountryName(formData.country)}
              </p>
            </div>
          </div>

          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {t('common.save')}
          </Button>
        </CardContent>
      </Card>

      {/* Language Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            {t('settings.language.title')}
          </CardTitle>
          <CardDescription>
            {t('settings.language.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <p className="text-text-secondary">{t('settings.language.current')}</p>
            <LanguageSwitcher />
          </div>
        </CardContent>
      </Card>

      {/* Notifications Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            {t('settings.notifications.title')}
          </CardTitle>
          <CardDescription>
            {t('settings.notifications.description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-white">{t('settings.notifications.email.title')}</p>
              <p className="text-sm text-text-muted">
                {t('settings.notifications.email.description')}
              </p>
            </div>
            <Switch
              checked={notifications.email}
              onCheckedChange={(checked) =>
                setNotifications({ ...notifications, email: checked })
              }
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-white">{t('settings.notifications.newCombines.title')}</p>
              <p className="text-sm text-text-muted">
                {t('settings.notifications.newCombines.description')}
              </p>
            </div>
            <Switch
              checked={notifications.newCombines}
              onCheckedChange={(checked) =>
                setNotifications({ ...notifications, newCombines: checked })
              }
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-white">{t('settings.notifications.results.title')}</p>
              <p className="text-sm text-text-muted">
                {t('settings.notifications.results.description')}
              </p>
            </div>
            <Switch
              checked={notifications.results}
              onCheckedChange={(checked) =>
                setNotifications({ ...notifications, results: checked })
              }
            />
          </div>

          <Separator />

          {/* Web Push */}
          <PushNotifToggle />

          <Separator />

          {/* WhatsApp info */}
          <div className="bg-surface-light rounded-xl p-4">
            <p className="text-sm font-medium text-white mb-1">
              📱 Notifications WhatsApp
            </p>
            <p className="text-xs text-text-muted leading-relaxed">
              Pour recevoir les résultats sur WhatsApp, renseignez votre numéro de téléphone
              (format international, ex&nbsp;: +22996123456) dans la section Profil ci-dessus
              et activez les notifications résultats.
            </p>
          </div>

          <Button onClick={handleSave} disabled={saving} size="sm">
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Sauvegarder les préférences
          </Button>
        </CardContent>
      </Card>

      {/* Security Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            {t('settings.security.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            {t('sidebar.logout')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
