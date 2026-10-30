import { create } from 'zustand';
import { getMyShop } from '@/api/shops';
import { getErrorMessage } from '@/lib/errors';
import type { Shop } from '@/types';

interface OwnerState {
  shop: Shop | null;
  loaded: boolean;
  error: string | null;
  load: (ownerId: string) => Promise<Shop | null>;
  setShop: (shop: Shop | null) => void;
  reset: () => void;
}

/** The signed-in owner's shop, shared across the owner dashboard screens. */
export const useOwnerStore = create<OwnerState>((set) => ({
  shop: null,
  loaded: false,
  error: null,
  load: async (ownerId) => {
    try {
      const shop = await getMyShop(ownerId);
      set({ shop, loaded: true, error: null });
      return shop;
    } catch (err) {
      set({ loaded: true, error: getErrorMessage(err) });
      return null;
    }
  },
  setShop: (shop) => set({ shop }),
  reset: () => set({ shop: null, loaded: false, error: null }),
}));
