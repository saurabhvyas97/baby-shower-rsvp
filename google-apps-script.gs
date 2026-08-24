const SHEET_ID = "PASTE_YOUR_SHEET_ID_HERE";
const SHEET_NAME = "Sheet1";
const FINAL_LOCATION = "Paste final venue/address here";
const FINAL_TIME = "Paste final time here";
const HOST_NAME = "Your host name";

const HEADERS = [
  "createdAt",
  "name",
  "email",
  "status",
  "guests",
  "children",
  "dietary",
  "message",
  "locationEmailSentAt"
];

function doPost(e) {
  const sheet = getSheet();
  ensureHeaders(sheet);

  const data = JSON.parse((e && e.postData && e.postData.contents) || "{}");
  sheet.appendRow([
    data.createdAt || new Date().toISOString(),
    data.name || "",
    data.email || "",
    data.status || "",
    Number(data.guests || 0),
    Number(data.children || 0),
    data.dietary || "",
    data.message || "",
    ""
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

function sendFinalLocationToAttendees() {
  const sheet = getSheet();
  ensureHeaders(sheet);

  const rows = sheet.getDataRange().getValues();
  const headers = rows[0];
  const emailSentAtIndex = headers.indexOf("locationEmailSentAt");

  rows.slice(1).forEach((row, offset) => {
    const record = Object.fromEntries(headers.map((header, index) => [header, row[index]]));
    if (record.status !== "yes" || !record.email || record.locationEmailSentAt) return;

    MailApp.sendEmail({
      to: record.email,
      subject: "Baby shower location details",
      htmlBody: `
        <p>Hi ${record.name || "there"},</p>
        <p>Thank you for RSVPing. Here are the final baby shower details:</p>
        <p><strong>Date:</strong> Saturday, 3 October 2026<br>
        <strong>Time:</strong> ${FINAL_TIME}<br>
        <strong>Location:</strong> ${FINAL_LOCATION}</p>
        <p>Warmly,<br>${HOST_NAME}</p>
      `
    });

    sheet.getRange(offset + 2, emailSentAtIndex + 1).setValue(new Date().toISOString());
  });
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
