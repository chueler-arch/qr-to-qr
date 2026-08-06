const state = {
  entries: [], columns: [], rawRows: [], outputType: 'CODE128', outputMode: 'uniform', columnFormats: {}, outputSize: 240, zoom: 1, focus: 0.5,
  inputSettings: { addMode: true, barcodeInput: true, overwrite: true, cameraCapture: true },
  facingMode: 'environment', stream: null, track: null, scanTimer: null,
  lastCode: '', currentOutputs: [], outputIndex: 0, currentEntry: null, keyTitle: 'A列', addMode: false, addColumnIndex: 0, overwriteHeld: false, cameraStarting: false, swipeStartX: null,
};

const byId = (id) => document.getElementById(id);
const dom = {
  video: byId('video'), cameraPlaceholder: byId('cameraPlaceholder'), retryCameraBtn: byId('retryCameraBtn'),
  scanResult: byId('scanResult'), cameraSettings: byId('cameraSettings'), zoomControl: byId('zoomControl'),
  focusControl: byId('focusControl'), zoomValue: byId('zoomValue'), focusValue: byId('focusValue'),
  switchCameraBtn: byId('switchCameraBtn'), barcodeSection: byId('barcodeSection'), emptyState: byId('emptyState'),
  outputStage: byId('outputStage'), barcodeCanvas: byId('barcodeCanvas'), valueText: byId('valueText'),
  outputTitle: byId('outputTitle'), outputPager: byId('outputPager'), barcodeWarning: byId('barcodeWarning'),
  addModeBtn: byId('addModeBtn'), exitAddModeBtn: byId('exitAddModeBtn'), addModeStage: byId('addModeStage'), addKeyTitle: byId('addKeyTitle'), addValueTitle: byId('addValueTitle'), addKeyValue: byId('addKeyValue'), addColumnValue: byId('addColumnValue'), addColumnPager: byId('addColumnPager'), capturePhotoBtn: byId('capturePhotoBtn'), overwriteControl: byId('overwriteControl'), overwriteHoldBtn: byId('overwriteHoldBtn'),
  importModal: byId('importModal'), barcodeSettingsModal: byId('barcodeSettingsModal'), fileInput: byId('fileInput'),
  googleSheetUrl: byId('googleSheetUrl'), importAppsScriptToken: byId('importAppsScriptToken'), loadGoogleSheetBtn: byId('loadGoogleSheetBtn'), statusText: byId('statusText'), tokenHelpModal: byId('tokenHelpModal'),
  outputType: byId('outputType'), outputSize: byId('outputSize'), formatOptions: byId('formatOptions'), formatHelp: byId('formatHelp'),
  uniformFormatSettings: byId('uniformFormatSettings'), columnFormatSettings: byId('columnFormatSettings'), columnFormatList: byId('columnFormatList'), autoDetectFormatsBtn: byId('autoDetectFormatsBtn'), openImportBtn: byId('openImportBtn'),
  barcodeSettingsPanel: byId('barcodeSettingsPanel'), inputSettingsPanel: byId('inputSettingsPanel'), enableAddMode: byId('enableAddMode'), enableBarcodeInput: byId('enableBarcodeInput'), enableOverwrite: byId('enableOverwrite'), enableCameraCapture: byId('enableCameraCapture'),
  dataTransferBtnLabel: byId('dataTransferBtnLabel'), exportTabBtn: byId('exportTabBtn'), importPanel: byId('importPanel'), exportPanel: byId('exportPanel'), exportCsvBtn: byId('exportCsvBtn'), appsScriptUrl: byId('appsScriptUrl'), appsScriptToken: byId('appsScriptToken'), overwriteSheetBtn: byId('overwriteSheetBtn'), exportStatus: byId('exportStatus'),
  openCameraSettingsBtn: byId('openCameraSettingsBtn'), openBarcodeSettingsBtn: byId('openBarcodeSettingsBtn'),
};

const STORAGE_KEY = 'qrtoqr-settings';
const SHEET_URL_STORAGE_KEY = 'qrtoqr-google-sheet-url';
const APPS_SCRIPT_URL_STORAGE_KEY = 'qrtoqr-apps-script-url';
const APPS_SCRIPT_TOKEN_STORAGE_KEY = 'qrtoqr-apps-script-token';
const tr = (ja, en) => window.QRtoQRI18n?.text(ja, en) || ja;
const FORMAT_INFO = {
  CODE128:{name:'CODE128 Auto',max:'実用上80文字程度',maxEn:'About 80 characters in this app',chars:'ASCII文字。内容に応じてA/B/Cを自動切替',charsEn:'ASCII; automatically switches between A/B/C',case:'大文字・小文字を保持',caseEn:'Preserved'},
  CODE128A:{name:'CODE128 Set A',max:'実用上80文字程度',maxEn:'About 80 characters in this app',chars:'ASCII制御文字、数字、記号、大文字。小文字は使用不可',charsEn:'ASCII controls, digits, symbols, uppercase; no lowercase',case:'小文字不可',caseEn:'Lowercase unavailable'},
  CODE128B:{name:'CODE128 Set B',max:'実用上80文字程度',maxEn:'About 80 characters in this app',chars:'ASCII 32–127。日本語など非ASCII文字は使用不可',charsEn:'ASCII 32–127; no non-ASCII text',case:'大文字・小文字を保持',caseEn:'Preserved'},
  CODE128C:{name:'CODE128 Set C',max:'実用上80桁程度',maxEn:'About 80 digits in this app',chars:'数字のみ、桁数は偶数',charsEn:'Digits only; even number of digits',case:'英字使用不可',caseEn:'Letters unavailable'},
  CODE39:{name:'CODE39',max:'推奨43文字以内',maxEn:'43 characters recommended',chars:'0–9、A–Z、空白、- . $ / + %',charsEn:'0–9, A–Z, space, - . $ / + %',case:'小文字は大文字へ変換',caseEn:'Lowercase converted to uppercase'},
  EAN13:{name:'EAN-13',max:'12桁または13桁',maxEn:'Exactly 12 or 13 digits',chars:'数字のみ。13桁目はチェックディジット',charsEn:'Digits only; digit 13 is a check digit',case:'英字使用不可',caseEn:'Letters unavailable'},
  ITF:{name:'ITF',max:'実用上80桁程度',maxEn:'About 80 digits in this app',chars:'数字のみ、桁数は偶数',charsEn:'Digits only; even number of digits',case:'英字使用不可',caseEn:'Letters unavailable'},
  QR:{name:'QRコード',max:'UTF-8で最大約2,953バイト',maxEn:'Up to about 2,953 UTF-8 bytes',chars:'文字・数字・記号・日本語を使用可能',charsEn:'Text, digits, symbols, and Unicode',case:'大文字・小文字を保持',caseEn:'Preserved'},
};

function loadSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    if (saved.outputType) state.outputType = saved.outputType;
    if (saved.outputMode) state.outputMode = saved.outputMode;
    if (saved.columnFormats) state.columnFormats = saved.columnFormats;
    if (saved.inputSettings) state.inputSettings = { ...state.inputSettings, ...saved.inputSettings };
    if (saved.outputSize) state.outputSize = Number(saved.outputSize);
    if (saved.zoom) state.zoom = Number(saved.zoom);
    if (saved.focus !== undefined) state.focus = Number(saved.focus);
  } catch { /* Ignore broken local settings. */ }
}

function saveSettings() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    outputType: state.outputType, outputMode: state.outputMode, columnFormats: state.columnFormats, outputSize: state.outputSize, zoom: state.zoom, focus: state.focus, inputSettings: state.inputSettings,
  }));
}

function openLayer(element) {
  element.classList.add('is-open');
  element.setAttribute('aria-hidden', 'false');
}

function closeLayer(element) {
  element.classList.remove('is-open');
  element.setAttribute('aria-hidden', 'true');
}

function setImportStatus(message, isError = false) {
  dom.statusText.textContent = message;
  dom.statusText.classList.toggle('is-error', isError);
}

function columnName(index) {
  let number = index + 1;
  let name = '';
  while (number > 0) {
    number -= 1;
    name = String.fromCharCode(65 + (number % 26)) + name;
    number = Math.floor(number / 26);
  }
  return name;
}

function updateEntries(rows) {
  const normalizedRows = rows.map((row) => row.map((cell) => String(cell ?? '').trim()));
  const titles = normalizedRows[0]?.slice(1) || [];
  state.rawRows = normalizedRows;
  state.keyTitle = normalizedRows[0]?.[0] || 'A列';
  const columnCount = Math.max(0, ...normalizedRows.map((row) => row.length - 1));
  state.columns = Array.from({ length: columnCount }, (_, index) => ({ column: columnName(index + 1), title: titles[index] || `${columnName(index + 1)}列` }));
  state.entries = normalizedRows.map((row, rowIndex) => ({
    key: row[0],
    rowIndex,
    outputs: row.slice(1).map((value, index) => ({
      value,
      title: titles[index] || `${columnName(index + 1)}列`,
      column: columnName(index + 1),
    })).filter((output) => output.value),
  })).filter((row) => row.key);
  state.columnFormats = {};
  state.columns.forEach(({ column }, index) => { state.columnFormats[column] = detectFormat(normalizedRows.slice(1).map((row) => row[index + 1]).filter(Boolean)); });
  renderColumnFormatSettings();
  saveSettings();
  if (!state.entries.length) {
    setImportStatus(tr('有効なデータが見つかりませんでした。2列以上のデータを確認してください。', 'No valid data was found. Check that the data has at least two columns.'), true);
    return false;
  }
  state.lastCode = '';
  state.currentEntry = null; state.addMode = false; state.overwriteHeld = false; dom.addModeBtn.hidden = true; dom.addModeStage.hidden = true; dom.overwriteControl.hidden = true;
  state.currentOutputs = [];
  state.outputIndex = 0;
  dom.barcodeSection.classList.remove('is-empty');
  dom.barcodeSection.removeAttribute('role');
  dom.emptyState.hidden = true;
  dom.outputStage.hidden = false;
  dom.dataTransferBtnLabel.textContent = tr('データエクスポート', 'Export Data'); dom.exportTabBtn.disabled = false;
  clearOutput(tr('コードをスキャンしてください', 'Scan a code'));
  setImportStatus(tr(`${state.entries.length}件のデータをインポートしました。`, `${state.entries.length} records imported.`));
  window.setTimeout(() => closeLayer(dom.importModal), 450);
  return true;
}

function parseCSV(text) {
  const rows = [];
  let row = [], cell = '', quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (char === '"' && quoted && text[i + 1] === '"') { cell += '"'; i += 1; }
    else if (char === '"') quoted = !quoted;
    else if (char === ',' && !quoted) { row.push(cell); cell = ''; }
    else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && text[i + 1] === '\n') i += 1;
      row.push(cell); if (row.some((value) => value.trim())) rows.push(row); row = []; cell = '';
    } else cell += char;
  }
  row.push(cell); if (row.some((value) => value.trim())) rows.push(row);
  return rows.filter((values) => values.length >= 2);
}

