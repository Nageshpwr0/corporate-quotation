import React, { useMemo, useState } from 'react';
import api from '../api';
import '../design-system.css';

const emptyCustomerForm = {
  customerName: '',
  address: '',
  contactNo: '',
  email: '',
  kindAttentionName: '',
};

function CustomerMaster({ customers = [], onCustomerSaved }) {
  const [editingCustomerId, setEditingCustomerId] = useState('');
  const [customerForm, setCustomerForm] = useState(emptyCustomerForm);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const sortedCustomers = useMemo(
    () => customers.slice().sort((a, b) => (a.customerName || '').localeCompare(b.customerName || '')),
    [customers]
  );

  const handleCustomerFormChange = (field, value) => {
    setCustomerForm((prev) => ({ ...prev, [field]: value }));
  };

  const loadCustomerForEdit = (id) => {
    setEditingCustomerId(id);
    const selectedCustomer = customers.find((c) => String(c.id) === String(id));
    if (!selectedCustomer) {
      setCustomerForm(emptyCustomerForm);
      return;
    }
    setCustomerForm({
      customerName: selectedCustomer.customerName || '',
      address: selectedCustomer.address || '',
      contactNo: selectedCustomer.contactNo || '',
      email: selectedCustomer.email || '',
      kindAttentionName:
        selectedCustomer.kindAttentionName ||
        selectedCustomer.kindAttention ||
        selectedCustomer.kindAttenName ||
        '',
    });
  };

  const resetCustomerMasterForm = () => {
    setEditingCustomerId('');
    setCustomerForm(emptyCustomerForm);
    setError('');
  };

  const saveCustomerMaster = async () => {
    setError('');
    if (!String(customerForm.customerName || '').trim()) {
      setError('Customer Name is required.');
      return;
    }
    setIsSaving(true);
    try {
      const requestBody = {
        customerName: customerForm.customerName.trim(),
        address: customerForm.address.trim(),
        contactNo: customerForm.contactNo.trim(),
        email: customerForm.email.trim(),
        kindAttentionName: customerForm.kindAttentionName.trim(),
      };
      const response = editingCustomerId
        ? await api.put(`/customers/${editingCustomerId}`, requestBody)
        : await api.post('/customers', requestBody);
      const savedCustomer = response?.data?.data;
      if (savedCustomer) onCustomerSaved?.(savedCustomer);
      resetCustomerMasterForm();
    } catch (saveError) {
      setError(saveError.response?.data?.error || saveError.message || 'Failed to save customer.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ width: '100%', padding: '8px 12px 18px' }}>
      <div className="cuttosheet-box cuttosheet-form-box" style={{ width: '100%', maxWidth: 'none', margin: 0 }}>
        <h1 className="form-title-pink">Customer Master</h1>

        <div className="form-group" style={{ marginBottom: 10 }}>
          <label className="input-label">Edit Existing Customer</label>
          <select className="input-box" value={editingCustomerId} onChange={(e) => loadCustomerForEdit(e.target.value)}>
            <option value="">-- New Customer --</option>
            {sortedCustomers.map((c) => (
              <option key={c.id || c.customerName} value={String(c.id)}>
                {c.customerName}
              </option>
            ))}
          </select>
        </div>

        <div className="form-grid-modern">
          <div className="form-group">
            <label className="input-label">Customer Name</label>
            <input className="input-box" value={customerForm.customerName} onChange={(e) => handleCustomerFormChange('customerName', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="input-label">Kind Atten Name</label>
            <input className="input-box" value={customerForm.kindAttentionName} onChange={(e) => handleCustomerFormChange('kindAttentionName', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="input-label">Contact No</label>
            <input className="input-box" value={customerForm.contactNo} onChange={(e) => handleCustomerFormChange('contactNo', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="input-label">Email</label>
            <input className="input-box" type="email" value={customerForm.email} onChange={(e) => handleCustomerFormChange('email', e.target.value)} />
          </div>
        </div>

        <div className="form-group" style={{ marginTop: 10 }}>
          <label className="input-label">Address</label>
          <textarea className="input-box" rows={3} value={customerForm.address} onChange={(e) => handleCustomerFormChange('address', e.target.value)} />
        </div>

        {error && <p style={{ color: '#B91C1C', marginTop: '10px' }}>{error}</p>}

        <div style={{ marginTop: 10 }}>
          <button type="button" className="save-btn-modern" onClick={saveCustomerMaster} disabled={isSaving}>
            {isSaving ? 'Saving Customer...' : (editingCustomerId ? 'Update Customer' : 'Save Customer')}
          </button>
          <button
            type="button"
            className="btn-secondary"
            style={{ marginLeft: 8 }}
            onClick={resetCustomerMasterForm}
            disabled={isSaving}
          >
            Reset
          </button>
        </div>

        <div style={{ marginTop: 20 }}>
          <h3 style={{ margin: '0 0 10px', color: '#be185d' }}>Saved Customers</h3>
          {sortedCustomers.length === 0 ? (
            <p className="text-gray">No customers found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="result-table-modern" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Customer Name</th>
                    <th>Kind Atten Name</th>
                    <th>Contact No</th>
                    <th>Email</th>
                    <th>Address</th>
                    <th className="text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedCustomers.map((customer) => (
                    <tr key={customer.id || customer.customerName}>
                      <td style={{ fontWeight: 600 }}>{customer.customerName || '—'}</td>
                      <td>{customer.kindAttentionName || customer.kindAttention || customer.kindAttenName || '—'}</td>
                      <td>{customer.contactNo || '—'}</td>
                      <td>{customer.email || '—'}</td>
                      <td>{customer.address || '—'}</td>
                      <td className="text-center">
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => loadCustomerForEdit(String(customer.id))}
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CustomerMaster;
