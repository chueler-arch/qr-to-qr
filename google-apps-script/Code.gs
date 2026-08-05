function doPost(event) {
  try {
    const request = JSON.parse(event.postData.contents || '{}');
    const expectedToken = PropertiesService.getScriptProperties().getProperty('QRTOQR_TOKEN');
    if (!expectedToken || request.token !== expectedToken) throw new Error('Unauthorized');
    if (!request.spreadsheetUrl || !Array.isArray(request.values)) throw new Error('Invalid request');

    const spreadsheet = SpreadsheetApp.openByUrl(request.spreadsheetUrl);
    const sheet = spreadsheet.getSheets()[0];
    const width = request.values.reduce((max, row) => Math.max(max, Array.isArray(row) ? row.length : 0), 0);
    const values = request.values.map((row) => Array.from({ length: width }, (_, index) => String(row[index] == null ? '' : row[index])));

    sheet.clearContents();
    if (values.length && width) sheet.getRange(1, 1, values.length, width).setValues(values);
    return jsonResponse_({ ok: true, rows: values.length, columns: width });
  } catch (error) {
    return jsonResponse_({ ok: false, error: String(error.message || error) });
  }
}

function jsonResponse_(body) {
  return ContentService.createTextOutput(JSON.stringify(body)).setMimeType(ContentService.MimeType.JSON);
}