function buildGoogleExportUrl(url) {
  const match = url.match(/spreadsheets\/d\/([a-zA-Z0-9-_]+)/i);
  if (!match) throw new Error(tr('Google SpreadsheetのURLが正しくありません。', 'The Google Spreadsheet URL is invalid.'));
  const gidMatch = url.match(/[?&]gid=([^&]+)/i);
  return `https://docs.google.com/spreadsheets/d/${match[1]}/export?format=csv${gidMatch ? `&gid=${encodeURIComponent(gidMatch[1])}` : ''}`;
}

async function importFromFile(file) {
  if (!file) return;
  setImportStatus(tr(`${file.name}を読み込んでいます…`, `Loading ${file.name}…`));
  try {
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (extension === 'csv') updateEntries(parseCSV(await file.text()));
    else if (['xlsx', 'xls', 'xlsm'].includes(extension)) {
      const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
      updateEntries(rawRows.filter((row) => row.length >= 2));
    } else setImportStatus(tr('CSVまたはExcelファイルを選択してください。', 'Choose a CSV or Excel file.'), true);
  } catch (error) { setImportStatus(error.message || tr('ファイルを読み込めませんでした。', 'The file could not be loaded.'), true); }
  finally { dom.fileInput.value = ''; }
}

async function importFromGoogleSheet() {
  const url = dom.googleSheetUrl.value.trim();
  if (!url) { setImportStatus(tr('Google SpreadsheetのURLを入力してください。', 'Enter a Google Spreadsheet URL.'), true); return; }
  setImportStatus(tr('Spreadsheetを読み込んでいます…', 'Loading Spreadsheet…'));
  try {
    const response = await fetch(buildGoogleExportUrl(url), { mode: 'cors' });
    if (!response.ok) throw new Error(tr('Spreadsheetを読み込めませんでした。公開設定を確認してください。', 'The Spreadsheet could not be loaded. Check its sharing settings.'));
    updateEntries(parseCSV(await response.text()));
  } catch (error) { setImportStatus(error.message || tr('Spreadsheetの読み込みに失敗しました。', 'Failed to load the Spreadsheet.'), true); }
}

function detectFormat(values) {
  if (!values.length) return 'QR';
  if (values.every((value) => /^\d{12,13}$/.test(value))) return 'EAN13';
  if (values.every((value) => /^\d+$/.test(value) && value.length % 2 === 0)) return 'CODE128C';
  if (values.every((value) => /^[\x00-\x5f]+$/.test(value))) return 'CODE128A';
  if (values.every((value) => /^[\x20-\x7f]+$/.test(value))) return 'CODE128B';
  return 'QR';
}

function formatForOutput(output) {
  return state.outputMode === 'perColumn' ? (state.columnFormats[output.column] || 'QR') : state.outputType;
}

function analyzeBarcodeValue(value, format) {
  let encodedValue = value;
  const warnings = [];
  if (format === 'CODE39' && /[a-z]/.test(value)) {
    encodedValue = value.toUpperCase();
    warnings.push(tr('文字列に小文字が含まれているため、全て大文字化されます。', 'Lowercase letters are present and will be converted to uppercase.'));
  }
  const validators = {
    CODE128: /^[\x00-\x7f]+$/, CODE128A: /^[\x00-\x5f]+$/, CODE128B: /^[\x20-\x7f]+$/, CODE128C: /^(?:\d{2})+$/,
    CODE39: /^[0-9A-Z\-\. \$\/\+%]+$/, EAN13: /^\d{12,13}$/, ITF: /^(?:\d{2})+$/,
  };
  if (validators[format] && !validators[format].test(encodedValue)) warnings.push(tr(`${FORMAT_INFO[format].name}の使用可能文字・桁数の制限に適合しません。`, `The value does not meet the character or length requirements for ${FORMAT_INFO[format].name}.`));
  if (format === 'EAN13' && /^\d{12}$/.test(encodedValue)) warnings.push(tr('12桁の値にはチェックディジットが自動追加されます。', 'A check digit will be added automatically to the 12-digit value.'));
  return { encodedValue, warnings, valid: !validators[format] || validators[format].test(encodedValue) };
}

function showFormatHelp(format) {
  const info = FORMAT_INFO[format];
  dom.formatHelp.innerHTML = `<strong>${info.name}</strong><div>${tr('最大文字数', 'Maximum length')}: ${tr(info.max, info.maxEn)}</div><div>${tr('使用できる文字', 'Allowed characters')}: ${tr(info.chars, info.charsEn)}</div><div>${tr('大文字・小文字', 'Letter case')}: ${tr(info.case, info.caseEn)}</div>`;
}

function renderFormatOptions() {
  dom.formatOptions.replaceChildren(...Object.entries(FORMAT_INFO).map(([format, info]) => {
    const button = document.createElement('button'); button.type = 'button'; button.className = 'format-option'; button.textContent = info.name; button.dataset.format = format;
    button.classList.toggle('is-selected', format === state.outputType); button.setAttribute('role', 'radio'); button.setAttribute('aria-checked', String(format === state.outputType));
    button.addEventListener('mouseenter', () => showFormatHelp(format)); button.addEventListener('focus', () => showFormatHelp(format));
    button.addEventListener('mouseleave', () => showFormatHelp(state.outputType));
    button.addEventListener('click', () => { state.outputType = format; dom.outputType.value = format; renderFormatOptions(); showFormatHelp(format); saveSettings(); if (state.currentOutputs.length) renderOutputPage(); });
    return button;
  }));
  showFormatHelp(state.outputType);
}

