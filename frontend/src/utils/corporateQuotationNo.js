// Format: RPS-0001, BDC-0001, ...
export const formatCorporateQuotationNo = (seq, prefix = 'RPS') =>
  (typeof seq === 'string' && /^[A-Za-z]+-\d+$/.test(seq.trim()))
    ? seq.trim().toUpperCase()
    : `${prefix}-${String(seq).padStart(4, '0')}`;

export const inferQuotationPrefix = (quotationLike) => {
  const code = quotationLike?.inputs?.brandCode;
  if (code === 'BDC') return 'BDC';
  if (code === 'RPS') return 'RPS';
  const rawNo = quotationLike?.inputs?.corporateQuotationNo;
  if (typeof rawNo === 'string') {
    const match = rawNo.match(/^([A-Za-z]+)-/);
    if (match?.[1]) return match[1].toUpperCase();
  }
  return 'RPS';
};

export const nextCorporateQuotationSeq = (quotations = []) => {
  if (!quotations.length) return 1;
  const seqs = quotations
    .map((q) => parsePlausibleCorporateSeq(q))
    .filter((n) => n !== null);
  return seqs.length ? Math.max(...seqs) + 1 : 1;
};

export const parsePlausibleCorporateSeq = (quotation) => {
  const no = quotation?.inputs?.corporateQuotationNo;
  if (typeof no === 'number' && Number.isFinite(no)) return no;
  if (typeof no === 'string') {
    const match = no.match(/(\d+)$/);
    if (match) return parseInt(match[1], 10);
  }
  return null;
};
