(function () {
  const STORAGE_KEY = 'qrtoqr-language';
  const originalTitle = document.title;
  const translations = {
    'データインポート':'Import Data','カメラを起動しています':'Starting camera','もう一度試す':'Try Again',
    'コードを枠内に合わせてください':'Align the code inside the frame','カメラ設定':'Camera Settings','ズーム':'Zoom',
    'フォーカス':'Focus','前面／背面を切替':'Switch Front / Rear','データをインポートしてください':'Please import data',
    'タップしてインポート画面を開く':'Tap to open the import dialog','コードをスキャンしてください':'Scan a code',
    '使い方・ヘルプ':'Help','このアプリについて':'About','利用規約':'Terms','プライバシーポリシー':'Privacy',
    'データインポート':'Import Data','Excel / CSVファイルを選択':'Choose Excel / CSV file','または':'OR',
    '公開Google Spreadsheet':'Public Google Spreadsheet','Spreadsheetを読み込む':'Load Spreadsheet',
    'A列を検索キー、B列以降を表示値として読み込みます。1行目はタイトルとして使用します。':'Column A is the lookup key; columns B onward are output values. Row 1 is used as titles.',
    'バーコード設定':'Barcode Settings','バーコード形式':'Barcode Format','描画サイズ':'Render Size','設定を適用':'Apply Settings',
    '小（180px）':'Small (180px)','中（240px）':'Medium (240px)','大（320px）':'Large (320px)','出力':'Output',
    'アプリへ戻る':'Back to App','基本的な使い方':'Basic Usage','データを用意する':'Prepare Your Data',
    'A列に読み取り対象のキー、B列以降に表示したい値を入れます。1行目は各列のタイトルとして表示されますが、A1も検索キーとして読み取れます。':'Put lookup keys in column A and output values in columns B onward. Row 1 provides column titles, while A1 also remains a valid lookup key.',
    'データをインポートする':'Import Data','画面右上の「データインポート」からファイルを選ぶか、公開Google SpreadsheetのURLを入力します。':'Choose a file from Import Data at the top right, or enter a public Google Spreadsheet URL.',
    'コードを読み取る':'Scan a Code','カメラの枠内にQRコードまたはバーコードを合わせます。B列以降に複数の値がある場合は、下段を横にスワイプして切り替えます。':'Align a QR code or barcode inside the camera frame. If columns B onward contain multiple values, swipe horizontally in the output area.',
    'カメラ設定':'Camera Settings','カメラ右上の設定ボタンから、ズーム、対応端末でのフォーカス、前面・背面カメラを変更できます。初回はブラウザのカメラ許可が必要です。':'Use the camera settings button to control zoom, supported focus, and front/rear cameras. Camera permission is required on first use.',
    'バーコード設定':'Barcode Settings','出力画面右上の設定ボタンから、QR、CODE128、CODE39、EAN-13、ITFと描画サイズを選択できます。形式に合わない文字列は描画できない場合があります。':'Choose QR, CODE128, CODE39, EAN-13, ITF, and render size from the output settings. Some values may not be valid for the selected format.',
    'うまく動作しない場合':'Troubleshooting','このアプリについて':'About This App','用途':'Purpose',
    '現場で使われているコードと、別システムへ入力するコードの対応付けなど、コードの変換・照合作業をスマートフォンだけで素早く行うために開発しました。':'Built for fast code conversion and lookup on a smartphone, such as mapping codes used in the field to codes required by another system.',
    'ブラウザ内で動作':'Runs in Your Browser','インポートしたファイルの解析、カメラ映像の読み取り、コードの描画はブラウザ内で行います。専用アプリのインストールは不要です。':'Imported files, camera frames, and code rendering are processed in your browser. No app installation is required.',
    '活動へのご支援':'Support Our Work','このアプリがお役に立ちましたら、今後の改善・運営のため、任意の少額支援をご検討いただけるとうれしいです。支援は利用条件ではありません。':'If this app has helped you, please consider an optional small contribution toward future improvements and operation. Support is never required to use the app.',
    'ご希望の方には、銀行振込またはPayPayでの方法をご案内します。まずはメールでご連絡ください。':'We can provide bank transfer or PayPay details. Please contact us by email first.',
    '支援方法をメールで問い合わせる':'Ask About Supporting Us','活用事例を募集しています':'Share Your Use Case',
    '企業・学校・団体などで活用いただいた際は、企業・団体名と、公開可能な利用風景や用途をお送りください。許可いただいた内容をSONA CRAFTの活用事例として紹介させていただく場合があります。':'If your company, school, or organization uses QRtoQR, send us your organization name and any publishable photos or usage details. With permission, we may feature them as a SONA CRAFT use case.',
    '活用事例をメールで送る':'Email a Use Case','提供者':'Provider','お問い合わせ':'Contact',
    'インポートしたデータ':'Imported Data','Google Spreadsheet':'Google Spreadsheet','カメラ':'Camera','端末に保存する設定':'Settings Stored on This Device',
    '変更・提供終了':'Changes and Discontinuation','利用について':'Use of the App','利用者の責任':'User Responsibility','免責事項':'Disclaimer',
    '本規約は、SONA CRAFTが提供する「QRtoQR」の利用条件を定めるものです。':'These Terms set out the conditions for using QRtoQR, provided by SONA CRAFT.',
    '最終更新日：2026年8月5日':'Last updated: August 5, 2026','1. 利用について':'1. Use of the App',
    '本アプリは、法令および本規約を守る範囲で利用できます。第三者の権利を侵害する目的、不正アクセスその他の不正な目的で利用してはなりません。':'You may use this app in compliance with applicable laws and these Terms. You may not use it to infringe third-party rights, gain unauthorized access, or for any unlawful purpose.',
    '2. 利用者の責任':'2. User Responsibility','インポートするデータ、読み取るコード、生成したコードの内容および利用結果は、利用者自身の責任で確認してください。機密情報や個人情報を扱う場合は、所属組織の規則に従ってください。':'You are responsible for verifying imported data, scanned and generated codes, and the results of using the app. Follow your organization’s rules when handling confidential or personal information.',
    '3. 免責事項':'3. Disclaimer','本アプリの正確性、完全性、特定目的への適合性および継続提供を保証するものではありません。本アプリの利用または利用不能により生じた損害について、法令で認められる範囲で責任を負いません。':'We do not guarantee accuracy, completeness, fitness for a particular purpose, or uninterrupted availability. To the extent permitted by law, we are not liable for damages resulting from use or inability to use the app.',
    '4. 変更・提供終了':'4. Changes and Discontinuation','機能、仕様、本規約は、必要に応じて予告なく変更または提供終了する場合があります。':'Features, specifications, these Terms, or the service may be changed or discontinued without notice when necessary.','5. お問い合わせ':'5. Contact',
    'QRtoQRで使用するデータ、カメラおよびブラウザ設定の取り扱いについて説明します。':'This policy explains how QRtoQR handles data, camera access, and browser settings.',
    '選択したCSV・Excelファイルは、利用者のブラウザ内で読み取ります。本アプリのサーバーへアップロードまたは保存する機能はありません。ページを閉じるとインポートしたデータは破棄されます。':'Selected CSV and Excel files are read in your browser. They are not uploaded to or stored on our server. Imported data is discarded when you close the page.',
    '入力されたURLから、利用者のブラウザがGoogleへ直接アクセスして公開CSVを取得します。入力したURLは次回の利用時に復元できるよう、利用端末のブラウザ内に保存します。URLおよび取得データを本アプリのサーバーへ保存する機能はありません。Google側での通信情報の取り扱いは、Googleの規約とポリシーに従います。':'Your browser directly accesses Google to retrieve the public CSV. The entered URL is stored in your browser so it can be restored next time. Neither the URL nor retrieved data is stored on our server. Google handles connection data under its own terms and policies.',
    'コード読み取りのため、利用者が許可した場合に端末のカメラを使用します。カメラ映像はブラウザ内で解析し、本アプリのサーバーへの送信・録画・保存は行いません。':'With your permission, the app uses your camera to scan codes. Camera frames are analyzed in your browser and are not transmitted to, recorded by, or stored on our server.',
    'バーコード形式、描画サイズ、ズーム、フォーカス値およびGoogle SpreadsheetのURLをブラウザのローカルストレージに保存します。ブラウザのサイトデータを削除すると、これらの設定も削除されます。':'Barcode format, render size, zoom, focus, and the Google Spreadsheet URL are stored in browser local storage. Deleting site data also deletes these settings.',
    'QRtoQRは、読み取ったコードを登録データと照合し、対応する値を別のQRコードまたはバーコードとして表示するブラウザアプリです。':'QRtoQR is a browser app that looks up scanned codes in imported data and displays matching values as new QR codes or barcodes.',
    'カメラが映らない場合は、ブラウザのサイト設定でカメラを許可してください。':'If the camera does not appear, allow camera access in your browser’s site settings.',
    'Spreadsheetは「リンクを知っている全員が閲覧可能」など、CSVを取得できる公開設定が必要です。':'The Spreadsheet must be shared publicly so its CSV can be retrieved.',
    '古い表示が残る場合は、ブラウザを再読み込みしてください。':'If an old screen remains, reload the browser.',
    '設定方法':'Setting Method','全て同一のバーコードを設定する':'Use one barcode format for all columns','列ごとにバーコードを設定する':'Set barcode format by column',
    '列ごとの設定':'Per-column Settings','自動で設定する':'Auto Detect','インポート値を検査して適切な形式を提案します。自動設定後も変更できます。':'Imported values are inspected to suggest a suitable format. You can change it afterward.',
    '最大文字数':'Maximum length','使用できる文字':'Allowed characters','大文字・小文字':'Letter case',
    '出力画面右上の設定ボタンから、QR、CODE128 Auto／Set A／Set B／Set C、CODE39、EAN-13、ITFと描画サイズを選択できます。全列共通または列ごとの設定を選び、インポート値からの自動設定後に手動で変更できます。形式の制限により値が変換される場合は、出力画面に警告が表示されます。':'Choose QR, CODE128 Auto/Set A/Set B/Set C, CODE39, EAN-13, ITF, and render size. Use one format for all columns or configure each column, with automatic detection followed by manual adjustment. A warning appears if format restrictions transform a value.'
    ,'追加モード':'Add Mode','追加モード終了':'Exit Add Mode','追加する列を左右にスワイプし、カメラでコードを読み取ってください':'Swipe to choose a column, then scan a code with the camera','空白':'Blank','押している間だけ上書き':'Hold to Overwrite',
    '既存のキーを読み取ると、出力画面左上に追加モードが表示されます。追加モードでは左右のスワイプで列を選び、次にカメラで読み取った文字列を空白セルへ追加できます。入力済みセルを変更する場合は、左下の上書きボタンを押したまま読み取ってください。変更はブラウザ上のデータにのみ反映され、元のファイルやSpreadsheetには書き戻されません。':'After scanning an existing key, Add Mode appears at the upper left of the output. Swipe to select a column, then scan a value into a blank cell. To replace an existing value, hold the overwrite button at the lower left while scanning. Changes affect only the in-browser data and are not written back to the source file or Spreadsheet.',
    '入力設定':'Input Settings','終了':'Exit','追加モード':'Add Mode','バーコード入力':'Barcode Input','上書きモード':'Overwrite Mode','カメラ撮影':'Camera Capture',
    '読み取り済みの行へ値を追加':'Add values to a scanned row','カメラで読み取った文字列をセルへ入力':'Enter camera-scanned text into a cell','入力済みセルの上書きを許可':'Allow existing cells to be overwritten','画像保存とファイル名入力を使用':'Save camera images with a chosen filename'
    ,'既存のキーを読み取ると、出力画面左上に赤い追加ボタンが表示されます。追加モードでは左右のスワイプで列を選び、次にカメラで読み取った文字列を空白セルへ追加できます。空白列ではカメラボタンから現在の映像をPNG画像として保存し、指定したファイル名をセルへ登録できます。入力済みセルを変更する場合は、左下の上書きボタンを押したまま読み取ってください。各機能は入力設定タブでON/OFFできます。変更はブラウザ上のデータにのみ反映され、元のファイルやSpreadsheetには書き戻されません。':'After scanning an existing key, a red add button appears at the upper left. Swipe to select a column and scan text into a blank cell. For a blank column, the camera button saves the current frame as a PNG and records your filename in the cell. Hold the overwrite button while scanning to change an existing cell. Each feature can be enabled or disabled on the Input Settings tab. Changes remain in browser data and are not written back to the source.',
    'データ管理':'Data Management','インポート':'Import','エクスポート':'Export','CSVファイルをエクスポート':'Export CSV File','Spreadsheetを上書き':'Overwrite Spreadsheet','データエクスポート':'Export Data',
    '上書き':'Overwrite','押している間だけ上書きが有効となります':'Overwrite is enabled only while holding the button.',
    '押すとカメラの画像を保存します':'Press to save the camera image.','削除':'Delete','長押しすると値を削除できます':'Press and hold to delete the value.','ブランクにしますか？':'Make it blank?','選択しているセルの値を削除します。':'The selected cell value will be deleted.','キャンセル':'Cancel','ブランクにする':'Make Blank',
    'Google Spreadsheetを選択':'Select Google Spreadsheet','Googleアカウントに接続されていません。':'Not connected to a Google Account.','または公開URLから読み込む':'Or load from a public URL','上書き先のGoogle Spreadsheetを選択':'Select a Google Spreadsheet to overwrite','保存先のGoogle Spreadsheetを選択':'Select a Google Spreadsheet to save','Spreadsheetが選択されていません。':'No Spreadsheet selected.','Googleアカウントで接続すると、選択したSpreadsheetへ上書きできます。':'Connect your Google Account to overwrite the selected Spreadsheet.','Googleアカウントで接続すると、変更したセルだけを保存できます。':'Connect your Google Account to save only changed cells.','今すぐ保存':'Save Now',
    '画面右上の「データインポート」からファイルを選ぶか、Googleアカウントに接続してSpreadsheetを選択します。公開SpreadsheetはURLからも読み込めます。':'Choose a file from Import Data, or connect your Google Account and select a Spreadsheet. Public Spreadsheets can also be loaded by URL.','既存のキーを読み取ると、出力画面左上にデータ入力への切替ボタンが表示されます。左右のスワイプで列を選び、カメラで読み取った文字列を空白セルへ追加できます。空白列ではカメラボタンから現在の映像をPNG画像として保存し、キーと撮影日時から作成したファイル名をセルへ登録します。入力済みセルは上書きまたは削除できます。Google Spreadsheetから読み込んだ場合は、変更したセルだけが約1秒後に自動保存されます。':'After scanning an existing key, use the upper-left button to switch to data input. Swipe to choose a column and scan text into a blank cell. The camera button saves a PNG and records a filename made from the key and capture time. Existing cells can be overwritten or deleted. For Google Spreadsheet imports, only changed cells are saved automatically after about one second.','非公開SpreadsheetはGoogleアカウントに接続して選択してください。URL読み込みを使う場合は公開設定が必要です。':'Connect your Google Account to select a private Spreadsheet. URL loading requires public sharing.','Googleアカウント連携を選択した場合、Googleの認証画面とPickerを使用し、利用者が選択したSpreadsheetだけを読み書きします。アクセストークンと取得データはブラウザ内で処理し、本アプリのサーバーには保存しません。公開URLから読み込む場合は、ブラウザがGoogleへ直接アクセスして公開CSVを取得します。入力した公開URLは次回利用時のためブラウザ内に保存します。Google側での取り扱いはGoogleの規約とポリシーに従います。':'When Google Account integration is used, Google authorization and Picker are used to read and write only the Spreadsheet selected by the user. Access tokens and retrieved data are processed in the browser and are not stored on our server. For a public URL, the browser retrieves the public CSV directly from Google and stores the entered URL locally for future use. Google handles related data under its terms and policies.'
  };
  const text = (ja, en) => (getLanguage() === 'en' ? en : ja);
  function getLanguage() { return localStorage.getItem(STORAGE_KEY) === 'en' ? 'en' : 'ja'; }
  function translateTree() {
    const language = getLanguage(); document.documentElement.lang = language;
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      if (!node.parentElement || ['SCRIPT','STYLE'].includes(node.parentElement.tagName)) continue;
      const source = node.datasetSource || node.nodeValue.trim();
      if (!source) continue;
      node.datasetSource = source;
      const translated = translations[source];
      if (translated) node.nodeValue = node.nodeValue.replace(node.nodeValue.trim(), language === 'en' ? translated : source);
    }
    document.querySelectorAll('.language-toggle').forEach((button) => { button.textContent = language === 'en' ? '日本語' : 'EN'; button.setAttribute('aria-label', language === 'en' ? '日本語に切り替え' : 'Switch to English'); });
    if (language === 'en') {
      const titles = { '/': 'QRtoQR | QR & Barcode Converter', '/index.html': 'QRtoQR | QR & Barcode Converter', '/how-to-use.html': 'Help | QRtoQR', '/about.html': 'About | QRtoQR', '/terms.html': 'Terms | QRtoQR', '/privacy.html': 'Privacy Policy | QRtoQR' };
      document.title = titles[location.pathname] || document.title;
    } else document.title = originalTitle;
    document.dispatchEvent(new CustomEvent('qrtoqr-language-change', { detail: { language } }));
  }
  function toggle() { localStorage.setItem(STORAGE_KEY, getLanguage() === 'en' ? 'ja' : 'en'); translateTree(); }
  document.addEventListener('DOMContentLoaded', () => { document.querySelectorAll('.language-toggle').forEach((button) => button.addEventListener('click', toggle)); translateTree(); });
  window.QRtoQRI18n = { getLanguage, text, translateTree, toggle };
}());
