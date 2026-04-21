export type QrSheetParams = {
  title: string
  source: string
  qrImageAbsoluteUrl: string
  intakeUrl: string
  qrId: string
}

/** Opens a print-friendly tab for event handouts. */
export function openPrintableQrSheet(p: QrSheetParams): void {
  const esc = (s: string) =>
    s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')

  const imgSrc = p.qrImageAbsoluteUrl.startsWith('data:')
    ? p.qrImageAbsoluteUrl
    : esc(p.qrImageAbsoluteUrl)

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${esc(p.title)}</title>
  <style>
    body { font-family: system-ui, Segoe UI, sans-serif; padding: 28px; max-width: 720px; margin: 0 auto; color: #111; }
    h1 { font-size: 22px; margin: 0 0 8px; }
    .muted { color: #444; font-size: 13px; margin-bottom: 20px; }
    .box { border: 1px solid #ccc; border-radius: 12px; padding: 20px; text-align: center; margin: 16px 0; }
    img { width: 260px; height: 260px; image-rendering: pixelated; }
    code { font-size: 12px; word-break: break-all; display: block; text-align: left; background: #f4f4f4; padding: 10px; border-radius: 8px; }
    ul { text-align: left; font-size: 13px; line-height: 1.5; }
    @media print {
      body { padding: 12px; }
      .noprint { display: none; }
    }
  </style>
</head>
<body>
  <h1>${esc(p.title)}</h1>
  <p class="muted">Source: <strong>${esc(p.source)}</strong> · Scanning opens your online form (requires internet on the phone).</p>
  <div class="box">
    <img src="${imgSrc}" alt="QR Code" width="260" height="260" />
  </div>
  <p><strong>Scan opens</strong></p>
  <code>${esc(p.intakeUrl)}</code>
  <p style="margin-top:16px;font-size:13px;"><strong>QR record ID</strong> ${esc(p.qrId)}</p>
  <ul>
    <li>Print this page or save as PDF for events.</li>
    <li>Submissions flow into the CRM when your JotForm webhook is configured for production.</li>
  </ul>
  <p class="noprint" style="margin-top:24px;"><button type="button" onclick="window.print()" style="padding:10px 18px;font-size:15px;cursor:pointer;">Print</button></p>
  <script>window.focus();</script>
</body>
</html>`

  const w = window.open('', '_blank', 'noopener,noreferrer')
  if (!w) {
    alert('Pop-up blocked — allow pop-ups to print the QR sheet.')
    return
  }
  w.document.open()
  w.document.write(html)
  w.document.close()
}
