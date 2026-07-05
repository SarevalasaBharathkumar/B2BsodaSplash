alter table quotes add column if not exists cancelled_at timestamptz;

update quotes
set cancelled_at = coalesce(cancelled_at, updated_at, now())
where status = 'cancelled'
  and cancelled_at is null;

create index if not exists quotes_cancelled_at_idx
on quotes (cancelled_at)
where status = 'cancelled';

create extension if not exists pg_cron with schema extensions;

do $$
begin
  if exists (select 1 from cron.job where jobname = 'cleanup_cancelled_orders_after_10_days') then
    perform cron.unschedule('cleanup_cancelled_orders_after_10_days');
  end if;
end $$;

select cron.schedule(
  'cleanup_cancelled_orders_after_10_days',
  '0 3 * * *',
  $$
    delete from public.quotes
    where status = 'cancelled'
      and cancelled_at is not null
      and cancelled_at < now() - interval '10 days';
  $$
);