function renderColumnFormatSettings() {
  const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[char]));
  const options = Object.entries(FORMAT_INFO).map(([value, info]) => `<option value="${value}">${info.name}</option>`).join('');
  dom.columnFormatList.innerHTML = state.columns.length ? state.columns.map(({ column, title }) => `<div class="column-format-row"><label title="${escapeHtml(title)}">${escapeHtml(title)} ${tr(`(${column}列)`, `(Column ${column})`)}</label><select data-column="${column}">${options}</select></div>`).join('') : `<p class="setting-note">${tr('データをインポートすると列設定が表示されます。', 'Import data to display column settings.')}</p>`;
  dom.columnFormatList.querySelectorAll('select').forEach((select) => { select.value = state.columnFormats[select.dataset.column] || 'QR'; select.addEventListener('change', () => { state.columnFormats[select.dataset.column] = select.value; saveSettings(); if (state.currentOutputs.length) renderOutputPage(); }); });
}

function syncOutputModeUI() {
  document.querySelectorAll('input[name="outputMode"]').forEach((radio) => { radio.checked = radio.value === state.outputMode; });
  dom.uniformFormatSettings.hidden = state.outputMode !== 'uniform'; dom.columnFormatSettings.hidden = state.outputMode !== 'perColumn';
}

function clearOutput(message) {
  const context = dom.barcodeCanvas.getContext('2d');
  context.clearRect(0, 0, dom.barcodeCanvas.width, dom.barcodeCanvas.height);
  dom.outputTitle.textContent = tr('出力', 'Output');
  dom.valueText.textContent = message;
  dom.barcodeWarning.hidden = true; dom.barcodeWarning.textContent = '';
  dom.outputPager.replaceChildren();
}

function renderBarcode(value, format = state.outputType) {
  if (!value) { clearOutput(tr('対応するデータがありません', 'No matching data')); return; }
  const canvas = dom.barcodeCanvas;
  const analysis = analyzeBarcodeValue(value, format);
  dom.barcodeWarning.hidden = !analysis.warnings.length; dom.barcodeWarning.textContent = analysis.warnings.join(' ');
  if (!analysis.valid) { const context = canvas.getContext('2d'); context.clearRect(0, 0, canvas.width, canvas.height); dom.valueText.textContent = value; return; }
  try {
    if (format === 'QR') {
      QRCode.toCanvas(canvas, analysis.encodedValue, { width: state.outputSize, margin: 2 }, (error) => {
        if (error) clearOutput(tr('QRコードを描画できませんでした', 'Could not render the QR code'));
      });
    } else {
      JsBarcode(canvas, analysis.encodedValue, { format, displayValue: false, margin: 8, width: 2, height: Math.max(64, state.outputSize * .48) });
    }
    dom.valueText.textContent = value;
  } catch { clearOutput(tr(`${format}形式で描画できない値です`, `This value cannot be rendered as ${format}.`)); }
}

function renderOutputPage() {
  const output = state.currentOutputs[state.outputIndex];
  if (!output) { clearOutput(tr('対応するデータがありません', 'No matching data')); return; }
  dom.outputTitle.textContent = tr(`${output.title} (${output.column}列)`, `${output.title} (Column ${output.column})`);
  renderBarcode(output.value, formatForOutput(output));
  dom.outputPager.replaceChildren(...state.currentOutputs.map((_, index) => {
    const dot = document.createElement('span');
    dot.classList.toggle('is-active', index === state.outputIndex);
    dot.setAttribute('aria-label', `${index + 1}/${state.currentOutputs.length}`);
    return dot;
  }));
}

function moveOutputPage(direction) {
  if (state.currentOutputs.length < 2) return;
  state.outputIndex = (state.outputIndex + direction + state.currentOutputs.length) % state.currentOutputs.length;
  renderOutputPage();
}

function ensureWritableColumn() {
  if (!state.currentEntry) return;
  const row = state.rawRows[state.currentEntry.rowIndex];
  const blankIndices = state.columns.map((_, index) => index).filter((index) => !String(row[index + 1] ?? '').trim());
  while (blankIndices.length < 10) {
    const blankIndex = state.columns.length;
    const column = columnName(blankIndex + 1);
    state.columns.push({ column, title: '' });
    state.rawRows.forEach((dataRow) => { while (dataRow.length <= blankIndex + 1) dataRow.push(''); });
    state.columnFormats[column] = 'QR';
    blankIndices.push(blankIndex);
  }
  renderColumnFormatSettings();
  state.addColumnIndex = blankIndices[0];
}

function currentAddCell() {
  if (!state.currentEntry) return '';
  return String(state.rawRows[state.currentEntry.rowIndex]?.[state.addColumnIndex + 1] ?? '');
}

function renderAddMode() {
  if (!state.currentEntry) return;
  const column = state.columns[state.addColumnIndex];
  const value = currentAddCell();
  dom.addKeyTitle.textContent = state.keyTitle || 'A列';
  dom.addValueTitle.textContent = column.title || `${column.column}列`;
  dom.addKeyValue.textContent = state.currentEntry.key;
  dom.addColumnValue.textContent = value || tr('空白', 'Blank');
  dom.addColumnValue.classList.toggle('is-blank', !value);
  dom.overwriteControl.hidden = !value || !state.inputSettings.overwrite;
  dom.addColumnPager.replaceChildren(...state.columns.map((_, index) => { const dot = document.createElement('span'); dot.classList.toggle('is-active', index === state.addColumnIndex); return dot; }));
  updateAddActionButton();
}

