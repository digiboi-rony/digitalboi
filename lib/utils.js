// ────────────────────────────────────────────────
// Digiboi — Utility Functions
// ────────────────────────────────────────────────

// Format currency in BDT
export function formatCurrency(amount, compact = false) {
  if (amount === null || amount === undefined) return '৳ ০';
  const num = Number(amount);
  if (compact) {
    if (num >= 10000000) return '৳ ' + (num / 10000000).toFixed(1) + ' কোটি';
    if (num >= 100000)   return '৳ ' + (num / 100000).toFixed(1) + ' লক্ষ';
    if (num >= 1000)     return '৳ ' + (num / 1000).toFixed(1) + 'K';
  }
  return '৳ ' + num.toLocaleString('bn-BD');
}

// Format date in Bangla
export function formatDate(dateStr, style = 'short') {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  const opts = style === 'full'
    ? { weekday:'long', year:'numeric', month:'long', day:'numeric' }
    : style === 'medium'
    ? { year:'numeric', month:'short', day:'numeric' }
    : { year:'numeric', month:'2-digit', day:'2-digit' };
  return date.toLocaleDateString('bn-BD', opts);
}

// Time ago in Bangla
export function timeAgo(dateStr) {
  if (!dateStr) return '—';
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60)    return 'এইমাত্র';
  if (diff < 3600)  return Math.floor(diff / 60) + ' মিনিট আগে';
  if (diff < 86400) return Math.floor(diff / 3600) + ' ঘন্টা আগে';
  if (diff < 604800)return Math.floor(diff / 86400) + ' দিন আগে';
  return formatDate(dateStr);
}

// Generate barcode / verification code
export function generateCode(prefix = 'DIGIBOI-VRF') {
  return `${prefix}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

// Validate phone number (BD)
export function validatePhone(phone) {
  return /^(\+880|880|0)?1[3-9]\d{8}$/.test(phone?.replace(/\s/g, ''));
}

// Format phone to +880 format
export function formatPhone(phone) {
  if (!phone) return '';
  const clean = phone.replace(/\D/g, '');
  if (clean.startsWith('880')) return '+' + clean;
  if (clean.startsWith('0'))   return '+880' + clean.slice(1);
  if (clean.length === 10)     return '+880' + clean;
  return phone;
}

// Debounce
export function debounce(fn, ms = 400) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

// Convert file to base64
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Compress image before upload (max 800px, 80% quality)
export async function compressImage(file, maxPx = 800) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ratio = Math.min(maxPx / img.width, maxPx / img.height, 1);
      canvas.width  = img.width  * ratio;
      canvas.height = img.height * ratio;
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.82));
    };
    img.src = url;
  });
}

// Pagination helper
export function paginate(items, page = 1, perPage = 20) {
  const start = (page - 1) * perPage;
  return {
    data: items.slice(start, start + perPage),
    total: items.length,
    pages: Math.ceil(items.length / perPage),
    page,
    perPage,
  };
}

// Payment status color
export const STATUS_STYLE = {
  paid:    { bg: '#E6F9F2', color: '#0BAA69', label: '✓ পরিশোধ' },
  due:     { bg: '#FDECEA', color: '#E63946', label: '⏳ বাকি' },
  partial: { bg: '#FFF3E0', color: '#F4A261', label: '~ আংশিক' },
  pending: { bg: '#EEF1FF', color: '#4361EE', label: '⏳ অপেক্ষমান' },
  active:  { bg: '#E6F9F2', color: '#0BAA69', label: '● সক্রিয়' },
  inactive:{ bg: '#F0F4F8', color: '#5E6E8A', label: '● বন্ধ' },
};

// Export to CSV
export function exportCSV(data, filename = 'export') {
  if (!data?.length) return;
  const headers = Object.keys(data[0]);
  const rows = data.map(row => headers.map(h => JSON.stringify(row[h] ?? '')).join(','));
  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = `${filename}.csv`; a.click();
  URL.revokeObjectURL(url);
}

// Generate invoice number
export function generateInvoiceNumber(prefix = 'INV') {
  const d = new Date();
  const ym = d.getFullYear().toString() + String(d.getMonth() + 1).padStart(2, '0');
  const rand = Math.floor(Math.random() * 9000 + 1000);
  return `${prefix}-${ym}-${rand}`;
}

// Number to Bangla words (for receipts)
const BN_ONES = ['', 'এক', 'দুই', 'তিন', 'চার', 'পাঁচ', 'ছয়', 'সাত', 'আট', 'নয়', 'দশ', 'এগারো', 'বারো', 'তেরো', 'চৌদ্দ', 'পনেরো', 'ষোল', 'সতেরো', 'আঠারো', 'উনিশ'];
const BN_TENS = ['', '', 'বিশ', 'ত্রিশ', 'চল্লিশ', 'পঞ্চাশ', 'ষাট', 'সত্তর', 'আশি', 'নব্বই'];

export function numberToBanglaWords(n) {
  n = Math.floor(n);
  if (n === 0) return 'শূন্য';
  if (n < 20)  return BN_ONES[n];
  if (n < 100) return BN_TENS[Math.floor(n/10)] + (n%10 ? ' ' + BN_ONES[n%10] : '');
  if (n < 1000)return BN_ONES[Math.floor(n/100)] + ' শত' + (n%100 ? ' ' + numberToBanglaWords(n%100) : '');
  if (n < 100000) return numberToBanglaWords(Math.floor(n/1000)) + ' হাজার' + (n%1000 ? ' ' + numberToBanglaWords(n%1000) : '');
  if (n < 10000000) return numberToBanglaWords(Math.floor(n/100000)) + ' লক্ষ' + (n%100000 ? ' ' + numberToBanglaWords(n%100000) : '');
  return numberToBanglaWords(Math.floor(n/10000000)) + ' কোটি' + (n%10000000 ? ' ' + numberToBanglaWords(n%10000000) : '');
}
