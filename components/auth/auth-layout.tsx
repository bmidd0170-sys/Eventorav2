'use client';

import Link from 'next/link';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  footerText: string;
  footerLink: {
    text: string;
    href: string;
  };
}

export function AuthLayout({
  children,
  title,
  subtitle,
  footerText,
  footerLink,
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        {/* Logo/Branding */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Invyra</h1>
          <p className="text-muted-foreground">Create Invitations That Feel Alive</p>
        </div>

        {/* Auth Card */}
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold">{title}</h2>
            <p className="text-muted-foreground mt-2">{subtitle}</p>
          </div>

          {/* Forms */}
          {children}

          {/* Footer Link */}
          <div className="text-center text-sm text-muted-foreground">
            {footerText}{' '}
            <Link
              href={footerLink.href}
              className="text-primary hover:underline font-medium"
            >
              {footerLink.text}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
