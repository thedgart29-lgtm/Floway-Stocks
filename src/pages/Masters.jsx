import React, { useState, useEffect, useRef } from 'react';
import { useDB, addSupplier, addClient, addMaterial, addProduct, addProductConfig, addWorker, updateItem, deleteItem, saveCompanyProfile } from '../data/db';
import { Plus, Tag, Ruler, Droplets, Trash2, Edit2, Package, Users, Box, Boxes, ChevronRight, Info, CheckCircle2, XCircle, HardHat, Building2, Eye, ShieldAlert } from 'lucide-react';
import DataTable from '../components/DataTable';
import CustomSelect from '../components/CustomSelect';

const Masters = ({ activeTab }) => {
  const db = useDB();
  const currency = db.preferences?.currency || '₹';
  const [formData, setFormData] = useState(() => {
    if (activeTab === 'company') {
      return db.companyProfile || {};
    }
    return {};
  });
  const [configData, setConfigData] = useState({});
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [editId, setEditId] = useState(null);
  const [configEditId, setConfigEditId] = useState(null);

  // Layout form visibility toggles
  const [showForm, setShowForm] = useState(false);
  const [showConfigForm, setShowConfigForm] = useState(false);

  // Form references for programmatically triggering submission with validation
  const formRef = useRef(null);

  // Keyboard shortcuts event listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Escape to cancel/close active form
      if (e.key === 'Escape') {
        if (showForm || showConfigForm) {
          e.preventDefault();
          setShowForm(false);
          setShowConfigForm(false);
          setEditId(null);
          setConfigEditId(null);
          setFormData({});
        }
      }

      // Ctrl+S or Alt+S or Cmd+S to save/submit
      if ((e.ctrlKey || e.metaKey || e.altKey) && e.key.toLowerCase() === 's') {
        if (showForm || showConfigForm) {
          e.preventDefault();
          if (formRef.current) {
            formRef.current.requestSubmit();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showForm, showConfigForm]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (activeTab === 'company') {
      await saveCompanyProfile(formData);
      alert('Company Profile saved successfully!');
      return;
    }

    const storeMap = { 
      suppliers: 'suppliers', 
      clients: 'clients', 
      materials: 'materials', 
      products: 'products', 
      workers: 'workers' 
    };
    const store = storeMap[activeTab];

    if (activeTab === 'products') {
      const confirmSave = window.confirm("Are you sure you want to save this product?");
      if (!confirmSave) return;
      // Filter out invalid/empty materials
      const validMats = formData.materials?.filter(m => m.materialId && m.consumption) || [];
      formData.materials = validMats;
    }

    if (editId) {
      await updateItem(store, editId, formData);
    } else {
      if (activeTab === 'suppliers') await addSupplier(formData);
      if (activeTab === 'clients') await addClient(formData);
      if (activeTab === 'materials') await addMaterial(formData);
      if (activeTab === 'products') await addProduct(formData);
      if (activeTab === 'workers') await addWorker(formData);
    }
    
    setFormData({});
    setEditId(null);
    setShowForm(false);
  };

  const handleEdit = (item) => {
    if (activeTab === 'products') {
      setFormData({
        ...item,
        materials: item.materials?.length ? item.materials : [{ materialId: '', consumption: '' }]
      });
    } else {
      setFormData(item);
    }
    setEditId(item.id);
    setShowForm(true);
  };

  const handleOpenNewForm = () => {
    if (activeTab === 'products') {
      setFormData({
        materials: [{ materialId: '', consumption: '' }]
      });
    } else {
      setFormData({});
    }
    setEditId(null);
    setShowForm(true);
  };

  const addProductMaterial = () => {
    setFormData(prev => ({
      ...prev,
      materials: [...(prev.materials || []), { materialId: '', consumption: '' }]
    }));
  };

  const updateProductMaterial = (index, field, value) => {
    const updated = [...(formData.materials || [])];
    if (!updated[index]) updated[index] = { materialId: '', consumption: '' };
    updated[index][field] = value;
    setFormData(prev => ({ ...prev, materials: updated }));
  };

  const removeProductMaterial = (index) => {
    const updated = [...(formData.materials || [])];
    updated.splice(index, 1);
    setFormData(prev => ({ ...prev, materials: updated }));
  };

  const handleDelete = async (store, id) => {
    await deleteItem(store, id);
    if (selectedProduct?.id === id) setSelectedProduct(null);
  };

  // BOM Configuration Form Handlers
  const handleConfigSubmit = async (e) => {
    e.preventDefault();
    const mats = configData.materials?.filter(m => m.materialId && m.consumptionPerPc) || [];
    if (mats.length === 0) {
      alert("Please assign at least one raw material with consumption weight.");
      return;
    }
    const dataToSave = { ...configData, materials: mats };
    
    if (configEditId) {
      await updateItem('productConfigs', configEditId, dataToSave);
    } else {
      await addProductConfig({ ...dataToSave, productId: selectedProduct.id });
    }
    setConfigData({ materials: [{ materialId: '', consumptionPerPc: '' }] });
    setConfigEditId(null);
    setShowConfigForm(false);
  };

  const handleConfigEdit = (item) => {
    setConfigData({ ...item, materials: item.materials?.length ? item.materials : [{ materialId: '', consumptionPerPc: '' }] });
    setConfigEditId(item.id);
    setShowConfigForm(true);
  };

  const handleOpenConfigForm = () => {
    setConfigData({ materials: [{ materialId: '', consumptionPerPc: '' }] });
    setConfigEditId(null);
    setShowConfigForm(true);
  };

  const addMaterialToConfig = () => {
    setConfigData({
      ...configData,
      materials: [...(configData.materials || []), { materialId: '', consumptionPerPc: '' }]
    });
  };

  const updateConfigMaterial = (index, field, value) => {
    const updated = [...(configData.materials || [])];
    if (!updated[index]) updated[index] = { materialId: '', consumptionPerPc: '' };
    updated[index][field] = value;
    setConfigData({ ...configData, materials: updated });
  };

  const removeConfigMaterial = (index) => {
    const updated = [...(configData.materials || [])];
    updated.splice(index, 1);
    setConfigData({ ...configData, materials: updated });
  };

  // Header Component for forms
  const FormHeader = ({ title }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
      <button 
        type="button" 
        className="btn btn-secondary btn-tiny"
        onClick={() => { setShowForm(false); setShowConfigForm(false); setEditId(null); setConfigEditId(null); setFormData({}); }}
        style={{ fontWeight: 600, padding: '0.4rem 0.8rem' }}
      >
        ← Back to List
      </button>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>{title}</h2>
      <div style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
        Press <kbd style={{ background: 'var(--bg-hover)', padding: '2px 6px', border: '1px solid var(--border)', borderRadius: '4px' }}>Ctrl + S</kbd> to Save • <kbd style={{ background: 'var(--bg-hover)', padding: '2px 6px', border: '1px solid var(--border)', borderRadius: '4px' }}>Esc</kbd> to Cancel
      </div>
    </div>
  );

  // Render Page Header for Lists
  const ListHeader = ({ title, btnText, onAdd }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
      <h1 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>{title}</h1>
      {onAdd && (
        <button className="btn btn-primary" onClick={onAdd}>
          <Plus size={20} /> {btnText}
        </button>
      )}
    </div>
  );

  const renderCompanyTab = () => {
    return (
      <div className="fade-in">
        <ListHeader title="My Company Profile" />
        <div className="card" style={{ padding: '2rem' }}>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1.5rem' }}>
              <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                <label>Company Name</label>
                <input className="input-field" type="text" placeholder="e.g. Acme Corporation" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
              </div>
              <div className="input-group">
                <label>GSTIN</label>
                <input className="input-field" type="text" placeholder="22AAAAA0000A1Z5" value={formData.gstin || ''} onChange={e => setFormData({ ...formData, gstin: e.target.value })} />
              </div>
              <div className="input-group">
                <label>Phone Number</label>
                <input className="input-field" type="text" placeholder="+91 9999999999" value={formData.phone || ''} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
              </div>
              <div className="input-group" style={{ gridColumn: '3 / -1' }}>
                <label>Email ID</label>
                <input className="input-field" type="email" placeholder="contact@company.com" value={formData.email || ''} onChange={e => setFormData({ ...formData, email: e.target.value })} />
              </div>
              <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                <label>Address</label>
                <input className="input-field" type="text" placeholder="Street, City, State, PIN" value={formData.address || ''} onChange={e => setFormData({ ...formData, address: e.target.value })} required />
              </div>
            </div>
            <div style={{ marginTop: '2.5rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn btn-primary" style={{ width: '250px', height: '3.2rem', fontSize: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold' }}>
                <CheckCircle2 size={20} /> Save Company Profile
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const renderWorkerTab = () => {
    if (showForm) {
      return (
        <div className="fade-in">
          <FormHeader title={editId ? 'Edit Karigar Profile' : 'Register New Karigar'} />
          <div className="card" style={{ padding: '2rem' }}>
            <form ref={formRef} onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem' }}>
                <div className="input-group">
                  <label>Karigar Name</label>
                  <input className="input-field" required value={formData.name || ''} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="e.g. Ramesh Bhai" />
                </div>
                <div className="input-group">
                  <label>Role</label>
                  <input className="input-field" value={formData.role || ''} onChange={(e) => setFormData({...formData, role: e.target.value})} placeholder="e.g. Machine Operator" />
                </div>
                <div className="input-group">
                  <label>Phone Number</label>
                  <input className="input-field" value={formData.phone || ''} onChange={(e) => setFormData({...formData, phone: e.target.value})} placeholder="+91 ..." />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '2.5rem', borderTop: '1px solid var(--border)', paddingTop: '1.5rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => { setShowForm(false); setEditId(null); setFormData({}); }} style={{ width: '120px' }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ width: '220px', height: '3.2rem', fontWeight: 'bold' }}>
                  {editId ? 'Update Profile' : 'Register Worker'}
                </button>
              </div>
            </form>
          </div>
        </div>
      );
    }

    const columns = [
      { header: 'Karigar / Worker Name', key: 'name', sortable: true, filterable: true, render: (val) => <span>{val}</span> },
      { header: 'Role/Type', key: 'role', sortable: true, filterable: true, render: (val) => <span className="badge badge-blue">{val || 'Factory Worker'}</span> },
      { header: 'Phone', key: 'phone', sortable: true, filterable: true, render: (val) => val || '---' },
      { 
        header: 'Actions', 
        key: 'id', 
        sortable: false, 
        render: (id, row) => (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-secondary" onClick={() => handleEdit(row)} style={{ padding: '0.4rem', border: '1px solid var(--border)' }}>
              <Edit2 size={14} color="var(--primary)" />
            </button>
            <button className="btn btn-secondary" onClick={() => handleDelete('workers', id)} style={{ padding: '0.4rem', border: '1px solid var(--border)' }}>
              <Trash2 size={14} color="#ff3b30" />
            </button>
          </div>
        )
      }
    ];

    return (
      <div className="fade-in">
        <ListHeader title="Factory Karigars Directory" btnText="Register Karigar" onAdd={handleOpenNewForm} />
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: '1.5rem', marginBottom: '2rem' }}>
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem' }}>
            <div className="stat-icon" style={{ background: 'var(--bg-success-subtle)' }}><HardHat size={20} color="var(--color-success)" /></div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>TOTAL KARIGARS</span>
              <h3 style={{ fontSize: '1.4rem', margin: 0 }}>{db.workers?.length || 0}</h3>
            </div>
          </div>
        </div>

        <div className="card">
          <DataTable data={db.workers || []} columns={columns} emptyMessage="No Karigars found. Add your first worker." />
        </div>
      </div>
    );
  };

  const renderSupplierTab = () => {
    if (showForm) {
      return (
        <div className="fade-in">
          <FormHeader title={editId ? 'Edit Supplier Profile' : 'Register New Material Supplier'} />
          <div className="card" style={{ padding: '2rem' }}>
            <form ref={formRef} onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1.5rem' }}>
                <div className="input-group">
                  <label>Supplier / Company Name</label>
                  <input className="input-field" required value={formData.name || ''} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="e.g. Reliance Plastics" />
                </div>
                <div className="input-group">
                  <label>GSTIN / Tax ID</label>
                  <input className="input-field" value={formData.gstin || ''} onChange={(e) => setFormData({...formData, gstin: e.target.value.toUpperCase()})} placeholder="e.g. 24AAAAA0000A1Z2" />
                </div>
                <div className="input-group">
                  <label>Phone Number</label>
                  <input className="input-field" value={formData.phone || ''} onChange={(e) => setFormData({...formData, phone: e.target.value})} placeholder="+91 ..." />
                </div>
                <div className="input-group">
                  <label>Email Address</label>
                  <input className="input-field" type="email" value={formData.email || ''} onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="contact@supplier.com" />
                </div>
                <div className="input-group" style={{ gridColumn: '1 / -3' }}>
                  <label>Billing Address</label>
                  <input className="input-field" value={formData.address || ''} onChange={(e) => setFormData({...formData, address: e.target.value})} placeholder="e.g. Plot No 12, Industrial Phase 2" />
                </div>
                <div className="input-group">
                  <label>City</label>
                  <input className="input-field" value={formData.city || ''} onChange={(e) => setFormData({...formData, city: e.target.value})} placeholder="e.g. Ahmedabad" />
                </div>
                <div className="input-group">
                  <label>State</label>
                  <input className="input-field" value={formData.state || ''} onChange={(e) => setFormData({...formData, state: e.target.value})} placeholder="e.g. Gujarat" />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '2.5rem', borderTop: '1px solid var(--border)', paddingTop: '1.5rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => { setShowForm(false); setEditId(null); setFormData({}); }} style={{ width: '120px' }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ width: '220px', height: '3.2rem', fontWeight: 'bold' }}>
                  {editId ? 'Update Supplier' : 'Register Supplier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      );
    }

    const columns = [
      { header: 'Supplier Name', key: 'name', sortable: true, filterable: true, render: (val) => <span>{val}</span> },
      { header: 'GSTIN', key: 'gstin', sortable: true, render: (val) => val || '---' },
      { header: 'Phone', key: 'phone', sortable: true, filterable: true, render: (val) => val || '---' },
      { header: 'Email', key: 'email', sortable: true, filterable: true, render: (val) => val || '---' },
      { header: 'Location', key: 'city', render: (val, row) => row.city ? `${row.city}, ${row.state || ''}` : '---' },
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
        <ListHeader title="Suppliers Directory" btnText="Register Supplier" onAdd={handleOpenNewForm} />
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: '1.5rem', marginBottom: '2rem' }}>
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem' }}>
            <div className="stat-icon" style={{ background: 'var(--bg-success-subtle)' }}><Users size={20} color="var(--color-success)" /></div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>TOTAL SUPPLIERS</span>
              <h3 style={{ fontSize: '1.4rem', margin: 0 }}>{db.suppliers.length}</h3>
            </div>
          </div>
        </div>

        <div className="card">
          <DataTable data={db.suppliers} columns={columns} emptyMessage="No suppliers registered yet." />
        </div>
      </div>
    );
  };

  const renderClientTab = () => {
    if (showForm) {
      return (
        <div className="fade-in">
          <FormHeader title={editId ? 'Edit Client Profile' : 'Register New Buyer / Client'} />
          <div className="card" style={{ padding: '2rem' }}>
            <form ref={formRef} onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1.5rem' }}>
                <div className="input-group">
                  <label>Client / Company Name</label>
                  <input className="input-field" required value={formData.name || ''} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="e.g. Aqua Springs Beverages" />
                </div>
                <div className="input-group">
                  <label>GSTIN / Tax ID</label>
                  <input className="input-field" value={formData.gstin || ''} onChange={(e) => setFormData({...formData, gstin: e.target.value.toUpperCase()})} placeholder="e.g. 24BBBBB0000B1Z3" />
                </div>
                <div className="input-group">
                  <label>Phone Number</label>
                  <input className="input-field" value={formData.phone || ''} onChange={(e) => setFormData({...formData, phone: e.target.value})} placeholder="+91 ..." />
                </div>
                <div className="input-group">
                  <label>Email Address</label>
                  <input className="input-field" type="email" value={formData.email || ''} onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="contact@client.com" />
                </div>
                <div className="input-group" style={{ gridColumn: '1 / -4' }}>
                  <label>Billing Address</label>
                  <input className="input-field" value={formData.address || ''} onChange={(e) => setFormData({...formData, address: e.target.value})} placeholder="e.g. GIDC Phase 3, Warehouse No 4" />
                </div>
                <div className="input-group">
                  <label>City</label>
                  <input className="input-field" value={formData.city || ''} onChange={(e) => setFormData({...formData, city: e.target.value})} placeholder="e.g. Surat" />
                </div>
                <div className="input-group">
                  <label>State</label>
                  <input className="input-field" value={formData.state || ''} onChange={(e) => setFormData({...formData, state: e.target.value})} placeholder="e.g. Gujarat" />
                </div>
                <div className="input-group">
                  <label>Maximum Credit Limit ({currency})</label>
                  <input type="number" step="1000" className="input-field" value={formData.creditLimit || ''} onChange={(e) => setFormData({...formData, creditLimit: Number(e.target.value)})} placeholder="e.g. 50000" />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '2.5rem', borderTop: '1px solid var(--border)', paddingTop: '1.5rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => { setShowForm(false); setEditId(null); setFormData({}); }} style={{ width: '120px' }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ width: '220px', height: '3.2rem', fontWeight: 'bold' }}>
                  {editId ? 'Update Client' : 'Register Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      );
    }

    const columns = [
      { header: 'Client Name', key: 'name', sortable: true, filterable: true, render: (val) => <span>{val}</span> },
      { header: 'GSTIN', key: 'gstin', sortable: true, render: (val) => val || '---' },
      { header: 'Phone', key: 'phone', sortable: true, filterable: true, render: (val) => val || '---' },
      { header: 'Email', key: 'email', sortable: true, filterable: true, render: (val) => val || '---' },
      { header: 'Credit Limit', key: 'creditLimit', sortable: true, render: (val) => val ? `${currency}${val.toLocaleString()}` : '---' },
      { header: 'Location', key: 'city', render: (val, row) => row.city ? `${row.city}, ${row.state || ''}` : '---' },
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
        <ListHeader title="Clients Registry" btnText="Register Client" onAdd={handleOpenNewForm} />
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: '1.5rem', marginBottom: '2rem' }}>
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem' }}>
            <div className="stat-icon" style={{ background: 'var(--bg-success-subtle)' }}><Users size={20} color="var(--color-success)" /></div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>TOTAL BUYERS</span>
              <h3 style={{ fontSize: '1.4rem', margin: 0 }}>{db.clients.length}</h3>
            </div>
          </div>
        </div>

        <div className="card">
          <DataTable data={db.clients} columns={columns} emptyMessage="No clients registered yet." />
        </div>
      </div>
    );
  };

  const renderMaterialTab = () => {
    if (showForm) {
      return (
        <div className="fade-in">
          <FormHeader title={editId ? 'Edit Material Specifications' : 'Add New Raw Material'} />
          <div className="card" style={{ padding: '2rem' }}>
            <form ref={formRef} onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1.5rem' }}>
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
                  <CustomSelect
                    required
                    value={formData.category || ''}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    placeholder="Select Category"
                    options={(db.materialCategories || ['Raw Material', 'Colorant', 'Chemical']).map(cat => ({ value: cat, label: cat }))}
                  />
                </div>
                <div className="input-group">
                  <label>Stock Unit</label>
                  <CustomSelect
                    required
                    value={formData.unit || 'KG'}
                    onChange={(e) => setFormData({...formData, unit: e.target.value})}
                    placeholder="Select Unit"
                    options={(db.stockUnits || ['KG', 'GM', 'LTR', 'PCS']).map(unit => ({ value: unit, label: unit }))}
                  />
                </div>
                <div className="input-group">
                  <label>Minimum Stock Alert Level</label>
                  <input className="input-field" type="number" step="0.01" required value={formData.minStock || ''} onChange={(e) => setFormData({...formData, minStock: e.target.value})} placeholder="e.g. 50" />
                </div>
                <div className="input-group">
                  <label>Grade / Specification Spec</label>
                  <input className="input-field" value={formData.gradeSpec || ''} onChange={(e) => setFormData({...formData, gradeSpec: e.target.value})} placeholder="e.g. Grade-A, Food Grade" />
                </div>
                <div className="input-group" style={{ gridColumn: '3 / -1' }}>
                  <label>Brand / Manufacturer</label>
                  <input className="input-field" value={formData.brandManufacturer || ''} onChange={(e) => setFormData({...formData, brandManufacturer: e.target.value})} placeholder="e.g. Reliance, GAIL" />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '2.5rem', borderTop: '1px solid var(--border)', paddingTop: '1.5rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => { setShowForm(false); setEditId(null); setFormData({}); }} style={{ width: '120px' }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ width: '220px', height: '3.2rem', fontWeight: 'bold' }}>
                  {editId ? 'Update Material' : 'Save Material'}
                </button>
              </div>
            </form>
          </div>
        </div>
      );
    }

    const columns = [
      { header: 'Code', key: 'code', sortable: true, filterable: true, render: (val) => <span style={{ fontFamily: 'monospace', padding: '0.2rem 0.4rem', background: 'var(--bg-hover)', borderRadius: '4px' }}>{val}</span> },
      { header: 'Name', key: 'name', sortable: true, filterable: true, render: (val) => <span>{val}</span> },
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
      { header: 'Unit', key: 'unit', sortable: true, render: (val) => <span style={{ fontSize: '0.8rem' }}>{val}</span> },
      { header: 'Grade', key: 'gradeSpec', render: (val) => val || '---' },
      { header: 'Brand / Make', key: 'brandManufacturer', render: (val) => val || '---' },
      { header: 'Min Stock', key: 'minStock', sortable: true, render: (val, row) => <span style={{ fontSize: '0.8rem', color: 'var(--color-error)' }}>{val || 0} {row.unit}</span> },
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
        <ListHeader title="Material Inventory Library" btnText="Register Material" onAdd={handleOpenNewForm} />
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: '1.5rem', marginBottom: '2rem' }}>
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem' }}>
            <div className="stat-icon" style={{ background: 'var(--bg-success-subtle)' }}><Droplets size={20} color="var(--color-success)" /></div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>TOTAL MATERIAL CODES</span>
              <h3 style={{ fontSize: '1.4rem', margin: 0 }}>{db.materials.length}</h3>
            </div>
          </div>
        </div>

        <div className="card">
          <DataTable data={db.materials} columns={columns} emptyMessage="No materials found in library." />
        </div>
      </div>
    );
  };

  const renderProductTab = () => {
    // If designing/editing the product itself
    if (showForm) {
      return (
        <div className="fade-in">
          <FormHeader title={editId ? 'Modify Product Specifications' : 'Define New Finished Product'} />
          <div className="card" style={{ padding: '2rem' }}>
            <form ref={formRef} onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem', marginBottom: '2rem' }}>
                <div className="input-group">
                  <label>Product Code</label>
                  <input className="input-field" required value={formData.code || ''} onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})} placeholder="e.g. BOT-1L" />
                </div>
                <div className="input-group">
                  <label>Product Name</label>
                  <input className="input-field" required value={formData.name || ''} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="e.g. 1 Litre Mineral Water Bottle" />
                </div>
                <div className="input-group">
                  <label>Default Sale Price ({currency})</label>
                  <input type="number" min="0" step="0.01" className="input-field" placeholder="0.00" value={formData.defaultPrice || ''} onChange={(e) => setFormData({...formData, defaultPrice: parseFloat(e.target.value) || 0})} />
                </div>
                <div className="input-group">
                  <label>Price Unit</label>
                  <CustomSelect
                    value={formData.priceUnit || 'pcs'}
                    onChange={(e) => setFormData({...formData, priceUnit: e.target.value})}
                    options={[
                      { value: 'pcs', label: 'Per PCS Price' },
                      { value: 'kg', label: 'Per KG Price' }
                    ]}
                  />
                </div>
                <div className="input-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.75rem', marginTop: '1.5rem', gridColumn: 'span 2' }}>
                  <input type="checkbox" id="isActive" checked={formData.isActive !== false} onChange={(e) => setFormData({...formData, isActive: e.target.checked})} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                  <label htmlFor="isActive" style={{ margin: 0, fontWeight: 700, cursor: 'pointer' }}>Active for Production & Sales</label>
                </div>
              </div>

              {/* Composition BOM weights list in first add */}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
                  <div>
                    <label style={{ margin: 0, fontWeight: 800, fontSize: '0.95rem' }}>Bill of Materials (BOM) Raw Weights Specification</label>
                    <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                      Define raw materials consumed to produce one unit of this product.
                    </p>
                  </div>
                  <button type="button" onClick={addProductMaterial} className="btn btn-secondary btn-tiny">
                    <Plus size={14} /> Add Row
                  </button>
                </div>
                
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      <th style={{ textAlign: 'left', padding: '0.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>RAW MATERIAL</th>
                      <th style={{ textAlign: 'left', padding: '0.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)', width: '200px' }}>CONSUMPTION WEIGHT (KG / PC)</th>
                      <th style={{ textAlign: 'center', padding: '0.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)', width: '80px' }}>REMOVE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(formData.materials || []).map((mat, index) => (
                      <tr key={index} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '0.2rem 0.5rem' }}>
                          <CustomSelect
                            required
                            value={mat.materialId || ''}
                            onChange={(e) => updateProductMaterial(index, 'materialId', e.target.value)}
                            placeholder="Select Material"
                            options={db.materials.map(m => ({ value: m.id, label: `${m.name} (${m.code})` }))}
                          />
                        </td>
                        <td style={{ padding: '0.5rem' }}>
                          <input type="number" step="0.0001" className="input-field" required value={mat.consumption || ''} onChange={(e) => updateProductMaterial(index, 'consumption', e.target.value)} placeholder="0.0000" style={{ marginBottom: 0 }} />
                        </td>
                        <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                          <button type="button" className="btn btn-secondary" onClick={() => removeProductMaterial(index)} style={{ padding: '0.4rem', border: '1px solid var(--border)' }} disabled={formData.materials?.length <= 1}>
                            <Trash2 size={14} color={formData.materials?.length <= 1 ? "var(--border)" : "#ff3b30"} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ display: 'flex', gap: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1.5rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => { setShowForm(false); setEditId(null); setFormData({}); }} style={{ width: '120px' }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ width: '220px', height: '3.2rem', fontWeight: 'bold' }}>
                  {editId ? 'Update Product' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      );
    }

    // Default Products overview grid
    return (
      <div className="fade-in">
        <ListHeader title="Finished Products Registry" btnText="Define Product" onAdd={handleOpenNewForm} />
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem' }}>
            <div className="stat-icon" style={{ background: 'var(--bg-success-subtle)' }}><Boxes size={20} color="var(--color-success)" /></div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>TOTAL REGISTERED PRODUCTS</span>
              <h3 style={{ fontSize: '1.4rem', margin: 0 }}>{db.products.length}</h3>
            </div>
          </div>
        </div>

        <div className="master-grid" style={{ gridTemplateColumns: '1.2fr 1.8fr' }}>
          {/* Products List Panel */}
          <div className="card">
            <h3 className="section-title">Products List</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {db.products.map(p => (
                <div key={p.id} onClick={() => setSelectedProduct(p)} className={`stat-card ${selectedProduct?.id === p.id ? 'active' : ''}`} style={{ 
                  cursor: 'pointer',
                  padding: '0.8rem 1rem',
                  border: selectedProduct?.id === p.id ? '1px solid var(--primary)' : '1px solid var(--border)',
                  background: selectedProduct?.id === p.id ? 'var(--bg-hover)' : 'var(--bg-card)',
                  opacity: p.isActive === false ? 0.6 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  borderRadius: 'var(--radius)'
                }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 500, fontSize: '0.8rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem', margin: 0 }}>
                      {p.name}
                      {p.isActive === false ? <XCircle size={12} color="var(--color-error)" /> : <CheckCircle2 size={12} color="var(--color-success)" />}
                    </p>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0 0' }}>
                      Code: {p.code} • Rate: {currency}{p.defaultPrice?.toFixed(2)} / {p.priceUnit || 'pcs'}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                    <button className="btn btn-secondary" onClick={(e) => { e.stopPropagation(); handleEdit(p); }} style={{ padding: '0.3rem', border: '1px solid var(--border)' }}><Edit2 size={12} color="var(--primary)" /></button>
                    <button className="btn btn-secondary" onClick={(e) => { e.stopPropagation(); handleDelete('products', p.id); }} style={{ padding: '0.3rem', border: '1px solid var(--border)' }}><Trash2 size={12} color="var(--color-error)" /></button>
                    <ChevronRight size={16} color={selectedProduct?.id === p.id ? 'var(--primary)' : 'var(--border)'} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* BOM Specifications Panel */}
          <div>
            {selectedProduct ? (
              <div className="fade-in">
                <div className="card" style={{ marginBottom: '1.5rem', borderTop: '4px solid var(--primary)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <div>
                      <h2 style={{ fontSize: '1.1rem', fontWeight: 800 }}>{selectedProduct.name} Ingredients</h2>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>Raw materials required for 1 unit of production</p>
                    </div>
                  </div>
                  
                  <DataTable data={selectedProduct.materials || []} columns={[
                    { 
                      header: 'Material Code', 
                      key: 'materialId', 
                      render: (val) => {
                        const m = db.materials.find(x => x.id === val);
                        return <span className="badge badge-blue">{m?.code || '---'}</span>;
                      } 
                    },
                    { 
                      header: 'Material Name', 
                      key: 'materialId', 
                      render: (val) => {
                        const m = db.materials.find(x => x.id === val);
                        return m?.name || '---';
                      } 
                    },
                    { 
                      header: 'Consumption Weight', 
                      key: 'consumption', 
                      render: (val) => <span style={{ fontWeight: 600 }}>{val} KG</span> 
                    }
                  ]} emptyMessage="No BOM parameters configured for this product yet. Edit this product to define composition." />
                </div>
              </div>
            ) : (
              <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '400px', textAlign: 'center' }}>
                <div style={{ background: 'var(--bg-hover)', padding: '2rem', borderRadius: '100%', marginBottom: '1.5rem' }}>
                  <Package size={48} color="var(--text-secondary)" />
                </div>
                <h2 style={{ color: 'var(--text-main)', fontWeight: 800, fontSize: '1rem' }}>No Product Selected</h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', maxWidth: '300px', marginTop: '0.5rem', lineHeight: 1.4 }}>
                  Select a product from the left side panel to view its Bill of Material weights.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (activeTab === 'company') return renderCompanyTab();
  if (activeTab === 'suppliers') return renderSupplierTab();
  if (activeTab === 'clients') return renderClientTab();
  if (activeTab === 'materials') return renderMaterialTab();
  if (activeTab === 'products') return renderProductTab();
  if (activeTab === 'workers') return renderWorkerTab();

  return null;
};

// Helper component for settings icon
const SettingsIcon = ({ size, color }) => <Box size={size} color={color} />;

export default Masters;
