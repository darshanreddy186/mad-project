import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import { supabase } from '@/lib/supabase';
import { AppError, toAppError } from '@/lib/errors';
import { STORAGE_BUCKETS } from '@/constants/config';

export type Bucket = (typeof STORAGE_BUCKETS)[keyof typeof STORAGE_BUCKETS];

export interface PickedImage {
  uri: string;
  base64: string;
  mimeType: string;
}

export interface UploadedImage {
  path: string;
  publicUrl: string;
}

const MAX_BYTES = 10 * 1024 * 1024;

const EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
};

function toPickedImage(result: ImagePicker.ImagePickerResult): PickedImage | null {
  if (result.canceled || !result.assets?.[0]) return null;
  const asset = result.assets[0];
  let base64 = asset.base64 ?? null;
  let mimeType = asset.mimeType ?? 'image/jpeg';

  // Web returns a data URI rather than a separate base64 payload.
  if (!base64 && asset.uri.startsWith('data:')) {
    const match = /^data:([^;]+);base64,(.*)$/.exec(asset.uri);
    if (match) {
      mimeType = match[1]!;
      base64 = match[2]!;
    }
  }
  if (!base64) throw new AppError('Could not read the selected image.');
  if (!EXTENSIONS[mimeType]) mimeType = 'image/jpeg';
  if ((base64.length * 3) / 4 > MAX_BYTES) {
    throw new AppError('That image is too large. Please choose one under 10 MB.');
  }
  return { uri: asset.uri, base64, mimeType };
}

interface PickOptions {
  aspect?: [number, number];
  allowsEditing?: boolean;
}

export async function pickImage({ aspect, allowsEditing = true }: PickOptions = {}) {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new AppError('Allow photo library access in Settings to upload images.');
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing,
    aspect,
    quality: 0.7,
    base64: true,
    exif: false,
  });
  return toPickedImage(result);
}

export async function takePhoto({ aspect, allowsEditing = true }: PickOptions = {}) {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) {
    throw new AppError('Allow camera access in Settings to take photos.');
  }
  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ['images'],
    allowsEditing,
    aspect,
    quality: 0.7,
    base64: true,
    exif: false,
  });
  return toPickedImage(result);
}

/**
 * Uploads to `{folder}/{name}-{timestamp}-{random}.{ext}`. The first path
 * segment is what Storage RLS checks (user id for avatars, shop id for media).
 */
export async function uploadImage(
  bucket: Bucket,
  folder: string,
  name: string,
  image: PickedImage
): Promise<UploadedImage> {
  const ext = EXTENSIONS[image.mimeType] ?? 'jpg';
  const random = Math.random().toString(36).slice(2, 8);
  const path = `${folder}/${name}-${Date.now()}-${random}.${ext}`;

  const { error } = await supabase.storage.from(bucket).upload(path, decode(image.base64), {
    contentType: image.mimeType,
    cacheControl: '31536000',
    upsert: false,
  });
  if (error) throw toAppError(error);

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return { path, publicUrl: data.publicUrl };
}

/** Best-effort removal; storage cleanup must never block the main action. */
export async function removeFiles(bucket: Bucket, paths: (string | null | undefined)[]) {
  const valid = paths.filter((p): p is string => Boolean(p));
  if (valid.length === 0) return;
  const { error } = await supabase.storage.from(bucket).remove(valid);
  if (error) console.warn('[storage] cleanup failed', error.message);
}

/** Extracts the object path from a public URL in the given bucket, if it is one. */
export function pathFromPublicUrl(bucket: Bucket, url: string | null | undefined): string | null {
  if (!url) return null;
  const marker = `/storage/v1/object/public/${bucket}/`;
  const index = url.indexOf(marker);
  return index === -1 ? null : decodeURIComponent(url.slice(index + marker.length).split('?')[0]!);
}
