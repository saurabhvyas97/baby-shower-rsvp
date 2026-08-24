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

GitHub Pages is static, so it cannot save RSVP responses on its own. The page has a demo mode that saves test responses in the visitor's browser. For real shared RSVP stats, use a Google Sheet plus Apps Script.

The ready-to-paste backend is in `google-apps-script.gs`.

1. Create a Google Sheet.
2. Open Extensions > Apps Script.
3. Paste the contents of `google-apps-script.gs`.
4. Replace `SHEET_ID`, `FINAL_LOCATION`, `FINAL_TIME`, and `HOST_NAME`.
5. Click Deploy > New deployment > Web app.
6. Set "Execute as" to "Me".
7. Set "Who has access" to "Anyone".
8. Copy the Web app URL.
9. Paste that URL into both `rsvpEndpoint` and `statsEndpoint` in `script.js`.
10. Push the updated `script.js` to your GitHub repository.

Note: GitHub Pages does not provide private authentication. Keep the Google Sheet private for full guest details. The included `stats.html` page is useful for quick totals, but it is public if you publish it. The script below returns only RSVP confirmation summary fields to the public stats page.

Run `sendFinalLocationToAttendees` manually from Apps Script after you know the venue. It emails only rows where `status` is `yes` and `locationEmailSentAt` is blank.

## Publish With GitHub Pages

1. Create a GitHub repository.
2. Upload the files in this folder.
3. In GitHub, open Settings > Pages.
4. Set Source to "Deploy from a branch".
5. Select the `main` branch and `/root`, then save.

Your RSVP page will be available at the GitHub Pages URL shown in that settings page.
