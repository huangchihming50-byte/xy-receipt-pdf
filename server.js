// 翔宇收據 PDF 服務：POST /pdf { html, filename } -> 回傳 PDF
// 資料只在記憶體 render，不落地、不經任何第三方。
const express = require('express');
const { chromium } = require('playwright');

const app = express();
app.use(express.json({ limit: '12mb' }));

const SECRET = process.env.RECEIPT_SECRET || '';

app.get('/', (_req, res) => res.type('text').send('翔宇收據 PDF 服務 OK'));
app.get('/healthz', (_req, res) => res.json({ ok: true }));

app.post('/pdf', async (req, res) => {
  if (SECRET) {
    const got = req.get('x-receipt-secret');
    if (got !== SECRET) return res.status(401).json({ ok: false, error: 'unauthorized' });
  }
  const html = req.body && req.body.html;
  const filename = String((req.body && req.body.filename) || 'receipt.pdf');
  // HTTP header 只能放 ASCII：含中文/控制字元/引號時改用 receipt.pdf，原檔名放 filename* (UTF-8) 給支援的客戶端
  const asciiName = /^[\x20-\x7E]+$/.test(filename) && !/["\\]/.test(filename) ? filename : 'receipt.pdf';
  const utf8Name = encodeURIComponent(filename).replace(/['()*]/g, c => '%' + c.charCodeAt(0).toString(16).toUpperCase());
  if (!html) return res.status(400).json({ ok: false, error: 'missing html' });

  let browser;
  try {
    const launchOpts = { args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'] };
    if (process.env.CHROMIUM_PATH) launchOpts.executablePath = process.env.CHROMIUM_PATH;
    browser = await chromium.launch(launchOpts);
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'load', timeout: 30000 });
    // 等字型就緒；再給外部資源(如 QR 圖)最多 6 秒，逾時也不擋出圖
    try { await page.evaluate(() => document.fonts && document.fonts.ready); } catch (_) {}
    await page.waitForLoadState('networkidle', { timeout: 6000 }).catch(() => {});
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' }
    });
    res.set('Content-Type', 'application/pdf');
    res.set('Content-Disposition', 'inline; filename="' + asciiName + '"; filename*=UTF-8\'\'' + utf8Name);
    res.send(pdf);
  } catch (e) {
    res.status(500).json({ ok: false, error: String((e && e.message) || e) });
  } finally {
    if (browser) { try { await browser.close(); } catch (_) {} }
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log('xy-receipt-pdf listening on ' + port));
