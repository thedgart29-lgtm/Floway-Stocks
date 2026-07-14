import React, { useState } from 'react';
import { useDB, deleteItem, getStartOfMonth, getTodayDate } from '../data/db';
import { FileText, Calendar, Package, Tag, Layers, Trash2, Clock } from 'lucide-react';
import DataTable from '../components/DataTable';

const History = () => {
  const db = useDB();
  const [dateRange, setDateRange] = useState({ 
    start: getStartOfMonth(), 
    end: getTodayDate() 
  });

  const getProductName = (id) => db.products.find(p => p.id === id)?.name || 'Unknown';
  const getConfigDetails = (id) => db.productConfigs.find(c => c.id === id);

  const columns = [
    { 
      header: 'Date', 
      key: 'timestamp', 
      sortable: true, 
      filterable: true,
      render: (val, row) => <span>{val ? new Date(val).toLocaleDateString() : (row.date || '---')}</span>
    },
    { 
      header: 'Time', 
      key: 'timestamp', 
      sortable: true, 
      filterable: true,
      render: (val, row) => <span style={{ color: 'var(--text-secondary)' }}>{val ? new Date(val).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (row.time || '---')}</span>
    },
    { 
      header: 'Batch Code', 
      key: 'batchCode', 
      sortable: true, 
      filterable: true,
      render: (val) => <span className="badge badge-blue" style={{ fontFamily: 'monospace', letterSpacing: '0.05em' }}>{val}</span>
    },
    { 
      header: 'Product', 
      key: 'productId', 
      sortable: true, 
      filterable: true,
      render: (val) => <span style={{ fontWeight: 600 }}>{getProductName(val)}</span>
    },
    { 
      header: 'Config / Color', 
      key: 'configId', 
      sortable: false, 
      filterable: false,
      render: (val) => {
        const config = getConfigDetails(val);
        return (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
             <span style={{ fontSize: '0.85rem' }}>{config?.size}</span>
             <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{config?.color || 'Plain'}</span>
          </div>
        );
      }
    },
    { 
      header: 'Quantity (PCS)', 
      key: 'quantity', 
      sortable: true, 
      filterable: true,
      showTotal: true,
      render: (val) => <span style={{ fontWeight: 700 }}>{val}</span>
    },
    { 
      header: 'Material Used (KG)', 
      key: 'materialUsed', 
      sortable: true, 
      filterable: true,
      showTotal: true,
      render: (val) => <span style={{ color: '#007aff', fontWeight: 600 }}>{Number(val)?.toFixed(3)}</span>,
      renderTotal: (val) => <span style={{ color: '#007aff', fontWeight: 800 }}>{Number(val).toFixed(3)}</span>
    },
    {
      header: 'Actions',
      key: 'id',
      sortable: false,
      render: (id) => (
        <button className="btn btn-secondary" onClick={async () => await deleteItem('productions', id)} style={{ padding: '0.3rem', border: '1px solid var(--border)' }}>
          <Trash2 size={14} color="#ff3b30" />
        </button>
      )
    }
  ];


  const filteredProductions = db.productions.filter(item => {
    const itemDate = item.date || (item.timestamp ? new Date(item.timestamp).toISOString().split('T')[0] : '');
    return itemDate >= dateRange.start && itemDate <= dateRange.end;
  });

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '1.5rem', padding: '1rem', display: 'flex', alignItems: 'center', gap: '2rem', background: 'var(--bg-card)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Filter History:</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>From:</label>
            <input 
              type="date" 
              className="input-field" 
              style={{ width: '130px', padding: '0.3rem 0.5rem', fontSize: '0.8rem' }}
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>To:</label>
            <input 
              type="date" 
              className="input-field" 
              style={{ width: '130px', padding: '0.3rem 0.5rem', fontSize: '0.8rem' }}
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
            />
          </div>
        </div>
        <button 
          className="btn btn-secondary btn-tiny"
          onClick={() => setDateRange({ start: getStartOfMonth(), end: getTodayDate() })}
          style={{ marginLeft: 'auto' }}
        >
          Current Month
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'rgba(10, 132, 255, 0.15)', padding: '0.75rem', borderRadius: '12px' }}>
            <Package size={24} color="#007aff" />
          </div>
          <div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>PERIOD PRODUCTIONS</p>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{filteredProductions.length}</h2>
          </div>
        </div>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'rgba(52, 199, 89, 0.15)', padding: '0.75rem', borderRadius: '12px' }}>
            <Layers size={24} color="#34c759" />
          </div>
          <div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>PRODUCT VARIANTS</p>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{db.productConfigs.length}</h2>
          </div>
        </div>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'rgba(245, 158, 11, 0.15)', padding: '0.75rem', borderRadius: '12px' }}>
            <Tag size={24} color="#f59e0b" />
          </div>
          <div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>TOTAL MATERIALS</p>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{db.materials.length}</h2>
          </div>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            Production Register
          </h3>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
             Live Data Feed
          </div>
        </div>

        <DataTable 
          data={filteredProductions} 
          columns={columns} 
          emptyMessage="No production records found. Start by adding a production entry." 
        />
      </div>
    </div>
  );
};

export default History;
