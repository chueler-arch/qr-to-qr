# QRtoQR

QRtoQR は、スマホで使う前提の静的ウェブアプリです。

## できること
- CSV / Excel 形式のデータをインポート
- 公開設定された Google Spreadsheet の CSV を読み込み
- カメラで QR / バーコードをスキャン
- 一致したキーに紐づく値を QR / バーコードとして表示
- ブラウザのローカルストレージへ設定保存
- フロントエンドのみで完結

## ローカル起動
1. このフォルダで以下を実行
   ```sh
   python -m http.server 4173
   ```
2. ブラウザで http://localhost:4173 を開く

## デプロイ
### GitHub Pages
1. GitHub へリポジトリを作成
2. このフォルダを push
3. Settings → Pages → Source を `Deploy from a branch` で `main` / `docs` を選択
4. 公開 URL を確認

### Cloudflare Pages
1. Cloudflare にログイン
2. Pages → Create Project → Direct Upload
3. このフォルダをアップロード
4. `index.html` を公開対象にしてデプロイ

## 注意点
- Google Spreadsheet は公開設定が必要です
- スマホでは HTTPS または localhost でカメラアクセスが可能です
- 一部モバイルブラウザでは `BarcodeDetector` の対応状況に依存します
