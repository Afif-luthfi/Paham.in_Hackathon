create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated, service_role;

create table public.categories (
 id text primary key, name text not null unique
);
insert into public.categories(id,name) values
 ('informatika','Teknik Informatika'),('sistem-informasi','Sistem Informasi'),('kimia','Kimia'),('fisika','Fisika'),('tambang','Teknik Tambang'),('agribisnis','Agribisnis'),('matematika','Matematika');

create table public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 nim text not null unique check (length(trim(nim)) between 3 and 30),
 name text not null check (length(trim(name)) between 1 and 120),
 major text not null references public.categories(id),
 avatar_url text,
 created_at timestamptz not null default now()
);
create index profiles_major_idx on public.profiles(major);
create table public.mentor_profiles (
 user_id uuid primary key references public.profiles(id) on delete cascade,
 display_name text not null, major text not null references public.categories(id),
 avatar_url text, approved_at timestamptz not null default now()
);
create index mentor_profiles_major_idx on public.mentor_profiles(major);
create table public.mentor_verifications (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references public.profiles(id) on delete cascade,
 category_id text not null references public.categories(id),
 gpa numeric(3,2) not null check (gpa between 0 and 4),
 contact text not null check(length(trim(contact)) between 5 and 200),
 transcript_path text not null check (split_part(transcript_path,'/',1) = user_id::text),
 file_name text not null, file_size bigint not null check(file_size between 1 and 10485760),
 status text not null default 'pending' check(status in ('pending','approved','rejected')),
 review_notes text, reviewed_at timestamptz, created_at timestamptz not null default now()
);
create unique index one_pending_verification on public.mentor_verifications(user_id) where status='pending';
create index mentor_verifications_user_idx on public.mentor_verifications(user_id);
create index mentor_verifications_category_idx on public.mentor_verifications(category_id);
create table public.classes (
 id uuid primary key default gen_random_uuid(),
 mentor_id uuid not null references public.mentor_profiles(user_id),
 category_id text not null references public.categories(id),
 title text not null check(length(trim(title)) between 1 and 200),
 description text not null check(length(trim(description)) between 1 and 10000),
 starts_at timestamptz not null,
 duration_minutes integer not null check(duration_minutes between 15 and 480),
 location text not null,
 price integer not null default 5000 check(price=5000),
 max_quota integer not null default 10 check(max_quota=10),
 reserved_seats integer not null default 0 check(reserved_seats between 0 and 10),
 status text not null default 'published' check(status in ('published','completed','cancelled')),
 created_at timestamptz not null default now()
);
create index classes_mentor_idx on public.classes(mentor_id);
create index classes_category_date_idx on public.classes(category_id,starts_at);
create table public.class_access (
 class_id uuid primary key references public.classes(id) on delete cascade,
 meeting_url text not null check(meeting_url ~ '^https://')
);
create table public.class_materials (
 id uuid primary key default gen_random_uuid(), class_id uuid not null references public.classes(id) on delete cascade,
 title text not null, storage_path text, external_url text check(external_url is null or external_url ~ '^https://'),
 created_at timestamptz not null default now()
);
create index class_materials_class_idx on public.class_materials(class_id);
create table public.bookings (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references public.profiles(id), class_id uuid not null references public.classes(id),
 status text not null default 'pending' check(status in ('pending','confirmed','cancelled')),
 created_at timestamptz not null default now(), unique(user_id,class_id)
);
create index bookings_class_idx on public.bookings(class_id);
create table public.payments (
 id uuid primary key default gen_random_uuid(), booking_id uuid not null unique references public.bookings(id),
 amount integer not null check(amount=5000), currency text not null default 'IDR' check(currency='IDR'),
 method text not null default 'qris', status text not null default 'pending' check(status in ('pending','paid','failed','refunded')),
 provider_reference text unique, paid_at timestamptz, created_at timestamptz not null default now()
);
create table public.wallet_entries (
 id uuid primary key default gen_random_uuid(), mentor_id uuid not null references public.mentor_profiles(user_id),
 payment_id uuid not null unique references public.payments(id), amount integer not null check(amount > 0),
 created_at timestamptz not null default now()
);
create index wallet_entries_mentor_idx on public.wallet_entries(mentor_id);
create table public.withdrawals (
 id uuid primary key default gen_random_uuid(), mentor_id uuid not null references public.mentor_profiles(user_id),
 amount integer not null check(amount > 0), channel text not null check(channel in ('GoPay','OVO','DANA','Dana','BCA','BRI','Mandiri','Bank Transfer')),
 destination text not null check(length(trim(destination)) between 5 and 200),
 status text not null default 'pending' check(status in ('pending','processing','paid','rejected')),
 processed_at timestamptz, created_at timestamptz not null default now()
);
create index withdrawals_mentor_idx on public.withdrawals(mentor_id);
create table public.class_reviews (
 booking_id uuid primary key references public.bookings(id), rating integer not null check(rating between 1 and 5),
 comment text not null default '' check(length(comment)<=2000), created_at timestamptz not null default now()
);
create table public.notifications (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
 title text not null, message text not null, read_at timestamptz, created_at timestamptz not null default now()
);
create index notifications_user_date_idx on public.notifications(user_id,created_at desc);

