'use client';

// Thermal Receipt Printer (58mm / 80mm)
export function printReceipt(sale, shopInfo, items) {
  const shopName = shopInfo?.shop_name || 'Digiboi Shop';
  const shopAddress = shopInfo?.address || '';
  const shopPhone = shopInfo?.phone || '';
  const date = new Date().toLocaleString('bn-BD');

  const itemRows = items.map(i => `
    <tr>
      <td style="padding:3px 0;font-size:12px;">${i.name}</td>
      <td style="padding:3px 0;font-size:12px;text-align:center;">${i.qty}</td>
      <td style="padding:3px 0;font-size:12px;text-align:right;">৳${(i.unit_price*i.qty).toLocaleString()}</td>
    </tr>
  `).join('');

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Hind+Siliguri&display=swap');
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Hind Siliguri',Arial,sans-serif; width:80mm; padding:8px; font-size:13px; color:#000; }
  .center { text-align:center; }
  .bold { font-weight:bold; }
  .divider { border-top:1px dashed #000; margin:6px 0; }
  table { width:100%; }
  th { font-size:11px; border-bottom:1px solid #000; padding-bottom:4px; }
  .total-row td { font-size:14px; font-weight:bold; border-top:1px solid #000; padding-top:4px; }
  .footer { margin-top:10px; font-size:11px; text-align:center; }
  @media print { body { width:80mm; } }
</style>
</head>
<body>
<div class="center bold" style="font-size:18px;margin-bottom:2px;">${shopName}</div>
<div class="center" style="font-size:11px;color:#444;">${shopAddress}</div>
${shopPhone?`<div class="center" style="font-size:11px;">📱 ${shopPhone}</div>`:''}
<div class="divider"></div>
<div style="display:flex;justify-content:space-between;font-size:11px;">
  <span>ইনভয়েস: ${sale?.invoice_number||'—'}</span>
  <span>${date}</span>
</div>
${sale?.customer_name?`<div style="font-size:11px;">গ্রাহক: ${sale.customer_name}</div>`:''}
<div class="divider"></div>
<table>
  <thead><tr>
    <th style="text-align:left;">পণ্য</th>
    <th style="text-align:center;">পরিমাণ</th>
    <th style="text-align:right;">মূল্য</th>
  </tr></thead>
  <tbody>${itemRows}</tbody>
  <tfoot>
    <tr><td colspan="3" style="padding-top:4px;"></td></tr>
    <tr>
      <td colspan="2" style="font-size:12px;">উপমোট:</td>
      <td style="text-align:right;font-size:12px;">৳ ${sale?.subtotal?.toLocaleString()||0}</td>
    </tr>
    ${sale?.discount>0?`<tr><td colspan="2" style="font-size:12px;">ছাড়:</td><td style="text-align:right;font-size:12px;">−৳ ${sale.discount.toLocaleString()}</td></tr>`:''}
    <tr class="total-row">
      <td colspan="2">সর্বমোট:</td>
      <td style="text-align:right;">৳ ${sale?.total?.toLocaleString()||0}</td>
    </tr>
    <tr>
      <td colspan="2" style="font-size:12px;">পরিশোধ (${sale?.payment_method||'নগদ'}):</td>
      <td style="text-align:right;font-size:12px;">৳ ${sale?.paid_amount?.toLocaleString()||0}</td>
    </tr>
    ${(sale?.due_amount||0)>0?`<tr><td colspan="2" style="font-size:12px;color:red;">বাকি:</td><td style="text-align:right;font-size:12px;color:red;">৳ ${sale.due_amount.toLocaleString()}</td></tr>`:''}
  </tfoot>
</table>
<div class="divider"></div>
<div class="footer">
  <p>ধন্যবাদ! আবার আসবেন 🙏</p>
  <p style="margin-top:4px;font-size:10px;color:#888;">Powered by Digiboi</p>
</div>
</body></html>`;

  const w = window.open('', '_blank', 'width=400,height=600');
  w.document.write(html);
  w.document.close();
  setTimeout(() => { w.focus(); w.print(); }, 500);
}

// A4 Invoice
export function printInvoice(sale, shopInfo, items) {
  const shopName = shopInfo?.shop_name || 'Digiboi Shop';
  const date = new Date().toLocaleDateString('bn-BD');

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Hind+Siliguri&display=swap');
  body { font-family:'Hind Siliguri',Arial; padding:40px; color:#141D28; }
  .header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:30px; border-bottom:3px solid #0F4C81; padding-bottom:20px; }
  .logo { font-size:32px; font-weight:800; color:#0F4C81; }
  h2 { color:#0F4C81; margin:0 0 6px; }
  table { width:100%; border-collapse:collapse; margin:20px 0; }
  th { background:#0F4C81; color:white; padding:10px 12px; text-align:left; }
  td { padding:9px 12px; border-bottom:1px solid #DDE4EE; }
  tr:nth-child(even) td { background:#F8FAFC; }
  .total-box { background:#0F4C81; color:white; padding:15px 20px; border-radius:10px; text-align:right; margin-top:16px; }
  .footer { margin-top:40px; text-align:center; font-size:12px; color:#888; border-top:1px solid #DDE4EE; padding-top:16px; }
</style>
</head>
<body>
<div class="header">
  <div>
    <div class="logo">Digiboi</div>
    <p style="margin:4px 0 0;color:#5E6E8A;">${shopName}</p>
    <p style="margin:2px 0;font-size:13px;color:#8A9AB5;">${shopInfo?.address||''}</p>
  </div>
  <div style="text-align:right;">
    <h2>ইনভয়েস</h2>
    <p style="margin:0;font-size:14px;">${sale?.invoice_number||'INV-001'}</p>
    <p style="margin:4px 0 0;font-size:13px;color:#5E6E8A;">তারিখ: ${date}</p>
    ${sale?.customer_name?`<p style="margin:4px 0 0;font-size:13px;">গ্রাহক: ${sale.customer_name}</p>`:''}
  </div>
</div>
<table>
  <thead><tr><th>পণ্যের নাম</th><th>পরিমাণ</th><th>একক মূল্য</th><th>মোট</th></tr></thead>
  <tbody>
    ${items.map(i=>`<tr><td>${i.name}</td><td>${i.qty}</td><td>৳ ${i.unit_price.toLocaleString()}</td><td>৳ ${(i.unit_price*i.qty).toLocaleString()}</td></tr>`).join('')}
  </tbody>
</table>
<div class="total-box">
  ${sale?.discount>0?`<p style="margin:0 0 6px;font-size:14px;">ছাড়: −৳ ${sale.discount.toLocaleString()}</p>`:''}
  <p style="margin:0;font-size:22px;font-weight:800;">সর্বমোট: ৳ ${sale?.total?.toLocaleString()||0}</p>
  <p style="margin:6px 0 0;font-size:13px;opacity:0.8;">পেমেন্ট: ${sale?.payment_method||'নগদ'}</p>
</div>
<div class="footer">
  <p>ধন্যবাদ আপনার ক্রয়ের জন্য! | Powered by Digiboi © 2025</p>
</div>
</body></html>`;

  const w = window.open('', '_blank');
  w.document.write(html);
  w.document.close();
  setTimeout(() => { w.focus(); w.print(); }, 500);
}
