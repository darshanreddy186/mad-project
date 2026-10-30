import { supabase } from '@/lib/supabase';
import { check, toAppError } from '@/lib/errors';
import { pathFromPublicUrl, removeFiles, uploadImage, type PickedImage } from '@/lib/storage';
import { STORAGE_BUCKETS } from '@/constants/config';
import type { Profile } from '@/types';
import { mapProfile } from './mappers';

const PROFILE_COLUMNS =
  'id, full_name, email, phone, avatar_url, role, is_suspended, created_at, updated_at';

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select(PROFILE_COLUMNS)
    .eq('id', userId)
    .maybeSingle();
  if (error) throw toAppError(error);
  return data ? mapProfile(data) : null;
}

export async function updateProfile(
  userId: string,
  input: { full_name?: string; phone?: string | null; avatar_url?: string | null }
): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .update(input)
    .eq('id', userId)
    .select(PROFILE_COLUMNS)
    .single();
  if (error) throw toAppError(error);
  return mapProfile(data);
}

export async function uploadAvatar(profile: Profile, image: PickedImage): Promise<Profile> {
  const uploaded = await uploadImage(STORAGE_BUCKETS.avatars, profile.id, 'avatar', image);
  const updated = await updateProfile(profile.id, { avatar_url: uploaded.publicUrl });
  await removeFiles(STORAGE_BUCKETS.avatars, [
    pathFromPublicUrl(STORAGE_BUCKETS.avatars, profile.avatar_url),
  ]);
  return updated;
}

export async function becomeShopOwner() {
  check(await supabase.rpc('become_shop_owner'));
}

export async function savePushToken(userId: string, token: string | null) {
  check(await supabase.from('profiles').update({ expo_push_token: token }).eq('id', userId));
}
