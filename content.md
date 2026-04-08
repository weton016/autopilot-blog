# Prompt para Claude Code — Blog Automatizado com Next.js, Supabase, OpenAI, Gemini e Vercel

Crie um blog automatizado completo com Next.js 15 (App Router), Supabase, OpenAI, Google Gemini e deploy na Vercel, seguindo DDD, design patterns e arquitetura de software sênior.

---

## VARIÁVEIS DE AMBIENTE NECESSÁRIAS

```env
# OpenAI
OPENAI_API_KEY=

# Google Gemini (geração de imagens)
GEMINI_API_KEY=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Blog config
BLOG_TOPIC="Meu app é um app de agendamento chamado <your-website> que ajuda autônomos e pequenos negócios a gerenciar clientes e compromissos"
WEBSITE_URL="https://<your-website>.app"
POSTS_PER_DAY=3
POST_CREATION_INTERVAL_DAYS=1

# Keyword Research — DataForSEO (recomendado, tem plano pay-per-use barato)
DATAFORSEO_LOGIN=
DATAFORSEO_PASSWORD=

# Cron secret
CRON_SECRET=
```

---

## ARQUITETURA (DDD + Design Patterns)

### Estrutura de pastas

```
src/
  domain/
    blog/
      entities/
        Post.ts
        Job.ts
        Keyword.ts
      value-objects/
        PostSlug.ts
        FunnelStage.ts        # TOP | MIDDLE | BOTTOM
        PostStatus.ts
        KeywordMetrics.ts     # volume, difficulty, cpc
      repositories/
        IPostRepository.ts
        IJobRepository.ts
        IKeywordRepository.ts
      services/
        ContentGenerationService.ts
        FunnelStrategyService.ts      # Strategy Pattern — proporção 60/25/15
        KeywordResearchService.ts     # Seleciona keywords por volume/dificuldade
      events/
        PostCreatedEvent.ts
        JobScheduledEvent.ts
  application/
    use-cases/
      ScheduleWeeklyJobsUseCase.ts   # Inclui keyword research antes de criar jobs
      ExecuteDailyJobsUseCase.ts
      GeneratePostUseCase.ts
      GenerateCoverImageUseCase.ts   # Chama Gemini para gerar imagem do post
      GetPostUseCase.ts
      ListPostsUseCase.ts
    dtos/
      CreateJobDTO.ts
      GeneratePostDTO.ts
      PostResponseDTO.ts
      KeywordDTO.ts
  infrastructure/
    repositories/
      SupabasePostRepository.ts
      SupabaseJobRepository.ts
      SupabaseKeywordRepository.ts
    ai/
      OpenAIContentGenerator.ts       # Adapter Pattern — geração de texto
      GeminiImageGenerator.ts         # Adapter Pattern — geração de imagem
      PromptBuilder.ts                # Builder Pattern
    seo/
      KeywordResearchAdapter.ts       # Adapter para DataForSEO API
      MetadataFactory.ts              # Factory Pattern
      StructuredDataBuilder.ts
    storage/
      SupabaseStorageAdapter.ts       # Upload da imagem gerada pelo Gemini
    cache/
      RevalidationService.ts
  presentation/
    app/
      (blog)/
        page.tsx                      # Home com lista de posts
        [slug]/
          page.tsx                    # Post ISR revalidate: 604800 (7 dias)
        sitemap.ts
        robots.ts
      api/
        cron/
          weekly-scheduler/route.ts
          daily-executor/route.ts
    components/
      blog/
        PostCard.tsx
        PostContent.tsx
        CTABanner.tsx                 # CTA inteligente por funnel stage
        RelatedPosts.tsx              # Internal linking automático
      seo/
        JsonLd.tsx
      ui/
        ...
```

---

## BANCO DE DADOS (Supabase)

