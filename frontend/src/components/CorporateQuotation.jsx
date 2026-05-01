import React, { useEffect, useMemo, useState } from 'react';
import api from '../api';
import '../design-system.css';
import {
  formatCorporateQuotationNo,
  nextCorporateQuotationSeq,
  parsePlausibleCorporateSeq,
} from '../utils/corporateQuotationNo';

const DEFAULT_TERMS_TEXT = `Quotation valid 14 days only
Payment Cycle 30 days
Delivery within Mumbai & Navi Mumbai
GST Extra Applicable`;

const DEFAULT_TERMS_LINES = DEFAULT_TERMS_TEXT.split(/\r?\n/)
  .map((s) => s.trim())
  .filter(Boolean);

const createRow = () => ({
  product: '',
  description: '',
  qty: '',
  unit: '',
  rate: '',
  gst: '',
});

function parseTermsPayload(formInputs) {
  const t = formInputs?.terms;
  if (Array.isArray(t) && t.length) return t.map((s) => String(s).trim()).filter(Boolean);
  if (typeof t === 'string' && t.trim()) return t.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
  return [];
}

const toNumber = (value) => {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const calculateRowAmount = (row) => {
  const qty = toNumber(row.qty);
  const rate = toNumber(row.rate);
  const gst = toNumber(row.gst);
  const base = qty * rate;
  return base + (base * gst / 100);
};

const getQuotationPrefix = (brandTheme) =>
  brandTheme === 'bhavesh' ? 'BDC' : brandTheme === 'printHouse' ? 'PH' : brandTheme === 'nexPrint' ? 'NP' : 'RPS';

function CorporateQuotation({ formData, onSaved, onOpenCustomerMaster, brandTheme = 'radhe', customers = [], quotations = [] }) {
  const quotationPrefix = getQuotationPrefix(brandTheme);
  const [quotationSeq, setQuotationSeq] = useState(() => nextCorporateQuotationSeq(quotations, quotationPrefix));
  const [customerName, setCustomerName] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [kindAttention, setKindAttention] = useState('');
  const [rows, setRows] = useState([createRow()]);
  const [termsText, setTermsText] = useState(DEFAULT_TERMS_TEXT);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const isEditing = Boolean(formData && formData.id);

  useEffect(() => {
    if (isEditing) {
      const fromParsed = parsePlausibleCorporateSeq(formData);
      setQuotationSeq(
        fromParsed !== null
          ? fromParsed
          : nextCorporateQuotationSeq(quotations.filter((q) => q.id !== formData.id), quotationPrefix)
      );
      setCustomerName(formData.inputs?.customerName || '');
      const found = customers.find((c) => (
        formData.inputs?.customerId
          ? String(c.id) === String(formData.inputs.customerId)
          : (c.customerName || '') === (formData.inputs?.customerName || '')
      ));
      setSelectedCustomerId(found?.id ? String(found.id) : '');
      setKindAttention(formData.inputs?.kindAttention || '');
      const loadedTerms = parseTermsPayload(formData.inputs);
      setTermsText(loadedTerms.length ? loadedTerms.join('\n') : DEFAULT_TERMS_TEXT);
      if (Array.isArray(formData.rows) && formData.rows.length > 0) {
        setRows(formData.rows.map((row) => ({
          product: row.product || '',
          description: row.description || '',
          qty: row.qty ?? '',
          unit: row.unit || '',
          rate: row.rate ?? '',
          gst: row.gst ?? '',
        })));
      } else {
        setRows([createRow()]);
      }
      setError('');
      return;
    }
    setQuotationSeq(nextCorporateQuotationSeq(quotations, quotationPrefix));
    setCustomerName('');
    setSelectedCustomerId('');
    setKindAttention('');
    setTermsText(DEFAULT_TERMS_TEXT);
    setRows([createRow()]);
    setError('');
  }, [customers, formData, isEditing, quotationPrefix, quotations]);

  useEffect(() => {
    if (!selectedCustomerId) return;
    const selectedCustomer = customers.find((c) => String(c.id) === String(selectedCustomerId));
    if (!selectedCustomer) return;
    setKindAttention(
      selectedCustomer.kindAttentionName ||
      selectedCustomer.kindAttention ||
      selectedCustomer.kindAttenName ||
      ''
    );
  }, [customers, selectedCustomerId]);

  const tableRows = useMemo(() => rows.map((row) => ({ ...row, amount: calculateRowAmount(row) })), [rows]);
  const totalAmount = useMemo(() => tableRows.reduce((sum, row) => sum + row.amount, 0), [tableRows]);
  const totalQty = useMemo(() => tableRows.reduce((sum, row) => sum + toNumber(row.qty), 0), [tableRows]);
  const ratePerUnit = totalQty > 0 ? totalAmount / totalQty : 0;
  const accentColor = brandTheme === 'bhavesh' ? '#1d4ed8' : brandTheme === 'nexPrint' ? '#0f766e' : '#be185d';
  const accentSoft = brandTheme === 'bhavesh' ? '#dbeafe' : brandTheme === 'nexPrint' ? '#ccfbf1' : '#fce7f3';
  const tableHeaderBg = brandTheme === 'bhavesh' ? '#dbeafe' : brandTheme === 'nexPrint' ? '#ccfbf1' : '#1e293b';
  const tableHeaderColor = brandTheme === 'bhavesh' ? '#1e3a8a' : brandTheme === 'nexPrint' ? '#134e4a' : '#f1f5f9';
  const selectedCustomer = useMemo(
    () => customers.find((c) => String(c.id) === String(selectedCustomerId)),
    [customers, selectedCustomerId]
  );
  const sortedCustomers = useMemo(
    () => customers.slice().sort((a, b) => (a.customerName || '').localeCompare(b.customerName || '')),
    [customers]
  );

  const updateRow = (index, field, value) => {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  };

  const addRow = () => {
    setRows((prev) => [...prev, createRow()]);
  };

  const removeRow = (index) => {
    setRows((prev) => prev.length > 1 ? prev.filter((_, i) => i !== index) : prev);
  };

  const handleCustomerChange = (event) => {
    const id = event.target.value;
    setSelectedCustomerId(id);
    const selectedCustomer = customers.find((c) => String(c.id) === String(id));
    if (selectedCustomer) {
      setCustomerName(selectedCustomer.customerName || '');
      setKindAttention(
        selectedCustomer.kindAttentionName ||
        selectedCustomer.kindAttention ||
        selectedCustomer.kindAttenName ||
        ''
      );
      return;
    }
    setCustomerName('');
    setKindAttention('');
  };

  const saveQuotation = async () => {
    setError('');
    const hasValidRow = tableRows.some((row) =>
      String(row.product || '').trim() ||
      String(row.description || '').trim() ||
      toNumber(row.qty) > 0
    );
    if (!String(customerName || '').trim()) {
      setError('Please select customer name.');
      return;
    }
    if (!hasValidRow) {
      setError('Please enter at least one row.');
      return;
    }

    const cleanRows = tableRows.map((row) => ({
      product: row.product,
      description: row.description,
      qty: toNumber(row.qty),
      unit: row.unit,
      rate: toNumber(row.rate),
      gst: toNumber(row.gst),
      amt: Number(row.amount.toFixed(2)),
    }));

    const termsLines = termsText
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean);

    const payload = {
      productType: 'CorporateQuotation',
      inputs: {
        brandCode: quotationPrefix,
        customerId: selectedCustomerId ? Number(selectedCustomerId) : null,
        customerName: customerName.trim(),
        customerAddress: String(selectedCustomer?.address || '').trim(),
        customerContactNo: String(selectedCustomer?.contactNo || '').trim(),
        customerEmail: String(selectedCustomer?.email || '').trim(),
        kindAttention: kindAttention.trim(),
        corporateQuotationNo: quotationSeq,
        qty: totalQty,
        terms: termsLines.length ? termsLines : DEFAULT_TERMS_LINES,
      },
      rows: cleanRows,
      totalAmount: Number(totalAmount.toFixed(2)),
      ratePerPiece: Number(ratePerUnit.toFixed(4)),
      results: [{
        totalCost: Number(totalAmount.toFixed(2)),
        finalRate: Number(ratePerUnit.toFixed(4)),
      }],
    };

    setIsSaving(true);
    try {
      const response = isEditing
        ? await api.put(`/quotations/${formData.id}`, payload)
        : await api.post('/quotations', payload);
      onSaved?.(response?.data?.data || payload);
    } catch (saveError) {
      setError(saveError.response?.data?.error || saveError.message || 'Failed to save quotation.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ width: '100%', padding: '8px 12px 18px' }}>
      <div className="cuttosheet-box cuttosheet-form-box" style={{ width: '100%', maxWidth: 'none', margin: 0 }}>
        <h1 className="form-title-pink" style={{ color: accentColor, borderBottomColor: accentSoft }}>
          Corporate Quotation
        </h1>
        <div className="form-grid-modern" style={{ marginBottom: '12px' }}>
          <div className="form-group">
            <label className="input-label">Customer Name</label>
            <select className="input-box" value={selectedCustomerId} onChange={handleCustomerChange}>
              <option value="">-- Select Customer --</option>
              {sortedCustomers.map((c) => (
                  <option key={c.id || c.customerName} value={String(c.id)}>
                    {c.customerName}
                  </option>
                ))}
            </select>
            <button
              type="button"
              className="btn-secondary"
              style={{ marginTop: 8 }}
              onClick={onOpenCustomerMaster}
            >
              + Create / Edit Customer Master
            </button>
          </div>
          <div className="form-group">
            <label className="input-label">Kind Atten Name</label>
            <input className="input-box" value={kindAttention} onChange={(e) => setKindAttention(e.target.value)} placeholder="Enter name" />
          </div>
          <div className="form-group">
            <label className="input-label">Quotation No</label>
            <input className="input-box" value={formatCorporateQuotationNo(quotationSeq, quotationPrefix)} readOnly />
          </div>
        </div>

        <p style={{ margin: '0 0 6px', color: '#374151', fontSize: '0.95rem', lineHeight: 1.45, maxWidth: 900 }}>
          Thank you for your inquiry. We are pleased to quote you the following.
        </p>

        <div className="overflow-x-auto mb-4" style={{ marginTop: 0 }}>
          <table className="result-table-modern compact-table corporate-quotation-table" style={{ width: '100%', tableLayout: 'fixed' }}>
            <thead>
              <tr>
                <th style={{ width: '5%', padding: '10px 8px', background: tableHeaderBg, color: tableHeaderColor }}>Sr No</th>
                <th style={{ width: '17%', padding: '10px 8px', background: tableHeaderBg, color: tableHeaderColor }}>Product</th>
                <th style={{ width: '30%', padding: '10px 8px', background: tableHeaderBg, color: tableHeaderColor }}>Description</th>
                <th style={{ width: '8%', padding: '10px 8px', background: tableHeaderBg, color: tableHeaderColor }}>Qty</th>
                <th style={{ width: '9%', padding: '10px 8px', background: tableHeaderBg, color: tableHeaderColor }}>Unit</th>
                <th style={{ width: '9%', padding: '10px 8px', background: tableHeaderBg, color: tableHeaderColor }}>Rate</th>
                <th style={{ width: '7%', padding: '10px 8px', background: tableHeaderBg, color: tableHeaderColor }}>GST %</th>
                <th style={{ width: '9%', padding: '10px 8px', background: tableHeaderBg, color: tableHeaderColor }}>Amt</th>
                <th style={{ width: '6%', padding: '10px 8px', background: tableHeaderBg, color: tableHeaderColor }}></th>
              </tr>
            </thead>
            <tbody>
              {tableRows.map((row, index) => (
                <tr key={`row-${index}`}>
                  <td style={{ padding: '8px' }}><input className="input-box" value={index + 1} readOnly style={{ width: '100%', height: '34px' }} /></td>
                  <td style={{ padding: '8px' }}><input className="input-box" value={row.product} onChange={(e) => updateRow(index, 'product', e.target.value)} style={{ width: '100%', height: '34px' }} /></td>
                  <td style={{ padding: '8px' }}><input className="input-box" value={row.description} onChange={(e) => updateRow(index, 'description', e.target.value)} style={{ width: '100%', height: '34px' }} /></td>
                  <td style={{ padding: '8px' }}><input className="input-box" type="number" min="0" value={row.qty} onChange={(e) => updateRow(index, 'qty', e.target.value)} style={{ width: '100%', height: '34px' }} /></td>
                  <td style={{ padding: '8px' }}>
                    <select className="input-box" value={row.unit} onChange={(e) => updateRow(index, 'unit', e.target.value)} style={{ width: '100%', height: '34px' }}>
                      <option value="">Select</option>
                      <option value="pcs">pcs</option>
                      <option value="kg">kg</option>
                      <option value="nos">nos</option>
                      <option value="box">box</option>
                      <option value="pack">pack</option>
                      <option value="set">set</option>
                    </select>
                  </td>
                  <td style={{ padding: '8px' }}><input className="input-box" type="number" min="0" step="0.01" value={row.rate} onChange={(e) => updateRow(index, 'rate', e.target.value)} style={{ width: '100%', height: '34px' }} /></td>
                  <td style={{ padding: '8px' }}><input className="input-box" type="number" min="0" step="0.01" value={row.gst} onChange={(e) => updateRow(index, 'gst', e.target.value)} style={{ width: '100%', height: '34px' }} /></td>
                  <td style={{ padding: '8px' }}><input className="input-box" value={row.amount.toFixed(2)} readOnly style={{ width: '100%', height: '34px' }} /></td>
                  <td style={{ padding: '8px', textAlign: 'center' }}>
                    <button type="button" className="btn-danger" onClick={() => removeRow(index)} style={{ padding: '4px 8px', fontSize: '0.8rem' }}>✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ background: '#f8fafc', fontWeight: 600 }}>
                <td colSpan={3} style={{ padding: '8px', textAlign: 'right', color: '#374151' }}>Total</td>
                <td style={{ padding: '8px' }}><input className="input-box" value={totalQty} readOnly style={{ width: '100%', height: '34px', fontWeight: 700 }} /></td>
                <td colSpan={3} style={{ padding: '8px', textAlign: 'right', color: '#374151' }}>Total Amount</td>
                <td style={{ padding: '8px' }}><input className="input-box" value={totalAmount.toFixed(2)} readOnly style={{ width: '100%', height: '34px', fontWeight: 700, color: accentColor }} /></td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <button type="button" className="save-btn-modern" style={{ background: accentColor }} onClick={addRow}>+ Add Row</button>
        </div>

        <div className="form-group" style={{ marginTop: 18, width: '100%', maxWidth: 720 }}>
          <label className="input-label" style={{ fontWeight: 700 }}>Terms</label>
          <textarea
            className="input-box"
            value={termsText}
            onChange={(e) => setTermsText(e.target.value)}
            rows={5}
            placeholder="One term per line (shown on PDF)"
            style={{ width: '100%', minHeight: 110, resize: 'vertical', fontSize: '0.95rem', lineHeight: 1.45, padding: '10px 12px' }}
          />
        </div>

        {error && <p style={{ color: '#B91C1C', marginTop: '10px' }}>{error}</p>}

        <div style={{ marginTop: '14px' }}>
          <button type="button" className="save-btn-modern py-3 px-8 text-lg" style={{ background: accentColor }} onClick={saveQuotation} disabled={isSaving}>
            {isSaving ? 'Saving...' : (isEditing ? 'Update Quotation' : 'Save Quotation')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CorporateQuotation;
