const state = {
  entries: [], outputType: 'CODE128', outputSize: 240, zoom: 1, focus: 0.5,
  facingMode: 'environment', stream: null, track: null, scanTimer: null,
  lastCode: '', currentOutputs: [], outputIndex: 0, cameraStarting: false, swipeStartX: null,
};

const byId = (id) => document.getElementById(id);
const dom = {
  video: byId('video'), cameraPlaceholder: byId('cameraPlaceholder'), retryCameraBtn: byId('retryCameraBtn'),
  scanResult: byId('scanResult'), cameraSettings: byId('cameraSettings'), zoomControl: byId('zoomControl'),
  focusControl: byId('focusControl'), zoomValue: byId('zoomValue'), focusValue: byId('focusValue'),
  switchCameraBtn: byId('switchCameraBtn'), barcodeSection: byId('barcodeSection'), emptyState: byId('emptyState'),
  outputStage: byId('outputStage'), barcodeCanvas: byId('barcodeCanvas'), valueText: byId('valueText'),
  outputTitle: byId('outputTitle'), outputPager: byId('outputPager'),
  importModal: byId('importModal'), barcodeSettingsModal: byId('barcodeSettingsModal'), fileInput: byId('fileInput'),
  googleSheetUrl: byId('googleSheetUrl'), loadGoogleSheetBtn: byId('loadGoogleSheetBtn'), statusText: byId('statusText'),
  outputType: byId('outputType'), outputSize: byId('outputSize'), openImportBtn: byId('openImportBtn'),
  openCameraSettingsBtn: byId('openCameraSettingsBtn'), openBarcodeSettingsBtn: byId('openBarcodeSettingsBtn'),
};

const STORAGE_KEY = 'qrtoqr-settings';
const SHEET_URL_STORAGE_KEY = 'qrtoqr-google-sheet-url';

function loadSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    if (saved.outputType) state.outputType = saved.outputType;
    if (saved.outputSize) state.outputSize = Number(saved.outputSize);
    if (saved.zoom) state.zoom = Number(saved.zoom);
    if (saved.focus !== undefined) state.focus = Number(saved.focus);
  } catch { /* Ignore broken local settings. */ }
}

function saveSettings() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    outputType: state.outputType, outputSize: state.outputSize, zoom: state.zoom, focus: state.focus,
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
  state.entries = normalizedRows.map((row) => ({
    key: row[0],
    outputs: row.slice(1).map((value, index) => ({
      value,
      title: titles[index] || `${columnName(index + 1)}列`,
      column: columnName(index + 1),
    })).filter((output) => output.value),
  })).filter((row) => row.key && row.outputs.length);
  if (!state.entries.length) {
    setImportStatus('有効なデータが見つかりませんでした。2列以上のデータを確認してください。', true);
    return false;
  }
  state.lastCode = '';
  state.currentOutputs = [];
  state.outputIndex = 0;
  dom.barcodeSection.classList.remove('is-empty');
  dom.barcodeSection.removeAttribute('role');
  dom.emptyState.hidden = true;
  dom.outputStage.hidden = false;
  clearOutput('コードをスキャンしてください');
  setImportStatus(`${state.entries.length}件のデータをインポートしました。`);
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
  if (!match) throw new Error('Google SpreadsheetのURLが正しくありません。');
  const gidMatch = url.match(/[?&]gid=([^&]+)/i);
  return `https://docs.google.com/spreadsheets/d/${match[1]}/export?format=csv${gidMatch ? `&gid=${encodeURIComponent(gidMatch[1])}` : ''}`;
}

async function importFromFile(file) {
  if (!file) return;
  setImportStatus(`${file.name}を読み込んでいます…`);
  try {
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (extension === 'csv') updateEntries(parseCSV(await file.text()));
    else if (['xlsx', 'xls', 'xlsm'].includes(extension)) {
      const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
      updateEntries(rawRows.filter((row) => row.length >= 2));
    } else setImportStatus('CSVまたはExcelファイルを選択してください。', true);
  } catch (error) { setImportStatus(error.message || 'ファイルを読み込めませんでした。', true); }
  finally { dom.fileInput.value = ''; }
}

async function importFromGoogleSheet() {
  const url = dom.googleSheetUrl.value.trim();
  if (!url) { setImportStatus('Google SpreadsheetのURLを入力してください。', true); return; }
  setImportStatus('Spreadsheetを読み込んでいます…');
  try {
    const response = await fetch(buildGoogleExportUrl(url), { mode: 'cors' });
    if (!response.ok) throw new Error('Spreadsheetを読み込めませんでした。公開設定を確認してください。');
    updateEntries(parseCSV(await response.text()));
  } catch (error) { setImportStatus(error.message || 'Spreadsheetの読み込みに失敗しました。', true); }
}

function clearOutput(message) {
  const context = dom.barcodeCanvas.getContext('2d');
  context.clearRect(0, 0, dom.barcodeCanvas.width, dom.barcodeCanvas.height);
  dom.outputTitle.textContent = '出力';
  dom.valueText.textContent = message;
  dom.outputPager.replaceChildren();
}

function renderBarcode(value) {
  if (!value) { clearOutput('対応するデータがありません'); return; }
  const canvas = dom.barcodeCanvas;
  try {
    if (state.outputType === 'QR') {
      QRCode.toCanvas(canvas, value, { width: state.outputSize, margin: 2 }, (error) => {
        if (error) clearOutput('QRコードを描画できませんでした');
      });
    } else {
      JsBarcode(canvas, value, { format: state.outputType, displayValue: false, margin: 8, width: 2, height: Math.max(64, state.outputSize * .48) });
    }
    dom.valueText.textContent = value;
  } catch { clearOutput(`${state.outputType}形式で描画できない値です`); }
}

