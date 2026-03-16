# TimeKernel v2 要件定義書

## 概要

v1の基盤（カレンダー・予定管理・共有・時間割・バイト計算・MCP・Apple Watch）に加え、
v2では **オフライン対応・ウィジェット・通知・外部カレンダー連携** を追加する。

---

## 1. オフライン対応

### 目的
ネットワーク接続がなくても予定の閲覧・追加ができるようにする。

### 仕様

| 項目 | 内容 |
|------|------|
| キャッシュ方式 | Firestore のオフラインパーシステンス（`enablePersistentCacheIndexAutoCreation`）+ AsyncStorage 補助 |
| オフライン時の閲覧 | キャッシュ済みデータを表示 |
| オフライン時の書き込み | ローカルに保存、オンライン復帰時に Firestore が自動同期 |
| 競合解決 | Firestore のサーバータイムスタンプ優先（last-write-wins） |
| 同期状態表示 | ヘッダーに接続状態インジケーター（オンライン / オフライン / 同期中） |

### 技術方針

- `firebase.firestore().enablePersistence()` を有効化（React Native Firestore のオフラインサポート）
- `NetInfo`（`@react-native-community/netinfo`）でネットワーク状態を監視
- オフライン状態のUI表示（バナーまたはアイコン）
- 未同期の変更にはインジケーターを付与（「同期待ち」マーク）

### データフロー

```
[ユーザー操作] → [ローカルキャッシュに書き込み] → [UIに即座に反映]
                                                    ↓
                                         [オンライン復帰時]
                                                    ↓
                                         [Firestoreに自動同期]
                                                    ↓
                                         [同期完了マーク表示]
```

---

## 2. ウィジェット（iOS / Android）

### 目的
ホーム画面から今日の予定やバイト情報をひと目で確認できるようにする。

### ウィジェット種類

| ウィジェット | サイズ | 表示内容 |
|-------------|--------|---------|
| 今日の予定 | Small / Medium | 今日の予定一覧（最大3〜5件） |
| 次の予定 | Small | 次に控えている予定（タイトル・時刻・残り時間） |
| 今月のバイト代 | Small | 今月の合計勤務時間 + 見込み給料 |
| 週間カレンダー | Medium | 今週の予定を簡易表示 |

### 技術方針

| プラットフォーム | 技術 |
|-----------------|------|
| iOS | `expo-widgets`（WidgetKit / SwiftUI） |
| Android | `expo-widgets`（Glance / Jetpack Compose） |
| データ連携 | SharedGroupPreferences（iOS）/ SharedPreferences（Android）経由でアプリからウィジェットにデータを渡す |

### ウィジェット更新タイミング

- アプリフォアグラウンド復帰時
- 予定の追加・編集・削除時
- タイムラインベースの定期更新（15分〜1時間間隔）

---

## 3. 通知・リマインダー

### 目的
予定の前にプッシュ通知でリマインドし、忘れ防止する。

### 通知種類

| 通知タイプ | トリガー | デフォルト |
|-----------|---------|-----------|
| 予定リマインダー | 予定開始の N 分前 | 15分前 |
| バイト開始通知 | シフト開始の N 分前 | 30分前 |
| 授業リマインダー | 授業開始の N 分前 | 10分前 |
| 共有カレンダー更新 | メンバーが予定を追加/変更した時 | ON |

### ユーザー設定

- 通知のON/OFF（全体 + タイプ別）
- リマインド時間の変更（5分前 / 10分前 / 15分前 / 30分前 / 1時間前）
- 共有カレンダー通知のON/OFF（カレンダーごと）
- おやすみ時間帯の設定（例: 23:00〜7:00 は通知しない）

### 技術方針

| 項目 | 技術 |
|------|------|
| ローカル通知 | `expo-notifications`（スケジュール通知） |
| リモート通知 | Firebase Cloud Messaging (FCM) |
| 共有更新通知 | Firestore トリガー → Cloud Functions → FCM |

### データ構造（追加）

```
users/{uid}/settings/
  └── notifications/
        ├── enabled: true
        ├── eventReminder: 15        // 分
        ├── shiftReminder: 30        // 分
        ├── classReminder: 10        // 分
        ├── sharedUpdates: true
        ├── quietHoursEnabled: false
        ├── quietHoursStart: "23:00"
        └── quietHoursEnd: "07:00"

users/{uid}/
  └── fcmTokens: ["token1", "token2"]  // デバイスごとのFCMトークン
```

---

## 4. 外部カレンダー連携（双方向同期）

### 目的
Google Calendar / Apple Calendar / Outlook など既存のカレンダーとTimeKernelを双方向同期し、ひとつのアプリで全予定を管理できるようにする。

### 対応サービス

| サービス | 方式 | 優先度 |
|---------|------|--------|
| Google Calendar | Google Calendar API（OAuth 2.0） | 高 |
| Apple Calendar | EventKit（デバイスローカル） | 高 |
| Outlook | Microsoft Graph API（OAuth 2.0） | 中 |
| iCal形式（汎用） | .ics インポート / エクスポート | 中 |

### 同期仕様

