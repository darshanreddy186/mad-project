import { forwardRef, useImperativeHandle, useMemo, useRef } from 'react';
import { Platform, StyleSheet } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, type Region } from 'react-native-maps';
import { Colors } from '@/constants/theme';
import { regionForPoints } from '@/lib/geo';
import type { Coordinates } from '@/types';
import type { ShopMapProps } from './types';

export interface ShopMapHandle {
  focus: (coords: Coordinates, zoomDelta?: number) => void;
  fitAll: () => void;
}

const DARK_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#1a1d25' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8492a6' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0f1115' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2e3340' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#414a59' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0f1115' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
];

export const ShopMap = forwardRef<ShopMapHandle, ShopMapProps>(function ShopMap(
  { shops, userLocation, selectedId, onSelect, onPickLocation, pickedLocation, initialCenter },
  ref
) {
  const mapRef = useRef<MapView>(null);

  const initialRegion: Region = useMemo(() => {
    if (pickedLocation) return { ...pickedLocation, latitudeDelta: 0.05, longitudeDelta: 0.05 };
    if (userLocation) return { ...userLocation, latitudeDelta: 0.25, longitudeDelta: 0.25 };
    return regionForPoints(shops, initialCenter);
    // Only computed on first render; later moves are animated.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useImperativeHandle(ref, () => ({
    focus: (coords, zoomDelta = 0.05) =>
      mapRef.current?.animateToRegion({ ...coords, latitudeDelta: zoomDelta, longitudeDelta: zoomDelta }, 400),
    fitAll: () => {
      const points = userLocation ? [...shops, userLocation] : shops;
      if (points.length === 0) return;
      mapRef.current?.animateToRegion(regionForPoints(points, initialCenter), 400);
    },
  }));

  return (
    <MapView
      ref={mapRef}
      style={StyleSheet.absoluteFill}
      provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
      customMapStyle={Platform.OS === 'android' ? DARK_STYLE : undefined}
      userInterfaceStyle="dark"
      initialRegion={initialRegion}
      showsUserLocation={Boolean(userLocation)}
      showsMyLocationButton={false}
      toolbarEnabled={false}
      onPress={(e) => {
        if (e.nativeEvent.action === 'marker-press') return;
        if (onPickLocation) onPickLocation(e.nativeEvent.coordinate);
        else onSelect(null);
      }}>
      {shops.map((shop) => (
        <Marker
          key={`${shop.id}-${shop.id === selectedId ? 'on' : 'off'}`}
          identifier={shop.id}
          coordinate={{ latitude: shop.latitude, longitude: shop.longitude }}
          title={shop.name}
          description={`${shop.rating > 0 ? `★ ${shop.rating.toFixed(1)} · ` : ''}${shop.city}`}
          pinColor={shop.id === selectedId ? Colors.accent[500] : Colors.electric[500]}
          onPress={() => onSelect(shop)}
        />
      ))}
      {pickedLocation && (
        <Marker coordinate={pickedLocation} pinColor={Colors.accent[500]} title="Selected location" />
      )}
    </MapView>
  );
});
