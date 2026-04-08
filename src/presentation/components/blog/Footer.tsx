import Link from 'next/link';

const WEBSITE_URL = process.env.WEBSITE_URL ?? '';

const LINKS = [
  { label: 'Funcionalidades', href: `${WEBSITE_URL}/features` },
  { label: 'Preços', href: `${WEBSITE_URL}/pricing` },
  { label: 'Criar conta', href: `${WEBSITE_URL}/auth/sign-up` },
];

export function Footer() {
  return (
    <footer className="border-t border-border mt-20">
      <div className="max-w-6xl mx-auto px-4 py-10 flex flex-col sm:flex-row items-center justify-between gap-6">
        {/* Brand */}
        <div className="flex flex-col items-center sm:items-start gap-1">
          <Link href="/" className="font-bold text-base hover:text-primary transition-colors">
            your-website Blog
          </Link>

        </div>

        {/* Nav links */}
        <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Copyright */}
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} your-website. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}