| 項目 | 仕様 |
|------|------|
| 同期方向 | 双方向（TimeKernel ↔ 外部） |
| 同期頻度 | 手動 + バックグラウンド定期同期（15分間隔） |
| 競合解決 | 最終更新タイムスタンプ優先 + ユーザー確認ダイアログ（重要な競合時） |
| 同期範囲 | 過去1ヶ月〜未来3ヶ月（設定可能） |
| マッピング | 外部予定 → TimeKernelの「event」タイプとして表示 |

### 機能詳細

#### インポート（外部 → TimeKernel）
- 外部カレンダーの予定をTimeKernelに表示
- 外部カレンダーの予定は視覚的に区別（アイコン or バッジ）
- インポート元ごとにカラー設定可能

#### エクスポート（TimeKernel → 外部）
- TimeKernelの予定を外部カレンダーに反映
- エクスポート対象のカレンダーを選択可能
- 予定タイプ（授業 / 予定 / バイト）ごとにエクスポートON/OFF

#### iCal対応
- .ics ファイルのインポート（ファイル選択 or URL指定）
- .ics ファイルのエクスポート（共有シートから送信）
- iCal URL購読（定期的にフェッチして同期）

### 技術方針

| 項目 | 技術 |
|------|------|
| Google Calendar | `expo-auth-session`（OAuth）+ Google Calendar API v3 |
| Apple Calendar | `expo-calendar`（EventKit ラッパー） |
| Outlook | `expo-auth-session`（OAuth）+ Microsoft Graph API |
| iCal | `ical.js` ライブラリでパース / 生成 |
| バックグラウンド同期 | `expo-background-fetch` + `expo-task-manager` |

### データ構造（追加）

```
users/{uid}/
  └── externalCalendars/
        └── {externalCalId}/
              ├── provider: "google" | "apple" | "outlook" | "ical"
              ├── name: "Google - 個人"
              ├── color: "#4285F4"
              ├── syncEnabled: true
              ├── syncDirection: "both" | "import" | "export"
              ├── lastSynced: timestamp
              ├── accessToken: "..."         // Google/Outlook（暗号化保存）
              ├── refreshToken: "..."        // Google/Outlook（暗号化保存）
              ├── icalUrl: "https://..."     // iCal URL購読用
              └── exportTypes: ["class", "event", "shift"]  // エクスポート対象タイプ

users/{uid}/
  └── externalEventMap/                     // 外部ID ↔ TimeKernel ID のマッピング
        └── {mappingId}/
              ├── externalId: "google_event_123"
              ├── internalEventId: "eventId1"
              ├── calendarId: "calendarId1"
              ├── provider: "google"
              └── lastSynced: timestamp
```

### 画面

| 画面 | 概要 |
|------|------|
| 外部カレンダー設定 | 連携先一覧、追加、削除、同期設定 |
| 連携先追加 | サービス選択 → OAuth認証 → カレンダー選択 |
| 同期状態 | 最終同期日時、同期エラー表示 |
| iCalインポート | ファイル選択 or URL入力 |

---

## 画面一覧（v2追加分）

| 画面 | 概要 |
|------|------|
| 設定 > 通知設定 | リマインド時間、タイプ別ON/OFF、おやすみ時間 |
| 設定 > 外部カレンダー | 連携先一覧、追加・削除・同期設定 |
| 外部カレンダー追加 | サービス選択 → 認証 → カレンダー選択 |
| iCalインポート | ファイル or URL からのインポート |

---

## 非機能要件（v2追加分）

| 項目 | 内容 |
|------|------|
| オフライン | ローカルキャッシュで閲覧・追加、オンライン復帰時に自動同期 |
| バックグラウンド同期 | 外部カレンダー: 15分間隔、ウィジェット更新: 予定変更時 + 定期 |
| トークン管理 | OAuth トークンは `expo-secure-store` で暗号化保存 |
| 通知制限 | おやすみ時間帯は通知を抑制 |

---

## 開発フェーズ（v2）

| Phase | 内容 | 依存関係 |
|-------|------|---------|
| Phase 1 | オフライン対応（Firestoreパーシステンス + ネットワーク状態UI） | なし |
| Phase 2 | 通知・リマインダー（ローカル通知 + FCM + Cloud Functions） | なし |
| Phase 3 | 外部カレンダー連携（Apple Calendar → Google → Outlook → iCal） | なし |
| Phase 4 | ウィジェット（iOS → Android） | Phase 1（オフラインデータ共有基盤を利用） |
| Phase 5 | テスト・統合・リリース準備 | 全Phase |

---

## 決定事項まとめ

- [x] オフライン → **Firestoreオフラインパーシステンス + AsyncStorage補助**
- [x] ウィジェット → **expo-widgets（WidgetKit / Glance）**
- [x] 通知 → **expo-notifications（ローカル）+ FCM（リモート）**
- [x] 外部カレンダー連携 → **双方向同期、Google / Apple / Outlook / iCal 全対応**
- [x] 競合解決 → **最終更新タイムスタンプ優先（重要な競合時はユーザー確認）**
- [x] トークン保存 → **expo-secure-store で暗号化**
