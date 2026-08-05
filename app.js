const state = {
  entries: [],
  outputType: 'CODE128',
  outputSize: 240,
  zoom: 1,
  focus: 0.5,
  stream: null,
  track: null,
  scanTimer: null,
  lastCode: '',
  torchOn: false,
};

const dom = {
  fileInput: document.getElementById('fileInput'),
  googleSheetUrl: document.getElementById('googleSheetUrl'),
  loadGoogleSheetBtn: document.getElementById('loadGoogleSheetBtn'),
  statusText: document.getElementById('statusText'),
  outputType: document.getElementById('outputType'),
  outputSize: document.getElementById('outputSize'),
  zoomControl: document.getElementById('zoomControl'),
  focusControl: document.getElementById('focusControl'),
  cameraBtn: document.getElementById('cameraBtn'),
  toggleTorchBtn: document.getElementById('toggleTorchBtn'),
  video: document.getElementById('video'),
  cameraPlaceholder: document.getElementById('cameraPlaceholder'),
  scanResult: document.getElementById('scanResult'),
  barcodeCanvas: document.getElementById('barcodeCanvas'),
  valueText: document.getElementById('valueText'),
};

const STORAGE_KEY = 'qrtoqr-settings';

function loadSettings() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return;

  try {
    const parsed = JSON.parse(saved);
    if (parsed.outputType) state.outputType = parsed.outputType;
    if (parsed.outputSize) state.outputSize = parsed.outputSize;
    if (parsed.zoom) state.zoom = parsed.zoom;
    if (parsed.focus) state.focus = parsed.focus;
  } catch {
    // ignore malformed cache
  }
}

function saveSettings() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      outputType: state.outputType,
      outputSize: state.outputSize,
      zoom: state.zoom,
      focus: state.focus,
    })
  );
}

function setStatus(message) {
  dom.statusText.textContent = message;
}

function normalizeRow(key, value) {
  return {
    key: String(key ?? '').trim(),
    value: String(value ?? '').trim(),
  };
}

function updateEntries(rows) {
  state.entries = rows
    .map((row) => normalizeRow(row.key, row.value))
    .filter((row) => row.key && row.value);

  setStatus(`インポートされたレコード数: ${state.entries.length}`);
  renderOutput(state.entries[0]?.value || '');
}

function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (!lines.length) return [];

  const records = [];
  for (const line of lines) {
    const cells = line.match(/(".*?"|[^,]+)(?=,|$)/g) || [];
    const values = cells.map((cell) => cell.replace(/^"|"$/g, '').trim());
    if (values.length >= 2) {
      records.push({ key: values[0], value: values.slice(1).join(',') });
    }
  }
  return records;
}

