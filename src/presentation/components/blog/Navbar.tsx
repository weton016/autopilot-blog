'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, type FormEvent } from 'react';
import { Search } from 'lucide-react';


export function Navbar() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    const q = inputRef.current?.value.trim();
    if (q) {
      router.push(`/?q=${encodeURIComponent(q)}`);
    } else {
      router.push('/');
    }
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-4">
        {/* Brand */}
        <Link
          href="/"
          className="font-bold text-lg tracking-tight shrink-0 hover:text-primary transition-colors"
        >
          your-website Blog
        </Link>

        {/* Search */}
        <form
          onSubmit={handleSearch}
          className="flex-1 max-w-sm ml-auto flex items-center gap-1 rounded-lg border border-input bg-muted/40 px-3 py-1.5 focus-within:border-ring focus-within:ring-1 focus-within:ring-ring transition-all"
        >
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            type="search"
            placeholder="Buscar artigos…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </form>


      </div>
    </header>
  );
}