```sql
-- Posts
create table posts (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  excerpt text not null,
  content text not null,
  cover_image_url text,
  funnel_stage text not null check (funnel_stage in ('TOP', 'MIDDLE', 'BOTTOM')),
  topic_cluster text,
  related_post_ids uuid[],
  keywords text[],
  primary_keyword text,
  keyword_volume int,
  keyword_difficulty int,
  meta_title text,
  meta_description text,
  og_image text,
  read_time_minutes int,
  published_at timestamptz default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Jobs de criação de conteúdo
create table content_jobs (
  id uuid primary key default gen_random_uuid(),
  scheduled_date date not null,
  funnel_stage text not null check (funnel_stage in ('TOP', 'MIDDLE', 'BOTTOM')),
  topic_hint text not null,
  primary_keyword text,
  keywords_to_target text[],
  keyword_volume int,
  keyword_difficulty int,
  status text not null default 'PENDING' check (status in ('PENDING', 'RUNNING', 'DONE', 'FAILED')),
  post_id uuid references posts(id),
  error_message text,
  created_at timestamptz default now(),
  executed_at timestamptz
);

-- Histórico de tópicos (evitar repetição de conteúdo)
create table topic_history (
  id uuid primary key default gen_random_uuid(),
  topic text not null,
  funnel_stage text not null,
  primary_keyword text,
  keywords text[],
  created_at timestamptz default now()
);

-- Cache de keywords pesquisadas (evitar re-consultar a API desnecessariamente)
create table keyword_cache (
  id uuid primary key default gen_random_uuid(),
  keyword text unique not null,
  volume int,
  difficulty int,
  cpc numeric,
  fetched_at timestamptz default now()
);

-- Índices
create index posts_slug_idx on posts(slug);
create index posts_funnel_stage_idx on posts(funnel_stage);
create index posts_published_at_idx on posts(published_at desc);
create index content_jobs_scheduled_date_idx on content_jobs(scheduled_date);
create index content_jobs_status_idx on content_jobs(status);
create index keyword_cache_keyword_idx on keyword_cache(keyword);
```

---

## LÓGICA DE NEGÓCIO

### FunnelStrategyService — Strategy Pattern

Implementar a proporção 60% TOP / 25% MIDDLE / 15% BOTTOM.
Para cada semana, calcular quantos posts de cada estágio devem ser criados com base em `POSTS_PER_DAY * 7`, respeitando as proporções e garantindo pelo menos 1 de cada tipo.

---

### Keyword Research (NOVO — acelera tráfego)

O sistema não deve gerar posts sobre tópicos aleatórios. Antes de criar os jobs semanais, deve executar pesquisa de keywords via DataForSEO API para identificar termos com:

- Volume de busca mensal > 100
- Keyword Difficulty (KD) < 40 (baixa concorrência)
- Relevância com `BLOG_TOPIC`

Implementar `KeywordResearchAdapter` que:

1. Usa a OpenAI para gerar uma lista de 30 seed keywords relacionadas ao `BLOG_TOPIC` e ao estágio de funil
2. Envia essas seeds para a DataForSEO API (`/v3/keywords_data/google_ads/search_volume/live`)
3. Filtra e ranqueia por melhor oportunidade (volume alto + dificuldade baixa)
4. Verifica no `keyword_cache` antes de chamar a API (TTL de 30 dias)
5. Retorna as melhores keywords para o `ScheduleWeeklyJobsUseCase` usar ao criar os jobs

Cada job criado deve ter `primary_keyword`, `keywords_to_target`, `keyword_volume` e `keyword_difficulty` preenchidos.

O `GeneratePostUseCase` deve usar a `primary_keyword` como âncora do conteúdo, garantindo que ela apareça no título, no primeiro parágrafo, em pelo menos um subtítulo H2 e na meta description.

---

### ScheduleWeeklyJobsUseCase

