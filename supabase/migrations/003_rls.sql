-- Enable RLS on all tables
alter table posts enable row level security;
alter table content_jobs enable row level security;
alter table topic_history enable row level security;
alter table keyword_cache enable row level security;

-- posts: anyone can read, only service role can write (service role bypasses RLS)
create policy "Public read posts"
  on posts for select
  using (true);

-- content_jobs, topic_history, keyword_cache: no public access
-- (service role bypasses RLS, so cron jobs work without extra policies)