-- Explicit privileges: clients cannot grant mentor status, settle payments, or change balances.
do $$ declare t text; begin
 foreach t in array array['categories','profiles','mentor_profiles','mentor_verifications','classes','class_access','class_materials','bookings','payments','wallet_entries','withdrawals','class_reviews','notifications'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('revoke all on public.%I from anon, authenticated',t);
 execute format('grant all on public.%I to service_role',t);
 end loop;
end $$;
grant select on public.categories,public.mentor_profiles,public.classes to anon,authenticated;
grant select on public.profiles,public.mentor_verifications,public.class_access,public.class_materials,public.bookings,public.payments,public.wallet_entries,public.withdrawals,public.class_reviews,public.notifications to authenticated;
grant insert(id,nim,name,major,avatar_url) on public.profiles to authenticated;
grant update(name,major,avatar_url) on public.profiles to authenticated;
grant insert(user_id,category_id,gpa,contact,transcript_path,file_name,file_size) on public.mentor_verifications to authenticated;
grant insert(mentor_id,category_id,title,description,starts_at,duration_minutes,location) on public.classes to authenticated;
grant insert on public.class_access,public.class_materials,public.class_reviews to authenticated;
grant update(read_at) on public.notifications to authenticated;
create policy categories_read on public.categories for select to anon,authenticated using(true);
create policy mentors_read on public.mentor_profiles for select to anon,authenticated using(true);
create policy classes_read on public.classes for select to anon,authenticated using(true);
create policy profile_read on public.profiles for select to authenticated using(id=(select auth.uid()));
create policy profile_insert on public.profiles for insert to authenticated with check(id=(select auth.uid()));
create policy profile_update on public.profiles for update to authenticated using(id=(select auth.uid())) with check(id=(select auth.uid()));
create policy verification_read on public.mentor_verifications for select to authenticated using(user_id=(select auth.uid()));
create policy verification_insert on public.mentor_verifications for insert to authenticated with check(user_id=(select auth.uid()) and status='pending');
create policy classes_insert on public.classes for insert to authenticated with check(mentor_id=(select auth.uid()) and starts_at>now());
create policy bookings_read on public.bookings for select to authenticated using(user_id=(select auth.uid()));
create policy access_read on public.class_access for select to authenticated using(
 exists(select 1 from public.classes c where c.id=class_id and c.mentor_id=(select auth.uid())) or
 exists(select 1 from public.bookings b where b.class_id=class_access.class_id and b.user_id=(select auth.uid()) and b.status='confirmed'));
create policy access_insert on public.class_access for insert to authenticated with check(exists(select 1 from public.classes c where c.id=class_id and c.mentor_id=(select auth.uid())));
create policy material_read on public.class_materials for select to authenticated using(
 exists(select 1 from public.classes c where c.id=class_id and c.mentor_id=(select auth.uid())) or
 exists(select 1 from public.bookings b where b.class_id=class_materials.class_id and b.user_id=(select auth.uid()) and b.status='confirmed'));
create policy material_insert on public.class_materials for insert to authenticated with check(exists(select 1 from public.classes c where c.id=class_id and c.mentor_id=(select auth.uid())));
create policy payments_read on public.payments for select to authenticated using(exists(select 1 from public.bookings b where b.id=booking_id and b.user_id=(select auth.uid())));
create policy wallet_read on public.wallet_entries for select to authenticated using(mentor_id=(select auth.uid()));
create policy withdrawals_read on public.withdrawals for select to authenticated using(mentor_id=(select auth.uid()));
create policy reviews_read on public.class_reviews for select to authenticated using(exists(select 1 from public.bookings b where b.id=booking_id and b.user_id=(select auth.uid())));
create policy reviews_insert on public.class_reviews for insert to authenticated with check(exists(select 1 from public.bookings b join public.classes c on c.id=b.class_id where b.id=booking_id and b.user_id=(select auth.uid()) and b.status='confirmed' and c.status='completed'));
create policy notifications_read on public.notifications for select to authenticated using(user_id=(select auth.uid()));
create policy notifications_update on public.notifications for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));

-- Class and private meeting link are created in one transaction under the caller's RLS.
create function public.create_class(p_title text,p_category text,p_description text,p_starts_at timestamptz,p_duration integer,p_location text,p_url text)
returns uuid language plpgsql security invoker set search_path='' as $$
declare cid uuid; begin
 insert into public.classes(mentor_id,title,category_id,description,starts_at,duration_minutes,location)
 values(auth.uid(),p_title,p_category,p_description,p_starts_at,p_duration,p_location) returning id into cid;
 insert into public.class_access(class_id,meeting_url) values(cid,p_url);
 return cid;
end $$;

