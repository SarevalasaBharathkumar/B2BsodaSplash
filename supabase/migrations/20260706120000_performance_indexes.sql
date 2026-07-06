create index if not exists quotes_created_at_idx on quotes (created_at desc);
create index if not exists quotes_bd_id_created_at_idx on quotes (bd_id, created_at desc);
create index if not exists quotes_assigned_to_created_at_idx on quotes (assigned_to, created_at desc);
create index if not exists quotes_status_created_at_idx on quotes (status, created_at desc);

create index if not exists profiles_role_is_active_full_name_idx on profiles (role, is_active, full_name);
create index if not exists profiles_role_is_active_created_at_idx on profiles (role, is_active, created_at desc);

create index if not exists products_active_display_order_idx on products (is_active, display_order, created_at desc);
create index if not exists flavours_product_active_display_order_idx on flavours (product_id, is_active, display_order, created_at desc);
create index if not exists flavours_active_display_order_idx on flavours (is_active, display_order, created_at desc);

create index if not exists quote_items_quote_id_idx on quote_items (quote_id);
create index if not exists quote_status_events_quote_id_created_at_idx on quote_status_events (quote_id, created_at desc);
create index if not exists tracking_otps_lookup_idx on tracking_otps (quote_id, email, code, expires_at desc, used_at);
create index if not exists invoices_quote_id_version_idx on invoices (quote_id, version desc);
