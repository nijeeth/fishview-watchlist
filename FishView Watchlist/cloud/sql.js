export const SETUP_SQL = `-- FishView Watchlist · run once in Supabase SQL Editor
create table if not exists public.fv_list_book (
  user_id uuid primary key references auth.users (id) on delete cascade,
  book jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.fv_list_book enable row level security;

drop policy if exists "fv_list_book_select" on public.fv_list_book;
drop policy if exists "fv_list_book_insert" on public.fv_list_book;
drop policy if exists "fv_list_book_update" on public.fv_list_book;
drop policy if exists "fv_list_book_delete" on public.fv_list_book;

create policy "fv_list_book_select" on public.fv_list_book
  for select using (auth.uid() = user_id);
create policy "fv_list_book_insert" on public.fv_list_book
  for insert with check (auth.uid() = user_id);
create policy "fv_list_book_update" on public.fv_list_book
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "fv_list_book_delete" on public.fv_list_book
  for delete using (auth.uid() = user_id);

grant select, insert, update, delete on table public.fv_list_book to authenticated;
`;
