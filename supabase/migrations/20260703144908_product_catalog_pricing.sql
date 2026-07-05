alter table products add column if not exists display_order integer not null default 0;

update products
set name = 'Goli Soda',
    description = coalesce(description, 'Classic marble soda bottles supplied by the case.'),
    display_order = 1
where name = 'SodaSplash'
  and not exists (select 1 from products existing where existing.name = 'Goli Soda');

update products
set display_order = case when display_order = 0 then 1 else display_order end
where name = 'Goli Soda';

with goli_product as (
  select id from products where name = 'Goli Soda' order by created_at limit 1
),
old_product as (
  select id from products where name = 'SodaSplash' order by created_at limit 1
)
update flavours
set product_id = goli_product.id
from goli_product, old_product
where flavours.product_id = old_product.id;

update products
set is_active = false
where name = 'SodaSplash'
  and exists (select 1 from products existing where existing.name = 'Goli Soda');

insert into products (name, description, display_order, is_active)
select 'Goli Soda', 'Classic marble soda bottles supplied by the case.', 1, true
where not exists (select 1 from products where name = 'Goli Soda');

insert into products (name, description, display_order, is_active)
select 'Cup Soda', 'Ready-to-serve cup format for counters and events.', 2, true
where not exists (select 1 from products where name = 'Cup Soda');

insert into products (name, description, display_order, is_active)
select 'More', 'Seasonal and custom flavours for larger requirements.', 3, true
where not exists (select 1 from products where name = 'More');

with cup_product as (
  select id from products where name = 'Cup Soda' order by created_at limit 1
)
insert into flavours (product_id, name, note, price_per_case, color, display_order, is_active)
select cup_product.id, flavour.name, flavour.note, flavour.price, flavour.color, flavour.display_order, true
from cup_product,
(values
  ('Cola', 'Familiar and fast moving', 900, '#7b4f42', 1),
  ('Lime', 'Sharp and refreshing', 850, '#7aa957', 2)
) as flavour(name, note, price, color, display_order)
where not exists (select 1 from flavours f where f.product_id = cup_product.id and f.name = flavour.name);

with more_product as (
  select id from products where name = 'More' order by created_at limit 1
)
insert into flavours (product_id, name, note, price_per_case, color, display_order, is_active)
select more_product.id, flavour.name, flavour.note, flavour.price, flavour.color, flavour.display_order, true
from more_product,
(values
  ('Ginger', 'Warm and punchy', 1300, '#b77742', 1),
  ('Jeera', 'Spiced and savoury', 1250, '#8d7650', 2)
) as flavour(name, note, price, color, display_order)
where not exists (select 1 from flavours f where f.product_id = more_product.id and f.name = flavour.name);
