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

-- Content creation jobs
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

-- Topic history (avoid repeating content)
create table topic_history (
  id uuid primary key default gen_random_uuid(),
  topic text not null,
  funnel_stage text not null,
  primary_keyword text,
  keywords text[],
  created_at timestamptz default now()
);

-- Cache of researched keywords (avoid unnecessary API re-queries)
create table keyword_cache (
  id uuid primary key default gen_random_uuid(),
  keyword text unique not null,
  volume int,
  difficulty int,
  cpc numeric,
  fetched_at timestamptz default now()
);

-- Indexes
create index posts_slug_idx on posts(slug);
create index posts_funnel_stage_idx on posts(funnel_stage);
create index posts_published_at_idx on posts(published_at desc);
create index content_jobs_scheduled_date_idx on content_jobs(scheduled_date);
create index content_jobs_status_idx on content_jobs(status);
create index keyword_cache_keyword_idx on keyword_cache(keyword);