function moveAddColumn(direction) {
  if (!state.columns.length) return;
  const movingCells = [...document.querySelectorAll('.add-value-slide')];
  const distance = direction > 0 ? -90 : 90;
  const changeColumn = () => {
    state.addColumnIndex = (state.addColumnIndex + direction + state.columns.length) % state.columns.length;
    state.overwriteHeld = false; dom.overwriteHoldBtn.classList.remove('is-held'); renderAddMode();
    movingCells.forEach((cell) => cell.animate([{ transform:`translateX(${-distance}px)`, opacity:.15 },{ transform:'translateX(0)', opacity:1 }], { duration:190, easing:'cubic-bezier(.2,.8,.2,1)' }));
  };
  if (!movingCells[0]?.animate) { changeColumn(); return; }
  const animations = movingCells.map((cell) => cell.animate([{ transform:'translateX(0)', opacity:1 },{ transform:`translateX(${distance}px)`, opacity:.15 }], { duration:150, easing:'ease-in' }));
  const animation = animations[0];
  animation.finished.then(changeColumn).catch(changeColumn);
}

function setAddMode(enabled) {
  if (!state.currentEntry || (enabled && !state.inputSettings.addMode)) return;
  state.addMode = enabled; state.overwriteHeld = false; dom.overwriteHoldBtn.classList.remove('is-held');
  if (enabled) { ensureWritableColumn(); state.lastCode = state.currentEntry.key; }
  dom.outputStage.hidden = enabled; dom.addModeStage.hidden = !enabled; dom.overwriteControl.hidden = true;
  if (enabled) renderAddMode(); else { renderOutputPage(); updateAddActionButton(); }
}

function updateAddActionButton() {
  const canEnter = Boolean(state.currentEntry && state.inputSettings.addMode);
  dom.addModeBtn.hidden = !canEnter;
  dom.addModeBtn.classList.remove('is-capture');
  dom.addModeBtn.textContent = state.addMode ? '▦' : '＋';
  dom.addModeBtn.setAttribute('aria-label', state.addMode ? tr('バーコード表示', 'Barcode Display') : tr('データ入力', 'Data Input'));
  const blank = !currentAddCell();
  dom.capturePhotoBtn.hidden = !(state.addMode && blank && state.inputSettings.cameraCapture);
  dom.overwriteControl.hidden = !(state.addMode && !blank && state.inputSettings.overwrite);
}

function applyInputSettings() {
  dom.enableAddMode.checked = state.inputSettings.addMode; dom.enableBarcodeInput.checked = state.inputSettings.barcodeInput;
  dom.enableOverwrite.checked = state.inputSettings.overwrite; dom.enableCameraCapture.checked = state.inputSettings.cameraCapture;
  if (!state.inputSettings.addMode && state.addMode) setAddMode(false);
  if (!state.inputSettings.overwrite) { state.overwriteHeld = false; dom.overwriteHoldBtn.classList.remove('is-held'); }
  if (state.addMode) renderAddMode(); else updateAddActionButton();
}

