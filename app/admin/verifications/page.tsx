'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  CheckCircle,
  XCircle,
  Search,
  Filter,
  ExternalLink,
  Loader2,
  Clock,
  Image as ImageIcon,
  RefreshCw,
} from 'lucide-react';
import { getInitials } from '@/lib/utils';
import toast from 'react-hot-toast';

interface Verification {
  id: string;
  user_id: string;
  bookmaker_identifier: string;
  screenshot_url: string | null;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes: string | null;
  created_at: string;
  user: {
    id: string;
    email: string;
    full_name: string;
  } | null;
}

export default function VerificationsPage() {
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [search, setSearch] = useState('');
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    fetchVerifications();
  }, [filter]);

  async function fetchVerifications() {
    setLoading(true);

    try {
      const response = await fetch(`/api/admin/verifications?status=${filter}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur de chargement');
      }

      setVerifications(data.verifications || []);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erreur de chargement des vérifications');
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(id: string) {
    setProcessing(id);

    try {
      const response = await fetch('/api/admin/verifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'approved' }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur');
      }

      toast.success('Vérification approuvée ! Compte activé.');
      fetchVerifications();
    } catch (error) {
      toast.error('Erreur lors de l\'approbation');
      console.error(error);
    } finally {
      setProcessing(null);
    }
  }

  async function handleReject(id: string) {
    const notes = prompt('Raison du rejet (optionnel):');

    setProcessing(id);

    try {
      const response = await fetch('/api/admin/verifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'rejected', admin_notes: notes }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur');
      }

      toast.success('Vérification rejetée');
      fetchVerifications();
    } catch (error) {
      toast.error('Erreur lors du rejet');
      console.error(error);
    } finally {
      setProcessing(null);
    }
  }

  const filteredVerifications = verifications.filter(
    (v) =>
      v.user?.email?.toLowerCase().includes(search.toLowerCase()) ||
      v.user?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      v.bookmaker_identifier?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Activations de Compte</h1>
          <p className="text-text-secondary">
            Vérifiez les comptes 1xBet et activez les utilisateurs
          </p>
        </div>
        <Badge variant={filter === 'pending' ? 'warning' : 'outline'}>
          {verifications.length} demande(s)
        </Badge>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
              <Input
                placeholder="Rechercher par email, nom ou ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                Tous
              </Button>
              <Button
                variant={filter === 'pending' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('pending')}
              >
                <Clock className="h-4 w-4 mr-1" />
                En attente
              </Button>
              <Button
                variant={filter === 'approved' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('approved')}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Approuvés
              </Button>
              <Button
                variant={filter === 'rejected' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('rejected')}
              >
                <XCircle className="h-4 w-4 mr-1" />
                Rejetés
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Verifications List */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredVerifications.length === 0 ? (
            <div className="text-center py-12 text-text-muted">
              Aucune vérification trouvée
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-surface-light">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-text-secondary">
                      Utilisateur
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-text-secondary">
                      ID Bookmaker
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-text-secondary">
                      Screenshot
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-text-secondary">
                      Date
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-text-secondary">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-text-secondary">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-light">
                  {filteredVerifications.map((verification) => (
                    <tr
                      key={verification.id}
                      className="hover:bg-surface-light/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>
                              {getInitials(
                                verification.user?.full_name ||
                                  verification.user?.email ||
                                  'U'
                              )}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-white">
                              {verification.user?.full_name || 'Utilisateur'}
                            </p>
                            <p className="text-sm text-text-muted">
                              {verification.user?.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <code className="bg-background px-2 py-1 rounded text-sm text-primary">
                          {verification.bookmaker_identifier}
                        </code>
                      </td>
                      <td className="px-6 py-4">
                        {verification.screenshot_url ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              // Open screenshot in new tab
                              const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/vip-verifications/${verification.screenshot_url}`;
                              window.open(url, '_blank');
                            }}
                          >
                            <ImageIcon className="h-4 w-4 mr-1" />
                            Voir
                            <ExternalLink className="h-3 w-3 ml-1" />
                          </Button>
                        ) : (
                          <span className="text-text-muted text-sm">Aucun</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-text-secondary">
                        {new Date(verification.created_at).toLocaleDateString(
                          'fr-FR',
                          {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          }
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          variant={
                            verification.status === 'approved'
                              ? 'success'
                              : verification.status === 'rejected'
                              ? 'destructive'
                              : 'warning'
                          }
                        >
                          {verification.status === 'approved'
                            ? 'Approuvé'
                            : verification.status === 'rejected'
                            ? 'Rejeté'
                            : 'En attente'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        {verification.status === 'pending' && (
                          <div className="flex items-center gap-2">
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleApprove(verification.id)}
                              disabled={processing === verification.id}
                            >
                              {processing === verification.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Approuver
                                </>
                              )}
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleReject(verification.id)}
                              disabled={processing === verification.id}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Rejeter
                            </Button>
                          </div>
                        )}
                        {verification.status !== 'pending' && verification.admin_notes && (
                          <p className="text-xs text-text-muted">
                            Note: {verification.admin_notes}
                          </p>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
