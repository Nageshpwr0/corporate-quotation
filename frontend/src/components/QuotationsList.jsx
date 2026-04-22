import React from 'react';
import { formatCorporateQuotationNo, inferQuotationPrefix } from '../utils/corporateQuotationNo';

function QuotationsList({ quotations, onEdit, onDelete, onPreviewPdf, loading }) {
  if (loading) return <p className="text-gray">Loading quotations...</p>;
  if (!quotations.length) return <p className="text-gray">No quotations found. Create one!</p>;

  return (
    <div className="cuttosheet-box" style={{ padding: '0', overflow: 'hidden' }}>
      <table className="result-table-modern" style={{ width: '100%' }}>
        <thead>
          <tr>
            <th>Quotation No</th>
            <th>Customer</th>
            <th>Kind Attention</th>
            <th>Total Qty</th>
            <th className="text-right">Total Amount</th>
            <th>Date</th>
            <th className="text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {quotations.map((q) => (
            (() => {
              const prefix = inferQuotationPrefix(q);
              const formattedNo = formatCorporateQuotationNo(q.inputs?.corporateQuotationNo || q.id, prefix);
              const badgeStyle = prefix === 'BDC'
                ? { background: '#dbeafe', color: '#1d4ed8' }
                : undefined;
              return (
            <tr key={q.id}>
              <td>
                <span className="badge badge-pink" style={badgeStyle}>
                  {formattedNo}
                </span>
              </td>
              <td style={{ fontWeight: 600 }}>{q.inputs?.customerName || '—'}</td>
              <td>{q.inputs?.kindAttention || '—'}</td>
              <td>{q.inputs?.qty ?? '—'}</td>
              <td className="text-right" style={{ fontWeight: 700, color: '#be185d' }}>
                ₹{Number(q.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </td>
              <td className="text-sm text-gray">
                {new Date(q.createdAt).toLocaleDateString('en-IN')}
              </td>
              <td className="text-center">
                <div className="flex gap-2 items-center" style={{ justifyContent: 'center' }}>
                  <button className="btn-secondary" onClick={() => onPreviewPdf(q)}>Preview PDF</button>
                  <button className="btn-secondary" onClick={() => onEdit(q)}>Edit</button>
                  <button className="btn-danger" onClick={() => onDelete(q.id)}>Delete</button>
                </div>
              </td>
            </tr>
              );
            })()
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default QuotationsList;
