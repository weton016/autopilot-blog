import Link from 'next/link';
import type { FunnelStage } from '../../../domain/blog/value-objects/FunnelStage';

interface CTABannerProps {
  funnelStage: FunnelStage;
  websiteUrl: string;
  relatedMiddleSlug?: string;
  relatedBottomSlug?: string;
}

const CTA_CONFIG = {
  TOP: {
    heading: 'Descubra ferramentas que facilitam sua vida',
    body: 'Veja como ferramentas modernas de agendamento estão transformando a rotina de freelancers e pequenas empresas.',
    label: 'Ver como funciona',
    style: 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800',
    btnStyle: 'bg-blue-600 hover:bg-blue-700 text-white',
  },
  MIDDLE: {
    heading: 'Compare as melhores opções do mercado',
    body: 'Veja como o <your-website> se compara às alternativas — preço, funcionalidades e facilidade de uso.',
    label: 'Comparar agora',
    style: 'bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800',
    btnStyle: 'bg-purple-600 hover:bg-purple-700 text-white',
  },
  BOTTOM: {
    heading: 'Comece grátis — sem cartão de crédito',
    body: 'Junte-se a milhares de freelancers e pequenas empresas que já economizam tempo com o <your-website>.',
    label: 'Começar gratuitamente',
    style: 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800',
    btnStyle: 'bg-green-600 hover:bg-green-700 text-white',
  },
} as const;

export function CTABanner({
  funnelStage,
  websiteUrl,
  relatedMiddleSlug,
  relatedBottomSlug,
}: CTABannerProps) {
  const config = CTA_CONFIG[funnelStage];

  const href =
    funnelStage === 'TOP'
      ? relatedMiddleSlug
        ? `/${relatedMiddleSlug}`
        : `${websiteUrl}/features`
      : funnelStage === 'MIDDLE'
        ? relatedBottomSlug
          ? `/${relatedBottomSlug}`
          : `${websiteUrl}/pricing`
        : `${websiteUrl}/signup`;

  return (
    <div className={`my-10 rounded-2xl border p-6 md:p-8 ${config.style}`}>
      <h3 className="text-xl font-bold mb-2">{config.heading}</h3>
      <p className="text-muted-foreground mb-4">{config.body}</p>
      <Link
        href={href}
        className={`inline-block px-5 py-2.5 rounded-lg font-semibold transition-colors ${config.btnStyle}`}
      >
        {config.label}
      </Link>
    </div>
  );
}
