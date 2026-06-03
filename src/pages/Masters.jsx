import React, { useState, useEffect } from 'react';
import { useDB, addSupplier, addClient, addMaterial, addProduct, addProductConfig, updateItem, deleteItem } from '../data/db';
import { Plus, Tag, Ruler, Droplets, Trash2, Edit2, Package, Users, Box, Boxes, ChevronRight, Info, CheckCircle2, XCircle } from 'lucide-react';
import DataTable from '../components/DataTable';

const Masters = ({ activeTab }) => {
  const db = useDB();
  const [formData, setFormData] = useState({});
  const [configData, setConfigData] = useState({});
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [editId, setEditId] = useState(null);
  const [configEditId, setConfigEditId] = useState(null);

  useEffect(() => {
    setFormData({});
    setEditId(null);
  }, [activeTab]);



  const handleSubmit = async (e) => {
    e.preventDefault();
    const storeMap = { suppliers: 'suppliers', clients: 'clients', materials: 'materials', products: 'products' };
    const store = storeMap[activeTab];

    if (editId) {
      await updateItem(store, editId, formData);
    } else {
      if (activeTab === 'suppliers') await addSupplier(formData);
      if (activeTab === 'clients') await addClient(formData);
      if (activeTab === 'materials') await addMaterial(formData);
      if (activeTab === 'products') await addProduct(formData);
    }
    
    setFormData({});
    setEditId(null);
  };

  const handleEdit = (item) => {
    setFormData(item);
    setEditId(item.id);
  };

  const handleDelete = async (store, id) => {
    await deleteItem(store, id);
    if (selectedProduct?.id === id) setSelectedProduct(null);
  };

  const renderSupplierTab = () => {
    const columns = [
      { header: 'Supplier Name', key: 'name', sortable: true, filterable: true, render: (val) => <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{val}</span> },
      { header: 'Phone', key: 'phone', sortable: true, filterable: true, render: (val) => val || '---' },
      { header: 'Email', key: 'email', sortable: true, filterable: true, render: (val) => val || '---' },
      { 
        header: 'Actions', 
        key: 'id', 
        sortable: false, 
        render: (id, row) => (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-secondary" onClick={() => handleEdit(row)} style={{ padding: '0.4rem', border: '1px solid var(--border)' }}>
              <Edit2 size={14} color="var(--primary)" />
            </button>
            <button className="btn btn-secondary" onClick={() => handleDelete('suppliers', id)} style={{ padding: '0.4rem', border: '1px solid var(--border)' }}>
              <Trash2 size={14} color="#ff3b30" />
            </button>
          </div>
        )
      }
    ];

    return (
      <div className="fade-in">
        <div className="stats-bar">
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#e1f0ff' }}><Users size={20} color="#007aff" /></div>
            <div className="stat-info"><p>Total Suppliers</p><h3>{db.suppliers.length}</h3></div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#fef7e0' }}><Info size={20} color="#f59e0b" /></div>
            <div className="stat-info"><p>Active Registry</p><h3>Stable</h3></div>
          </div>
        </div>

        <div className="master-grid">
          <div className="card form-sidebar">
            <h3 className="section-title">{editId ? <Edit2 size={18} color="var(--primary)" /> : <Plus size={18} color="var(--primary)" />} {editId ? 'Edit Supplier' : 'Add Supplier'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="input-group">
                <label>Company Name</label>
                <input className="input-field" required value={formData.name || ''} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="e.g. Reliance Plastics" />
              </div>
              <div className="input-group">
                <label>Phone Number</label>
                <input className="input-field" value={formData.phone || ''} onChange={(e) => setFormData({...formData, phone: e.target.value})} placeholder="+91 ..." />
              </div>
              <div className="input-group">
                <label>Email Address</label>
                <input className="input-field" type="email" value={formData.email || ''} onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="contact@supplier.com" />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, height: '3rem' }}>{editId ? 'Update Supplier' : 'Register Supplier'}</button>
                {editId && <button type="button" className="btn btn-secondary" onClick={() => { setEditId(null); setFormData({}); }} style={{ padding: '0 1rem' }}>Cancel</button>}
              </div>
            </form>
          </div>

          <div className="card">
            <h3 className="section-title"><Users size={18} color="var(--primary)" /> Supplier Registry</h3>
            <DataTable data={db.suppliers} columns={columns} emptyMessage="No suppliers registered yet." />
          </div>
        </div>
      </div>
    );
  };

  const renderClientTab = () => {
    const columns = [
      { header: 'Client Name', key: 'name', sortable: true, filterable: true, render: (val) => <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{val}</span> },
      { header: 'Phone', key: 'phone', sortable: true, filterable: true, render: (val) => val || '---' },
      { header: 'Email', key: 'email', sortable: true, filterable: true, render: (val) => val || '---' },
      { 
        header: 'Actions', 
        key: 'id', 
        sortable: false, 
        render: (id, row) => (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-secondary" onClick={() => handleEdit(row)} style={{ padding: '0.4rem', border: '1px solid var(--border)' }}>
              <Edit2 size={14} color="var(--primary)" />
            </button>
            <button className="btn btn-secondary" onClick={() => handleDelete('clients', id)} style={{ padding: '0.4rem', border: '1px solid var(--border)' }}>
              <Trash2 size={14} color="#ff3b30" />
            </button>
          </div>
        )
      }
    ];

    return (
      <div className="fade-in">
        <div className="stats-bar">
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#e1f0ff' }}><Users size={20} color="#007aff" /></div>
            <div className="stat-info"><p>Total Clients</p><h3>{db.clients.length}</h3></div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#fef7e0' }}><Info size={20} color="#f59e0b" /></div>
            <div className="stat-info"><p>Active Registry</p><h3>Stable</h3></div>
          </div>
        </div>

        <div className="master-grid">
          <div className="card form-sidebar">
            <h3 className="section-title">{editId ? <Edit2 size={18} color="var(--primary)" /> : <Plus size={18} color="var(--primary)" />} {editId ? 'Edit Client' : 'Add Client'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="input-group">
                <label>Client / Company Name</label>
                <input className="input-field" required value={formData.name || ''} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="e.g. Reliance Plastics" />
              </div>
              <div className="input-group">
                <label>Phone Number</label>
                <input className="input-field" value={formData.phone || ''} onChange={(e) => setFormData({...formData, phone: e.target.value})} placeholder="+91 ..." />
              </div>
              <div className="input-group">
                <label>Email Address</label>
                <input className="input-field" type="email" value={formData.email || ''} onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="contact@client.com" />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, height: '3rem' }}>{editId ? 'Update Client' : 'Register Client'}</button>
                {editId && <button type="button" className="btn btn-secondary" onClick={() => { setEditId(null); setFormData({}); }} style={{ padding: '0 1rem' }}>Cancel</button>}
              </div>
            </form>
          </div>

          <div className="card">
            <h3 className="section-title"><Users size={18} color="var(--primary)" /> Client Registry</h3>
            <DataTable data={db.clients} columns={columns} emptyMessage="No clients registered yet." />
          </div>
        </div>
      </div>
    );
  };

  const renderMaterialTab = () => {
    const columns = [
      { header: 'Code', key: 'code', sortable: true, filterable: true, render: (val) => <span style={{ fontFamily: 'monospace', fontWeight: 600, padding: '0.2rem 0.4rem', background: '#f2f2f7', borderRadius: '4px' }}>{val}</span> },
      { header: 'Name', key: 'name', sortable: true, filterable: true, render: (val) => <span style={{ fontWeight: 600 }}>{val}</span> },
      { 
        header: 'Category', 
        key: 'category', 
        sortable: true, 
        filterable: true,
        render: (val) => {
          const colors = { 'Raw Material': 'badge-blue', 'Colorant': 'badge-green', 'Chemical': 'badge-grey' };
          return <span className={`badge ${colors[val] || 'badge-grey'}`}>{val || 'General'}</span>
        }
      },
      { header: 'Unit', key: 'unit', sortable: true, render: (val) => <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{val}</span> },
      { 
        header: 'Actions', 
        key: 'id', 
        sortable: false, 
        render: (id, row) => (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-secondary" onClick={() => handleEdit(row)} style={{ padding: '0.4rem', border: '1px solid var(--border)' }}>
              <Edit2 size={14} color="var(--primary)" />
            </button>
            <button className="btn btn-secondary" onClick={() => handleDelete('materials', id)} style={{ padding: '0.4rem', border: '1px solid var(--border)' }}>
              <Trash2 size={14} color="#ff3b30" />
            </button>
          </div>
        )
      }
    ];

    return (
      <div className="fade-in">
        <div className="stats-bar">
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#e3f9e5' }}><Box size={20} color="#34c759" /></div>
            <div className="stat-info"><p>Material Types</p><h3>{db.materials.length}</h3></div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#f5f5f7' }}><Tag size={20} color="var(--text-secondary)" /></div>
            <div className="stat-info"><p>Last Updated</p><h3>Today</h3></div>
          </div>
        </div>

        <div className="master-grid">
          <div className="card form-sidebar">
            <h3 className="section-title">{editId ? <Edit2 size={18} color="var(--primary)" /> : <Tag size={18} color="var(--primary)" />} {editId ? 'Edit Material' : 'New Material'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="input-group">
                <label>Material Code</label>
                <input className="input-field" required value={formData.code || ''} onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})} placeholder="MAT01" />
              </div>
              <div className="input-group">
                <label>Formal Name</label>
                <input className="input-field" required value={formData.name || ''} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="PET Granules" />
              </div>
              <div className="input-group">
                <label>Category</label>
                <select className="input-field" value={formData.category || ''} onChange={(e) => setFormData({...formData, category: e.target.value})}>
                  <option value="">Select Category</option>
                  <option value="Raw Material">Raw Material</option>
                  <option value="Colorant">Colorant</option>
                  <option value="Chemical">Chemical</option>
                </select>
              </div>
              <div className="input-group">
                <label>Stock Unit</label>
                <select className="input-field" value={formData.unit || 'KG'} onChange={(e) => setFormData({...formData, unit: e.target.value})}>
                  <option value="KG">KG</option>
                  <option value="GM">GM</option>
                  <option value="LTR">LTR</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, height: '3rem' }}>{editId ? 'Update Material' : 'Save to Library'}</button>
                {editId && <button type="button" className="btn btn-secondary" onClick={() => { setEditId(null); setFormData({}); }} style={{ padding: '0 1rem' }}>Cancel</button>}
              </div>
            </form>
          </div>

          <div className="card">
            <h3 className="section-title"><Box size={18} color="var(--primary)" /> Material Library</h3>
            <DataTable data={db.materials} columns={columns} emptyMessage="No materials found in library." />
          </div>
        </div>
      </div>
    );
  };

  const renderProductTab = () => {
    const handleConfigSubmit = async (e) => {
      e.preventDefault();
      if (configEditId) {
        await updateItem('productConfigs', configEditId, configData);
      } else {
        await addProductConfig({ ...configData, productId: selectedProduct.id });
      }
      setConfigData({});
      setConfigEditId(null);
    };

    const handleConfigEdit = (item) => {
      setConfigData(item);
      setConfigEditId(item.id);
    };

    return (
      <div className="fade-in">
        <div className="stats-bar">
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#e1f0ff' }}><Boxes size={20} color="#007aff" /></div>
            <div className="stat-info"><p>Products Defined</p><h3>{db.products.length}</h3></div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#f2f2f7' }}><Ruler size={20} color="var(--text-secondary)" /></div>
            <div className="stat-info"><p>Total Configs</p><h3>{db.productConfigs.length}</h3></div>
          </div>
        </div>

        <div className="master-grid">
          <div className="form-sidebar">
            <div className="card" style={{ marginBottom: '2rem' }}>
              <h3 className="section-title">{editId ? <Edit2 size={18} color="var(--primary)" /> : <Plus size={18} color="var(--primary)" />} {editId ? 'Edit Product' : 'Define Product'}</h3>
              <form onSubmit={handleSubmit}>
                <div className="input-group"><label>Product Code</label><input className="input-field" required value={formData.code || ''} onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})} /></div>
                <div className="input-group"><label>Product Name</label><input className="input-field" required value={formData.name || ''} onChange={(e) => setFormData({...formData, name: e.target.value})} /></div>
                <div className="input-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <input type="checkbox" id="isActive" checked={formData.isActive !== false} onChange={(e) => setFormData({...formData, isActive: e.target.checked})} style={{ width: '18px', height: '18px' }} />
                  <label htmlFor="isActive" style={{ margin: 0, fontWeight: 700 }}>Active for Production</label>
                </div>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1, height: '3rem' }}>{editId ? 'Update Product' : 'Create Product'}</button>
                  {editId && <button type="button" className="btn btn-secondary" onClick={() => { setEditId(null); setFormData({}); }} style={{ padding: '0 1rem' }}>Cancel</button>}
                </div>
              </form>
            </div>

            <div className="card">
              <h3 className="section-title"><Package size={18} color="var(--primary)" /> Select Product</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {db.products.map(p => (
                  <div key={p.id} onClick={() => setSelectedProduct(p)} className={`stat-card ${selectedProduct?.id === p.id ? 'active' : ''}`} style={{ 
                    cursor: 'pointer',
                    padding: '0.75rem 1rem',
                    border: selectedProduct?.id === p.id ? '1px solid var(--primary)' : '1px solid var(--border)',
                    background: selectedProduct?.id === p.id ? '#f0f7ff' : 'white',
                    opacity: p.isActive === false ? 0.6 : 1
                  }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 700, fontSize: '0.9rem', color: selectedProduct?.id === p.id ? 'var(--primary)' : 'inherit', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        {p.name}
                        {p.isActive === false ? <XCircle size={12} color="#ff3b30" /> : <CheckCircle2 size={12} color="#34c759" />}
                      </p>
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Code: {p.code}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button className="btn btn-secondary" onClick={(e) => { e.stopPropagation(); handleEdit(p); }} style={{ padding: '0.3rem', border: '1px solid var(--border)' }}><Edit2 size={12} color="var(--primary)" /></button>
                      <button className="btn btn-secondary" onClick={(e) => { e.stopPropagation(); handleDelete('products', p.id); }} style={{ padding: '0.3rem', border: '1px solid var(--border)' }}><Trash2 size={12} color="#ff3b30" /></button>
                      <ChevronRight size={16} color={selectedProduct?.id === p.id ? 'var(--primary)' : 'var(--border)'} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div>
            {selectedProduct ? (
              <div className="fade-in">
                <div className="card" style={{ marginBottom: '2rem', borderTop: '4px solid var(--primary)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <div>
                      <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>{selectedProduct.name} Configuration</h2>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{configEditId ? `Editing Config: ${configData.configCode}` : 'Add a new production variant'}</p>
                    </div>
                    <span className={`badge ${selectedProduct.isActive === false ? 'badge-grey' : 'badge-blue'}`}>
                      {selectedProduct.isActive === false ? 'INACTIVE' : 'ACTIVE'}
                    </span>
                  </div>
                  
                  <form onSubmit={handleConfigSubmit}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                      <div className="input-group"><label>Config Code (e.g. BLU)</label><input className="input-field" required value={configData.configCode || ''} onChange={(e) => setConfigData({...configData, configCode: e.target.value.toUpperCase()})} /></div>
                      <div className="input-group"><label>Color / Finish</label><input className="input-field" value={configData.color || ''} onChange={(e) => setConfigData({...configData, color: e.target.value})} placeholder="e.g. Transparent Blue" /></div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                      <div className="input-group"><label>Capacity / Dimensions</label><input className="input-field" required value={configData.capacity || ''} onChange={(e) => setConfigData({...configData, capacity: e.target.value})} placeholder="e.g. 500ml, 1 Ltr" /></div>
                      <div className="input-group"><label>Neck Size</label><input className="input-field" value={configData.neckSize || ''} onChange={(e) => setConfigData({...configData, neckSize: e.target.value})} placeholder="e.g. 28mm CTC" /></div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                      <div className="input-group">
                        <label>Material Consumption (Weight)</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <input type="number" step="0.001" className="input-field" required value={configData.consumptionPerPc || ''} onChange={(e) => setConfigData({...configData, consumptionPerPc: e.target.value})} />
                          <span style={{ fontWeight: 600, fontSize: '0.8rem' }}>KG</span>
                        </div>
                      </div>
                      <div className="input-group"><label>Packaging (Pcs/Box)</label><input type="number" className="input-field" value={configData.packaging || ''} onChange={(e) => setConfigData({...configData, packaging: e.target.value})} placeholder="e.g. 100" /></div>
                    </div>
                    <div className="input-group">
                      <label>Assigned Raw Material</label>
                      <select className="input-field" required value={configData.materialId || ''} onChange={(e) => setConfigData({...configData, materialId: e.target.value})}>
                        <option value="">Select Material</option>
                        {db.materials.map(m => <option key={m.id} value={m.id}>{m.name} ({m.code})</option>)}
                      </select>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                      <button type="submit" className="btn btn-primary" style={{ flex: 1, height: '3.5rem', fontSize: '1rem' }}>{configEditId ? 'Update Configuration' : 'Assign Configuration'}</button>
                      {configEditId && <button type="button" className="btn btn-secondary" onClick={() => { setConfigEditId(null); setConfigData({}); }} style={{ padding: '0 1.5rem' }}>Cancel</button>}
                    </div>
                  </form>
                </div>

                <div className="card">
                  <h3 className="section-title"><SettingsIcon size={18} color="var(--primary)" /> Saved Parameters</h3>
                  <DataTable data={db.productConfigs.filter(c => c.productId === selectedProduct.id)} columns={[
                    { header: 'Config Code', key: 'configCode', sortable: true, render: (val) => <span className="badge badge-blue">{val}</span> },
                    { header: 'Color', key: 'color', render: (val) => val || '---' },
                    { header: 'Capacity', key: 'capacity', render: (val) => val || '---' },
                    { header: 'Neck Size', key: 'neckSize', render: (val) => val || '---' },
                    { header: 'Weight', key: 'consumptionPerPc', render: (val) => <span style={{ fontWeight: 700 }}>{val} KG</span> },
                    { header: 'Packaging', key: 'packaging', render: (val) => val ? `${val} pcs` : '---' },
                    { 
                      header: 'Actions', 
                      key: 'id', 
                      sortable: false, 
                      render: (id, row) => (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button className="btn btn-secondary" onClick={() => handleConfigEdit(row)} style={{ padding: '0.3rem', border: '1px solid var(--border)' }}><Edit2 size={12} color="var(--primary)" /></button>
                          <button className="btn btn-secondary" onClick={() => handleDelete('productConfigs', id)} style={{ padding: '0.3rem', border: '1px solid var(--border)' }}><Trash2 size={12} color="#ff3b30" /></button>
                        </div>
                      )
                    }
                  ]} emptyMessage="No parameters defined yet." />
                </div>
              </div>
            ) : (
              <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '500px', textAlign: 'center' }}>
                <div style={{ background: '#f5f5f7', padding: '2.5rem', borderRadius: '100%', marginBottom: '2rem' }}>
                  <Package size={64} color="var(--text-secondary)" />
                </div>
                <h2 style={{ color: 'var(--text-main)', fontWeight: 800 }}>Registry Selection Required</h2>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', maxWidth: '350px', marginTop: '0.75rem' }}>
                  Please select a product from the list on the left to manage its physical parameters and material consumption.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (activeTab === 'suppliers') return renderSupplierTab();
  if (activeTab === 'clients') return renderClientTab();
  if (activeTab === 'materials') return renderMaterialTab();
  if (activeTab === 'products') return renderProductTab();

  return null;
};

// Helper component for settings icon
const SettingsIcon = ({ size, color }) => <Box size={size} color={color} />;

export default Masters;
