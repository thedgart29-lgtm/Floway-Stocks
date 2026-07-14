import React, { useState, useEffect } from 'react';
import { useDB, saveCompanyProfile, saveSystemPreferences, resetDatabase, saveTaxonomies } from '../data/db';
import { Plus, X, Trash2, CheckCircle2, Sliders, Settings2 } from 'lucide-react';

const Settings = () => {
  const db = useDB();
  
  // Form states
  const [companyForm, setCompanyForm] = useState({});
  const [prefForm, setPrefForm] = useState({});
  const [newItemText, setNewItemText] = useState({});
  
  // UI states
  const [loadingCompany, setLoadingCompany] = useState(false);
  const [loadingPrefs, setLoadingPrefs] = useState(false);
  const [msgCompany, setMsgCompany] = useState('');
  const [msgPrefs, setMsgPrefs] = useState('');
  const [activeTab, setActiveTab] = useState('company'); // 'company', 'system', or 'dropdowns'

  useEffect(() => {
    if (db.companyProfile) {
      setCompanyForm(db.companyProfile);
    }
    if (db.preferences) {
      setPrefForm(db.preferences);
    }
  }, [db.companyProfile, db.preferences]);

  const handleCompanySubmit = async (e) => {
    e.preventDefault();
    setLoadingCompany(true);
    setMsgCompany('');

    try {
      await saveCompanyProfile(companyForm);
      setMsgCompany('Company profile saved.');
      setTimeout(() => setMsgCompany(''), 3000);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingCompany(false);
    }
  };

  const handlePrefsSubmit = async (e) => {
    e.preventDefault();
    setLoadingPrefs(true);
    setMsgPrefs('');

    try {
      await saveSystemPreferences(prefForm);
      setMsgPrefs('Preferences updated.');
      setTimeout(() => setMsgPrefs(''), 3000);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingPrefs(false);
    }
  };

  const handleResetDB = async () => {
    if (window.confirm("WARNING: Are you sure you want to reset the database? This will delete all custom entries, transactions, and settings and reload default stock data!")) {
      await resetDatabase();
      alert("Database has been reset successfully. Page will reload.");
      window.location.reload();
    }
  };

  // Dropdown options modifications
  const handleAddItem = async (key, val) => {
    if (!val || !val.trim()) return;
    const cleanVal = val.trim();
    const currentList = db[key] || [];
    if (currentList.map(v => v.toLowerCase()).includes(cleanVal.toLowerCase())) {
      alert("This option choice already exists!");
      return;
    }
    const updatedList = [...currentList, cleanVal];
    await saveTaxonomies({ [key]: updatedList });
    setNewItemText(prev => ({ ...prev, [key]: '' }));
  };

  const handleRemoveItem = async (key, val) => {
    const currentList = db[key] || [];
    if (currentList.length <= 1) {
      alert("Cannot delete the last remaining option. Dropdowns must have at least one choice.");
      return;
    }
    if (window.confirm(`Are you sure you want to remove "${val}" from the options list?`)) {
      const updatedList = currentList.filter(item => item !== val);
      await saveTaxonomies({ [key]: updatedList });
    }
  };

  return (
    <div className="fade-in" style={{ paddingBottom: '2rem', height: '100%', overflowY: 'auto' }}>
      <h1 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.5rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Settings2 size={22} color="var(--primary)" /> Settings Configurator
      </h1>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '2rem', alignItems: 'start' }}>
        {/* Settings Navigation Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <button 
            onClick={() => setActiveTab('company')}
            className="btn" 
            style={{ 
              justifyContent: 'flex-start', 
              background: activeTab === 'company' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'company' ? 'white' : 'var(--text-main)',
              fontWeight: activeTab === 'company' ? 600 : 500,
              textAlign: 'left',
              width: '100%',
              padding: '0.6rem 1rem',
              borderRadius: '8px'
            }}
          >
            Company Profile
          </button>
          <button 
            onClick={() => setActiveTab('system')}
            className="btn" 
            style={{ 
              justifyContent: 'flex-start', 
              background: activeTab === 'system' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'system' ? 'white' : 'var(--text-main)',
              fontWeight: activeTab === 'system' ? 600 : 500,
              textAlign: 'left',
              width: '100%',
              padding: '0.6rem 1rem',
              borderRadius: '8px'
            }}
          >
            System Preferences
          </button>
          <button 
            onClick={() => setActiveTab('dropdowns')}
            className="btn" 
            style={{ 
              justifyContent: 'flex-start', 
              background: activeTab === 'dropdowns' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'dropdowns' ? 'white' : 'var(--text-main)',
              fontWeight: activeTab === 'dropdowns' ? 600 : 500,
              textAlign: 'left',
              width: '100%',
              padding: '0.6rem 1rem',
              borderRadius: '8px'
            }}
          >
            Dropdown Option Manager
          </button>
        </div>

        {/* Settings Content Area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {activeTab === 'company' && (
            <div className="card" style={{ maxWidth: '750px', animation: 'fadeIn 0.2s' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.2rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.8rem', color: 'var(--text-main)' }}>
                Company Settings
              </h3>

              {msgCompany && (
                <div style={{ background: 'rgba(99, 102, 241, 0.1)', border: '1px solid var(--primary)', color: 'var(--primary)', padding: '0.6rem 1rem', borderRadius: '6px', marginBottom: '1.2rem', fontSize: '0.8rem' }}>
                  {msgCompany}
                </div>
              )}

              <form onSubmit={handleCompanySubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                    <label>Company Name</label>
                    <input 
                      className="input-field" 
                      type="text" 
                      placeholder="e.g. Bottle Production Co." 
                      value={companyForm.name || ''} 
                      onChange={e => setCompanyForm({ ...companyForm, name: e.target.value })} 
                      required 
                    />
                  </div>
                  <div className="input-group">
                    <label>GSTIN / Tax ID</label>
                    <input 
                      className="input-field" 
                      type="text" 
                      placeholder="22AAAAA0000A1Z5" 
                      value={companyForm.gstin || ''} 
                      onChange={e => setCompanyForm({ ...companyForm, gstin: e.target.value })} 
                    />
                  </div>
                  <div className="input-group">
                    <label>Phone Number</label>
                    <input 
                      className="input-field" 
                      type="text" 
                      placeholder="+91 9999999999" 
                      value={companyForm.phone || ''} 
                      onChange={e => setCompanyForm({ ...companyForm, phone: e.target.value })} 
                    />
                  </div>
                  <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                    <label>Address</label>
                    <input 
                      className="input-field" 
                      type="text" 
                      placeholder="Street, City, State, PIN" 
                      value={companyForm.address || ''} 
                      onChange={e => setCompanyForm({ ...companyForm, address: e.target.value })} 
                      required 
                    />
                  </div>
                  <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                    <label>Email ID</label>
                    <input 
                      className="input-field" 
                      type="email" 
                      placeholder="contact@company.com" 
                      value={companyForm.email || ''} 
                      onChange={e => setCompanyForm({ ...companyForm, email: e.target.value })} 
                    />
                  </div>
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1.5rem', height: '42px', fontSize: '0.9rem', fontWeight: 'bold' }} disabled={loadingCompany}>
                  {loadingCompany ? 'Saving...' : 'Save Profile Changes'}
                </button>
              </form>
            </div>
          )}

          {activeTab === 'system' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '750px' }}>
              
              {/* Preferences Configuration */}
              <div className="card" style={{ animation: 'fadeIn 0.2s' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.2rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.8rem', color: 'var(--text-main)' }}>
                  System Preferences
                </h3>

                {msgPrefs && (
                  <div style={{ background: 'rgba(99, 102, 241, 0.1)', border: '1px solid var(--primary)', color: 'var(--primary)', padding: '0.6rem 1rem', borderRadius: '6px', marginBottom: '1.2rem', fontSize: '0.8rem' }}>
                    {msgPrefs}
                  </div>
                )}

                <form onSubmit={handlePrefsSubmit}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="input-group">
                      <label>Currency Notation</label>
                      <select 
                        className="input-field"
                        value={prefForm.currency || '₹'}
                        onChange={e => setPrefForm({ ...prefForm, currency: e.target.value })}
                      >
                        <option value="₹">Rupee (₹)</option>
                        <option value="$">US Dollar ($)</option>
                        <option value="€">Euro (€)</option>
                        <option value="£">Pound (£)</option>
                      </select>
                    </div>
                    
                    <div className="input-group">
                      <label>Low Stock Warning Limit (KG)</label>
                      <input 
                        type="number"
                        className="input-field"
                        value={prefForm.lowStockThreshold || 100}
                        onChange={e => setPrefForm({ ...prefForm, lowStockThreshold: Number(e.target.value) })}
                      />
                    </div>
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1.5rem', height: '42px', fontSize: '0.9rem', fontWeight: 'bold' }} disabled={loadingPrefs}>
                    {loadingPrefs ? 'Updating...' : 'Update Preferences'}
                  </button>
                </form>
              </div>

              {/* Danger Zone */}
              <div className="card" style={{ border: '1px solid #ef4444', animation: 'fadeIn 0.2s' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.6rem', color: '#ef4444' }}>
                  Danger Zone
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1.2rem' }}>
                  These settings affect the active application state and local storage directly. Resetting the database cannot be undone.
                </p>
                
                <button 
                  onClick={handleResetDB} 
                  className="btn" 
                  style={{ background: '#ef4444', color: 'white', width: '100%', height: '42px', fontSize: '0.9rem', fontWeight: 'bold', border: 'none' }}
                >
                  Reset System Database
                </button>
              </div>
            </div>
          )}

          {activeTab === 'dropdowns' && (
            <div className="fade-in" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              {/* Render an options management block for each category */}
              {[
                { label: 'Material Categories', key: 'materialCategories', placeholder: 'e.g. Packaging, Spares' },
                { label: 'Stock Units', key: 'stockUnits', placeholder: 'e.g. BUNDLE, BOX' },
                { label: 'Payment Modes', key: 'paymentModes', placeholder: 'e.g. Credit Card, NetBanking' },
                { label: 'Material Loss Categories', key: 'lossCategories', placeholder: 'e.g. Moisture, Quality Check' },
                { label: 'Working Shifts', key: 'workingShifts', placeholder: 'e.g. General, Evening' },
                { label: 'Invoice Payment Terms', key: 'paymentTerms', placeholder: 'e.g. Net 45 days, Advanced' }
              ].map(item => {
                const list = db[item.key] || [];
                const val = newItemText[item.key] || '';
                return (
                  <div key={item.key} className="card" style={{ display: 'flex', flexDirection: 'column', padding: '1.25rem' }}>
                    <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-main)', borderBottom: '1px solid var(--border)', paddingBottom: '0.6rem', marginBottom: '1rem', textTransform: 'uppercase' }}>
                      {item.label}
                    </h4>
                    
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1.5rem', flex: 1, contentAlign: 'start', alignContent: 'start' }}>
                      {list.map(v => (
                        <span 
                          key={v} 
                          className="badge badge-grey" 
                          style={{ 
                            display: 'inline-flex', 
                            alignItems: 'center', 
                            gap: '0.4rem', 
                            fontSize: '0.75rem', 
                            padding: '0.3rem 0.6rem', 
                            borderRadius: '4px',
                            background: 'var(--bg-hover)',
                            border: '1px solid var(--border)',
                            color: 'var(--text-main)',
                            fontWeight: 600
                          }}
                        >
                          {v}
                          <button 
                            type="button" 
                            onClick={() => handleRemoveItem(item.key, v)}
                            style={{ 
                              background: 'none', 
                              border: 'none', 
                              cursor: 'pointer', 
                              padding: 0, 
                              display: 'flex', 
                              alignItems: 'center', 
                              color: 'var(--color-error)'
                            }}
                          >
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid var(--border)', paddingTop: '0.8rem' }}>
                      <input 
                        type="text" 
                        className="input-field" 
                        value={val}
                        onChange={e => setNewItemText({ ...newItemText, [item.key]: e.target.value })}
                        placeholder={item.placeholder}
                        style={{ flex: 1, height: '32px', fontSize: '0.8rem', padding: '0 0.5rem', marginBottom: 0 }}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            handleAddItem(item.key, val);
                          }
                        }}
                      />
                      <button 
                        type="button" 
                        className="btn btn-primary"
                        onClick={() => handleAddItem(item.key, val)}
                        style={{ height: '32px', padding: '0 0.8rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                      >
                        <Plus size={12} /> Add
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Settings;
