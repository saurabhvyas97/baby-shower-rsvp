# Baby Shower RSVP GitHub Page

This folder is ready to publish with GitHub Pages.

## Edit Event Details

Open `script.js` and update `EVENT_CONFIG`:

- `date`
- `time`
- `title`
- `summary`
- `mapsUrl`
- `rsvpEndpoint`
- `statsEndpoint`

The page is currently set to:

- Date: Saturday, 3 October 2026
- Time: Lunch and afternoon
- Location: Stockholm

## RSVP Storage

GitHub Pages is static, so it cannot save RSVP responses on its own. The page has a demo mode that saves test responses in the visitor's browser. For real shared RSVP stats, use a Google Sheet plus Apps Script:

1. Create a Google Sheet with headers:
   `createdAt`, `name`, `email`, `status`, `guests`, `children`, `dietary`, `message`, `locationEmailSentAt`
2. Open Extensions > Apps Script.
3. Paste this code and replace `SHEET_ID`, `FINAL_LOCATION`, `FINAL_TIME`, and `HOST_NAME`.
4. Deploy as a web app with access set to "Anyone".
5. Use the deployed web app URL for both `rsvpEndpoint` and `statsEndpoint` in `script.js`.

Note: GitHub Pages does not provide private authentication. Keep the Google Sheet private for full guest details. The included `stats.html` page is useful for quick totals, but it is public if you publish it. The script below returns only RSVP confirmation summary fields to the public stats page.

```javascript
const SHEET_ID = "PASTE_YOUR_SHEET_ID_HERE";
const SHEET_NAME = "Sheet1";
const FINAL_LOCATION = "Paste final venue/address here";
const FINAL_TIME = "Paste final time here";
const HOST_NAME = "Your host name";

function doPost(e) {
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
  const data = JSON.parse(e.postData.contents || "{}");
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

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  const rows = SpreadsheetApp.openById(SHEET_ID)
    .getSheetByName(SHEET_NAME)
    .getDataRange()
    .getValues();
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

  const callback = e.parameter.callback;
  const body = callback
    ? `${callback}(${JSON.stringify(responses)})`
    : JSON.stringify(responses);

  return ContentService
    .createTextOutput(body)
    .setMimeType(callback ? ContentService.MimeType.JAVASCRIPT : ContentService.MimeType.JSON);
}

function sendFinalLocationToAttendees() {
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
  const rows = sheet.getDataRange().getValues();
  const headers = rows[0];
  const emailSentAtIndex = headers.indexOf("locationEmailSentAt");
  if (emailSentAtIndex === -1) {
    throw new Error("Missing locationEmailSentAt column");
  }

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
```

Run `sendFinalLocationToAttendees` manually from Apps Script after you know the venue. It emails only rows where `status` is `yes` and `locationEmailSentAt` is blank.

## Publish With GitHub Pages

1. Create a GitHub repository.
2. Upload the files in this folder.
3. In GitHub, open Settings > Pages.
4. Set Source to "Deploy from a branch".
5. Select the `main` branch and `/root`, then save.

Your RSVP page will be available at the GitHub Pages URL shown in that settings page.