function renderOutputPage() {
  const output = state.currentOutputs[state.outputIndex];
  if (!output) { clearOutput('対応するデータがありません'); return; }
  dom.outputTitle.textContent = `${output.title} (${output.column}列)`;
  renderBarcode(output.value);
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
  } else { dom.focusControl.disabled = true; dom.focusValue.textContent = '自動'; }
  dom.zoomValue.textContent = `${state.zoom.toFixed(1)}×`;
}

async function startCamera() {
  if (state.cameraStarting) return;
  if (!navigator.mediaDevices?.getUserMedia) {
    dom.cameraPlaceholder.querySelector('p').textContent = 'このブラウザはカメラに対応していません';
    dom.retryCameraBtn.classList.remove('is-hidden'); return;
  }
  state.cameraStarting = true;
  dom.cameraPlaceholder.style.display = 'flex';
  dom.cameraPlaceholder.querySelector('p').textContent = 'カメラを起動しています';
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
    dom.scanResult.textContent = 'コードを枠内に合わせてください';
    state.scanTimer = window.setInterval(scanFrame, 650);
  } catch (error) {
    console.error(error);
    dom.cameraPlaceholder.querySelector('p').textContent = 'カメラの使用を許可してください';
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
    const match = state.entries.find((entry) => entry.key === rawValue);
    dom.scanResult.textContent = match ? `読取完了：${rawValue}` : `読取：${rawValue}（対応データなし）`;
    if (!state.entries.length) return;
    state.currentOutputs = match?.outputs || [];
    state.outputIndex = 0;
    renderOutputPage();
  } catch (error) { console.error(error); }
}

function syncOutputSettings() {
  state.outputType = dom.outputType.value; state.outputSize = Number(dom.outputSize.value); saveSettings();
  if (state.currentOutputs.length) renderOutputPage();
}

function initializeEvents() {
  dom.openImportBtn.addEventListener('click', () => openLayer(dom.importModal));
  dom.openCameraSettingsBtn.addEventListener('click', () => openLayer(dom.cameraSettings));
  dom.openBarcodeSettingsBtn.addEventListener('click', (event) => { event.stopPropagation(); openLayer(dom.barcodeSettingsModal); });
  dom.barcodeSection.addEventListener('click', () => { if (!state.entries.length) openLayer(dom.importModal); });
  dom.barcodeSection.addEventListener('keydown', (event) => { if (!state.entries.length && (event.key === 'Enter' || event.key === ' ')) openLayer(dom.importModal); });
  document.querySelectorAll('[data-close]').forEach((button) => button.addEventListener('click', () => closeLayer(byId(button.dataset.close))));
  document.querySelectorAll('.modal-layer').forEach((layer) => layer.addEventListener('click', (event) => { if (event.target === layer) closeLayer(layer); }));
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') document.querySelectorAll('.is-open').forEach(closeLayer); });
  dom.fileInput.addEventListener('change', (event) => importFromFile(event.target.files[0]));
  dom.loadGoogleSheetBtn.addEventListener('click', importFromGoogleSheet);
  dom.googleSheetUrl.addEventListener('input', () => {
    localStorage.setItem(SHEET_URL_STORAGE_KEY, dom.googleSheetUrl.value.trim());
  });
  dom.outputType.addEventListener('change', syncOutputSettings); dom.outputSize.addEventListener('change', syncOutputSettings);
  dom.outputStage.addEventListener('pointerdown', (event) => { state.swipeStartX = event.clientX; });
  dom.outputStage.addEventListener('pointerup', (event) => {
    if (state.swipeStartX === null) return;
    const distance = event.clientX - state.swipeStartX;
    state.swipeStartX = null;
    if (Math.abs(distance) >= 40) moveOutputPage(distance < 0 ? 1 : -1);
  });
  dom.outputStage.addEventListener('pointercancel', () => { state.swipeStartX = null; });
  dom.zoomControl.addEventListener('input', () => { state.zoom = Number(dom.zoomControl.value); dom.zoomValue.textContent = `${state.zoom.toFixed(1)}×`; saveSettings(); applyCameraControl('zoom', state.zoom); });
  dom.focusControl.addEventListener('input', () => { state.focus = Number(dom.focusControl.value); dom.focusValue.textContent = state.focus.toFixed(2); saveSettings(); applyCameraControl('focusDistance', state.focus); });
  dom.switchCameraBtn.addEventListener('click', async () => { state.facingMode = state.facingMode === 'environment' ? 'user' : 'environment'; await startCamera(); });
  dom.retryCameraBtn.addEventListener('click', startCamera);
  window.addEventListener('pagehide', stopCamera);
}

function init() {
  loadSettings();
  dom.googleSheetUrl.value = localStorage.getItem(SHEET_URL_STORAGE_KEY) || '';
  dom.outputType.value = state.outputType; dom.outputSize.value = String(state.outputSize);
  dom.zoomControl.value = state.zoom; dom.focusControl.value = state.focus;
  dom.zoomValue.textContent = `${state.zoom.toFixed(1)}×`;
  initializeEvents();
  if (!(window.JsBarcode && window.QRCode && window.jsQR && window.XLSX)) setImportStatus('必要なライブラリを読み込めませんでした。', true);
  startCamera();
}

init();
