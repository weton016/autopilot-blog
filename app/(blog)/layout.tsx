import { Suspense } from 'react';
import { Navbar } from '@/src/presentation/components/blog/Navbar';
import { Footer } from '@/src/presentation/components/blog/Footer';

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Suspense>
        <Navbar />
      </Suspense>
      <div className="flex-1">{children}</div>
      <Footer />
    </div>
  );
}