- Executado toda segunda-feira via cron
- Executa `KeywordResearchAdapter` para obter keywords validadas por volume e dificuldade
- Calcula posts necessários para os próximos `POST_CREATION_INTERVAL_DAYS` dias
- Para cada post define: `funnel_stage`, `topic_hint`, `primary_keyword`, `keywords_to_target`
- Consulta `topic_history` para evitar repetição de assuntos e keywords já usadas
- Persiste `content_jobs` com `scheduled_date` distribuído pelos dias da semana

### ExecuteDailyJobsUseCase

- Executado todo dia via cron
- Busca jobs com `scheduled_date = hoje` e `status = PENDING`
- Para cada job: executa `GeneratePostUseCase` e depois `GenerateCoverImageUseCase`
- Atualiza status do job (`RUNNING → DONE | FAILED`)

### GeneratePostUseCase

Usa o `PromptBuilder` (Builder Pattern) para montar prompt rico contendo:

- Contexto do negócio (`BLOG_TOPIC` + `WEBSITE_URL`)
- Estágio do funil com instrução de tom e objetivo
- `primary_keyword` como âncora obrigatória do conteúdo
- Keywords secundárias para inclusão natural
- Tópicos já existentes para evitar repetição

O post gerado deve conter:

- Título SEO-friendly com a `primary_keyword`
- Excerpt (150–160 chars) com a keyword
- Conteúdo em Markdown (1500–2500 palavras)
- Keyword no primeiro parágrafo, em pelo menos um H2 e na conclusão
- Meta title e meta description com a keyword
- Keywords primárias e secundárias
- Cluster temático
- IDs de posts relacionados para internal linking
- Tempo de leitura calculado automaticamente

Após criação, registrar o assunto e a keyword usada em `topic_history`.

---

### GenerateCoverImageUseCase (NOVO — Google Gemini)

Após criar o post, gerar automaticamente uma imagem de capa usando a API do Google Gemini (`gemini-2.0-flash-preview-image-generation` ou o modelo de imagem mais recente disponível).

Fluxo:

1. Recebe o título e o excerpt do post recém-criado
2. Usa o `PromptBuilder` para montar um prompt de imagem descritivo, moderno e relacionado ao tema do post — sem texto na imagem, estilo ilustração digital profissional
3. Chama a Gemini API para gerar a imagem
4. Faz upload da imagem para o Supabase Storage via `SupabaseStorageAdapter` no bucket `post-covers`, com o nome `{post-slug}.webp`
5. Atualiza `cover_image_url` e `og_image` do post com a URL pública da imagem

Exemplo de chamada à Gemini API:

```ts
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash-preview-image-generation",
});

const result = await model.generateContent({
  contents: [{ role: "user", parts: [{ text: imagePrompt }] }],
  generationConfig: { responseModalities: ["IMAGE", "TEXT"] },
});

// Extrair a imagem do resultado e converter para Buffer para upload
```

A imagem deve ser sempre 1200x630px (formato OG ideal) ou o mais próximo possível do que a API suportar, e salva em WebP para performance.

---

## INTERNAL LINKING AUTOMÁTICO

Ao criar um post, buscar posts relacionados por:

1. Mesmo `topic_cluster`
2. Keywords em comum
3. Estágio de funil adjacente (TOP → MIDDLE → BOTTOM)

Salvar os IDs em `related_post_ids` e renderizar no componente `RelatedPosts`.

---

## CTAs INTELIGENTES POR ESTÁGIO DE FUNIL

O componente `CTABanner` deve variar conforme o `funnel_stage`:

- **TOP:** CTA suave — "Conheça ferramentas que facilitam sua vida" → link para post MIDDLE ou página de features
- **MIDDLE:** CTA médio — "Compare as melhores opções do mercado" → link para post BOTTOM ou pricing
- **BOTTOM:** CTA forte — "Comece grátis agora" → link direto para `${WEBSITE_URL}/signup`

---

## ROTAS DE API — CRON

### POST `/api/cron/weekly-scheduler`

- Validar `Authorization: Bearer ${CRON_SECRET}`
- Executar `ScheduleWeeklyJobsUseCase` (inclui keyword research)
- Retornar jobs criados com keywords validadas

