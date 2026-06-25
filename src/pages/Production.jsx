import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useDB, addMaterialInward, addProduction, addOutward, getMaterialStock, getProductStock, updateItem, deleteItem, getStartOfMonth, getTodayDate } from '../data/db';
import { Truck, Cpu, Calculator, Hash, Clock, Plus, X, CheckCircle, Package, ArrowDownCircle, ArrowUpRight, Edit2, Trash2 } from 'lucide-react';
import DataTable from '../components/DataTable';

const Production = ({ activeTab }) => {
  const db = useDB();
  const [formData, setFormData] = useState({});
  const [calcResult, setCalcResult] = useState({ materialsUsed: [], batchCode: '', totalAmount: 0 });
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [dateRange, setDateRange] = useState({ 
    start: getStartOfMonth(), 
    end: getTodayDate() 
  });

  useEffect(() => {
    setShowModal(false);
    setEditId(null);
    setSuccessMsg('');
  }, [activeTab]);

  // Real-time calculation for Production Entry
  useEffect(() => {
    if (activeTab === 'production' && formData.productId && formData.configId && formData.quantity) {
      const config = db.productConfigs.find(c => c.id === formData.configId);
      const product = db.products.find(p => p.id === formData.productId);
      
      const materialsUsed = (config?.materials || []).map(m => {
        const mat = db.materials.find(mat => mat.id === m.materialId);
        return {
          materialId: m.materialId,
          name: mat?.name || 'Unknown',
          quantityUsed: (Number(formData.quantity) * Number(m.consumptionPerPc || 0)).toFixed(3)
        };
      });
      
      const serial = (editId ? db.productions.find(p => p.id === editId)?.batchCode.split('-').pop() : (db.productions.length + 1).toString().padStart(4, '0'));
      const batchCode = `${product?.code || 'PRD'}-${config?.configCode || 'XXX'}-BOM-${serial}`;
      
      setCalcResult(prev => ({ ...prev, materialsUsed, batchCode }));
    } else if (activeTab === 'outward' && formData.quantity && formData.rate) {
      const totalAmount = (Number(formData.quantity) * Number(formData.rate)).toFixed(2);
      setCalcResult(prev => ({ ...prev, totalAmount }));
    }
  }, [formData, db, activeTab, editId]);

  const handleOpenModal = () => {
    const now = new Date();
    setFormData({
      date: now.toISOString().split('T')[0],
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
    setEditId(null);
    setShowModal(true);
  };

  const handleEdit = (item) => {
    setFormData(item);
    setEditId(item.id);
    setShowModal(true);
  };

  const handleDelete = async (store, id) => {
    await deleteItem(store, id);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let store = 'productions';
    if (activeTab === 'inward') store = 'materialInward';
    if (activeTab === 'outward') store = 'outward';

    if (editId) {
      const updateData = activeTab === 'inward' ? formData : 
                         activeTab === 'outward' ? { ...formData, totalAmount: Number(calcResult.totalAmount) } :
                         { ...formData, materialsUsed: calcResult.materialsUsed, batchCode: calcResult.batchCode };
      await updateItem(store, editId, updateData);
      setSuccessMsg(`${activeTab === 'inward' ? 'Inward' : activeTab === 'outward' ? 'Outward Sales' : 'Production'} Entry Updated!`);
    } else {
      if (activeTab === 'inward') {
        await addMaterialInward(formData);
        setSuccessMsg('Material Inward Recorded!');
      } else if (activeTab === 'outward') {
        await addOutward({ ...formData, totalAmount: Number(calcResult.totalAmount) });
        setSuccessMsg('Sales / Outward Entry Saved!');
      } else {
        await addProduction({ ...formData, materialsUsed: calcResult.materialsUsed, batchCode: calcResult.batchCode });
        setSuccessMsg('Production Entry Saved!');
      }
    }
    
    setFormData({});
    setEditId(null);
    setShowModal(false);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const getMaterialName = (id) => db.materials.find(m => m.id === id)?.name || 'Unknown';
  const getSupplierName = (id) => db.suppliers.find(s => s.id === id)?.name || 'Unknown';
  const getClientName = (id) => db.clients.find(c => c.id === id)?.name || 'Unknown';
  const getProductName = (id) => db.products.find(p => p.id === id)?.name || 'Unknown';
  const getConfigDetails = (id) => db.productConfigs.find(c => c.id === id);

  const renderInwardList = () => {
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
      { header: 'Material', key: 'materialId', sortable: true, filterable: true, render: (val) => <span style={{ fontWeight: 600 }}>{getMaterialName(val)}</span> },
      { header: 'Supplier', key: 'supplierId', sortable: true, filterable: true, render: (val) => getSupplierName(val) },
      { header: 'Quantity (KG)', key: 'quantity', sortable: true, filterable: true, showTotal: true, render: (val) => <span className="badge badge-green">+{val} KG</span> },
      { 
        header: 'Actions', 
        key: 'id', 
        sortable: false, 
        render: (id, row) => (
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <button className="btn btn-secondary" onClick={() => handleEdit(row)} style={{ padding: '0.3rem' }}><Edit2 size={12} color="var(--primary)" /></button>
            <button className="btn btn-secondary" onClick={() => handleDelete('materialInward', id)} style={{ padding: '0.3rem' }}><Trash2 size={12} color="#ff3b30" /></button>
          </div>
        )
      }
    ];

    const filteredData = db.materialInward.filter(item => {
      const itemDate = item.date || (item.timestamp ? new Date(item.timestamp).toISOString().split('T')[0] : '');
      return itemDate >= dateRange.start && itemDate <= dateRange.end;
    });

    return (
      <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '1rem' }}>
        <DataTable data={filteredData} columns={columns} emptyMessage="No inward records found for this period." />
      </div>
    );
  };

  const renderProductionList = () => {
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
      { header: 'Batch Code', key: 'batchCode', sortable: true, filterable: true, render: (val) => <span className="badge badge-blue">{val}</span> },
      { header: 'Product', key: 'productId', sortable: true, filterable: true, render: (val) => <span style={{ fontWeight: 600 }}>{getProductName(val)}</span> },
      { header: 'Quantity (PCS)', key: 'quantity', sortable: true, filterable: true, showTotal: true, render: (val) => <span style={{ fontWeight: 700 }}>{val}</span> },
      { 
        header: 'Materials Used (BOM)', 
        key: 'materialsUsed', 
        showTotal: true,
        calcTotal: (data) => {
          let totalKg = 0;
          data.forEach(row => {
            if (Array.isArray(row.materialsUsed)) {
              row.materialsUsed.forEach(m => totalKg += Number(m.quantityUsed || 0));
            }
          });
          return totalKg;
        },
        renderTotal: (val) => <span style={{ color: '#ff3b30', fontWeight: 800 }}>-{Number(val).toFixed(3)} KG</span>,
        render: (materials) => {
          if (!materials || !Array.isArray(materials)) return '---';
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              {materials.map((m, i) => <span key={i} style={{ color: '#ff3b30', fontSize: '0.75rem', fontWeight: 600 }}>{m.name}: -{m.quantityUsed} KG</span>)}
            </div>
          );
        }
      },
      { 
        header: 'Actions', 
        key: 'id', 
        sortable: false, 
        render: (id, row) => (
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <button className="btn btn-secondary" onClick={() => handleEdit(row)} style={{ padding: '0.3rem' }}><Edit2 size={12} color="var(--primary)" /></button>
            <button className="btn btn-secondary" onClick={() => handleDelete('productions', id)} style={{ padding: '0.3rem' }}><Trash2 size={12} color="#ff3b30" /></button>
          </div>
        )
      }
    ];

    const filteredData = db.productions.filter(item => {
      const itemDate = item.date || (item.timestamp ? new Date(item.timestamp).toISOString().split('T')[0] : '');
      return itemDate >= dateRange.start && itemDate <= dateRange.end;
    });

    return (
      <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '1rem' }}>
        <DataTable data={filteredData} columns={columns} emptyMessage="No production records found for this period." />
      </div>
    );
  };

  const renderOutwardList = () => {
    const columns = [
      { header: 'Date', key: 'timestamp', sortable: true, filterable: true, render: (val, row) => <span>{val ? new Date(val).toLocaleDateString() : (row.date || '---')}</span> },
      { header: 'Client', key: 'clientId', sortable: true, filterable: true, render: (val) => <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{getClientName(val)}</span> },
      { header: 'Product', key: 'productId', sortable: true, filterable: true, render: (val) => <span style={{ fontWeight: 600 }}>{getProductName(val)}</span> },
      { header: 'Qty (PCS)', key: 'quantity', sortable: true, filterable: true, showTotal: true, render: (val) => <span style={{ fontWeight: 700 }}>{val}</span> },
      { header: 'Rate (₹)', key: 'rate', render: (val) => `₹${val}` },
      { header: 'Total (₹)', key: 'totalAmount', sortable: true, filterable: true, showTotal: true, render: (val) => <span style={{ color: '#34c759', fontWeight: 600 }}>₹{val}</span>, renderTotal: (val) => <span style={{ color: '#34c759', fontWeight: 800 }}>₹{Number(val).toFixed(2)}</span> },
      { 
        header: 'Actions', 
        key: 'id', 
        sortable: false, 
        render: (id, row) => (
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <button className="btn btn-secondary" onClick={() => handleEdit(row)} style={{ padding: '0.3rem' }}><Edit2 size={12} color="var(--primary)" /></button>
            <button className="btn btn-secondary" onClick={() => handleDelete('outward', id)} style={{ padding: '0.3rem' }}><Trash2 size={12} color="#ff3b30" /></button>
          </div>
        )
      }
    ];

    const filteredData = db.outward.filter(item => {
      const itemDate = item.date || (item.timestamp ? new Date(item.timestamp).toISOString().split('T')[0] : '');
      return itemDate >= dateRange.start && itemDate <= dateRange.end;
    });

    return (
      <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '1rem' }}>
        <DataTable data={filteredData} columns={columns} emptyMessage="No sales records found for this period." />
      </div>
    );
  };

  const renderModal = () => {
    if (!showModal) return null;

    const availableProducts = db.products.filter(p => p.isActive !== false || p.id === formData.productId);
    const configs = db.productConfigs.filter(c => c.productId === formData.productId);

    return createPortal(
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="modal-header">
            <h2>
              {activeTab === 'inward' ? <ArrowDownCircle size={22} color="var(--primary)" /> : 
               activeTab === 'outward' ? <ArrowUpRight size={22} color="var(--primary)" /> : 
               <Plus size={22} color="var(--primary)" />}
              {editId ? 'Edit' : 'New'} {activeTab === 'inward' ? 'Material Inward' : activeTab === 'outward' ? 'Sales / Outward' : 'Production Entry'}
            </h2>
            <button className="modal-close" onClick={() => setShowModal(false)}><X size={20} /></button>
          </div>
          
          <div className="modal-body">
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="input-group">
                  <label>{activeTab === 'inward' ? 'Inward Date' : 'Production Date'}</label>
                  <input type="date" className="input-field" required value={formData.date || ''} onChange={(e) => setFormData({...formData, date: e.target.value})} />
                </div>
                <div className="input-group">
                  <label>Current Time</label>
                  <input type="text" className="input-field" required value={formData.time || ''} onChange={(e) => setFormData({...formData, time: e.target.value})} placeholder="10:00 AM" />
                </div>
              </div>

              {activeTab === 'inward' ? (
                <>
                  <div className="input-group">
                    <label>Select Supplier</label>
                    <select className="input-field" required value={formData.supplierId || ''} onChange={(e) => setFormData({...formData, supplierId: e.target.value})}>
                      <option value="">-- Choose Supplier --</option>
                      {db.suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div className="input-group">
                    <label>Select Material</label>
                    <select className="input-field" required value={formData.materialId || ''} onChange={(e) => setFormData({...formData, materialId: e.target.value})}>
                      <option value="">-- Choose Material --</option>
                      {db.materials.map(m => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.code}) - Stock: {getMaterialStock(m.id)} KG
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="input-group">
                    <label>Quantity Received (KG)</label>
                    <input type="number" step="0.01" className="input-field" required value={formData.quantity || ''} onChange={(e) => setFormData({...formData, quantity: e.target.value})} placeholder="0.00" />
                  </div>
                </>
              ) : activeTab === 'outward' ? (
                <>
                  <div className="input-group">
                    <label>Select Client</label>
                    <select className="input-field" required value={formData.clientId || ''} onChange={(e) => setFormData({...formData, clientId: e.target.value})}>
                      <option value="">-- Choose Client --</option>
                      {db.clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="input-group">
                    <label>Select Product</label>
                    <select className="input-field" required value={formData.productId || ''} onChange={(e) => setFormData({...formData, productId: e.target.value})}>
                      <option value="">-- Choose Product --</option>
                      {db.products.filter(p => p.isActive !== false).map(p => (
                        <option key={p.id} value={p.id}>{p.name} (Stock: {getProductStock(p.id)})</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="input-group">
                      <label>Sales Quantity (PCS)</label>
                      <input type="number" className="input-field" required value={formData.quantity || ''} onChange={(e) => setFormData({...formData, quantity: e.target.value})} placeholder="0" />
                    </div>
                    <div className="input-group">
                      <label>Rate / Price (₹)</label>
                      <input type="number" step="0.01" className="input-field" required value={formData.rate || ''} onChange={(e) => setFormData({...formData, rate: e.target.value})} placeholder="0.00" />
                    </div>
                  </div>
                  <div className="card" style={{ background: '#e3f9e5', border: '1px solid #34c759', marginBottom: '1.5rem', boxShadow: 'none' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                       <div>
                         <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#34c759' }}>TOTAL AMOUNT</p>
                         <h3 style={{ fontSize: '1.5rem', color: '#109930' }}>₹{calcResult.totalAmount || '0.00'}</h3>
                       </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="input-group">
                    <label>Choose Product</label>
                    <select className="input-field" required value={formData.productId || ''} onChange={(e) => setFormData({...formData, productId: e.target.value, configId: ''})}>
                      <option value="">-- Select Product --</option>
                      {availableProducts.map(p => <option key={p.id} value={p.id}>{p.name} ({p.code})</option>)}
                    </select>
                  </div>
                  <div className="input-group">
                    <label>Select Config (Type/Color)</label>
                    <select className="input-field" required disabled={!formData.productId} value={formData.configId || ''} onChange={(e) => setFormData({...formData, configId: e.target.value})}>
                      <option value="">-- Choose Config --</option>
                      {configs.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.configCode} - {c.color || 'Plain'} (BOM: {c.materials?.length || 0} items)
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="input-group">
                    <label>Production Quantity (Total PCS)</label>
                    <input type="number" className="input-field" required value={formData.quantity || ''} onChange={(e) => setFormData({...formData, quantity: e.target.value})} placeholder="Enter pcs qty" />
                  </div>

                  <div className="card" style={{ background: '#f0f7ff', border: '1px solid #007aff', marginBottom: '1.5rem', boxShadow: 'none' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                       <div>
                         <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#007aff', marginBottom: '0.5rem' }}>ESTIMATED BOM USAGE</p>
                         <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                           {(calcResult.materialsUsed || []).map((m, i) => (
                             <div key={i} style={{ display: 'flex', justifyContent: 'space-between', width: '250px' }}>
                               <span style={{ fontSize: '0.85rem' }}>{m.name}</span>
                               <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>{m.quantityUsed} KG</span>
                             </div>
                           ))}
                         </div>
                       </div>
                       <div style={{ textAlign: 'right' }}>
                         <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>BATCH CODE</p>
                         <p style={{ fontFamily: 'monospace', fontWeight: 700 }}>{calcResult.batchCode || '---'}</p>
                       </div>
                    </div>
                  </div>
                </>
              )}
              <button type="submit" className="btn btn-primary" style={{ width: '100%', height: '3.5rem', fontSize: '1rem' }}>
                {editId ? 'Update Entry' : `Save ${activeTab === 'inward' ? 'Inward Record' : activeTab === 'outward' ? 'Sales Record' : 'Production Entry'}`}
              </button>
            </form>
          </div>
        </div>
      </div>,
      document.body
    );
  };

  return (
    <div className="fade-in" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      {successMsg && (
        <div className="toast-success">
          <CheckCircle size={20} />
          {successMsg}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>
            {activeTab === 'inward' ? 'Material Inward' : activeTab === 'outward' ? 'Product Sales (Outward)' : 'Production Manager'}
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            {activeTab === 'inward' ? 'Track raw material stock arrivals' : activeTab === 'outward' ? 'Manage product sales and deliveries' : 'Monitor factory production lines'}
          </p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenModal}>
          <Plus size={20} />
          {activeTab === 'inward' ? 'New Material Inward' : activeTab === 'outward' ? 'New Sales Entry' : 'New Production Entry'}
        </button>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem', display: 'flex', alignItems: 'center', gap: '2rem', background: '#fbfbfd', border: '1px solid #e1e1e1' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <Clock size={16} color="var(--primary)" />
          <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Filter Period:</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>From:</label>
            <input 
              type="date" 
              className="input-field" 
              style={{ width: '135px', padding: '0.35rem 0.5rem', fontSize: '0.85rem' }}
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>To:</label>
            <input 
              type="date" 
              className="input-field" 
              style={{ width: '135px', padding: '0.35rem 0.5rem', fontSize: '0.85rem' }}
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
            />
          </div>
        </div>
        <button 
          className="btn btn-secondary btn-tiny"
          onClick={() => setDateRange({ start: getStartOfMonth(), end: getTodayDate() })}
          style={{ marginLeft: 'auto', fontWeight: 600 }}
        >
          Reset to Current Month
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1.5rem', marginBottom: '2.5rem' }}>
        {activeTab === 'outward' ? (
          // Display Product Stocks for Outward
          db.products.slice(0, 4).map(p => {
            const stock = Number(getProductStock(p.id));
            return (
              <div key={p.id} className="card" style={{ padding: '1rem' }}>
                 <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{p.name}</p>
                 <h2 style={{ fontSize: '1.25rem', marginTop: '0.2rem' }}>{stock} <span style={{ fontSize: '0.8rem', fontWeight: 400 }}>PCS</span></h2>
                 <div className={`stock-indicator ${stock < 100 ? 'stock-low' : ''}`}>
                   {stock < 100 ? 'Low Stock' : 'In Stock'}
                 </div>
              </div>
            );
          })
        ) : (
          // Display Material Stocks for Production / Inward
          db.materials.slice(0, 4).map(m => {
            const stock = Number(getMaterialStock(m.id));
            return (
              <div key={m.id} className="card" style={{ padding: '1rem' }}>
                 <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{m.name}</p>
                 <h2 style={{ fontSize: '1.25rem', marginTop: '0.2rem' }}>{stock} <span style={{ fontSize: '0.8rem', fontWeight: 400 }}>KG</span></h2>
                 <div className={`stock-indicator ${stock < 10 ? 'stock-low' : ''}`}>
                   {stock < 10 ? 'Low Stock' : 'In Stock'}
                 </div>
              </div>
            );
          })
        )}
      </div>

      {activeTab === 'inward' ? renderInwardList() : activeTab === 'outward' ? renderOutwardList() : renderProductionList()}
      {renderModal()}
    </div>
  );
};

export default Production;
