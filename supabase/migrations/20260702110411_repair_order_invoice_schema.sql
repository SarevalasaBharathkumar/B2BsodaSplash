alter table quotes add column if not exists subtotal integer not null default 0;
alter table quotes add column if not exists discount_type text check (discount_type in ('percentage', 'flat') or discount_type is null);
alter table quotes add column if not exists discount_value integer not null default 0;
alter table quotes add column if not exists discount_amount integer not null default 0;
alter table quotes add column if not exists tax_amount integer not null default 0;
alter table quotes add column if not exists additional_charges integer not null default 0;
alter table quotes add column if not exists total integer not null default 0;
alter table quotes add column if not exists payment_status text not null default 'pending' check (payment_status in ('pending', 'partial', 'paid', 'refunded'));
alter table quotes add column if not exists invoice_version integer not null default 0;
alter table quotes add column if not exists latest_invoice_number text;
alter table quotes add column if not exists finalized_at timestamptz;
alter table quotes add column if not exists cancelled_at timestamptz;

create table if not exists invoices (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references quotes(id) on delete cascade,
  invoice_number text not null unique,
  version integer not null default 1,
  storage_path text,
  pdf_url text,
  is_latest boolean not null default true,
  emailed_to text,
  emailed_at timestamptz,
  pricing_snapshot jsonb not null,
  generated_at timestamptz not null default now()
);

alter table invoices add column if not exists quote_id uuid references quotes(id) on delete cascade;
alter table invoices add column if not exists invoice_number text;
alter table invoices add column if not exists version integer not null default 1;
alter table invoices add column if not exists storage_path text;
alter table invoices add column if not exists pdf_url text;
alter table invoices add column if not exists is_latest boolean not null default true;
alter table invoices add column if not exists emailed_to text;
alter table invoices add column if not exists emailed_at timestamptz;
alter table invoices add column if not exists pricing_snapshot jsonb not null default '{}'::jsonb;
alter table invoices add column if not exists generated_at timestamptz not null default now();

alter table invoices enable row level security;

insert into storage.buckets (id, name, public)
select 'invoices', 'invoices', false
where not exists (select 1 from storage.buckets where id = 'invoices');
