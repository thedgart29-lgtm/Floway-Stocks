import React, { useState, useMemo } from 'react';
import { useDB } from '../data/db';
import DataTable from '../components/DataTable';

const OutstandingReport = () => {
  const db = useDB();
  const currency = db.preferences?.currency || '₹';
  const [selectedClientId, setSelectedClientId] = useState(null);

  // Compute Outstanding Dues per Client
  const clientBalances = useMemo(() => {
    return (db.clients || []).map(client => {
      const clientInvoices = (db.invoices || []).filter(inv => inv.clientId === client.id);
      
      const totalBilled = clientInvoices.reduce((sum, inv) => sum + Number(inv.totalAmount || 0), 0);
      const totalPaid = clientInvoices.reduce((sum, inv) => sum + Number(inv.amountPaid || 0), 0);
      const outstanding = totalBilled - totalPaid;

      return {
        ...client,
        totalBilled,
        totalPaid,
        outstanding
      };
    });
  }, [db.clients, db.invoices]);

  // Aggregate summary
  const summary = useMemo(() => {
    const totalDues = clientBalances.reduce((sum, c) => sum + c.outstanding, 0);
    const debtorClientsCount = clientBalances.filter(c => c.outstanding > 0).length;
    return {
      totalDues,
      debtorClientsCount
    };
  }, [clientBalances]);

  // Selected client detailed invoices
  const clientInvoices = useMemo(() => {
    if (!selectedClientId) return [];
    return (db.invoices || []).filter(inv => inv.clientId === selectedClientId);
  }, [db.invoices, selectedClientId]);

  const selectedClient = useMemo(() => {
    return (db.clients || []).find(c => c.id === selectedClientId);
  }, [db.clients, selectedClientId]);

  // Columns for client summary table
  const columns = [
    { 
      header: 'Client / Company Name', 
      key: 'name', 
      sortable: true, 
      filterable: true, 
      showTotal: true,
      render: (val) => <span style={{ fontWeight: 600 }}>{val}</span>,
      renderTotal: () => <span style={{ fontWeight: 800 }}>GRAND TOTAL</span>
    },
    { header: 'Phone Number', key: 'phone' },
    { 
      header: 'Total Billed', 
      key: 'totalBilled', 
      sortable: true, 
      showTotal: true,
      render: (val) => `${currency}${Number(val).toFixed(2)}` 
    },
    { 
      header: 'Total Paid', 
      key: 'totalPaid', 
      sortable: true, 
      showTotal: true,
      render: (val) => <span style={{ color: '#22c55e', fontWeight: 500 }}>{currency}{Number(val).toFixed(2)}</span> 
    },
    { 
      header: 'Outstanding Balance', 
      key: 'outstanding', 
      sortable: true, 
      filterable: true,
      showTotal: true,
      render: (val) => (
        <span style={{ color: val > 0 ? 'var(--color-error)' : 'var(--color-success)', fontWeight: 700 }}>
          {currency}{Number(val).toFixed(2)}
        </span>
      )
    },
    {
      header: 'Ledger',
      key: 'id',
      sortable: false,
      render: (id) => (
        <button 
          className="btn btn-secondary btn-tiny" 
          onClick={() => setSelectedClientId(id === selectedClientId ? null : id)}
          style={{ fontWeight: 600 }}
        >
          {selectedClientId === id ? 'Close Ledger' : 'View Invoices'}
        </button>
      )
    }
  ];

  // Columns for detailed invoices table
  const invoiceColumns = [
    { header: 'Invoice Date', key: 'timestamp', render: (val, row) => <span>{val ? new Date(val).toLocaleDateString() : (row.date || '---')}</span> },
    { header: 'Invoice No.', key: 'invoiceNo', render: (val) => <span className="badge badge-grey">{val}</span> },
    { header: 'Product', key: 'productId', render: (val) => db.products.find(p => p.id === val)?.name || 'Unknown' },
    { header: 'Qty (PCS)', key: 'quantity', render: (val) => <span style={{ fontWeight: 600 }}>{val}</span> },
    { header: 'Total Amount', key: 'totalAmount', render: (val) => `${currency}${Number(val).toFixed(2)}` },
    { header: 'Paid Amount', key: 'amountPaid', render: (val) => <span style={{ color: '#22c55e', fontWeight: 500 }}>{currency}{Number(val).toFixed(2)}</span> },
    { 
      header: 'Pending Balance', 
      key: 'pendingDues', 
      render: (val) => (
        <span style={{ color: val > 0 ? 'var(--color-error)' : 'var(--color-success)', fontWeight: 700 }}>
          {currency}{Number(val).toFixed(2)}
        </span>
      )
    },
    { 
      header: 'Status', 
      key: 'status', 
      render: (val) => {
        const s = val || 'Pending';
        return <span className={`badge ${s === 'Paid' ? 'badge-green' : s === 'Partial' ? 'badge-blue' : 'badge-red'}`}>{s}</span>;
      }
    }
  ];

  return (
    <div className="fade-in" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', paddingBottom: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>Outstanding Balances Report</h1>
      </div>

      {/* Aggregate summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="card">
          <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Total Receivables Dues</p>
          <h2 style={{ fontSize: '1.8rem', marginTop: '0.4rem', color: summary.totalDues > 0 ? 'var(--color-error)' : 'var(--color-success)' }}>
            {currency}{summary.totalDues.toFixed(2)}
          </h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.4rem' }}>Sum of unpaid payments across all accounts.</p>
        </div>
        <div className="card">
          <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Accounts with Pending Balance</p>
          <h2 style={{ fontSize: '1.8rem', marginTop: '0.4rem', color: summary.debtorClientsCount > 0 ? 'var(--color-warning)' : 'var(--text-main)' }}>
            {summary.debtorClientsCount} <span style={{ fontSize: '1rem', fontWeight: 500 }}>Clients</span>
          </h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.4rem' }}>Number of client companies with unpaid balances.</p>
        </div>
      </div>

      {/* Client List */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <DataTable data={clientBalances} columns={columns} emptyMessage="No clients registered yet." />
      </div>

      {/* Ledger Detail View */}
      {selectedClientId && selectedClient && (
        <div className="card fade-in" style={{ border: '1px solid var(--border)', background: 'var(--bg-card)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.8rem' }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                Billing Ledger: {selectedClient.name}
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                Listing all invoices issued to this client.
              </p>
            </div>
            <button 
              className="btn btn-secondary btn-tiny"
              onClick={() => setSelectedClientId(null)}
            >
              Close Details
            </button>
          </div>
          
          <DataTable data={clientInvoices} columns={invoiceColumns} emptyMessage="No invoices found for this client." />
        </div>
      )}
    </div>
  );
};

export default OutstandingReport;
