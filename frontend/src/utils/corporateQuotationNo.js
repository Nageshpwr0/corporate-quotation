const START_SEQUENCE_BY_PREFIX = {
  RPS: 2701,
  BDC: 1,
  PH: 4001,
  NP: 501,
};

// Format: RPS-2701, BDC-0001, PH-4001. Nex Print uses plain numbers: 501, 502, ...
export const formatCorporateQuotationNo = (seq, prefix = 'RPS') =>
  prefix === 'NP'
    ? String(seq ?? '').trim().replace(/^[A-Za-z]+-0*/, '') || String(START_SEQUENCE_BY_PREFIX.NP)
    : (typeof seq === 'string' && /^[A-Za-z]+-\d+$/.test(seq.trim()))
    ? seq.trim().toUpperCase()
    : `${prefix}-${String(seq).padStart(4, '0')}`;

export const inferQuotationPrefix = (quotationLike) => {
  const code = quotationLike?.inputs?.brandCode;
  if (code === 'NP') return 'NP';
  if (code === 'PH') return 'PH';
  if (code === 'BDC') return 'BDC';
  if (code === 'RPS') return 'RPS';
  const rawNo = quotationLike?.inputs?.corporateQuotationNo;
  if (typeof rawNo === 'string') {
    const match = rawNo.match(/^([A-Za-z]+)-/);
    if (match?.[1]) return match[1].toUpperCase();
  }
  return 'RPS';
};

export const nextCorporateQuotationSeq = (quotations = [], prefix = 'RPS') => {
  const startSeq = START_SEQUENCE_BY_PREFIX[prefix] || 1;
  const relevantQuotations = quotations.filter((q) => inferQuotationPrefix(q) === prefix);
  if (!relevantQuotations.length) return startSeq;
  const seqs = relevantQuotations
    .map((q) => parsePlausibleCorporateSeq(q))
    .filter((n) => n !== null);
  const nextSeq = seqs.length ? Math.max(...seqs) + 1 : startSeq;
  return Math.max(nextSeq, startSeq);
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
