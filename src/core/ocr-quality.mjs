export const OCR_REGIONS = Object.freeze({
  document: Object.freeze({ x: .08, y: .08, w: .84, h: .84 }),
  digits: Object.freeze({ x: .10, y: .43, w: .80, h: .14 }),
});
export const OCR_MIN_CONFIDENCE = 75;
export function cropRect(width, height, profile) {
  if (!Number.isSafeInteger(width) || !Number.isSafeInteger(height) || width < 1 || height < 1) throw Error('Invalid image dimensions');
  const r = OCR_REGIONS[profile];
  if (!r) throw Error('Unknown OCR profile');
  const x = Math.floor(width * r.x), y = Math.floor(height * r.y);
  return { x, y, width: Math.max(1, Math.min(width, Math.ceil(width * (r.x + r.w))) - x), height: Math.max(1, Math.min(height, Math.ceil(height * (r.y + r.h))) - y) };
}
export function captureSize(width, height, profile) {
  if (![width, height].every(v => Number.isFinite(v) && v >= 1)) throw Error('Invalid image dimensions');
  const longest = Math.max(width, height);
  const scale = Math.min(2560 / longest, profile === 'digits' ? Math.max(1, Math.min(3, 1200 / longest)) : 1);
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}
export function assessOCR(data, profile) {
  const text = String(data.text ?? '').trim().normalize('NFC');
  const confidence = Number.isFinite(data.confidence) ? Math.max(0, Math.min(100, data.confidence)) : 0;
  const plausible = profile === 'digits' ? /^\d{1,12}(?:[.,]\d{1,3})?$/.test(text) : /[\p{L}\p{N}]/u.test(text);
  const valid = plausible && confidence >= OCR_MIN_CONFIDENCE;
  return { text, confidence, plausible, valid, warning: !plausible ? (profile === 'digits' ? 'Cần đọc một dãy số duy nhất. Hãy chụp lại.' : 'Không tìm thấy văn bản. Hãy chụp lại.') : !valid ? 'Độ tin cậy thấp. Hãy kiểm tra ảnh và chụp lại.' : undefined };
}
export function improveContrast(data) {
  const hist = new Uint32Array(256); let n = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (!data[i + 3]) continue;
    hist[(77 * data[i] + 150 * data[i + 1] + 29 * data[i + 2]) >> 8]++; n++;
  }
  if (!n) return false;
  let lo = 0, hi = 255, sum = 0;
  while (lo < 255 && (sum += hist[lo]) < n * .02) lo++;
  sum = 0;
  while (hi > 0 && (sum += hist[hi]) < n * .02) hi--;
  if (hi - lo < 20 || (lo < 8 && hi > 247)) return false;
  for (let i = 0; i < data.length; i += 4) {
    const gray = (77 * data[i] + 150 * data[i + 1] + 29 * data[i + 2]) >> 8;
    const v = Math.max(0, Math.min(255, Math.round((gray - lo) * 255 / (hi - lo))));
    data[i] = data[i + 1] = data[i + 2] = v;
  }
  return true;
}
// One original pass, one optional contrast pass. Never silently select a conflicting number.
export async function recognizeWithReview(profile, original, enhanced) {
  const a = assessOCR(await original(), profile);
  if (a.valid) return a;
  const next = await enhanced();
  if (!next) return a;
  const b = assessOCR(next, profile);
  if (profile === 'digits' && a.plausible && b.plausible && a.text !== b.text) {
    return { ...a, valid: false, warning: 'Hai lần đọc cho hai dãy số khác nhau. Hãy chụp lại.' };
  }
  return b.plausible && (!a.plausible || b.confidence > a.confidence) ? b : a;
}
export function characterErrorRate(expected, actual) {
  const normalize = s => Array.from(s.normalize('NFC').trim().replace(/\s+/gu, ' '));
  const a = normalize(expected), b = normalize(actual);
  let row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const next = [i];
    for (let j = 1; j <= b.length; j++) next[j] = Math.min(row[j] + 1, next[j - 1] + 1, row[j - 1] + Number(a[i - 1] !== b[j - 1]));
    row = next;
  }
  return row[b.length] / Math.max(1, a.length);
}