-- Privileged transactions are private and always validate the authenticated actor.
create function private.reserve_class(p_class_id uuid) returns uuid language plpgsql security definer set search_path='' as $$
declare c public.classes; bid uuid; uid uuid:=auth.uid(); begin
 if uid is null then raise exception 'Silakan masuk terlebih dahulu'; end if;
 select * into c from public.classes where id=p_class_id for update;
 if not found or c.status<>'published' or c.starts_at<=now() then raise exception 'Kelas tidak tersedia'; end if;
 if c.mentor_id=uid then raise exception 'Mentor tidak dapat mendaftar kelas sendiri'; end if;
 select id into bid from public.bookings where class_id=c.id and user_id=uid;
 if bid is not null then return bid; end if;
 if c.reserved_seats>=c.max_quota then raise exception 'Kuota kelas penuh'; end if;
 insert into public.bookings(user_id,class_id) values(uid,c.id) returning id into bid;
 insert into public.payments(booking_id,amount) values(bid,c.price);
 update public.classes set reserved_seats=reserved_seats+1 where id=c.id;
 return bid;
end $$;
create function public.reserve_class(p_class_id uuid) returns uuid language sql security invoker set search_path='' as $$ select private.reserve_class(p_class_id) $$;
create function private.request_withdrawal(p_amount integer,p_channel text,p_destination text) returns uuid language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); balance bigint; wid uuid; begin
 if uid is null then raise exception 'Silakan masuk terlebih dahulu'; end if;
 perform 1 from public.mentor_profiles where user_id=uid for update;
 if not found then raise exception 'Akun mentor belum disetujui'; end if;
 select coalesce((select sum(amount) from public.wallet_entries where mentor_id=uid),0)-coalesce((select sum(amount) from public.withdrawals where mentor_id=uid and status in ('pending','processing','paid')),0) into balance;
 if p_amount is null or p_amount<=0 or p_amount>balance then raise exception 'Saldo tidak mencukupi atau nominal tidak valid'; end if;
 insert into public.withdrawals(mentor_id,amount,channel,destination) values(uid,p_amount,p_channel,p_destination) returning id into wid;
 return wid;
end $$;
create function public.request_withdrawal(p_amount integer,p_channel text,p_destination text) returns uuid language sql security invoker set search_path='' as $$ select private.request_withdrawal(p_amount,p_channel,p_destination) $$;
-- Backend only: call AFTER verifying a payment provider callback, never from the browser.
create function public.settle_payment(p_payment_id uuid,p_provider_reference text) returns void language plpgsql security invoker set search_path='' as $$
declare p public.payments; b public.bookings; mid uuid; begin
 if p_provider_reference is null or length(trim(p_provider_reference))=0 then raise exception 'Referensi pembayaran wajib diisi'; end if;
 select * into p from public.payments where id=p_payment_id for update;
 if not found then raise exception 'Pembayaran tidak ditemukan'; end if;
 if p.status='paid' then return; end if;
 if p.status<>'pending' then raise exception 'Status pembayaran tidak valid'; end if;
 select * into b from public.bookings where id=p.booking_id for update;
 if b.status<>'pending' then raise exception 'Status pendaftaran tidak valid'; end if;
 select mentor_id into mid from public.classes where id=b.class_id and status='published';
 if mid is null then raise exception 'Kelas tidak aktif'; end if;
 update public.payments set status='paid',provider_reference=p_provider_reference,paid_at=now() where id=p.id;
 update public.bookings set status='confirmed' where id=b.id;
 insert into public.wallet_entries(mentor_id,payment_id,amount) values(mid,p.id,p.amount);
 insert into public.notifications(user_id,title,message) values(b.user_id,'Pembayaran terkonfirmasi','Pendaftaran kelas Anda telah dikonfirmasi.');
end $$;
revoke all on function public.create_class(text,text,text,timestamptz,integer,text,text),public.reserve_class(uuid),public.request_withdrawal(integer,text,text),public.settle_payment(uuid,text),private.reserve_class(uuid),private.request_withdrawal(integer,text,text) from public,anon,authenticated;
grant execute on function public.create_class(text,text,text,timestamptz,integer,text,text),public.reserve_class(uuid),public.request_withdrawal(integer,text,text),private.reserve_class(uuid),private.request_withdrawal(integer,text,text) to authenticated;
grant execute on function public.settle_payment(uuid,text) to service_role;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
 ('mentor-transcripts','mentor-transcripts',false,10485760,array['application/pdf','image/jpeg','image/png']),
 ('class-materials','class-materials',false,20971520,array['application/pdf','image/jpeg','image/png','application/vnd.openxmlformats-officedocument.presentationml.presentation']);
create policy transcript_upload on storage.objects for insert to authenticated with check(bucket_id='mentor-transcripts' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy transcript_read on storage.objects for select to authenticated using(bucket_id='mentor-transcripts' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy material_upload on storage.objects for insert to authenticated with check(bucket_id='class-materials' and exists(select 1 from public.classes c where c.id::text=(storage.foldername(name))[1] and c.mentor_id=(select auth.uid())));
create policy material_download on storage.objects for select to authenticated using(bucket_id='class-materials' and (exists(select 1 from public.classes c where c.id::text=(storage.foldername(name))[1] and c.mentor_id=(select auth.uid())) or exists(select 1 from public.bookings b where b.class_id::text=(storage.foldername(name))[1] and b.user_id=(select auth.uid()) and b.status='confirmed')));
