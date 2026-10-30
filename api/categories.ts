import { supabase } from '@/lib/supabase';
import { check, toAppError } from '@/lib/errors';
import type { ServiceCategory } from '@/types';

const COLUMNS = 'id, name, slug, description, icon_name, color, sort_order, is_active';

export async function listCategories(includeInactive = false): Promise<ServiceCategory[]> {
  let query = supabase.from('service_categories').select(COLUMNS).order('sort_order').order('name');
  if (!includeInactive) query = query.eq('is_active', true);
  const { data, error } = await query;
  if (error) throw toAppError(error);
  return data ?? [];
}

export type CategoryInput = Omit<ServiceCategory, 'id'>;

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function createCategory(input: CategoryInput) {
  check(await supabase.from('service_categories').insert(input));
}

export async function updateCategory(id: string, input: Partial<CategoryInput>) {
  check(await supabase.from('service_categories').update(input).eq('id', id));
}

export async function deleteCategory(id: string) {
  check(await supabase.from('service_categories').delete().eq('id', id));
}
