
begin;
insert into auth.users(id,email) values ('10000000-0000-0000-0000-000000000001','mentor-test@example.invalid'),('10000000-0000-0000-0000-000000000002','student-test@example.invalid');
insert into public.profiles(id,nim,name,major) values ('10000000-0000-0000-0000-000000000001','TEST-MENTOR','Test Mentor','informatika'),('10000000-0000-0000-0000-000000000002','TEST-STUDENT','Test Student','informatika');
insert into public.mentor_profiles(user_id,display_name,major) values ('10000000-0000-0000-0000-000000000001','Test Mentor','informatika');
set local role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000001',true);
select set_config('test.class',public.create_class('Test Class','informatika','Testing database',now()+interval '1 day',90,'Google Meet','https://meet.google.com/test')::text,true);
select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000002',true);
do $$ begin
 if (select count(*) from public.profiles)<>1 then raise exception 'Profile isolation failed'; end if;
 if (select count(*) from public.class_access)<>0 then raise exception 'Meeting link exposed before payment'; end if;
end $$;
select public.reserve_class(current_setting('test.class')::uuid);
select public.reserve_class(current_setting('test.class')::uuid);
do $$ begin
 if (select count(*) from public.bookings)<>1 then raise exception 'Booking idempotence failed'; end if;
 if (select reserved_seats from public.classes where id=current_setting('test.class')::uuid)<>1 then raise exception 'Quota count incorrect'; end if;
 begin
  update public.payments set status='paid';
  raise exception 'Client can settle payments';
 exception when insufficient_privilege then null; end;
 begin
  insert into public.mentor_profiles(user_id,display_name,major) values (auth.uid(),'Unauthorized','informatika');
  raise exception 'Client can self-approve mentor';
 exception when insufficient_privilege then null; end;
 begin
  perform public.settle_payment((select id from public.payments limit 1),'forged');
  raise exception 'Client can invoke settlement';
 exception when insufficient_privilege then null; end;
end $$;
reset role;
select set_config('test.payment',(select id::text from public.payments where booking_id=(select id from public.bookings where class_id=current_setting('test.class')::uuid)),true);
set local role service_role;
select public.settle_payment(current_setting('test.payment')::uuid,'test-provider-ref');
select public.settle_payment(current_setting('test.payment')::uuid,'test-provider-ref');
reset role;
set local role authenticated;
do $$ begin
 if (select count(*) from public.class_access)<>1 then raise exception 'Paid student cannot access meeting'; end if;
end $$;
select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000001',true);
do $$ begin
 if (select sum(amount) from public.wallet_entries)<>5000 then raise exception 'Settlement not idempotent'; end if;
end $$;
select public.request_withdrawal(3000,'GoPay','08123456789');
do $$ begin
 begin
  perform public.request_withdrawal(3000,'GoPay','08123456789');
  raise exception 'Overdraft accepted';
 exception when raise_exception then
  if sqlerrm <> 'Saldo tidak mencukupi atau nominal tidak valid' then raise; end if;
 end;
end $$;
reset role;
select 'PASS: profile isolation, private links, booking idempotence, restricted mentor approval/payment settlement, wallet idempotence, overdraft prevention' as result;
rollback;
