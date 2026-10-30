import type { Coordinates, Shop } from '@/types';

export interface ShopMapProps {
  shops: Shop[];
  userLocation: Coordinates | null;
  selectedId: string | null;
  onSelect: (shop: Shop | null) => void;
  /** Called when the user long-presses / taps an empty spot (used for picking). */
  onPickLocation?: (coords: Coordinates) => void;
  pickedLocation?: Coordinates | null;
  initialCenter: Coordinates;
}
