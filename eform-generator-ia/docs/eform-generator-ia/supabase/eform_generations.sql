-- =============================================================================
-- Generador de eForms IA — historial de generaciones (corregido: profiles.user_id)
-- =============================================================================

create table if not exists public.eform_generations (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  parent_id        uuid references public.eform_generations(id) on delete set null,
  version          int  not null default 1,
  created_at       timestamptz not null default now(),

  request_text     text not null,
  environment      text not null check (environment in ('online', 'onpremise')),
  tenant           text,
  server_url       text,
  blocks           text[] not null default '{}',
  answers          jsonb,
  category_fields  jsonb,
  used_custom_template boolean not null default false,

  detailed_prompt  text,
  refine_instruction text,
  form_name        text,
  form_id          text,
  components       jsonb,
  xml              text,
  validation       jsonb,
  status           text not null default 'draft'
                   check (status in ('draft', 'generated', 'invalid', 'error')),
  model_id         text,
  usage            jsonb
);

create index if not exists eform_generations_user_created_idx
  on public.eform_generations (user_id, created_at desc);

-- ¿El usuario actual es admin?
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.user_id = auth.uid() and p.role = 'admin'
  );
$$;

-- RLS: solo admins, y cada uno ve/edita lo suyo
alter table public.eform_generations enable row level security;

drop policy if exists "eform_gen_select_own_admin" on public.eform_generations;
create policy "eform_gen_select_own_admin" on public.eform_generations
  for select using (user_id = auth.uid() and public.is_admin());

drop policy if exists "eform_gen_insert_own_admin" on public.eform_generations;
create policy "eform_gen_insert_own_admin" on public.eform_generations
  for insert with check (user_id = auth.uid() and public.is_admin());

drop policy if exists "eform_gen_update_own_admin" on public.eform_generations;
create policy "eform_gen_update_own_admin" on public.eform_generations
  for update using (user_id = auth.uid() and public.is_admin());

drop policy if exists "eform_gen_delete_own_admin" on public.eform_generations;
create policy "eform_gen_delete_own_admin" on public.eform_generations
  for delete using (user_id = auth.uid() and public.is_admin());