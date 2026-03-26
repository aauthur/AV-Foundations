create table if not exists public.lesson_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  course_slug text not null,
  lesson_slug text not null,
  lesson_type text not null check (lesson_type in ('lesson', 'quiz', 'exam')),
  status text not null check (status in ('in_progress', 'completed')),
  attempts integer not null default 0 check (attempts >= 0),
  completed_at timestamptz null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint lesson_progress_pkey primary key (user_id, course_slug, lesson_slug)
);

create index if not exists lesson_progress_user_course_idx
  on public.lesson_progress (user_id, course_slug);

create index if not exists lesson_progress_user_status_idx
  on public.lesson_progress (user_id, status);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists trg_lesson_progress_updated_at on public.lesson_progress;
create trigger trg_lesson_progress_updated_at
before update on public.lesson_progress
for each row
execute function public.set_updated_at();

alter table public.lesson_progress enable row level security;

drop policy if exists "lesson_progress_select_own" on public.lesson_progress;
create policy "lesson_progress_select_own"
on public.lesson_progress
for select
using (auth.uid() = user_id);

drop policy if exists "lesson_progress_insert_own" on public.lesson_progress;
create policy "lesson_progress_insert_own"
on public.lesson_progress
for insert
with check (auth.uid() = user_id);

drop policy if exists "lesson_progress_update_own" on public.lesson_progress;
create policy "lesson_progress_update_own"
on public.lesson_progress
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "lesson_progress_delete_own" on public.lesson_progress;
create policy "lesson_progress_delete_own"
on public.lesson_progress
for delete
using (auth.uid() = user_id);
