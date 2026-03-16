import * as Location from 'expo-location';

interface Coordinates {
  lat: number;
  lon: number;
}

/**
 * 現在の位置情報を取得する
 * 権限がない場合はnullを返す
 */
export async function getLocation(): Promise<Coordinates | null> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      return null;
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Low,
    });

    return {
      lat: location.coords.latitude,
      lon: location.coords.longitude,
    };
  } catch (error) {
    console.warn('[Location] Failed to get location:', error);
    return null;
  }
}

/**
 * 位置情報の権限ステータスを確認
 */
export async function checkLocationPermission(): Promise<boolean> {
  const { status } = await Location.getForegroundPermissionsAsync();
  return status === 'granted';
}
