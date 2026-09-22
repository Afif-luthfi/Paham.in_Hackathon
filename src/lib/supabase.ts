import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';
const env = (import.meta as ImportMeta & { env: Record<string, string> }).env;
export const supabase = createClient<Database>(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_PUBLISHABLE_KEY);
export const categoryIds: Record<string, string> = {
  'Teknik Informatika': 'informatika', 'Sistem Informasi': 'sistem-informasi',
  Kimia: 'kimia', Fisika: 'fisika', 'Teknik Tambang': 'tambang', Agribisnis: 'agribisnis', Matematika: 'matematika',
};
export const categoryName = (id: string) => Object.keys(categoryIds).find(key => categoryIds[key] === id) || id;
export function unwrap<T>({ data, error }: { data?: T; error: { message: string } | null }): T {
  if (error) throw new Error(error.message);
  return data;
}
export async function loadAccount() {
  const { user } = unwrap(await supabase.auth.getUser());
  if (!user) return null;
  let profile = unwrap(await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle());
  if (!profile && user.user_metadata.nim) {
    const result = await supabase.from('profiles').upsert({ id: user.id, nim: user.user_metadata.nim,
      name: user.user_metadata.name, major: user.user_metadata.major }, { onConflict: 'id', ignoreDuplicates: true });
    if (result.error && result.error.code !== '23505') throw new Error(result.error.message);
    profile = unwrap(await supabase.from('profiles').select('*').eq('id',user.id).maybeSingle());
  }
  if (!profile) return { incomplete: true as const, user };
  const [mentorResult, entriesResult, withdrawalsResult] = await Promise.all([
    supabase.from('mentor_profiles').select('user_id').eq('user_id',user.id).maybeSingle(),
    supabase.from('wallet_entries').select('amount').eq('mentor_id',user.id),
    supabase.from('withdrawals').select('amount,status').eq('mentor_id',user.id),
  ]);
  const mentor = unwrap(mentorResult);
  const entries = unwrap(entriesResult) || [];
  const withdrawals = unwrap(withdrawalsResult) || [];
  return { incomplete: false as const, account: { id: user.id, nim: profile.nim, name: profile.name,
    email: user.email || '', major: categoryName(profile.major), isMentor: !!mentor,
    earnings: entries.reduce((sum,row)=>sum+row.amount,0)-withdrawals.filter(row=>row.status!=='rejected').reduce((sum,row)=>sum+row.amount,0) } };
}
export async function loadClasses() {
  const { data: { session } } = await supabase.auth.getSession();
  const rows = unwrap(await supabase.from('classes').select('*,mentor_profiles(display_name,major,avatar_url)').order('created_at',{ascending:false})) || [];
  const bookings = session ? unwrap(await supabase.from('bookings').select('class_id,status')) || [] : [];
  const access = session ? unwrap(await supabase.from('class_access').select('*')) || [] : [];
  const materials = session ? unwrap(await supabase.from('class_materials').select('class_id,title')) || [] : [];
  return rows.map(row => ({ id: row.id, mentorId: row.mentor_id, title: row.title,
    mentorName: row.mentor_profiles.display_name, mentorAvatar: row.mentor_profiles.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(row.mentor_profiles.display_name)}`,
    mentorMajor: categoryName(row.mentor_profiles.major), mentorRating: 0,
    price: row.price, currentQuota: row.reserved_seats, maxQuota: row.max_quota,
    category: categoryName(row.category_id), description: row.description,
    dateTime: new Date(row.starts_at).toLocaleString('id-ID',{dateStyle:'full',timeStyle:'short',timeZone:'Asia/Jakarta'})+' WIB',
    duration: `${row.duration_minutes} Menit`, location: row.location,
    materials: materials.filter(m=>m.class_id===row.id).map(m=>m.title),
    isBooked: bookings.some(b=>b.class_id===row.id && b.status==='confirmed'),
    classLink: access.find(a=>a.class_id===row.id)?.meeting_url,
  }));
}
