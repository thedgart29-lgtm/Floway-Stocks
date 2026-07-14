import React, { useState, useMemo } from 'react';
import { getDB, createEntry, generateBatchCode } from '../data/db';
import { ClipboardList, Fingerprint, History } from 'lucide-react';
import DataTable from '../components/DataTable';

const Entries = () => {
  const [db, setDb] = useState(getDB());
  const [form, setForm] = useState({
    materialId: '',
    productId: '',
    weight: '',
    pcs: '',
    typeCode: 'IND', // Example default
  });

  const previewBatch = useMemo(() => {
    if (form.materialId && form.productId) {
      const material = db.materials.find(m => m.id === form.materialId);
      const product = db.products.find(p => p.id === form.productId);
      if (material && product) {
        return generateBatchCode(product.brand.substring(0, 3).toUpperCase(), material.code, form.typeCode);
      }
    }
    return '';
  }, [form, db]);

  const handleSubmit = (e) => {
    e.preventDefault();
    createEntry({
      ...form,
      type: 'inward',
      batchCode: previewBatch,
      weight: Number(form.weight),
      pcs: Number(form.pcs)
    });
    setDb(getDB());
    setForm({ materialId: '', productId: '', weight: '', pcs: '', typeCode: 'IND' });
  };

  return (
    <div style={{ padding: '2rem', flex: 1, overflowY: 'auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <ClipboardList className="text-blue-500" />
          Production Entry (Inward)
        </h2>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Select Raw Material</label>
            <select 
              value={form.materialId}
              onChange={(e) => setForm({...form, materialId: e.target.value})}
              style={{ background: 'var(--bg-slate-900)', border: '1px solid var(--glass-border)', padding: '0.875rem', borderRadius: '8px', color: 'white' }}
              required
            >
              <option value="">-- Choose Material --</option>
              {db.materials.map(m => (
                <option key={m.id} value={m.id}>{m.name} ({m.stockWeight} KG available)</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Target Product</label>
            <select 
              value={form.productId}
              onChange={(e) => setForm({...form, productId: e.target.value})}
              style={{ background: 'var(--bg-slate-900)', border: '1px solid var(--glass-border)', padding: '0.875rem', borderRadius: '8px', color: 'white' }}
              required
            >
              <option value="">-- Choose Product --</option>
              {db.products.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.brand})</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Weight Consumed (KG)</label>
              <input 
                type="number" 
                value={form.weight}
                onChange={(e) => setForm({...form, weight: e.target.value})}
                placeholder="0.00"
                style={{ background: 'var(--bg-slate-900)', border: '1px solid var(--glass-border)', padding: '0.875rem', borderRadius: '8px', color: 'white' }} 
                required 
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>PCS Produced</label>
              <input 
                type="number" 
                value={form.pcs}
                onChange={(e) => setForm({...form, pcs: e.target.value})}
                placeholder="0"
                style={{ background: 'var(--bg-slate-900)', border: '1px solid var(--glass-border)', padding: '0.875rem', borderRadius: '8px', color: 'white' }} 
                required 
              />
            </div>
          </div>

          <div style={{ padding: '1.25rem', background: 'rgba(59, 130, 246, 0.05)', borderRadius: '12px', border: '1px dashed var(--accent-blue)', marginTop: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--accent-blue)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>
              <Fingerprint size={14} /> Batch Signature Preview
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '0.05em', color: previewBatch ? 'white' : 'var(--text-secondary)' }}>
              {previewBatch || 'SELECT MASTER DATA'}
            </div>
          </div>

          <button type="submit" className="btn-primary" style={{ padding: '1rem', marginTop: '1rem', fontSize: '1rem' }}>
            Commit Production Entry
          </button>
        </form>
      </div>

      <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column' }}>
        <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <History className="text-slate-400" />
          Recent Inward Logs
        </h2>
        
        <DataTable 
          data={db.entries} 
          columns={[
            { 
              header: 'Time', 
              key: 'timestamp', 
              sortable: true, 
              filterable: true,
              render: (val) => <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{new Date(val).toLocaleString()}</span>
            },
            { 
              header: 'Product', 
              key: 'productId', 
              sortable: true, 
              filterable: true,
              render: (val) => {
                const product = db.products.find(p => p.id === val);
                return <span style={{ fontWeight: 600 }}>{product?.name || 'Unknown'}</span>
              }
            },
            { 
              header: 'Weight', 
              key: 'weight', 
              sortable: true, 
              filterable: true,
              render: (val) => <span style={{ color: '#ff3b30', fontWeight: 600 }}>{val} KG</span>
            },
            { 
              header: 'PCS', 
              key: 'pcs', 
              sortable: true, 
              filterable: true,
              render: (val) => <span style={{ color: '#34c759', fontWeight: 600 }}>{val} PCS</span>
            },
            { 
              header: 'Batch', 
              key: 'batchCode', 
              sortable: true, 
              filterable: true,
              render: (val) => <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', padding: '0.2rem 0.4rem', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}>{val}</span>
            }
          ]} 
          emptyMessage="No production records yet." 
        />
      </div>
    </div>
  );
};

export default Entries;
