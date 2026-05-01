import { formatCorporateQuotationNo, inferQuotationPrefix } from './corporateQuotationNo';

const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const formatNumber = (value, digits = 2) =>
  Number(value || 0).toLocaleString('en-IN', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });

const getTerms = (quotation) => {
  const terms = quotation?.inputs?.terms;
  if (Array.isArray(terms)) {
    return terms.map((item) => String(item || '').trim()).filter(Boolean);
  }
  return [];
};

const addressToHtml = (value) => {
  const address = String(value || '').trim();
  if (!address) return '';
  if (/\r?\n/.test(address)) {
    return escapeHtml(address).replace(/\r?\n/g, '<br />');
  }

  const parts = address
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length > 1) {
    return parts.map((part) => escapeHtml(part)).join(',<br />');
  }

  return escapeHtml(address).replace(/(.{38,55})\s+/g, '$1<br />');
};

export function openQuotationPdfPreview(quotation) {
  const popup = window.open('', '_blank');
  if (!popup) {
    window.alert('Please allow popups to preview the PDF.');
    return;
  }

  const prefix = inferQuotationPrefix(quotation);
  const isBhavesh = prefix === 'BDC';
  const isPrintHouse = prefix === 'PH';
  const isNexPrint = prefix === 'NP';
  const brandTitle = isBhavesh ? 'BHAVESH DIGITAL CENTER' : isPrintHouse ? 'PRINT HOUSE' : isNexPrint ? 'NEX PRINT' : 'RADHE PRINT';
  const brandSubtitle = isBhavesh || isPrintHouse || isNexPrint ? 'PRINTING & DIGITAL SERVICES' : 'SOLUTIONS PVT. LTD.';
  const brandLogo = isBhavesh
    ? '/logos/bhavesh-digital.png'
    : isPrintHouse
      ? '/logos/print-house.png'
      : '/logos/radhe-print.png';
  const brandAccent = isBhavesh ? '#1d4ed8' : isNexPrint ? '#0f766e' : '#be185d';
  const dividerColor = isBhavesh ? '#93c5fd' : isNexPrint ? '#5eead4' : '#c783a2';
  const footerLine1 = isBhavesh
    ? 'B5/38, Shree Om Co.ho, Soc., Nehru Road, Old Ananad Nagar, Santacruz East, Mumbai - 400 055.'
    : isPrintHouse
      ? 'PRINT HOUSE'
      : isNexPrint
        ? 'NEX PRINT'
      : 'Radhe Print Solutions Pvt. Ltd. . Opp. Keytuo Industrial Estate . Ram Krishna Mandir Road . Kondivita lane, MIDC . Andheri (E), Mumbai - 400059';
  const footerLine2 = isBhavesh
    ? 'Office:- 8591084334 / 7977600328'
    : isPrintHouse
      ? 'Printing & Digital Services'
      : isNexPrint
        ? 'Printing & Digital Services'
      : 'Mob.: 9324302843    To know more visit: www.radheprint.in';

  const quotationNo = formatCorporateQuotationNo(
    quotation?.inputs?.corporateQuotationNo || quotation?.id,
    prefix
  );
  const customerName = quotation?.inputs?.customerName || '-';
  const customerAddress = quotation?.inputs?.customerAddress || quotation?.inputs?.address || '';
  const kindAttention = quotation?.inputs?.kindAttention || '-';
  const createdOn = quotation?.createdAt
    ? new Date(quotation.createdAt).toLocaleDateString('en-IN')
    : '-';
  const rows = Array.isArray(quotation?.rows) ? quotation.rows : [];
  const terms = getTerms(quotation);
  const totalAmount = Number(quotation?.totalAmount || 0);

  const rowHtml = rows
    .map((row, index) => {
      const qty = Number(row?.qty || 0);
      const rate = Number(row?.rate || 0);
      const gst = Number(row?.gst || 0);
      const amount = Number(row?.amt || qty * rate * (1 + gst / 100));
      return `
        <tr>
          <td>${index + 1}</td>
          <td>${escapeHtml(row?.product || '')}</td>
          <td>${escapeHtml(row?.description || '')}</td>
          <td class="num">${formatNumber(qty, 0)}</td>
          <td>${escapeHtml(row?.unit || '')}</td>
          <td class="num">${formatNumber(rate, 2)}</td>
          <td class="num">${formatNumber(gst, 2)}</td>
          <td class="num">${formatNumber(amount, 2)}</td>
        </tr>
      `;
    })
    .join('');

  const termsHtml = terms.length
    ? terms.map((item) => `<li>${escapeHtml(item)}</li>`).join('')
    : '<li>No terms specified.</li>';

  if (isBhavesh) {
    const bhaveshRowHtml = rows
      .map((row, index) => {
        const qty = Number(row?.qty || 0);
        const rate = Number(row?.rate || 0);
        const gst = Number(row?.gst || 0);
        const amount = Number(row?.amt || qty * rate * (1 + gst / 100));
        const itemName = [row?.product, row?.description].filter(Boolean).join(' - ');
        return `
          <tr>
            <td class="num">${formatNumber(qty, 0)}</td>
            <td>${escapeHtml(itemName || '-')}</td>
            <td class="num">${formatNumber(rate, 2)}</td>
            <td class="num">${formatNumber(gst, 2)}%</td>
            <td class="num">${formatNumber(amount, 2)}</td>
          </tr>
        `;
      })
      .join('');

    const bhaveshHtml = `
      <!doctype html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <title>Quotation ${escapeHtml(quotationNo)}</title>
          <style>
            * { box-sizing: border-box; }
            body {
              margin: 0;
              background: #eef0f3;
              color: #111827;
              font-family: Arial, Helvetica, sans-serif;
            }
            .toolbar {
              position: sticky;
              top: 0;
              background: #111827;
              color: #fff;
              padding: 10px 14px;
              display: flex;
              justify-content: space-between;
              align-items: center;
              z-index: 10;
            }
            .toolbar button {
              border: 0;
              background: #0f4ea8;
              color: #fff;
              padding: 8px 12px;
              border-radius: 6px;
              cursor: pointer;
              font-weight: 700;
            }
            .page {
              width: 210mm;
              min-height: 297mm;
              margin: 14px auto 18px;
              background: #fff;
              box-shadow: 0 4px 18px rgba(0,0,0,0.1);
              position: relative;
              overflow: hidden;
              padding: 7mm;
              border: 3px solid #111827;
            }
            .letter-head {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 8mm;
              align-items: start;
              margin-bottom: 6mm;
            }
            .logo {
              max-width: 96mm;
              max-height: 22mm;
              object-fit: contain;
              display: block;
            }
            .office {
              color: #111827;
              font-size: 12px;
              line-height: 1.35;
              text-align: right;
            }
            .office strong {
              color: #111827;
            }
            .quotation-no {
              font-size: 16px;
              font-weight: 900;
            }
            .quote-title {
              color: #111827;
              font-size: 34px;
              font-style: italic;
              font-weight: 900;
              text-align: right;
              margin: 0 0 2mm;
              line-height: 1;
            }
            .meta {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 8mm;
              font-size: 14px;
              margin-bottom: 7mm;
            }
            .meta div {
              margin: 2px 0;
            }
            .meta strong {
              color: #111827;
            }
            .customer-block {
              margin-top: 7mm;
            }
            .customer-block h3 {
              font-size: 16px;
              margin: 0 0 2mm;
            }
            .validity {
              text-align: right;
              font-style: italic;
              font-weight: 700;
              margin-top: 6mm;
            }
            .instructions {
              margin: 5mm 0 3mm;
              font-size: 14px;
            }
            .blue-row {
              display: grid;
              grid-template-columns: repeat(6, 1fr);
              border: 2px solid #111827;
              border-bottom: 0;
              margin-top: 5mm;
              font-size: 12px;
            }
            .blue-row .head-cell {
              background: #0f4ea8;
              color: #fff;
              padding: 5px 6px;
              border-right: 1px solid #111827;
              font-weight: 800;
              text-align: center;
            }
            .blue-row .head-cell:last-child,
            .blue-row .body-cell:last-child {
              border-right: 0;
            }
            .blue-row .body-cell {
              min-height: 20px;
              padding: 5px 6px;
              border-right: 1px solid #111827;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 12px;
              table-layout: fixed;
            }
            th, td {
              border: 2px solid #111827;
              padding: 8px 6px;
              vertical-align: top;
            }
            th {
              background: #0f4ea8;
              color: #fff;
              text-align: center;
              font-weight: 800;
            }
            tbody td {
              min-height: 34mm;
            }
            .num {
              text-align: right;
              white-space: nowrap;
            }
            .totals {
              width: 58mm;
              margin-left: auto;
              border-left: 2px solid #111827;
              border-right: 2px solid #111827;
              font-size: 13px;
            }
            .total-row {
              display: grid;
              grid-template-columns: 1fr 24mm;
              border-bottom: 2px solid #111827;
            }
            .total-row span,
            .total-row strong {
              padding: 5px 7px;
            }
            .total-row strong {
              border-left: 2px solid #111827;
              text-align: right;
            }
            .total-row.grand {
              font-weight: 900;
            }
            .terms {
              margin-top: 8mm;
              font-size: 13px;
            }
            .terms h3 {
              margin: 0 0 8px;
              color: #111827;
              font-size: 14px;
            }
            .terms ul {
              margin: 0;
              padding-left: 18px;
              line-height: 1.55;
            }
            .contact-note {
              position: absolute;
              left: 7mm;
              right: 7mm;
              bottom: 15mm;
              text-align: center;
              font-size: 12px;
              color: #111827;
            }
            .thanks {
              position: absolute;
              left: 7mm;
              right: 7mm;
              bottom: 6mm;
              text-align: center;
              font-size: 13px;
              font-weight: 900;
            }
            .content {
              padding-bottom: 28mm;
            }
            @media print {
              body { background: #fff; }
              .toolbar { display: none; }
              .page {
                width: auto;
                min-height: 297mm;
                margin: 0;
                box-shadow: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="toolbar">
            <div>Preview: ${escapeHtml(quotationNo)}</div>
            <button onclick="window.print()">Print / Save PDF</button>
          </div>
          <div class="page">
            <div class="letter-head">
              <div>
                <img class="logo" src="/logos/bhavesh-digital.png" alt="Bhavesh Digital Centre logo" />
                <div class="office" style="text-align: left;">
                  <div>B-5/38, Shree Om Co.op Hsg. Soc.</div>
                  <div>Nehru Road, Anand Nagar, Santacruz (E), Mumbai-400 055.</div>
                  <div>Office : 7977600328 / 81044 23892</div>
                  <div>E Mail : bhaveshdigitalcenter@gmail.com</div>
                  <div><strong>GST No. : 27AJBPG2716P1Z3</strong></div>
                </div>
              </div>
              <div>
                <h1 class="quote-title">Quotation</h1>
                <div class="office">
                  <div><strong>DATE</strong> ${escapeHtml(createdOn)}</div>
                  <div class="quotation-no"><strong>Quotation #</strong> ${escapeHtml(quotationNo)}</div>
                </div>
                <div class="validity">
                  <div>Quotation valid until: 10 days</div>
                </div>
              </div>
            </div>
            <div class="content">
              <div class="meta">
                <div class="customer-block">
                  <h3>Quotation For:</h3>
                  <div><strong>${escapeHtml(customerName)}</strong></div>
                  ${customerAddress ? `<div>${addressToHtml(customerAddress)}</div>` : ''}
                  <div>Kind Atten: ${escapeHtml(kindAttention)}</div>
                </div>
              </div>
              <div class="instructions">Thank you for your inquiry. We are pleased to quote you the following.</div>
              <table>
                <thead>
                  <tr>
                    <th style="width: 16%">QUANTITY</th>
                    <th>DESCRIPTION</th>
                    <th style="width: 16%">UNIT PRICE</th>
                    <th style="width: 16%">TAXES</th>
                    <th style="width: 16%">AMOUNT</th>
                  </tr>
                </thead>
                <tbody>${bhaveshRowHtml}</tbody>
              </table>
              <div class="totals">
                <div class="total-row"><span>SUBTOTAL</span><strong>INR ${formatNumber(totalAmount, 2)}</strong></div>
                <div class="total-row grand"><span>TOTAL</span><strong>INR ${formatNumber(totalAmount, 2)}</strong></div>
              </div>
              <div class="terms">
                <h3>Terms :</h3>
                <ul>${termsHtml}</ul>
              </div>
            </div>
            <div class="contact-note">If you have any questions concerning this quotation, please contact Bhavesh Digital Centre at 7977600328 / 81044 23892 or bhaveshdigitalcenter@gmail.com.</div>
            <div class="thanks">THANK YOU FOR YOUR BUSINESS!</div>
          </div>
        </body>
      </html>
    `;
    popup.document.open();
    popup.document.write(bhaveshHtml);
    popup.document.close();
    popup.focus();
    return;
  }

  if (isPrintHouse) {
    const printHouseRowHtml = rows
      .map((row, index) => {
        const qty = Number(row?.qty || 0);
        const rate = Number(row?.rate || 0);
        const gst = Number(row?.gst || 0);
        const amount = Number(row?.amt || qty * rate * (1 + gst / 100));
        const itemName = [row?.product, row?.description].filter(Boolean).join(' - ');
        return `
          <tr>
            <td class="num">${formatNumber(qty, 0)}</td>
            <td>${escapeHtml(itemName || '-')}</td>
            <td class="num">${formatNumber(rate, 2)}</td>
            <td class="num">${formatNumber(gst, 2)}</td>
            <td class="num">${formatNumber(amount, 2)}</td>
          </tr>
        `;
      })
      .join('');

    const printHouseHtml = `
      <!doctype html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <title>Quotation ${escapeHtml(quotationNo)}</title>
          <style>
            * { box-sizing: border-box; }
            body {
              margin: 0;
              background: #eef0f3;
              color: #111827;
              font-family: Arial, Helvetica, sans-serif;
            }
            .toolbar {
              position: sticky;
              top: 0;
              background: #111827;
              color: #fff;
              padding: 10px 14px;
              display: flex;
              justify-content: space-between;
              align-items: center;
              z-index: 10;
            }
            .toolbar button {
              border: 0;
              background: #111827;
              color: #fff;
              padding: 8px 12px;
              border-radius: 6px;
              cursor: pointer;
              font-weight: 700;
            }
            .page {
              width: 210mm;
              min-height: 297mm;
              margin: 14px auto 18px;
              background: #fff;
              box-shadow: 0 4px 18px rgba(0,0,0,0.1);
              position: relative;
              overflow: hidden;
              padding: 10mm 10mm 12mm;
              border: 2px solid #111827;
            }
            .header {
              display: grid;
              grid-template-columns: 1fr auto;
              align-items: start;
              gap: 10mm;
              margin-bottom: 8mm;
            }
            .logo {
              max-width: 72mm;
              max-height: 26mm;
              object-fit: contain;
              display: block;
            }
            .contact {
              margin-top: 2mm;
              font-size: 12px;
              line-height: 1.55;
            }
            .title {
              margin: 0;
              text-align: right;
              color: #111827;
              font-size: 46px;
              font-weight: 400;
              letter-spacing: 1px;
              text-transform: uppercase;
            }
            .quote-box {
              margin-top: 3mm;
              margin-left: auto;
              width: 58mm;
              border: 1px solid #111827;
              border-collapse: collapse;
              font-size: 12px;
            }
            .quote-box div {
              display: grid;
              grid-template-columns: 1fr 1fr;
            }
            .quote-box span,
            .quote-box strong {
              border: 1px solid #111827;
              padding: 5px 8px;
              text-align: center;
            }
            .meta {
              display: block;
              margin-bottom: 5mm;
              font-size: 14px;
            }
            .detail-row {
              display: grid;
              grid-template-columns: 32mm 1fr;
              gap: 5mm;
              align-items: end;
              margin: 3mm 0;
            }
            .label {
              font-weight: 800;
            }
            .line {
              border-bottom: 1px solid #111827;
              min-height: 18px;
            }
            .project-box {
              border: 1px solid #111827;
              min-height: 22mm;
              padding: 8px 10px;
              margin: 6mm 0;
              font-size: 14px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 12px;
              table-layout: fixed;
            }
            th, td {
              border: 1px solid #111827;
              padding: 8px 6px;
              vertical-align: top;
            }
            th {
              background: #f3f4f6;
              color: #111827;
              text-align: center;
              font-weight: 800;
            }
            tbody td {
              min-height: 62mm;
            }
            .num {
              text-align: right;
              white-space: nowrap;
            }
            .lower {
              display: grid;
              grid-template-columns: 1fr 38mm;
              gap: 0;
            }
            .conditions {
              border-left: 1px solid #111827;
              border-bottom: 1px solid #111827;
              padding: 8px 8px;
              font-size: 12px;
              line-height: 1.5;
            }
            .conditions strong {
              display: block;
              margin-bottom: 4px;
            }
            .totals {
              border-right: 1px solid #111827;
              border-bottom: 1px solid #111827;
              font-size: 13px;
            }
            .total-row {
              display: grid;
              grid-template-columns: 1fr 22mm;
              border-bottom: 1px solid #111827;
            }
            .total-row:last-child {
              border-bottom: 0;
            }
            .total-row span,
            .total-row strong {
              padding: 6px 8px;
            }
            .total-row strong {
              border-left: 1px solid #111827;
              text-align: right;
            }
            .total-row.grand {
              font-weight: 900;
            }
            .contact-note {
              margin-top: 8mm;
              font-size: 12px;
              text-align: center;
            }
            .footer-info {
              position: absolute;
              left: 10mm;
              right: 10mm;
              bottom: 6mm;
              text-align: center;
              font-size: 12px;
              line-height: 1.45;
              color: #111827;
              font-weight: 900;
            }
            .content {
              padding-bottom: 22mm;
            }
            @media print {
              body { background: #fff; }
              .toolbar { display: none; }
              .page {
                width: auto;
                min-height: 297mm;
                margin: 0;
                box-shadow: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="toolbar">
            <div>Preview: ${escapeHtml(quotationNo)}</div>
            <button onclick="window.print()">Print / Save PDF</button>
          </div>
          <div class="page">
            <div class="header">
              <div>
                <img class="logo" src="/logos/print-house.png" alt="Print House logo" />
                <div class="contact">
                  <div>Ishvar +91 9967902989</div>
                  <div>iprinthouse1@gmail.com</div>
                  <div>GSTIN:- 27ATKPG0524C1Z7</div>
                </div>
              </div>
              <div>
                <h1 class="title">Quotation</h1>
                <div class="quote-box">
                  <div><span>DATE</span><span>QUOTE #</span></div>
                  <div><strong>${escapeHtml(createdOn)}</strong><strong>${escapeHtml(quotationNo)}</strong></div>
                </div>
              </div>
            </div>
            <div class="content">
              <div class="meta">
                <div class="detail-row">
                  <div class="label">Company Name:</div>
                  <div class="line">${escapeHtml(customerName)}</div>
                </div>
                <div class="detail-row">
                  <div class="label">Address:</div>
                  <div class="line">${customerAddress ? addressToHtml(customerAddress) : ''}</div>
                </div>
              </div>
              <div class="project-box">
                Thank you for your inquiry. We are pleased to quote you the following.
              </div>
              <table>
                <thead>
                  <tr>
                    <th style="width: 12%">QTY</th>
                    <th>DESCRIPTION</th>
                    <th style="width: 18%">UNIT PRICE</th>
                    <th style="width: 14%">TAXES</th>
                    <th style="width: 18%">EXT. PRICE</th>
                  </tr>
                </thead>
                <tbody>${printHouseRowHtml}</tbody>
              </table>
              <div class="lower">
                <div class="conditions">
                  <strong>This quote is subject to the following terms and conditions:</strong>
                  ${terms.length ? `<ul>${termsHtml}</ul>` : 'Payment is due upon receipt of final approved quotation.'}
                </div>
                <div class="totals">
                  <div class="total-row"><span>SUB TOTAL</span><strong>${formatNumber(totalAmount, 2)}</strong></div>
                  <div class="total-row"><span>TAX</span><strong>Included</strong></div>
                  <div class="total-row grand"><span>TOTAL</span><strong>${formatNumber(totalAmount, 2)}</strong></div>
                </div>
              </div>
              <div class="contact-note">If you have any questions concerning this quotation, please contact Ishvar at 9967902989 or iprinthouse1@gmail.com.</div>
            </div>
            <div class="footer-info">
              THANK YOU FOR YOUR BUSINESS!
            </div>
          </div>
        </body>
      </html>
    `;
    popup.document.open();
    popup.document.write(printHouseHtml);
    popup.document.close();
    popup.focus();
    return;
  }

  if (isNexPrint) {
    const subTotal = rows.reduce((sum, row) => {
      const qty = Number(row?.qty || 0);
      const rate = Number(row?.rate || 0);
      return sum + (qty * rate);
    }, 0);
    const gstAmount = Math.max(totalAmount - subTotal, 0);
    const nexRowHtml = rows
      .map((row, index) => {
        const qty = Number(row?.qty || 0);
        const rate = Number(row?.rate || 0);
        const gst = Number(row?.gst || 0);
        const amount = Number(row?.amt || qty * rate * (1 + gst / 100));
        const itemName = [row?.product, row?.description].filter(Boolean).join(' - ');
        return `
          <tr>
            <td>${index + 1}.</td>
            <td>${escapeHtml(itemName || '-')}</td>
            <td class="num">${formatNumber(qty, 0)}</td>
            <td class="num">INR ${formatNumber(rate, 2)}</td>
            <td class="num">INR ${formatNumber(amount, 2)}</td>
          </tr>
        `;
      })
      .join('');

    const nexHtml = `
      <!doctype html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <title>Quotation ${escapeHtml(quotationNo)}</title>
          <style>
            * { box-sizing: border-box; }
            body {
              margin: 0;
              background: #f3f4f6;
              color: #273449;
              font-family: Arial, Helvetica, sans-serif;
            }
            .toolbar {
              position: sticky;
              top: 0;
              background: #172033;
              color: #fff;
              padding: 10px 14px;
              display: flex;
              justify-content: space-between;
              align-items: center;
              z-index: 10;
            }
            .toolbar button {
              border: 0;
              background: #ff7a00;
              color: #fff;
              padding: 8px 12px;
              border-radius: 6px;
              cursor: pointer;
              font-weight: 700;
            }
            .page {
              width: 210mm;
              min-height: 297mm;
              margin: 14px auto 18px;
              background: #fff;
              padding: 9mm 10mm 12mm;
              box-shadow: 0 5px 22px rgba(15, 23, 42, 0.14);
              position: relative;
            }
            .title {
              margin: 0 0 12px;
              color: #ff7a00;
              text-align: center;
              font-size: 28px;
              font-weight: 800;
            }
            .top {
              display: grid;
              grid-template-columns: 1fr auto;
              gap: 18px;
              align-items: start;
              margin-bottom: 18px;
            }
            .brand-mark {
              display: flex;
              align-items: center;
              gap: 10px;
              color: #111827;
              font-size: 26px;
              font-weight: 800;
              letter-spacing: -0.5px;
            }
            .logo-box {
              width: 48px;
              height: 48px;
              border-radius: 8px;
              background: #111827;
              color: #fff;
              display: grid;
              place-items: center;
              font-size: 24px;
              font-weight: 900;
              border-left: 6px solid #ff7a00;
            }
            .brand-mark span {
              display: block;
              line-height: 0.95;
            }
            .meta-right {
              min-width: 165px;
              font-size: 12px;
              color: #64748b;
            }
            .meta-row {
              display: grid;
              grid-template-columns: 1fr auto;
              gap: 14px;
              margin: 8px 0;
            }
            .meta-row strong {
              color: #111827;
            }
            .cards {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 10mm;
              margin-bottom: 10px;
            }
            .card {
              background: #fff0df;
              border-radius: 5px;
              padding: 14px 16px;
              min-height: 36mm;
              font-size: 12px;
              line-height: 1.55;
            }
            .card h3 {
              margin: 0 0 6px;
              color: #ff7a00;
              font-size: 15px;
            }
            .card strong {
              color: #111827;
            }
            .supply {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 10mm;
              margin: 8px 0 16px;
              color: #64748b;
              font-size: 11px;
              text-align: center;
            }
            .supply strong {
              color: #111827;
              margin-left: 12px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 12px;
              margin-top: 6px;
              overflow: hidden;
              border-radius: 5px;
            }
            th {
              background: #ff7a00;
              color: #fff;
              text-align: left;
              padding: 11px 10px;
              font-weight: 700;
            }
            td {
              padding: 11px 10px;
              border-bottom: 1px solid #f2dfca;
              vertical-align: top;
            }
            tbody tr:nth-child(even) td {
              background: #fff4e8;
            }
            .num {
              text-align: right;
              white-space: nowrap;
            }
            .bottom {
              display: grid;
              grid-template-columns: 1.2fr 0.85fr;
              gap: 16mm;
              margin-top: 18px;
            }
            .section h3 {
              margin: 0 0 8px;
              color: #ff7a00;
              font-size: 15px;
            }
            .section {
              font-size: 12px;
              color: #475569;
              line-height: 1.55;
            }
            .section ol {
              margin: 0;
              padding-left: 16px;
            }
            .notes {
              margin-top: 22px;
            }
            .totals {
              font-size: 15px;
            }
            .total-row {
              display: grid;
              grid-template-columns: 1fr auto;
              gap: 12px;
              padding: 9px 0;
              border-bottom: 1px solid #dbe2ea;
            }
            .total-row.gst {
              color: #16a34a;
              font-weight: 700;
            }
            .grand {
              font-size: 24px;
              font-weight: 800;
              color: #0f172a;
            }
            .words {
              color: #64748b;
              font-size: 12px;
              margin-top: 8px;
              line-height: 1.35;
            }
            .contact {
              position: absolute;
              left: 10mm;
              bottom: 10mm;
              font-size: 11px;
              color: #111827;
              line-height: 1.45;
            }
            @media print {
              body { background: #fff; }
              .toolbar { display: none; }
              .page {
                width: auto;
                min-height: 297mm;
                margin: 0;
                box-shadow: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="toolbar">
            <div>Preview: ${escapeHtml(quotationNo)}</div>
            <button onclick="window.print()">Print / Save PDF</button>
          </div>
          <div class="page">
            <h1 class="title">Quotation</h1>
            <div class="top">
              <div class="brand-mark">
                <div class="logo-box">N</div>
                <div>
                  <span>NEX</span>
                  <span>PRINT</span>
                </div>
              </div>
              <div class="meta-right">
                <div class="meta-row"><span>Quotation#</span><strong>${escapeHtml(quotationNo)}</strong></div>
                <div class="meta-row"><span>Quotation Date</span><strong>${escapeHtml(createdOn)}</strong></div>
              </div>
            </div>
            <div class="cards">
              <div class="card">
                <h3>Quotation by</h3>
                <strong>Nex Print</strong><br />
                Printing & Digital Services<br />
                Floor No.2nd Floor, Building No.Flat No.Room No.217.<br />
                Plot No.74.T.P.S.1 L.N. Garodiya Ramas Khotwadi<br />
                Phiroz Shah Mehta Road, Santacruz(W) Mum -400054.<br />
                <strong>GSTIN</strong> 27EZIPG3752C1ZH
              </div>
              <div class="card">
                <h3>Quotation to</h3>
                <strong>${escapeHtml(customerName)}</strong><br />
                ${customerAddress ? `${addressToHtml(customerAddress)}<br />` : ''}
                Kind Atten: ${escapeHtml(kindAttention)}
              </div>
            </div>
            <div class="supply">
              <div>Place of Supply <strong>Maharashtra</strong></div>
              <div>Country of Supply <strong>India</strong></div>
            </div>
            <table>
              <thead>
                <tr>
                  <th style="width: 8%">Item #</th>
                  <th>Item description</th>
                  <th style="width: 11%" class="num">Qty.</th>
                  <th style="width: 16%" class="num">Rate</th>
                  <th style="width: 18%" class="num">Amount</th>
                </tr>
              </thead>
              <tbody>${nexRowHtml}</tbody>
            </table>
            <div class="bottom">
              <div>
                <div class="section">
                  <h3>Terms and Conditions</h3>
                  <ol>${termsHtml}</ol>
                </div>
                <div class="section notes">
                  <h3>Additional Notes</h3>
                  <p>Thank you for your inquiry. We are pleased to quote you the above rates. Please contact us for any clarification before approval.</p>
                </div>
              </div>
              <div class="totals">
                <div class="total-row"><span>Sub Total</span><strong>INR ${formatNumber(subTotal, 2)}</strong></div>
                <div class="total-row gst"><span>GST</span><strong>INR ${formatNumber(gstAmount, 2)}</strong></div>
                <div class="total-row grand"><span>Total</span><strong>INR ${formatNumber(totalAmount, 2)}</strong></div>
                <div class="words"><strong>Invoice Total</strong><br />Amount payable as per final approved quotation.</div>
              </div>
            </div>
            <div class="contact">
              For any enquiries, email us on <strong>nexprint66@gmail.com</strong><br />
              or call us on <strong>9324826805</strong>
            </div>
          </div>
        </body>
      </html>
    `;
    popup.document.open();
    popup.document.write(nexHtml);
    popup.document.close();
    popup.focus();
    return;
  }

  const html = `
    <!doctype html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <title>Quotation ${escapeHtml(quotationNo)}</title>
        <style>
          * { box-sizing: border-box; }
          body {
            margin: 0;
            background: #eef0f3;
            font-family: Arial, Helvetica, sans-serif;
            color: #1f2937;
          }
          .toolbar {
            position: sticky;
            top: 0;
            background: #111827;
            color: #fff;
            padding: 10px 14px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            z-index: 10;
          }
          .toolbar button {
            border: 0;
            background: ${brandAccent};
            color: #fff;
            padding: 8px 12px;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 600;
          }
          .page {
            width: 210mm;
            min-height: 297mm;
            margin: 14px auto 18px;
            background: #fff;
            padding: 10mm 14mm 14mm;
            border: 1px solid #d9c6d1;
            box-shadow: 0 4px 18px rgba(0,0,0,0.1);
            position: relative;
          }
          .page::before {
            content: "";
            position: absolute;
            left: 14mm;
            top: 10mm;
            height: 47mm;
            border-left: 3px solid ${dividerColor};
          }
          .head {
            display: grid;
            grid-template-columns: 320px 1fr;
            align-items: end;
            margin-bottom: 4px;
            padding-left: 8mm;
          }
          .brand {
            display: flex;
            align-items: flex-end;
            justify-content: flex-start;
            min-height: 81px;
          }
          .brand-logo {
            max-width: 315px;
            max-height: 94px;
            object-fit: contain;
            display: block;
          }
          .title {
            text-align: right;
            font-size: 42px;
            font-weight: 700;
            color: #111827;
            line-height: 1;
            padding-bottom: 7px;
          }
          .divider {
            border-top: 2px solid ${dividerColor};
            margin: 0 0 14px;
          }
          .meta {
            display: grid;
            grid-template-columns: 1fr auto;
            gap: 8px 16px;
            margin-bottom: 12px;
            font-size: 15px;
            padding-left: 8mm;
          }
          .meta .left div,
          .meta .right div {
            margin: 4px 0;
          }
          .meta strong { color: #111827; }
          .intro {
            margin: 10px 0 12px;
            font-size: 14px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 13px;
            margin-top: 8px;
          }
          th, td {
            border: 1px solid #d8d8d8;
            padding: 8px 6px;
            vertical-align: top;
          }
          th {
            background: #f3eaf0;
            text-align: left;
            font-weight: 700;
          }
          td.num { text-align: right; }
          .terms {
            margin-top: 18px;
            font-size: 14px;
          }
          .terms h3 {
            margin: 0 0 8px;
            font-size: 15px;
            border-top: 2px solid ${dividerColor};
            padding-top: 8px;
          }
          .terms ul {
            margin: 0;
            padding-left: 18px;
            line-height: 1.5;
          }
          .summary {
            margin-top: 10px;
            text-align: right;
            font-size: 15px;
            font-weight: 700;
            color: #111827;
          }
          .summary .value {
            color: ${brandAccent};
            margin-left: 6px;
          }
          .footer {
            position: absolute;
            left: 14mm;
            right: 14mm;
            bottom: 10mm;
            border-top: 2px solid ${dividerColor};
            padding-top: 8px;
            color: #374151;
            font-size: 12px;
            line-height: 1.5;
          }
          .content-block {
            min-height: calc(297mm - 78mm);
            padding-bottom: 30mm;
          }
          @media print {
            body { background: #fff; }
            .toolbar { display: none; }
            .page {
              width: auto;
              min-height: 297mm;
              margin: 0;
              box-shadow: none;
              border: 1px solid #d9c6d1;
            }
          }
        </style>
      </head>
      <body>
        <div class="toolbar">
          <div>Preview: ${escapeHtml(quotationNo)}</div>
          <button onclick="window.print()">Print / Save PDF</button>
        </div>
        <div class="page">
          <div class="head">
            <div class="brand">
              <img class="brand-logo" src="${brandLogo}" alt="${escapeHtml(brandTitle)} logo" />
            </div>
            <div class="title">Quotation</div>
          </div>
          <div class="divider"></div>
          <div class="content-block">
            <div class="meta">
              <div class="left">
                <div><strong>Quotation No:</strong> ${escapeHtml(quotationNo)}</div>
                <div><strong>Customer:</strong> ${escapeHtml(customerName)}</div>
                ${customerAddress ? `<div><strong>Address:</strong> ${addressToHtml(customerAddress)}</div>` : ''}
                <div><strong>Kind Atten:</strong> ${escapeHtml(kindAttention)}</div>
              </div>
              <div class="right">
                <div><strong>Date:</strong> ${escapeHtml(createdOn)}</div>
              </div>
            </div>
            <p class="intro">Thank you for your inquiry. We are pleased to quote you the following.</p>
            <table>
              <thead>
                <tr>
                  <th style="width: 6%">Sr No</th>
                  <th style="width: 15%">Product</th>
                  <th style="width: 33%">Description</th>
                  <th style="width: 10%">Qty</th>
                  <th style="width: 8%">Unit</th>
                  <th style="width: 10%">Rate</th>
                  <th style="width: 8%">GST%</th>
                  <th style="width: 10%">Amt</th>
                </tr>
              </thead>
              <tbody>${rowHtml}</tbody>
            </table>
            <div class="summary">
              Total Amount:
              <span class="value">INR ${formatNumber(totalAmount, 2)}</span>
            </div>
            <div class="terms">
              <h3>Terms :</h3>
              <ul>${termsHtml}</ul>
            </div>
          </div>
          <div class="footer">
            <div><strong>${footerLine1}</strong></div>
            <div>${footerLine2}</div>
          </div>
        </div>
      </body>
    </html>
  `;
  popup.document.open();
  popup.document.write(html);
  popup.document.close();
  popup.focus();
}
