const SHEET_ID = "PASTE_YOUR_SHEET_ID_HERE";
const SHEET_NAME = "Sheet1";

const HEADERS = [
  "createdAt",
  "name",
  "status",
  "guests",
  "children",
  "dietary",
  "message"
];

function doPost(e) {
  const sheet = getSheet();
  ensureHeaders(sheet);

  const data = JSON.parse((e && e.postData && e.postData.contents) || "{}");
  sheet.appendRow([
    data.createdAt || new Date().toISOString(),
    data.name || "",
    data.status || "",
    Number(data.guests || 0),
    Number(data.children || 0),
    data.dietary || "",
    data.message || ""
  ]);

  return jsonResponse({ ok: true });
}

function doGet(e) {
  const sheet = getSheet();
  ensureHeaders(sheet);

  const rows = sheet.getDataRange().getValues();
  const headers = rows.shift();
  const responses = rows.map(row => {
    const record = Object.fromEntries(headers.map((header, index) => [header, row[index]]));
    return {
      name: record.name,
      status: record.status,
      guests: record.guests,
      children: record.children,
      createdAt: record.createdAt
    };
  });

  return jsonResponse(responses, e && e.parameter && e.parameter.callback);
}

function getSheet() {
  return SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
}

function ensureHeaders(sheet) {
  const existing = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
  const hasHeaders = HEADERS.every((header, index) => existing[index] === header);
  if (!hasHeaders) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  }
}

function jsonResponse(data, callback) {
  const json = JSON.stringify(data);
  const body = callback ? `${callback}(${json})` : json;
  return ContentService
    .createTextOutput(body)
    .setMimeType(callback ? ContentService.MimeType.JAVASCRIPT : ContentService.MimeType.JSON);
}
