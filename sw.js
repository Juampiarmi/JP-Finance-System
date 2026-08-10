-- ============================================================================
-- JP Finance System / Seven Tangos — Esquema Limpio para Supabase
-- ============================================================================

-- 1. Limpiamos tablas anteriores si existían de pruebas pasadas
drop table if exists public.transactions cascade;
drop table if exists public.budgets cascade;
drop table if exists public.goals cascade;
drop table if exists public.categories cascade;
drop table if exists public.profiles cascade;

-- 2. Habilitamos la extensión de UUID
create extension if not exists "uuid-ossp";

-- 3. Tabla de Transacciones (filtrada por device_code)
create table public.transactions (
  id uuid primary key default uuid_generate_v4(),
  device_code text not null,
  date date not null,
  description text not null,
  amount numeric not null,
  type text not null check (type in ('income', 'expense')),
  category_id text,
  account text,
  notes text,
  is_recurring boolean default false,
  recurrence jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index transactions_device_code_idx on public.transactions (device_code);

-- 4. Tabla de Presupuestos
create table public.budgets (
  id uuid primary key default uuid_generate_v4(),
  device_code text not null,
  category_id text not null,
  monthly_limit numeric not null,
  month text not null
);
create index budgets_device_code_idx on public.budgets (device_code);

-- 5. Tabla de Metas
create table public.goals (
  id uuid primary key default uuid_generate_v4(),
  device_code text not null,
  name text not null,
  type text not null,
  target_amount numeric not null,
  current_amount numeric default 0,
  target_date date,
  color text,
  created_at timestamptz default now()
);
create index goals_device_code_idx on public.goals (device_code);

-- 6. Habilitar RLS (Row Level Security) y Políticas Abiertas
alter table public.transactions enable row level security;
alter table public.budgets enable row level security;
alter table public.goals enable row level security;

create policy "allow all - transactions" on public.transactions for all using (true) with check (true);
create policy "allow all - budgets" on public.budgets for all using (true) with check (true);
create policy "allow all - goals" on public.goals for all using (true) with check (true);

-- 7. Trigger para actualizar la fecha de modificación en transactions
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_transactions_updated_at on public.transactions;
create trigger trg_transactions_updated_at
  before update on public.transactions
  for each row execute function public.set_updated_at();
