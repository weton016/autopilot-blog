-- Create public bucket for post cover images
insert into storage.buckets (id, name, public)
values ('post-covers', 'post-covers', true)
on conflict (id) do nothing;

-- Allow public read access
create policy "Public read post-covers"
  on storage.objects for select
  using (bucket_id = 'post-covers');

-- Allow service role to upload
create policy "Service role upload post-covers"
  on storage.objects for insert
  with check (bucket_id = 'post-covers');
