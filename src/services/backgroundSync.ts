import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import { syncAllExternalCalendars } from './syncService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BACKGROUND_SYNC_TASK = 'EXTERNAL_CALENDAR_SYNC';

// バックグラウンドタスク定義
TaskManager.defineTask(BACKGROUND_SYNC_TASK, async () => {
  try {
    const uid = await AsyncStorage.getItem('currentUid');
    const defaultCalendarId = await AsyncStorage.getItem('defaultCalendarId');

    if (!uid || !defaultCalendarId) {
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    const results = await syncAllExternalCalendars(uid, defaultCalendarId);
    const totalImported = results.reduce((sum, r) => sum + r.importedCount, 0);

    return totalImported > 0
      ? BackgroundFetch.BackgroundFetchResult.NewData
      : BackgroundFetch.BackgroundFetchResult.NoData;
  } catch {
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

/**
 * バックグラウンド同期を登録する（15分間隔）
 */
export async function registerBackgroundSync(): Promise<void> {
  const status = await BackgroundFetch.getStatusAsync();
  if (status === BackgroundFetch.BackgroundFetchStatus.Denied) {
    return;
  }

  await BackgroundFetch.registerTaskAsync(BACKGROUND_SYNC_TASK, {
    minimumInterval: 15 * 60, // 15分
    stopOnTerminate: false,
    startOnBoot: true,
  });
}

/**
 * バックグラウンド同期を解除する
 */
export async function unregisterBackgroundSync(): Promise<void> {
  const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_SYNC_TASK);
  if (isRegistered) {
    await BackgroundFetch.unregisterTaskAsync(BACKGROUND_SYNC_TASK);
  }
}

/**
 * 同期に必要なUID等をAsyncStorageに保存する
 */
export async function saveBackgroundSyncContext(
  uid: string,
  defaultCalendarId: string
): Promise<void> {
  await AsyncStorage.setItem('currentUid', uid);
  await AsyncStorage.setItem('defaultCalendarId', defaultCalendarId);
}
