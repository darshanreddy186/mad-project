import { create } from 'zustand';
import { SHOPS } from '@/data/mockData';
import type { Shop, FilterOptions } from '@/types';

interface AppState {
  shops: Shop[];
  favourites: string[];
  filters: FilterOptions;
  searchQuery: string;
  toggleFavourite: (shopId: string) => void;
  isFavourite: (shopId: string) => boolean;
  setSearchQuery: (query: string) => void;
  setFilters: (filters: Partial<FilterOptions>) => void;
  resetFilters: () => void;
  getFilteredShops: () => Shop[];
}

const DEFAULT_FILTERS: FilterOptions = {
  categories: [],
  maxDistance: 50,
  minRating: 0,
  maxPriceLevel: 4,
  sortBy: 'distance',
};

export const useAppStore = create<AppState>((set, get) => ({
  shops: SHOPS,
  favourites: ['shop-1', 'shop-4'],
  filters: DEFAULT_FILTERS,
  searchQuery: '',

  toggleFavourite: (shopId: string) => {
    set((state) => {
      const isFav = state.favourites.includes(shopId);
      return {
        favourites: isFav
          ? state.favourites.filter((id) => id !== shopId)
          : [...state.favourites, shopId],
        shops: state.shops.map((s) =>
          s.id === shopId ? { ...s, is_favourite: !isFav } : s
        ),
      };
    });
  },

  isFavourite: (shopId: string) => get().favourites.includes(shopId),

  setSearchQuery: (query: string) => set({ searchQuery: query }),

  setFilters: (newFilters: Partial<FilterOptions>) =>
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    })),

  resetFilters: () => set({ filters: DEFAULT_FILTERS }),

  getFilteredShops: () => {
    const { shops, filters, searchQuery } = get();
    let result = [...shops];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.city.toLowerCase().includes(q) ||
          s.categories.some((c) => c.toLowerCase().includes(q)) ||
          s.vehicle_brands.some((b) => b.toLowerCase().includes(q))
      );
    }

    if (filters.categories.length > 0) {
      result = result.filter((s) =>
        s.categories.some((c) => filters.categories.includes(c))
      );
    }

    if (filters.maxDistance < 50) {
      result = result.filter((s) => (s.distance ?? 0) <= filters.maxDistance);
    }

    if (filters.minRating > 0) {
      result = result.filter((s) => s.rating >= filters.minRating);
    }

    if (filters.maxPriceLevel < 4) {
      result = result.filter((s) => s.price_level <= filters.maxPriceLevel);
    }

    switch (filters.sortBy) {
      case 'rating':
        result.sort((a, b) => b.rating - a.rating);
        break;
      case 'name':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'distance':
      default:
        result.sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));
        break;
    }

    return result;
  },
}));
