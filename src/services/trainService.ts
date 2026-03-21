import { TrainStatus, TrainSettings, LINE_MASTERS } from '../types/train';

/**
 * ODPT APIから運行情報を取得（APIキー取得後に実装）
 * 現在はダミーデータを返す
 */
export async function fetchTrainStatus(
  subscribedLines: string[]
): Promise<TrainStatus[]> {
  // TODO: ODPT API実装後に置き換え
  // const apiKey = process.env.EXPO_PUBLIC_ODPT_API_KEY;
  // const url = `https://api.odpt.org/api/v4/odpt:TrainInformation?acl:consumerKey=${apiKey}`;

  // ダミーデータ（テスト用）
  return getDummyTrainStatus(subscribedLines);
}

function getDummyTrainStatus(subscribedLines: string[]): TrainStatus[] {
  const now = new Date().toISOString();
  const statuses: TrainStatus[] = [];

  for (const lineId of subscribedLines) {
    const master = LINE_MASTERS.find((l) => l.id === lineId)!;
    if (!master) continue;

    // TODO: ODPT API実装後に実データに差し替え
    const rand = Math.random();
    if (rand < 0.05) {
      statuses.push({
        lineId,
        lineName: master.name,
        operator: master.operator,
        status: 'delay',
        statusText: '一部列車に遅れが出ています',
        cause: '混雑の影響',
        updatedAt: now,
      });
    } else if (rand < 0.1) {
      statuses.push({
        lineId,
        lineName: master.name,
        operator: master.operator,
        status: 'suspended',
        statusText: '運転を見合わせています',
        cause: '人身事故',
        updatedAt: now,
      });
    } else {
      statuses.push({
        lineId,
        lineName: master.name,
        operator: master.operator,
        status: 'normal',
        statusText: '平常運転',
        updatedAt: now,
      });
    }
  }

  return statuses;
}