async function captureCameraImage() {
  if (!state.addMode || currentAddCell() || !state.inputSettings.cameraCapture || dom.video.readyState < 2) return;
  const now = new Date();
  const pad = (value, length = 2) => String(value).padStart(length, '0');
  const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}${pad(now.getMilliseconds(), 3)}`;
  let safeKey = String(state.currentEntry.key).replace(/[<>:"/\\|?*\x00-\x1F]/g, '-').replace(/[. ]+$/g, '-').trim() || 'key';
  if (/^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i.test(safeKey)) safeKey = `-${safeKey}`;
  const filename = `${safeKey}_${timestamp}.png`;
  const canvas = document.createElement('canvas'); canvas.width = dom.video.videoWidth; canvas.height = dom.video.videoHeight;
  canvas.getContext('2d').drawImage(dom.video, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) return;
  const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = filename; link.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  addScannedValue(filename);
}

function addScannedValue(rawValue) {
  if (!state.currentEntry || rawValue === state.currentEntry.key) return;
  const existing = currentAddCell();
  if (existing && (!state.inputSettings.overwrite || !state.overwriteHeld)) {
    dom.scanResult.textContent = tr('上書きするには、上書きボタンを押したまま読み取ってください', 'Hold the overwrite button while scanning to replace this value');
    state.lastCode = '';
    return;
  }
  const row = state.rawRows[state.currentEntry.rowIndex]; row[state.addColumnIndex + 1] = rawValue;
  const meta = state.columns[state.addColumnIndex];
  const output = { value: rawValue, title: meta.title || `${meta.column}列`, column: meta.column };
  const existingIndex = state.currentEntry.outputs.findIndex((item) => item.column === meta.column);
  if (existingIndex >= 0) state.currentEntry.outputs[existingIndex] = output; else state.currentEntry.outputs.push(output);
  state.currentEntry.outputs.sort((a, b) => state.columns.findIndex((item) => item.column === a.column) - state.columns.findIndex((item) => item.column === b.column));
  state.currentOutputs = state.currentEntry.outputs; state.columnFormats[meta.column] = detectFormat(state.rawRows.slice(1).map((dataRow) => dataRow[state.addColumnIndex + 1]).filter(Boolean));
  const selectedColumn = state.addColumnIndex; ensureWritableColumn(); state.addColumnIndex = selectedColumn;
  saveSettings(); renderColumnFormatSettings(); renderAddMode();
  dom.scanResult.textContent = tr(`${meta.column}列に「${rawValue}」を追加しました`, `Added “${rawValue}” to column ${meta.column}`);
}

function stopCamera() {
  if (state.scanTimer) window.clearInterval(state.scanTimer);
  state.scanTimer = null;
  if (state.stream) state.stream.getTracks().forEach((track) => track.stop());
  state.stream = null; state.track = null;
}

function configureCameraControls() {
  const capabilities = state.track?.getCapabilities?.() || {};
  if (capabilities.zoom) {
    dom.zoomControl.disabled = false;
    dom.zoomControl.min = capabilities.zoom.min;
    dom.zoomControl.max = capabilities.zoom.max;
    dom.zoomControl.step = capabilities.zoom.step || .1;
    state.zoom = Math.min(capabilities.zoom.max, Math.max(capabilities.zoom.min, state.zoom));
    dom.zoomControl.value = state.zoom;
  } else dom.zoomControl.disabled = true;
  if (capabilities.focusDistance) {
    dom.focusControl.disabled = false;
    dom.focusControl.min = capabilities.focusDistance.min;
    dom.focusControl.max = capabilities.focusDistance.max;
    dom.focusControl.step = capabilities.focusDistance.step || .01;
    state.focus = Math.min(capabilities.focusDistance.max, Math.max(capabilities.focusDistance.min, state.focus));
    dom.focusControl.value = state.focus;
    dom.focusValue.textContent = state.focus.toFixed(2);
  } else { dom.focusControl.disabled = true; dom.focusValue.textContent = tr('自動', 'Auto'); }
  dom.zoomValue.textContent = `${state.zoom.toFixed(1)}×`;
}

async function startCamera() {
  if (state.cameraStarting) return;
  if (!navigator.mediaDevices?.getUserMedia) {
    dom.cameraPlaceholder.querySelector('p').textContent = tr('このブラウザはカメラに対応していません', 'This browser does not support camera access');
    dom.retryCameraBtn.classList.remove('is-hidden'); return;
  }
  state.cameraStarting = true;
  dom.cameraPlaceholder.style.display = 'flex';
  dom.cameraPlaceholder.querySelector('p').textContent = tr('カメラを起動しています', 'Starting camera');
  dom.retryCameraBtn.classList.add('is-hidden');
  stopCamera();
  try {
    state.stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: state.facingMode }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false,
    });
    state.track = state.stream.getVideoTracks()[0];
    dom.video.srcObject = state.stream;
    await dom.video.play();
    configureCameraControls();
    dom.cameraPlaceholder.style.display = 'none';
    dom.scanResult.textContent = tr('コードを枠内に合わせてください', 'Align the code inside the frame');
    state.scanTimer = window.setInterval(scanFrame, 650);
  } catch (error) {
    console.error(error);
    dom.cameraPlaceholder.querySelector('p').textContent = tr('カメラの使用を許可してください', 'Allow camera access to continue');
    dom.retryCameraBtn.classList.remove('is-hidden');
  } finally { state.cameraStarting = false; }
}

async function applyCameraControl(kind, value) {
  if (!state.track) return;
  try { await state.track.applyConstraints({ advanced: [{ [kind]: value }] }); } catch { /* Unsupported by this camera. */ }
}

async function scanFrame() {
  if (!state.track || dom.video.readyState < 2) return;
  let rawValue = '';
  try {
    if ('BarcodeDetector' in window) {
      const detector = new BarcodeDetector({ formats: ['qr_code', 'code_128', 'code_39', 'ean_13', 'itf'] });
      const detected = await detector.detect(dom.video); rawValue = detected[0]?.rawValue || '';
    }
    if (!rawValue) {
      const canvas = document.createElement('canvas');
      canvas.width = dom.video.videoWidth || 640; canvas.height = dom.video.videoHeight || 480;
      const context = canvas.getContext('2d', { willReadFrequently: true });
      context.drawImage(dom.video, 0, 0, canvas.width, canvas.height);
      const image = context.getImageData(0, 0, canvas.width, canvas.height);
      rawValue = window.jsQR(image.data, image.width, image.height)?.data || '';
    }
    if (!rawValue || rawValue === state.lastCode) return;
    state.lastCode = rawValue;
    if (state.addMode) {
      if (state.inputSettings.barcodeInput) addScannedValue(rawValue);
      else dom.scanResult.textContent = tr('バーコード入力は設定で無効になっています', 'Barcode input is disabled in settings');
      return;
    }
    const match = state.entries.find((entry) => entry.key === rawValue);
    dom.scanResult.textContent = match ? tr(`読取完了：${rawValue}`, `Scanned: ${rawValue}`) : tr(`読取：${rawValue}（対応データなし）`, `Scanned: ${rawValue} (no matching data)`);
    if (!state.entries.length) return;
    state.currentEntry = match || null; updateAddActionButton();
    if (!match && state.addMode) setAddMode(false);
    state.currentOutputs = match?.outputs || [];
    state.outputIndex = 0;
    renderOutputPage();
  } catch (error) { console.error(error); }
}

function syncOutputSettings() {
  state.outputType = dom.outputType.value; state.outputSize = Number(dom.outputSize.value); saveSettings();
  if (state.currentOutputs.length) renderOutputPage();
}

function setTransferTab(tab) {
  if (tab === 'export' && dom.exportTabBtn.disabled) tab = 'import';
  document.querySelectorAll('[data-transfer-tab]').forEach((button) => button.classList.toggle('is-active', button.dataset.transferTab === tab));
  dom.importPanel.hidden = tab !== 'import';
  dom.exportPanel.hidden = tab !== 'export';
}

function timestampDigits() {
  const now = new Date(); const pad = (value, length = 2) => String(value).padStart(length, '0');
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}${pad(now.getMilliseconds(), 3)}`;
}