### POST `/api/cron/daily-executor`

- Validar `Authorization: Bearer ${CRON_SECRET}`
- Executar `ExecuteDailyJobsUseCase` (gera texto + imagem Gemini)
- Retornar posts criados

### vercel.json

```json
{
  "crons": [
    { "path": "/api/cron/weekly-scheduler", "schedule": "0 6 * * 1" },
    { "path": "/api/cron/daily-executor", "schedule": "0 8 * * *" }
  ]
}
```

---

## ISR E PERFORMANCE

- Páginas de post: `export const revalidate = 604800` (7 dias)
- Homepage: `export const revalidate = 3600` (1 hora)

Otimizações obrigatórias para score 100 no Google PageSpeed:

- `next/image` com `priority` no LCP (imagem de capa gerada pelo Gemini)
- `next/font` para fontes sem layout shift
- Sem CSS externo bloqueante
- Componentes de terceiros com `dynamic(() => import(...), { ssr: false })` quando necessário
- Prefetch de rotas internas via `<Link>`
- Minimizar JavaScript de terceiros

---

## SEO COMPLETO

### Metadata dinâmica por post

```ts
export async function generateMetadata({ params }): Promise<Metadata> {
  const post = await getPost(params.slug);
  return {
    title: post.metaTitle,
    description: post.metaDescription,
    keywords: post.keywords,
    authors: [{ name: "Blog Name" }],
    openGraph: {
      title: post.metaTitle,
      description: post.metaDescription,
      url: `${process.env.WEBSITE_URL}/blog/${post.slug}`,
      siteName: "Blog Name",
      images: [{ url: post.ogImage, width: 1200, height: 630 }],
      type: "article",
      publishedTime: post.publishedAt,
    },
    twitter: {
      card: "summary_large_image",
      title: post.metaTitle,
      description: post.metaDescription,
      images: [post.ogImage],
    },
    alternates: {
      canonical: `${process.env.WEBSITE_URL}/blog/${post.slug}`,
    },
  };
}
```

### `/robots.ts`

```ts
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/api/" },
    sitemap: `${process.env.WEBSITE_URL}/sitemap.xml`,
  };
}
```

### `/sitemap.ts`

Gerar sitemap dinâmico com todos os posts publicados, incluindo `lastModified` e `changeFrequency: "weekly"`.

### `/llms.txt`

Criar rota estática em `public/llms.txt` descrevendo o blog para crawlers de LLMs:

```
# Blog Name

> [BLOG_TOPIC]

Este blog publica conteúdo sobre [tema], cobrindo desde conceitos introdutórios
até comparações e reviews de ferramentas. Todo conteúdo é otimizado para SEO
e organizado por estágio de funil (topo, meio e fundo).

## Seções

- /blog — todos os artigos
- /blog/[slug] — artigo individual

## Links úteis

- Website: [WEBSITE_URL]
- Sitemap: [WEBSITE_URL]/sitemap.xml
```

### JSON-LD por post

Implementar `Article` schema com `author`, `datePublished`, `dateModified`, `headline`, `image` e `publisher`.

---

## AI SUPPORT (llms.txt + meta tags)

Adicionar nas páginas de post:

```html
<meta
  name="robots"
  content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1"
/>
```

---

## PADRÕES DE QUALIDADE OBRIGATÓRIOS

- Todo código TypeScript com tipagem estrita (`strict: true`)
- Repositories acessam Supabase apenas via `SUPABASE_SERVICE_ROLE_KEY` nas rotas de servidor
- Nunca expor `SERVICE_ROLE_KEY` no cliente
- Erros tratados com Result Pattern ou exceções de domínio tipadas
- Logs estruturados em todas as operações de cron
- Testes unitários nos Use Cases e Domain Services com Vitest
- README completo com instruções de setup, variáveis de ambiente, como configurar os crons na Vercel e como obter as credenciais do DataForSEO e Gemini
