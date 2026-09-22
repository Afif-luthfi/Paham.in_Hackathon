-- Service-role-only administrative workflows. Invoke from a trusted backend or SQL Editor.
create function public.approve_mentor(p_verification_id uuid) returns void
language plpgsql security invoker set search_path='' as $$
declare v public.mentor_verifications; p public.profiles; begin
 select * into v from public.mentor_verifications where id=p_verification_id for update;
 if not found or v.status<>'pending' then raise exception 'Pengajuan tidak tersedia'; end if;
 select * into p from public.profiles where id=v.user_id;
 insert into public.mentor_profiles(user_id,display_name,major,avatar_url)
 values(p.id,p.name,p.major,p.avatar_url)
 on conflict(user_id) do update set display_name=excluded.display_name,major=excluded.major,avatar_url=excluded.avatar_url;
 update public.mentor_verifications set status='approved',reviewed_at=now() where id=v.id;
 insert into public.notifications(user_id,title,message) values(p.id,'Mentor disetujui','Pengajuan mentor Anda disetujui. Silakan muat ulang halaman.');
end $$;
create function public.cancel_pending_booking(p_booking_id uuid) returns void
language plpgsql security invoker set search_path='' as $$
declare b public.bookings; cid uuid; begin
 select class_id into cid from public.bookings where id=p_booking_id;
 if cid is null then raise exception 'Pendaftaran tidak ditemukan'; end if;
 -- Same lock order as settlement: payment then booking. Class locked before quota update.
 perform 1 from public.payments where booking_id=p_booking_id for update;
 select * into b from public.bookings where id=p_booking_id for update;
 if b.status='cancelled' then return; end if;
 if b.status<>'pending' then raise exception 'Pembayaran terkonfirmasi memerlukan alur refund'; end if;
 update public.payments set status='failed' where booking_id=b.id and status='pending';
 update public.bookings set status='cancelled' where id=b.id;
 update public.classes set reserved_seats=reserved_seats-1 where id=b.class_id;
end $$;
revoke all on function public.approve_mentor(uuid),public.cancel_pending_booking(uuid) from public,anon,authenticated;
grant execute on function public.approve_mentor(uuid),public.cancel_pending_booking(uuid) to service_role;