function exportCsv() {
  if (!state.rawRows.length) return;
  const escape = (value) => { const text = String(value ?? ''); return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text; };
  const csv = `\uFEFF${state.rawRows.map((row) => row.map(escape).join(',')).join('\r\n')}`;
  const url = URL.createObjectURL(new Blob([csv], { type:'text/csv;charset=utf-8' }));
  const link = document.createElement('a'); link.href = url; link.download = `QRtoQR_${timestampDigits()}.csv`; link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function overwriteSpreadsheet() {
  const endpoint = dom.appsScriptUrl.value.trim(); const token = dom.appsScriptToken.value;
  const spreadsheetUrl = dom.googleSheetUrl.value.trim();
  if (!endpoint || !token || !spreadsheetUrl) { dom.exportStatus.textContent = tr('WebアプリURL、共有トークン、Spreadsheet URLを入力してください。', 'Enter the web app URL, shared token, and Spreadsheet URL.'); return; }
  dom.overwriteSheetBtn.disabled = true; dom.exportStatus.textContent = tr('Spreadsheetへ書き込んでいます…', 'Writing to Spreadsheet…');
  try {
    const response = await fetch(endpoint, { method:'POST', headers:{ 'Content-Type':'text/plain;charset=utf-8' }, body:JSON.stringify({ token, spreadsheetUrl, values:state.rawRows }) });
    const result = await response.json();
    if (!response.ok || !result.ok) throw new Error(result.error || `HTTP ${response.status}`);
    dom.exportStatus.textContent = tr(`${result.rows}行を上書きしました。`, `Overwrote ${result.rows} rows.`);
  } catch (error) {
    console.error(error); dom.exportStatus.textContent = tr('上書きできませんでした。Apps ScriptのURL、トークン、権限を確認してください。', 'Overwrite failed. Check the Apps Script URL, token, and permissions.');
  } finally { dom.overwriteSheetBtn.disabled = false; }
}

function initializeEvents() {
  dom.openImportBtn.addEventListener('click', () => { setTransferTab(state.entries.length ? 'export' : 'import'); openLayer(dom.importModal); });
  dom.openCameraSettingsBtn.addEventListener('click', () => openLayer(dom.cameraSettings));
  dom.openBarcodeSettingsBtn.addEventListener('click', (event) => { event.stopPropagation(); openLayer(dom.barcodeSettingsModal); });
  dom.addModeBtn.addEventListener('click', (event) => { event.stopPropagation(); setAddMode(!state.addMode); });
  dom.capturePhotoBtn.addEventListener('click', captureCameraImage);
  dom.exitAddModeBtn.addEventListener('click', () => setAddMode(false));
  document.querySelectorAll('[data-settings-tab]').forEach((button) => button.addEventListener('click', () => { const tab = button.dataset.settingsTab; document.querySelectorAll('[data-settings-tab]').forEach((item) => item.classList.toggle('is-active', item === button)); dom.barcodeSettingsPanel.hidden = tab !== 'barcode'; dom.inputSettingsPanel.hidden = tab !== 'input'; }));
  dom.barcodeSection.addEventListener('click', () => { if (!state.entries.length) openLayer(dom.importModal); });
  dom.barcodeSection.addEventListener('keydown', (event) => { if (!state.entries.length && (event.key === 'Enter' || event.key === ' ')) openLayer(dom.importModal); });
  document.querySelectorAll('[data-close]').forEach((button) => button.addEventListener('click', () => closeLayer(byId(button.dataset.close))));
  document.querySelectorAll('.modal-layer').forEach((layer) => layer.addEventListener('click', (event) => { if (event.target === layer) closeLayer(layer); }));
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') document.querySelectorAll('.is-open').forEach(closeLayer); });
  document.addEventListener('qrtoqr-language-change', () => {
    dom.dataTransferBtnLabel.textContent = state.entries.length ? tr('データエクスポート', 'Export Data') : tr('データインポート', 'Import Data');
    renderFormatOptions(); renderColumnFormatSettings(); syncOutputModeUI();
    applyInputSettings();
    if (state.currentOutputs.length) renderOutputPage();
    else if (state.entries.length) clearOutput(tr('コードをスキャンしてください', 'Scan a code'));
  });
  dom.fileInput.addEventListener('change', (event) => importFromFile(event.target.files[0]));
  dom.loadGoogleSheetBtn.addEventListener('click', importFromGoogleSheet);
  document.querySelectorAll('[data-open-token-help]').forEach((button) => button.addEventListener('click', () => openLayer(dom.tokenHelpModal)));
  document.querySelectorAll('[data-transfer-tab]').forEach((button) => button.addEventListener('click', () => setTransferTab(button.dataset.transferTab)));
  dom.exportCsvBtn.addEventListener('click', exportCsv);
  dom.overwriteSheetBtn.addEventListener('click', overwriteSpreadsheet);
  dom.googleSheetUrl.addEventListener('input', () => {
    localStorage.setItem(SHEET_URL_STORAGE_KEY, dom.googleSheetUrl.value.trim());
  });
  dom.appsScriptUrl.addEventListener('input', () => localStorage.setItem(APPS_SCRIPT_URL_STORAGE_KEY, dom.appsScriptUrl.value.trim()));
  const syncToken = (source, target) => { target.value = source.value; localStorage.setItem(APPS_SCRIPT_TOKEN_STORAGE_KEY, source.value); };
  dom.appsScriptToken.addEventListener('input', () => syncToken(dom.appsScriptToken, dom.importAppsScriptToken));
  dom.importAppsScriptToken.addEventListener('input', () => syncToken(dom.importAppsScriptToken, dom.appsScriptToken));
  dom.outputType.addEventListener('change', syncOutputSettings); dom.outputSize.addEventListener('change', syncOutputSettings);
  document.querySelectorAll('input[name="outputMode"]').forEach((radio) => radio.addEventListener('change', () => { state.outputMode = radio.value; syncOutputModeUI(); saveSettings(); if (state.currentOutputs.length) renderOutputPage(); }));
  dom.autoDetectFormatsBtn.addEventListener('click', () => {
    state.columns.forEach(({ column }, index) => { state.columnFormats[column] = detectFormat(state.rawRows.slice(1).map((row) => row[index + 1]).filter(Boolean)); });
    renderColumnFormatSettings(); saveSettings(); if (state.currentOutputs.length) renderOutputPage();
  });
  [[dom.enableAddMode,'addMode'],[dom.enableBarcodeInput,'barcodeInput'],[dom.enableOverwrite,'overwrite'],[dom.enableCameraCapture,'cameraCapture']].forEach(([control,key]) => control.addEventListener('change', () => { state.inputSettings[key] = control.checked; state.lastCode = state.currentEntry?.key || ''; saveSettings(); applyInputSettings(); }));
  dom.outputStage.addEventListener('pointerdown', (event) => { state.swipeStartX = event.clientX; });
  dom.outputStage.addEventListener('pointerup', (event) => {
    if (state.swipeStartX === null) return;
    const distance = event.clientX - state.swipeStartX;
    state.swipeStartX = null;
    if (Math.abs(distance) >= 40) moveOutputPage(distance < 0 ? 1 : -1);
  });
  dom.outputStage.addEventListener('pointercancel', () => { state.swipeStartX = null; });
  dom.addModeStage.addEventListener('pointerdown', (event) => { state.swipeStartX = event.clientX; });
  dom.addModeStage.addEventListener('pointerup', (event) => { if (state.swipeStartX === null) return; const distance = event.clientX - state.swipeStartX; state.swipeStartX = null; if (Math.abs(distance) >= 40) moveAddColumn(distance < 0 ? 1 : -1); });
  dom.addModeStage.addEventListener('pointercancel', () => { state.swipeStartX = null; });
  const releaseOverwrite = () => { state.overwriteHeld = false; dom.overwriteHoldBtn.classList.remove('is-held'); };
  dom.overwriteHoldBtn.addEventListener('pointerdown', (event) => { event.preventDefault(); state.overwriteHeld = true; dom.overwriteHoldBtn.classList.add('is-held'); dom.overwriteHoldBtn.setPointerCapture?.(event.pointerId); });
  dom.overwriteHoldBtn.addEventListener('pointerup', releaseOverwrite); dom.overwriteHoldBtn.addEventListener('pointercancel', releaseOverwrite); dom.overwriteHoldBtn.addEventListener('lostpointercapture', releaseOverwrite); window.addEventListener('blur', releaseOverwrite);
  dom.zoomControl.addEventListener('input', () => { state.zoom = Number(dom.zoomControl.value); dom.zoomValue.textContent = `${state.zoom.toFixed(1)}×`; saveSettings(); applyCameraControl('zoom', state.zoom); });
  dom.focusControl.addEventListener('input', () => { state.focus = Number(dom.focusControl.value); dom.focusValue.textContent = state.focus.toFixed(2); saveSettings(); applyCameraControl('focusDistance', state.focus); });
  dom.switchCameraBtn.addEventListener('click', async () => { state.facingMode = state.facingMode === 'environment' ? 'user' : 'environment'; await startCamera(); });
  dom.retryCameraBtn.addEventListener('click', startCamera);
  window.addEventListener('pagehide', stopCamera);
}

function init() {
  loadSettings();
  dom.googleSheetUrl.value = localStorage.getItem(SHEET_URL_STORAGE_KEY) || '';
  dom.appsScriptUrl.value = localStorage.getItem(APPS_SCRIPT_URL_STORAGE_KEY) || '';
  dom.appsScriptToken.value = localStorage.getItem(APPS_SCRIPT_TOKEN_STORAGE_KEY) || '';
  dom.importAppsScriptToken.value = dom.appsScriptToken.value;
  dom.outputType.value = state.outputType; dom.outputSize.value = String(state.outputSize);
  renderFormatOptions(); renderColumnFormatSettings(); syncOutputModeUI();
  applyInputSettings();
  dom.zoomControl.value = state.zoom; dom.focusControl.value = state.focus;
  dom.zoomValue.textContent = `${state.zoom.toFixed(1)}×`;
  initializeEvents();
  if (!(window.JsBarcode && window.QRCode && window.jsQR && window.XLSX)) setImportStatus(tr('必要なライブラリを読み込めませんでした。', 'Required libraries could not be loaded.'), true);
  startCamera();
}

init();