function buildGoogleExportUrl(url) {
  const match = url.match(/spreadsheets\/d\/([a-zA-Z0-9-_]+)/i);
  if (!match) {
    throw new Error('Google Spreadsheet URL が不正です。');
  }
  const sheetId = match[1];
  const gidMatch = url.match(/[?&]gid=([^&]+)/i);
  const gid = gidMatch ? `&gid=${encodeURIComponent(gidMatch[1])}` : '';
  return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv${gid}`;
}

async function importFromFile(file) {
  if (!file) return;
  const ext = file.name.split('.').pop()?.toLowerCase();

  if (ext === 'csv') {
    const text = await file.text();
    updateEntries(parseCSV(text));
    return;
  }

  if (['xlsx', 'xls', 'xlsm'].includes(ext)) {
    const bytes = await file.arrayBuffer();
    const workbook = XLSX.read(bytes, { type: 'array' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
    const mappedRows = rows.map((row) => {
      const keys = Object.keys(row);
      const key = keys.find((k) => /key|id|code|qr|scan/i.test(k)) || keys[0];
      const value = keys.find((k) => /value|result|text|data/i.test(k)) || keys[1] || keys[0];
      return { key: row[key], value: row[value] };
    });

    updateEntries(mappedRows);
    return;
  }

  setStatus('CSV または Excel のみ対応しています。');
}

async function importFromGoogleSheet() {
  const url = dom.googleSheetUrl.value.trim();
  if (!url) {
    setStatus('Google Spreadsheet の URL を入力してください。');
    return;
  }

  try {
    const exportUrl = buildGoogleExportUrl(url);
    const response = await fetch(exportUrl, { mode: 'cors' });
    if (!response.ok) throw new Error('Google Spreadsheet の読み込みに失敗しました。');
    const csvText = await response.text();
    updateEntries(parseCSV(csvText));
  } catch (error) {
    setStatus(error.message || 'Google Spreadsheet の読み込みに失敗しました。');
  }
}

function renderBarcode(outputValue) {
  const canvas = dom.barcodeCanvas;
  const context = canvas.getContext('2d');
  context.clearRect(0, 0, canvas.width, canvas.height);

  if (state.outputType === 'QR') {
    QRCode.toCanvas(canvas, outputValue || ' ', { width: state.outputSize }, (error) => {
      if (error) {
        console.error(error);
      }
    });
    dom.valueText.textContent = outputValue || '対応値';
    return;
  }

  JsBarcode(canvas, outputValue || ' ', {
    format: state.outputType,
    displayValue: false,
    margin: 8,
    width: 2,
    height: Math.max(70, state.outputSize * 0.65),
  });

  dom.valueText.textContent = outputValue || '対応値';
}

function renderOutput(value) {
  if (!value) {
    dom.valueText.textContent = '対応値';
    const ctx = dom.barcodeCanvas.getContext('2d');
    ctx.clearRect(0, 0, dom.barcodeCanvas.width, dom.barcodeCanvas.height);
    return;
  }

  renderBarcode(value);
}

function findMatch(codeValue) {
  const match = state.entries.find((entry) => entry.key === codeValue);
  if (!match) return null;
  return match.value;
}

async function startCamera() {
  if (!navigator.mediaDevices?.getUserMedia) {
    setStatus('このブラウザはカメラアクセスに対応していません。');
    return;
  }

  try {
    const constraints = {
      video: {
        facingMode: 'environment',
        width: { ideal: 1280 },
        height: { ideal: 720 },
        advanced: [{ zoom: Number(state.zoom) }],
      },
      audio: false,
    };

    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    state.stream = stream;
    state.track = stream.getVideoTracks()[0];
    dom.video.srcObject = stream;
    dom.video.style.display = 'block';
    dom.cameraPlaceholder.style.display = 'none';

    const capabilities = state.track.getCapabilities?.() || {};
    if (capabilities.zoom) {
      dom.zoomControl.max = capabilities.zoom.max || 4;
      dom.zoomControl.value = String(state.zoom);
    }

    if (capabilities.focusDistance) {
      dom.focusControl.max = String(capabilities.focusDistance.max || 1);
    }

    dom.scanResult.textContent = 'スキャン結果: 監視中';
    if (state.scanTimer) clearInterval(state.scanTimer);
    state.scanTimer = setInterval(scanFrame, 800);
  } catch (error) {
    setStatus('カメラを開始できませんでした。許可が必要です。');
    console.error(error);
  }
}

function stopCamera() {
  if (state.scanTimer) clearInterval(state.scanTimer);
  if (state.stream) {
    state.stream.getTracks().forEach((track) => track.stop());
    state.stream = null;
  }
  dom.video.style.display = 'none';
  dom.cameraPlaceholder.style.display = 'block';
  dom.scanResult.textContent = 'スキャン結果: なし';
}

async function scanFrame() {
  if (!state.track || dom.video.readyState < 2) return;

  let rawValue = '';

  try {
    if ('BarcodeDetector' in window) {
      const detector = new window.BarcodeDetector({
        formats: ['qr_code', 'code_128', 'code_39', 'ean_13', 'itf'],
      });
      const detected = await detector.detect(dom.video);
      rawValue = detected?.[0]?.rawValue || '';
    }

    if (!rawValue) {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d', { willReadFrequently: true });
      canvas.width = dom.video.videoWidth || 640;
      canvas.height = dom.video.videoHeight || 480;
      context.drawImage(dom.video, 0, 0, canvas.width, canvas.height);
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const qrResult = window.jsQR(imageData.data, imageData.width, imageData.height);
      rawValue = qrResult?.data || '';
    }

    if (!rawValue || rawValue === state.lastCode) return;

    state.lastCode = rawValue;
    const outputValue = findMatch(rawValue);
    dom.scanResult.textContent = `スキャン結果: ${rawValue}`;

    if (outputValue) {
      renderOutput(outputValue);
    } else {
      dom.scanResult.textContent = `スキャン結果: ${rawValue} (対応データなし)`;
      renderOutput('');
    }
  } catch (error) {
    console.error(error);
  }
}

async function toggleTorch() {
  if (!state.track) return;
  const capabilities = state.track.getCapabilities?.() || {};
  if (!capabilities.torch) {
    setStatus('このデバイスはフラッシュ切替をサポートしていません。');
    return;
  }

  state.torchOn = !state.torchOn;
  await state.track.applyConstraints({
    advanced: [{ torch: state.torchOn }],
  });

  dom.toggleTorchBtn.textContent = state.torchOn ? 'フラッシュON' : 'フラッシュ切替';
}

function syncControls() {
  state.outputType = dom.outputType.value;
  state.outputSize = Number(dom.outputSize.value);
  state.zoom = Number(dom.zoomControl.value);
  state.focus = Number(dom.focusControl.value);
  saveSettings();

  if (state.track) {
    state.track.applyConstraints({
      advanced: [{ zoom: state.zoom, focusDistance: state.focus }],
    }).catch(() => {});
  }

  renderOutput(state.entries[0]?.value || '');
}

function init() {
  loadSettings();
  dom.outputType.value = state.outputType;
  dom.outputSize.value = String(state.outputSize);
  dom.zoomControl.value = String(state.zoom);
  dom.focusControl.value = String(state.focus);

  dom.fileInput.addEventListener('change', async (event) => {
    const [file] = event.target.files;
    await importFromFile(file);
  });

  dom.loadGoogleSheetBtn.addEventListener('click', importFromGoogleSheet);
  [dom.outputType, dom.outputSize, dom.zoomControl, dom.focusControl].forEach((el) => {
    el.addEventListener('change', syncControls);
    el.addEventListener('input', syncControls);
  });

  dom.cameraBtn.addEventListener('click', async () => {
    if (state.stream) {
      stopCamera();
      dom.cameraBtn.textContent = 'カメラ開始';
    } else {
      await startCamera();
      dom.cameraBtn.textContent = 'カメラ停止';
    }
  });

  dom.toggleTorchBtn.addEventListener('click', toggleTorch);

  if (!(window.JsBarcode && window.QRCode && window.jsQR)) {
    setStatus('外部ライブラリが読み込めていません。ローカル資産の読み込みを確認してください。');
  }

  const initialCanvas = dom.barcodeCanvas;
  initialCanvas.width = 320;
  initialCanvas.height = 220;
  renderOutput('');
}

init();
