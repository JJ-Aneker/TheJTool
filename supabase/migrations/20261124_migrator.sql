-- ============================================================================
-- Migrador de documentos (TheJTool)
-- Registro de migraciones y de cada documento migrado, para:
--   · no duplicar documentos si se repite una migración
--   · poder reanudar una migración interrumpida
-- Ejecutar una vez en Supabase → SQL Editor.
-- ============================================================================

create table if not exists public.migration_runs (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name            text not null,
  mode            text not null check (mode in ('copy', 'download')),
  src_tenant_id   text not null,
  src_category_no integer not null,
  src_category    text,
  dst_tenant_id   text,
  dst_category_no integer,
  dst_category    text,
  field_map       jsonb not null default '{}'::jsonb,
  options         jsonb not null default '{}'::jsonb,
  status          text not null default 'pending'
                  check (status in ('pending', 'running', 'stopped', 'done', 'done_with_errors')),
  total           integer not null default 0,
  ok_count        integer not null default 0,
  error_count     integer not null default 0,
  skipped_count   integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table if not exists public.migration_items (
  id              bigserial primary key,
  user_id         uuid not null default auth.uid() references auth.users(id) on delete cascade,
  run_id          uuid references public.migration_runs(id) on delete set null,
  src_tenant_id   text not null,
  src_category_no integer not null,
  src_doc_no      integer not null,
  dst_tenant_id   text,
  dst_category_no integer,
  dst_doc_no      integer,
  status          text not null check (status in ('ok', 'error')),
  error           text,
  created_at      timestamptz not null default now()
);

-- Búsqueda rápida de "ya migrados" para un par origen → destino
create index if not exists migration_items_pair_idx
  on public.migration_items (src_tenant_id, src_category_no, dst_tenant_id, dst_category_no, status);
create index if not exists migration_runs_user_idx on public.migration_runs (user_id, created_at desc);

alter table public.migration_runs  enable row level security;
alter table public.migration_items enable row level security;

drop policy if exists "migration_runs_own" on public.migration_runs;
create policy "migration_runs_own" on public.migration_runs
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "migration_items_own" on public.migration_items;
create policy "migration_items_own" on public.migration_items
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
