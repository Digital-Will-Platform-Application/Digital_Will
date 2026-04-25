import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as Device from 'expo-device';

const DEVICE_KEY = 'dw_device_id';

/** Stable per-install id (AsyncStorage), like web localStorage device id. */
export async function getOrCreateDeviceIdAsync(): Promise<string> {
  try {
    let id = await AsyncStorage.getItem(DEVICE_KEY);
    if (!id) {
      id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
      await AsyncStorage.setItem(DEVICE_KEY, id);
    }
    return id;
  } catch {
    return `fallback-${Platform.OS}-${Date.now()}`;
  }
}

/** Human-readable label for Supabase login_activity.device_label */
export function getNativeDeviceLabel(): string {
  if (Platform.OS === 'web') return 'Digital Will (Web)';
  const os = Platform.OS === 'ios' ? 'iOS' : Platform.OS === 'android' ? 'Android' : Platform.OS;
  const model =
    Device.isDevice && Device.modelName
      ? Device.modelName
      : Device.modelId || Device.osName || os;
  return `Digital Will on ${model} (${os})`;
}

/** Snapshot string for login_activity.user_agent (parseable in UI like web UA). */
export function getNativeUserAgentSnapshot(): string {
  return `DigitalWillApp/${Platform.OS} ${String(Platform.Version ?? '')} (${getNativeDeviceLabel()})`;
}

export function isMobileLikeUserAgent(ua: string): boolean {
  if (/DigitalWillApp\/(ios|android)/i.test(ua)) return true;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
}
