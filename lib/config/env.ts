const REQUIRED_SERVER_ENV = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'VENICE_API_KEY',
  'API_FOOTBALL_KEY',
  'RESEND_API_KEY',
  'ADMIN_EMAILS',
] as const;

export function validateEnv(): void {
  const missing = REQUIRED_SERVER_ENV.filter(key => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(
      `Variables d'environnement manquantes: ${missing.join(', ')}. Vérifiez votre configuration Vercel.`
    );
  }
}

export function requireEnv(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Variable d'environnement manquante: ${key}`);
  return val;
}
