import React, { useEffect, useState } from 'react';
import api from './api';
import CorporateQuotation from './components/CorporateQuotation';
import CustomerMaster from './components/CustomerMaster';
import QuotationsList from './components/QuotationsList';
import { openQuotationPdfPreview } from './utils/quotationPdfPreview';

function App() {
  const [customers, setCustomers] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingQuotation, setEditingQuotation] = useState(null);
  const [view, setView] = useState('list'); // 'list' or 'form' or 'customerMaster'
  const [brandTheme, setBrandTheme] = useState('radhe');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [customersRes, quotationsRes] = await Promise.all([
        api.get('/customers'),
        api.get('/quotations'),
      ]);
      setCustomers(customersRes.data.data || []);
      setQuotations(quotationsRes.data.data || []);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaved = (savedQuotation) => {
    if (editingQuotation) {
      setQuotations(prev => prev.map(q => q.id === savedQuotation.id ? savedQuotation : q));
    } else {
      setQuotations(prev => [savedQuotation, ...prev]);
    }
    setEditingQuotation(null);
    setView('list');
  };

  const handleEdit = (quotation) => {
    setEditingQuotation(quotation);
    const brandCode = quotation?.inputs?.brandCode;
    setBrandTheme(
      brandCode === 'BDC'
        ? 'bhavesh'
        : brandCode === 'PH'
          ? 'printHouse'
          : brandCode === 'NP'
            ? 'nexPrint'
            : 'radhe'
    );
    setView('form');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this quotation?')) return;
    try {
      await api.delete(`/quotations/${id}`);
      setQuotations(prev => prev.filter(q => q.id !== id));
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  const handleNewQuotation = (brand = 'radhe') => {
    setEditingQuotation(null);
    setBrandTheme(brand);
    setView('form');
  };

  const handlePreviewPdf = (quotation) => {
    const matchedCustomer = customers.find((customer) => (
      quotation?.inputs?.customerId
        ? String(customer.id) === String(quotation.inputs.customerId)
        : (customer.customerName || '') === (quotation?.inputs?.customerName || '')
    ));
    openQuotationPdfPreview({
      ...quotation,
      inputs: {
        ...quotation.inputs,
        customerAddress: quotation.inputs?.customerAddress || matchedCustomer?.address || '',
        customerContactNo: quotation.inputs?.customerContactNo || matchedCustomer?.contactNo || '',
        customerEmail: quotation.inputs?.customerEmail || matchedCustomer?.email || '',
      },
    });
  };

  const handleCustomerCreated = (customer) => {
    setCustomers((prev) => {
      const withoutSame = prev.filter((c) => c.id !== customer.id);
      return [customer, ...withoutSame];
    });
  };

  return (
    <div className="app-container" style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <header style={{ marginBottom: '20px' }}>
        <h1 style={{ color: brandTheme === 'bhavesh' ? '#1d4ed8' : '#be185d', margin: 0 }}>
          Corporate Quotation System
        </h1>
      </header>

      <nav style={{ marginBottom: '20px' }}>
        <button
          className={`btn-secondary ${view === 'list' ? 'active' : ''}`}
          onClick={() => setView('list')}
          style={{ marginRight: '10px' }}
        >
          View Quotations
        </button>
        <button
          className="save-btn-modern"
          onClick={() => handleNewQuotation('radhe')}
          style={{ marginRight: '10px' }}
        >
          RADHE PRINT
        </button>
        <button
          className="save-btn-modern"
          onClick={() => handleNewQuotation('bhavesh')}
          style={{ marginRight: '10px', background: '#1d4ed8' }}
        >
          BHAVESH DIGITAL CENTRE
        </button>
        <button
          className="save-btn-modern"
          onClick={() => handleNewQuotation('printHouse')}
          style={{ marginRight: '10px', background: '#be185d' }}
        >
          PRINT HOUSE
        </button>
        <button
          className="save-btn-modern"
          onClick={() => handleNewQuotation('nexPrint')}
          style={{ marginRight: '10px', background: '#0f766e' }}
        >
          NEX PRINT
        </button>
        <button
          className={`btn-secondary ${view === 'customerMaster' ? 'active' : ''}`}
          onClick={() => setView('customerMaster')}
        >
          Customer Master
        </button>
      </nav>

      {view === 'list' ? (
        <QuotationsList
          quotations={quotations}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onPreviewPdf={handlePreviewPdf}
          loading={loading}
        />
      ) : view === 'customerMaster' ? (
        <CustomerMaster
          customers={customers}
          onCustomerSaved={handleCustomerCreated}
        />
      ) : (
        <CorporateQuotation
          formData={editingQuotation}
          onSaved={handleSaved}
          onOpenCustomerMaster={() => setView('customerMaster')}
          brandTheme={brandTheme}
          customers={customers}
          quotations={quotations}
        />
      )}
    </div>
  );
}

export default App;