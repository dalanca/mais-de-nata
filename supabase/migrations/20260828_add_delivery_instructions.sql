-- Add optional customer delivery instructions to consumer orders.
-- These instructions are persisted with the order and passed to
-- Wolt as part of the courier drop-off instructions.

alter table public.orders
add column if not exists delivery_instructions text;
-- Recreate the order creation RPC with support for delivery instructions.

create or replace function public.create_order_with_items(
  p_order_number text,
  p_sales_channel text,
  p_language text,
  p_external_event_id text,
  p_external_order_id text,
  p_payment_status text,
  p_fulfilment_status text,
  p_customer_name text,
  p_customer_email text,
  p_customer_phone text,
  p_delivery_street text,
  p_delivery_house_number text,
  p_delivery_apartment text,
  p_delivery_instructions text,
  p_delivery_city text,
  p_delivery_postcode text,
  p_delivery_date date,
  p_delivery_time text,
  p_currency text,
  p_total_amount integer,
  p_items jsonb,
  p_wolt_delivery jsonb default null::jsonb
)
returns table(id uuid, order_number text)
language plpgsql
set search_path to 'public'
as $function$
declare
  v_order_id uuid;
begin
  if p_order_number is null
     or trim(p_order_number) = '' then
    raise exception 'Order number is required';
  end if;

  if p_language is null
     or p_language not in ('en', 'cs') then
    raise exception 'Order language must be en or cs';
  end if;

  if p_customer_name is null
     or trim(p_customer_name) = '' then
    raise exception 'Customer name is required';
  end if;

  if p_customer_email is null
     or trim(p_customer_email) = '' then
    raise exception 'Customer email is required';
  end if;

  if p_currency is null
     or trim(p_currency) = '' then
    raise exception 'Currency is required';
  end if;

  if p_total_amount < 0 then
    raise exception 'Total amount cannot be negative';
  end if;

  if p_items is null
     or jsonb_typeof(p_items) <> 'array'
     or jsonb_array_length(p_items) = 0 then
    raise exception 'At least one order item is required';
  end if;

  insert into public.orders (
    order_number,
    stripe_event_id,
    stripe_session_id,
    payment_status,
    fulfilment_status,
    customer_name,
    customer_email,
    customer_phone,
    delivery_street,
    delivery_house_number,
    delivery_apartment,
    delivery_instructions,
    delivery_city,
    delivery_postcode,
    delivery_date,
    delivery_time,
    currency,
    total_amount,
    sales_channel,
    language,
    production_status,
    wolt_shipment_promise_id,
    wolt_shipment_promise_valid_until,
    wolt_shipment_promise_is_binding,
    wolt_delivery_fee,
    wolt_delivery_fee_currency,
    wolt_dropoff_lat,
    wolt_dropoff_lon,
    wolt_dropoff_formatted_address,
    wolt_pickup_eta_minutes,
    wolt_dropoff_eta_minutes
  )
  values (
    p_order_number,
    p_external_event_id,
    p_external_order_id,
    p_payment_status,
    p_fulfilment_status,
    p_customer_name,
    p_customer_email,
    p_customer_phone,
    p_delivery_street,
    p_delivery_house_number,
    p_delivery_apartment,
    p_delivery_instructions,
    p_delivery_city,
    p_delivery_postcode,
    p_delivery_date,
    p_delivery_time,
    lower(p_currency),
    p_total_amount,
    p_sales_channel,
    p_language,

    case
      when p_sales_channel = 'ConsumerWebsite'
        then 'new'
      else null
    end,

    p_wolt_delivery ->> 'shipmentPromiseId',

    nullif(
      p_wolt_delivery ->> 'shipmentPromiseValidUntil',
      ''
    )::timestamptz,

    case
      when p_wolt_delivery is null then null
      else coalesce(
        (
          p_wolt_delivery
          ->> 'shipmentPromiseIsBinding'
        )::boolean,
        false
      )
    end,

    nullif(
      p_wolt_delivery ->> 'deliveryFee',
      ''
    )::integer,

    p_wolt_delivery
      ->> 'deliveryFeeCurrency',

    nullif(
      p_wolt_delivery ->> 'dropoffLat',
      ''
    )::double precision,

    nullif(
      p_wolt_delivery ->> 'dropoffLon',
      ''
    )::double precision,

    p_wolt_delivery
      ->> 'dropoffFormattedAddress',

    nullif(
      p_wolt_delivery ->> 'pickupEtaMinutes',
      ''
    )::integer,

    nullif(
      p_wolt_delivery ->> 'dropoffEtaMinutes',
      ''
    )::integer
  )
  returning public.orders.id
  into v_order_id;

  insert into public.order_items (
    order_id,
    product_name,
    quantity,
    unit_price,
    total_price
  )
  select
    v_order_id,
    item.product_name,
    item.quantity,
    item.unit_price,
    item.total_price
  from jsonb_to_recordset(
    p_items
  ) as item(
    product_name text,
    quantity integer,
    unit_price integer,
    total_price integer
  );

  if exists (
    select 1
    from jsonb_to_recordset(
      p_items
    ) as item(
      product_name text,
      quantity integer,
      unit_price integer,
      total_price integer
    )
    where item.product_name is null
       or trim(item.product_name) = ''
       or item.quantity <= 0
       or item.unit_price < 0
       or item.total_price < 0
  ) then
    raise exception
      'One or more order items are invalid';
  end if;

  return query
  select
    v_order_id,
    p_order_number;
end;
$function$;