# DOPE Card Generator

Static, mobile-friendly seven-row DOPE card generator for 2.7-inch Waveshare NFC e-paper.

## Features

- Live 264 × 176 landscape preview
- Seven editable DOPE rows (yards, elevation, 5 mph wind, 10 mph wind)
- Import/export JSON profiles
- PNG download for the phone NFC app
- 176 × 264, 1-bit monochrome BMP download for Waveshare UART workflow
- No backend or dependencies

## Run

Open `index.html` in a browser, or serve with `python3 -m http.server 8000` and visit http://localhost:8000.

## Publish on GitHub Pages

Push these files to the repository's default branch, then choose **Settings → Pages → Deploy from a branch**, select the default branch and `/ (root)`, and save.

## Notes

The BMP exporter writes a standard 1-bit BMP with a 62-byte pixel offset, 176 × 264 dimensions, 6,398-byte total file, and a 90-degree CCW rotation of the landscape preview. Validate the output on your Waveshare hardware before public release. DOPE values are user-entered, not calculated.
