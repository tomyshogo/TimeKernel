# TimeKernel Alexa Skill

## 対応コマンド

| 発話 | 機能 |
|---|---|
| 「今日の予定を教えて」 | 今日のイベント一覧 |
| 「明日の予定」 | 指定日のイベント一覧 |
| 「次の予定は」 | 今日の次のイベント |
| 「明日14時に歯医者を追加して」 | 予定追加（キュー経由でローカルカレンダーにも対応） |
| 「今月のバイト代は」 | 月間バイト集計 |

## セットアップ手順

### 1. AWS Lambda 作成

```bash
cd alexa-skill/lambda
npm install
zip -r function.zip .
```

AWS Lambdaに `function.zip` をアップロード:
- ランタイム: Node.js 20.x
- リージョン: ap-northeast-1（東京）
- 環境変数: `TIMEKERNEL_UID`（開発用、Account Linking後は不要）
- トリガー: Alexa Skills Kit

### 2. Firebase サービスアカウント

- Firebase Console → プロジェクト設定 → サービスアカウント → 秘密鍵を生成
- Lambda環境変数に `GOOGLE_APPLICATION_CREDENTIALS` としてパスを設定
  （またはインラインでJSONを環境変数に設定）

### 3. Alexa Developer Console

1. https://developer.amazon.com/alexa/console/ask でスキル作成
2. 「カスタム」→「自分でプロビジョニング」を選択
3. `interactionModel.json` の内容を「対話モデル」に貼り付け
4. エンドポイントにLambdaのARNを設定
5. テストタブで動作確認

### 4. Account Linking（本番用）

Firebase Authのトークンを使ってAlexaアカウントとTimeKernelアカウントを紐付け。
詳細は [Alexa Account Linking ドキュメント](https://developer.amazon.com/docs/account-linking/understand-account-linking.html) を参照。
