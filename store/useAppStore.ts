import { create } from 'zustand';
import { listCategories } from '@/api/categories';
import { addFavorite, listFavoriteIds, removeFavorite } from '@/api/favorites';
import { getErrorMessage } from '@/lib/errors';
import type { FilterOptions, ServiceCategory } from '@/types';

export const DEFAULT_FILTERS: FilterOptions = {
  categories: [],
  maxDistance: null,
  minRating: 0,
  maxPriceLevel: 4,
  sortBy: 'distance',
};

interface AppState {
  // Discovery
  filters: FilterOptions;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  setFilters: (filters: Partial<FilterOptions>) => void;
  resetFilters: () => void;

  // Categories (reference data, cached for the session)
  categories: ServiceCategory[];
  categoriesLoaded: boolean;
  loadCategories: (force?: boolean) => Promise<void>;

  // Favourites (persisted in Supabase)
  favouriteIds: string[];
  favouritesUserId: string | null;
  loadFavourites: (userId: string) => Promise<void>;
  /** Optimistic toggle; reverts and returns an error message on failure. */
  toggleFavourite: (userId: string, shopId: string) => Promise<string | null>;
  clearUserData: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  filters: DEFAULT_FILTERS,
  searchQuery: '',
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setFilters: (partial) => set((s) => ({ filters: { ...s.filters, ...partial } })),
  resetFilters: () => set({ filters: DEFAULT_FILTERS }),

  categories: [],
  categoriesLoaded: false,
  loadCategories: async (force = false) => {
    if (get().categoriesLoaded && !force) return;
    try {
      const categories = await listCategories();
      set({ categories, categoriesLoaded: true });
    } catch (err) {
      console.warn('[categories] load failed', getErrorMessage(err));
    }
  },

  favouriteIds: [],
  favouritesUserId: null,
  loadFavourites: async (userId) => {
    try {
      const ids = await listFavoriteIds(userId);
      set({ favouriteIds: ids, favouritesUserId: userId });
    } catch (err) {
      console.warn('[favourites] load failed', getErrorMessage(err));
    }
  },
  toggleFavourite: async (userId, shopId) => {
    const wasFav = get().favouriteIds.includes(shopId);
    set((s) => ({
      favouriteIds: wasFav ? s.favouriteIds.filter((id) => id !== shopId) : [shopId, ...s.favouriteIds],
    }));
    try {
      if (wasFav) await removeFavorite(userId, shopId);
      else await addFavorite(userId, shopId);
      return null;
    } catch (err) {
      set((s) => ({
        favouriteIds: wasFav ? [shopId, ...s.favouriteIds] : s.favouriteIds.filter((id) => id !== shopId),
      }));
      return getErrorMessage(err);
    }
  },
  clearUserData: () => set({ favouriteIds: [], favouritesUserId: null }),
}));
