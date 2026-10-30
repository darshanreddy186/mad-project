import { Linking, Platform, Share } from 'react-native';
import * as ExpoLinking from 'expo-linking';
import { AppError } from '@/lib/errors';

async function openFirst(urls: string[]): Promise<void> {
  for (const url of urls) {
    try {
      await Linking.openURL(url);
      return;
    } catch {
      // try the next candidate
    }
  }
  throw new AppError('No app is available to open this link.');
}

export function callPhone(phone: string) {
  return openFirst([`tel:${phone.replace(/[^+\d]/g, '')}`]);
}

export function sendEmail(email: string, subject?: string) {
  const query = subject ? `?subject=${encodeURIComponent(subject)}` : '';
  return openFirst([`mailto:${email}${query}`]);
}

export function openWebsite(url: string) {
  return openFirst([/^https?:\/\//i.test(url) ? url : `https://${url}`]);
}

export function googleMapsUrl(lat: number, lng: number) {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

/** Opens turn-by-turn directions in the platform maps app, falling back to the web. */
export function openDirections(lat: number, lng: number, label: string) {
  const name = encodeURIComponent(label);
  const web = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  const native =
    Platform.OS === 'ios'
      ? [`maps://?daddr=${lat},${lng}&q=${name}`]
      : Platform.OS === 'android'
        ? [`google.navigation:q=${lat},${lng}`, `geo:0,0?q=${lat},${lng}(${name})`]
        : [];
  return openFirst([...native, web]);
}

export function shopDeepLink(shopId: string) {
  return ExpoLinking.createURL(`/shop/${shopId}`);
}

export async function shareShop(shop: {
  id: string;
  name: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
}) {
  const link = shopDeepLink(shop.id);
  const message = [
    `${shop.name}`,
    `${shop.address}, ${shop.city}`,
    '',
    `Open in AutoMod: ${link}`,
    `Map: ${googleMapsUrl(shop.latitude, shop.longitude)}`,
  ].join('\n');
  await Share.share(
    Platform.OS === 'ios' ? { message, url: link, title: shop.name } : { message, title: shop.name }
  );
}
