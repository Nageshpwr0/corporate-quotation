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

export function openQuotationPdfPreview(quotation) {
  const popup = window.open('', '_blank');
  if (!popup) {
    window.alert('Please allow popups to preview the PDF.');
    return;
  }

  const prefix = inferQuotationPrefix(quotation);
  const isBhavesh = prefix === 'BDC';
  const brandTitle = isBhavesh ? 'BHAVESH DIGITAL CENTER' : 'RADHE PRINT';
  const brandSubtitle = isBhavesh ? 'PRINTING & DIGITAL SERVICES' : 'SOLUTIONS PVT. LTD.';
  const brandAccent = isBhavesh ? '#1d4ed8' : '#be185d';
  const dividerColor = isBhavesh ? '#93c5fd' : '#c783a2';
  const footerLine1 = isBhavesh
    ? 'B5/38, Shree Om Co.ho, Soc., Nehru Road, Old Ananad Nagar, Santacruz East, Mumbai - 400 055.'
    : 'Radhe Print Solutions Pvt. Ltd. . Opp. Keytuo Industrial Estate . Ram Krishna Mandir Road . Kondivita lane, MIDC . Andheri (E), Mumbai - 400059';
  const footerLine2 = isBhavesh
    ? 'Office:- 8591084334 / 7977600328'
    : 'Mob.: 93726 88876    To know more visit: www.radheprint.in';

  const quotationNo = formatCorporateQuotationNo(
    quotation?.inputs?.corporateQuotationNo || quotation?.id,
    prefix
  );
  const customerName = quotation?.inputs?.customerName || '-';
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
          .head {
            display: grid;
            grid-template-columns: 1fr 1fr;
            align-items: center;
            margin-bottom: 10px;
          }
          .brand {
            color: ${brandAccent};
            font-weight: 700;
            font-size: 22px;
            line-height: 1.05;
            letter-spacing: 0.2px;
          }
          .brand small {
            display: block;
            font-size: 11px;
            color: #6b7280;
            letter-spacing: 0.4px;
          }
          .title {
            text-align: right;
            font-size: 40px;
            font-weight: 700;
            color: #111827;
          }
          .divider {
            border-top: 2px solid ${dividerColor};
            margin: 8px 0 14px;
          }
          .meta {
            display: grid;
            grid-template-columns: 1fr auto;
            gap: 8px 16px;
            margin-bottom: 12px;
            font-size: 15px;
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
              ${brandTitle}
              <small>${brandSubtitle}</small>
            </div>
            <div class="title">Quotation</div>
          </div>
          <div class="divider"></div>
          <div class="content-block">
            <div class="meta">
              <div class="left">
                <div><strong>Quotation No:</strong> ${escapeHtml(quotationNo)}</div>
                <div><strong>Customer:</strong> ${escapeHtml(customerName)}</div>
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
