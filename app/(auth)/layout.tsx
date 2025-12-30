import Link from 'next/link';
import { Logo } from '@/components/shared/Logo';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-2/5 bg-gradient-to-br from-surface via-background to-surface relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-20 w-64 h-64 bg-primary rounded-full mix-blend-multiply filter blur-[100px] animate-blob"></div>
          <div className="absolute bottom-40 right-20 w-64 h-64 bg-secondary rounded-full mix-blend-multiply filter blur-[100px] animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-20 left-1/2 w-48 h-48 bg-[#00D4FF] rounded-full mix-blend-multiply filter blur-[80px] animate-blob animation-delay-4000"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <Logo size="lg" />

          <div className="space-y-8">
            <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight">
              L&apos;IA la plus avancée
              <br />
              pour vos{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-[#00D4FF]">
                paris sportifs
              </span>
            </h1>
            <p className="text-text-secondary text-lg max-w-md">
              Rejoignez plus de 15,000 utilisateurs qui font confiance à AlgoPronos
              AI pour générer des combinés gagnants.
            </p>
            <div className="flex items-center gap-8 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-primary rounded-full animate-pulse"></div>
                <span className="text-text-secondary">78.5% taux de réussite</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-[#00D4FF] rounded-full animate-pulse"></div>
                <span className="text-text-secondary">VIP Gratuit à vie</span>
              </div>
            </div>
          </div>

          <p className="text-text-muted text-sm">
            &copy; {new Date().getFullYear()} AlgoPronos AI. Tous droits réservés.
          </p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden mb-8">
            <Link href="/">
              <Logo size="lg" />
            </Link>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
