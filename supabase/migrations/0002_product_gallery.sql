-- Extra product photos: up to 2 per product, shown only on the product page
-- after the pack image. Each entry is {"src": url, "width": px, "height": px}.
-- The old "scene" (serving suggestion) column is no longer read by the site;
-- it is left in place so this migration never removes data.

alter table public.products
  add column if not exists gallery jsonb not null default '[]'::jsonb;

alter table public.products drop constraint if exists products_gallery_check;
alter table public.products
  add constraint products_gallery_check
  check (jsonb_typeof(gallery) = 'array' and jsonb_array_length(gallery) <= 2);
