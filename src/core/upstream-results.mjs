const normalizeFormat = value => String(value ?? '').replace(/[^a-z0-9]/gi, '').toLowerCase();
const QR = new Set(['qrcode', 'qrcodemodel1', 'qrcodemodel2', 'microqrcode', 'rmqrcode']);
const LINEAR = new Set(['ean13', 'ean8', 'upca', 'upce', 'code128', 'code39', 'code39std', 'code39ext', 'code93', 'itf', 'itf14', 'codabar', 'databar', 'databarexpanded', 'databarlimited', 'databarexp', 'databarltd', 'databaromni', 'databarstk', 'databarstkomni', 'databarexpstk', 'gs1databar', 'isbn', 'eanupc']);
export function matchesBarcodeFormat(format, mode) {
  const key = normalizeFormat(format);
  return mode === 'qr' ? QR.has(key) : mode === 'barcode' && LINEAR.has(key);
}
export function selectBarcodeResult(results, mode, backend) {
  if (!Array.isArray(results)) return null;
  for (const item of results) {
    if (!item || item.isValid === false || (item.error && item.isValid !== true) || !(matchesBarcodeFormat(item.format, mode) || matchesBarcodeFormat(item.symbology, mode))) continue;
    const text = item.text ?? item.rawValue;
    if (typeof text === 'string' && text.length) return { text, valid: true, backend };
  }
  return null;
}
export function paddleData(items) {
  if (!Array.isArray(items)) return { text: '', confidence: 0 };
  const lines = items.filter(item => typeof item?.text === 'string' && item.text.trim().length);
  if (!lines.length) return { text: '', confidence: 0 };
  const confidence = Math.min(...lines.map(item => Number.isFinite(item.score) && item.score >= 0 && item.score <= 1 ? item.score * 100 : 0));
  return { text: lines.map(item => item.text.trim()).join('\n').normalize('NFC'), confidence };
}
