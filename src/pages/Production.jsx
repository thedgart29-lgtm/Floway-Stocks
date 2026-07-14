import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useDB, addMaterialInward, addProduction, addOutward, addInvoice, updateInvoice, updateItem, deleteItem, getStoreMaterialStock, getFactoryMaterialStock, getProductStock, addMaterialIssue, addMaterialLoss, getStartOfMonth, getTodayDate, addPayment, deletePayment } from '../data/db';
import { Plus, X, Search, Calendar, ChevronDown, CheckCircle, Package, Droplets, Ruler, Users, Tag, Box, Info, Clock, Edit2, Trash2, Truck, Cpu, Calculator, Hash, ArrowDownCircle, ArrowUpRight, Printer, Receipt } from 'lucide-react';
import DataTable from '../components/DataTable';
import ChallanPrint from '../components/ChallanPrint';
import CustomSelect from '../components/CustomSelect';

const Production = ({ activeTab }) => {
  const db = useDB();
  const currency = db.preferences?.currency || '₹';
  const [formData, setFormData] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [printEntry, setPrintEntry] = useState(null);
  const [selectedChallanIds, setSelectedChallanIds] = useState([]);
  const [dateRange, setDateRange] = useState({ 
    start: getStartOfMonth(), 
    end: getTodayDate() 
  });

  // Reference for form hotkey submissions
  const formRef = useRef(null);

  // Real-time calculation for Production Entry and Billing
  const calcResult = useMemo(() => {
    if (activeTab === 'production' && formData.productId && formData.quantity) {
      const product = db.products.find(p => p.id === formData.productId);
      
      const materialsUsed = (product?.materials || []).map(m => {
        const mat = db.materials.find(mat => mat.id === m.materialId);
        return {
          materialId: m.materialId,
          name: mat?.name || 'Unknown',
          quantityUsed: (Number(formData.quantity) * Number(m.consumption || 0)).toFixed(3)
        };
      });
      
      const serial = (editId ? db.productions.find(p => p.id === editId)?.batchCode.split('-').pop() : (db.productions.length + 1).toString().padStart(4, '0'));
      const batchCode = `${product?.code || 'PRD'}-BOM-${serial}`;
      
      return { materialsUsed, batchCode, totalAmount: 0, pendingDues: 0 };
    } else if (activeTab === 'billing') {
      const q = Number(formData.quantity || 0);
      const r = Number(formData.rate || 0);
      const subtotal = q * r;
      const discountPct = Number(formData.discountPct || 0);
      const discountAmount = subtotal * (discountPct / 100);
      const taxPct = Number(formData.taxPct || 0);
      const taxableAmount = subtotal - discountAmount;
      const taxAmount = taxableAmount * (taxPct / 100);
      const totalAmount = Number((taxableAmount + taxAmount).toFixed(2));
      const amountPaid = Number(formData.amountPaid || 0);
      const pendingDues = Number((totalAmount - amountPaid).toFixed(2));
      
      return { materialsUsed: [], batchCode: '', totalAmount, pendingDues };
    }
    return { materialsUsed: [], batchCode: '', totalAmount: 0, pendingDues: 0 };
  }, [formData, db, activeTab, editId]);

  // Keyboard hotkey listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Escape key cancels/closes active form
      if (e.key === 'Escape') {
        if (showModal) {
          e.preventDefault();
          setShowModal(false);
          setEditId(null);
          setFormData({});
        }
      }

      // Ctrl + S or Alt + S triggers program submit
      if ((e.ctrlKey || e.metaKey || e.altKey) && e.key.toLowerCase() === 's') {
        if (showModal) {
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
  }, [showModal]);

  const handleOpenModal = () => {
    const now = new Date();
    const initialData = {
      date: now.toISOString().split('T')[0],
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    if (activeTab === 'billing') {
      const year = now.getFullYear();
      const count = db.invoices ? db.invoices.length : 0;
      initialData.invoiceNo = `INV-${year}-${(count + 1).toString().padStart(4, '0')}`;
    }
    if (activeTab === 'payments') {
      const type = 'Bill Payment';
      const prefix = 'REC-INV';
      const year = now.getFullYear();
      const filteredPayments = (db.payments || []).filter(p => p.type === type);
      initialData.type = type;
      initialData.paymentMode = 'Cash';
      initialData.amount = 0;
      initialData.receiptNo = `${prefix}-${year}-${(filteredPayments.length + 1).toString().padStart(4, '0')}`;
    }
    setFormData(initialData);
    setEditId(null);
    setSelectedChallanIds([]);
    setShowModal(true);
  };

  const handleEdit = (item) => {
    setFormData(item);
    setEditId(item.id);
    if (activeTab === 'billing') {
      const linkedChs = (db.outward || []).filter(o => o.invoiceId === item.id).map(o => o.id);
      setSelectedChallanIds(linkedChs);
    }
    setShowModal(true);
  };

  const handleDelete = async (store, id) => {
    if (activeTab === 'payments') {
      await deletePayment(id);
    } else {
      await deleteItem(store, id);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let store = 'productions';
    if (activeTab === 'inward') store = 'materialInward';
    if (activeTab === 'issue') store = 'materialIssues';
    if (activeTab === 'loss') store = 'materialLosses';
    if (activeTab === 'outward') store = 'outward';
    if (activeTab === 'billing') store = 'invoices';

    if (editId) {
      if (activeTab === 'billing') {
        const updateData = { 
          ...formData, 
          totalAmount: Number(calcResult.totalAmount),
          pendingDues: Number(calcResult.pendingDues),
          status: Number(calcResult.pendingDues) <= 0 ? 'Paid' : (Number(formData.amountPaid || 0) > 0 ? 'Partial' : 'Pending')
        };
        await updateInvoice(editId, updateData, selectedChallanIds);
      } else {
        const updateData = activeTab === 'production' ? { ...formData, materialsUsed: calcResult.materialsUsed, batchCode: calcResult.batchCode } :
                           activeTab === 'inward' ? { ...formData, unit: formData.unit || 'KG' } :
                           formData;
        await updateItem(store, editId, updateData);
      }
      setSuccessMsg(`Entry Updated!`);
    } else {
      if (activeTab === 'inward') {
        const inwardData = { ...formData, unit: formData.unit || 'KG' };
        await addMaterialInward(inwardData);
        setSuccessMsg('Material Inward Recorded!');
      } else if (activeTab === 'issue') {
        await addMaterialIssue(formData);
        setSuccessMsg('Material Issued to Factory!');
      } else if (activeTab === 'loss') {
        await addMaterialLoss(formData);
        setSuccessMsg('Material Loss Recorded!');
      } else if (activeTab === 'outward') {
        await addOutward(formData);
        setSuccessMsg('Delivery Challan Saved!');
      } else if (activeTab === 'billing') {
        const invData = { 
           ...formData, 
           totalAmount: Number(calcResult.totalAmount),
           pendingDues: Number(calcResult.pendingDues),
           status: Number(calcResult.pendingDues) <= 0 ? 'Paid' : (Number(formData.amountPaid || 0) > 0 ? 'Partial' : 'Pending')
        };
        await addInvoice(invData, selectedChallanIds);
        setSuccessMsg('Sales Invoice Saved!');
      } else if (activeTab === 'payments') {
        const payData = { 
           ...formData, 
           amount: Number(formData.amount || 0)
        };
        await addPayment(payData);
        setSuccessMsg('Payment Receipt Saved!');
      } else {
        // Validation: Check if Karigar has enough WIP stock
        for (const mat of calcResult.materialsUsed) {
          const availableWIP = getFactoryMaterialStock(mat.materialId, formData.workerId);
          if (availableWIP < Number(mat.quantityUsed)) {
            alert(`Error: Cannot produce. Insufficient material stock for ${mat.name}. Available: ${availableWIP} KG, Required: ${mat.quantityUsed} KG.`);
            return; // Halt submission
          }
        }
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

  const renderInwardList = () => {
    const columns = [
      { 
        header: 'Date', 
        key: 'timestamp', 
        sortable: true, 
        filterable: true,
        render: (val, row) => <span>{val ? new Date(val).toLocaleDateString() : (row.date || '---')}</span>
      },
      { header: 'Material', key: 'materialId', sortable: true, filterable: true, render: (val) => <span>{getMaterialName(val)}</span> },
      { header: 'Supplier', key: 'supplierId', sortable: true, filterable: true, render: (val) => getSupplierName(val) },
      { header: 'Invoice Reference', key: 'supplierInvoiceNo', render: (val) => val || '---' },
      { header: 'Vehicle No', key: 'vehicleNo', render: (val) => val || '---' },
      { header: 'Quantity', key: 'quantity', sortable: true, filterable: true, showTotal: true, render: (val, row) => <span className="badge badge-green">+{val} {row.unit || 'KG'}</span> },
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

  const getWorkerName = (id) => db.workers?.find(w => w.id === id)?.name || 'Unknown';

  const renderIssueList = () => {
    const columns = [
      { header: 'Date', key: 'timestamp', sortable: true, filterable: true, render: (val, row) => <span>{val ? new Date(val).toLocaleDateString() : (row.date || '---')}</span> },
      { header: 'Worker / Karigar', key: 'workerId', sortable: true, filterable: true, render: (val) => <span>{getWorkerName(val)}</span> },
      { header: 'Material', key: 'materialId', sortable: true, filterable: true, render: (val) => <span>{db.materials.find(m => m.id === val)?.name || 'Unknown'}</span> },
      { 
        header: 'Issued Qty', 
        key: 'quantity', 
        sortable: true, 
        filterable: true, 
        showTotal: true, 
        render: (val, row) => {
          const unit = db.materials.find(m => m.id === row.materialId)?.unit || 'KG';
          return <span style={{ color: '#ff9500' }}>-{val} {unit}</span>;
        },
        renderTotal: (val) => <span style={{ color: '#ff9500', fontWeight: 600 }}>-{Number(val).toFixed(3)}</span> 
      },
      { 
        header: 'Actions', 
        key: 'id', 
        sortable: false, 
        render: (id, row) => (
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <button className="btn btn-secondary" onClick={() => handleEdit(row)} style={{ padding: '0.3rem' }}><Edit2 size={12} color="var(--primary)" /></button>
            <button className="btn btn-secondary" onClick={() => handleDelete('materialIssues', id)} style={{ padding: '0.3rem' }}><Trash2 size={12} color="#ff3b30" /></button>
          </div>
        )
      }
    ];

    const filteredData = (db.materialIssues || []).filter(item => {
      const itemDate = item.date || (item.timestamp ? new Date(item.timestamp).toISOString().split('T')[0] : '');
      return itemDate >= dateRange.start && itemDate <= dateRange.end;
    });

    return (
      <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '1rem' }}>
        <DataTable data={filteredData} columns={columns} emptyMessage="No material issues found for this period." />
      </div>
    );
  };

  const renderLossList = () => {
    const columns = [
      { header: 'Date', key: 'timestamp', sortable: true, filterable: true, render: (val, row) => <span>{val ? new Date(val).toLocaleDateString() : (row.date || '---')}</span> },
      { header: 'Worker / Karigar', key: 'workerId', sortable: true, filterable: true, render: (val) => <span>{getWorkerName(val)}</span> },
      { header: 'Material', key: 'materialId', sortable: true, filterable: true, render: (val) => <span>{db.materials.find(m => m.id === val)?.name || 'Unknown'}</span> },
      { header: 'Loss Class', key: 'lossCategory', render: (val) => val || '---' },
      { header: 'Lost Qty', key: 'quantity', sortable: true, filterable: true, showTotal: true, render: (val) => <span style={{ color: '#ff3b30' }}>-{val} KG</span>, renderTotal: (val) => <span style={{ color: '#ff3b30', fontWeight: 600 }}>-{Number(val).toFixed(3)} KG</span> },
      { header: 'Approved By', key: 'authorizedBy', render: (val) => val || '---' },
      { header: 'Reason', key: 'reason', render: (val) => <span style={{ fontSize: '0.85rem' }}>{val}</span> },
      { 
        header: 'Actions', 
        key: 'id', 
        sortable: false, 
        render: (id, row) => (
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <button className="btn btn-secondary" onClick={() => handleEdit(row)} style={{ padding: '0.3rem' }}><Edit2 size={12} color="var(--primary)" /></button>
            <button className="btn btn-secondary" onClick={() => handleDelete('materialLosses', id)} style={{ padding: '0.3rem' }}><Trash2 size={12} color="#ff3b30" /></button>
          </div>
        )
      }
    ];

    const filteredData = (db.materialLosses || []).filter(item => {
      const itemDate = item.date || (item.timestamp ? new Date(item.timestamp).toISOString().split('T')[0] : '');
      return itemDate >= dateRange.start && itemDate <= dateRange.end;
    });

    return (
      <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '1rem' }}>
        <DataTable data={filteredData} columns={columns} emptyMessage="No material losses recorded for this period." />
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
      { header: 'Batch Code', key: 'batchCode', sortable: true, filterable: true, render: (val) => <span className="badge badge-blue">{val}</span> },
      { header: 'Product', key: 'productId', sortable: true, filterable: true, render: (val) => <span>{getProductName(val)}</span> },
      { header: 'Machine No', key: 'machineNo', render: (val) => val || '---' },
      { header: 'Shift', key: 'shift', render: (val) => val || '---' },
      { header: 'Quantity (PCS)', key: 'quantity', sortable: true, filterable: true, showTotal: true, render: (val) => <span>{val}</span> },
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
        renderTotal: (val) => <span style={{ color: '#ff3b30', fontWeight: 600 }}>-{Number(val).toFixed(3)} KG</span>,
        render: (materials) => {
          if (!materials || !Array.isArray(materials)) return '---';
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              {materials.map((m, i) => (
                <span key={i} style={{ fontSize: '0.75rem', background: 'var(--bg-hover)', padding: '2px 6px', borderRadius: '4px' }}>
                  {m.name}: <b>-{m.quantityUsed} KG</b>
                </span>
              ))}
            </div>
          );
        }
      },
      { header: 'Worker', key: 'workerId', sortable: true, filterable: true, render: (val) => getWorkerName(val) },
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
      { header: 'Challan No.', key: 'challanNo', sortable: true, filterable: true, render: (val) => <span className="badge badge-grey">{val}</span> },
      { header: 'Client / Party', key: 'clientId', sortable: true, filterable: true, render: (val) => getClientName(val) },
      { header: 'Product', key: 'productId', sortable: true, filterable: true, render: (val) => getProductName(val) },
      { header: 'Quantity (PCS)', key: 'quantity', sortable: true, filterable: true, showTotal: true, render: (val) => <span>{val} PCS</span> },
      { header: 'Vehicle No', key: 'vehicleNo', render: (val) => val || '---' },
      { header: 'Transporter', key: 'transporterName', render: (val) => val || '---' },
      { 
        header: 'Actions', 
        key: 'id', 
        sortable: false, 
        render: (id, row) => (
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <button className="btn btn-secondary" onClick={() => setPrintEntry(row)} style={{ padding: '0.3rem' }} title="Print Challan"><Printer size={12} color="var(--primary)" /></button>
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
        <DataTable data={filteredData} columns={columns} emptyMessage="No delivery challans found for this period." />
      </div>
    );
  };

  const renderBillingList = () => {
    const columns = [
      { header: 'Date', key: 'timestamp', sortable: true, filterable: true, render: (val, row) => <span>{val ? new Date(val).toLocaleDateString() : (row.date || '---')}</span> },
      { header: 'Invoice No.', key: 'invoiceNo', sortable: true, filterable: true, render: (val) => <span className="badge badge-blue">{val}</span> },
      { header: 'Client Name', key: 'clientId', sortable: true, filterable: true, render: (val) => getClientName(val) },
      { header: 'PO Reference', key: 'poNo', render: (val) => val || '---' },
      { header: 'Terms', key: 'paymentTerms', render: (val) => val || '---' },
      { header: 'Qty (PCS)', key: 'quantity', sortable: true, showTotal: true, render: (val) => val },
      { header: 'Total Amount', key: 'totalAmount', sortable: true, showTotal: true, render: (val) => `${currency}${val.toFixed(2)}` },
      { header: 'Dues Pending', key: 'pendingDues', sortable: true, showTotal: true, render: (val) => <span style={{ color: val > 0 ? '#ff3b30' : '#34c759' }}>{currency}{val.toFixed(2)}</span> },
      { 
        header: 'Status', 
        key: 'status', 
        sortable: true, 
        filterable: true, 
        render: (val) => {
          const cls = val === 'Paid' ? 'badge-green' : val === 'Partial' ? 'badge-blue' : 'badge-grey';
          return <span className={`badge ${cls}`}>{val}</span>;
        }
      },
      { 
        header: 'Actions', 
        key: 'id', 
        sortable: false, 
        render: (id, row) => (
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <button className="btn btn-secondary" onClick={() => handleEdit(row)} style={{ padding: '0.3rem' }}><Edit2 size={12} color="var(--primary)" /></button>
            <button className="btn btn-secondary" onClick={() => handleDelete('invoices', id)} style={{ padding: '0.3rem' }}><Trash2 size={12} color="#ff3b30" /></button>
          </div>
        )
      }
    ];

    const filteredData = db.invoices.filter(item => {
      const itemDate = item.date || (item.timestamp ? new Date(item.timestamp).toISOString().split('T')[0] : '');
      return itemDate >= dateRange.start && itemDate <= dateRange.end;
    });

    return (
      <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '1rem' }}>
        <DataTable data={filteredData} columns={columns} emptyMessage="No sales invoices found for this period." />
      </div>
    );
  };

  const renderPaymentsList = () => {
    const columns = [
      { header: 'Date', key: 'timestamp', sortable: true, filterable: true, render: (val, row) => <span>{val ? new Date(val).toLocaleDateString() : (row.date || '---')}</span> },
      { header: 'Receipt No.', key: 'receiptNo', sortable: true, filterable: true, render: (val) => <span className="badge badge-grey">{val}</span> },
      { header: 'Client Name', key: 'clientId', sortable: true, filterable: true, render: (val) => getClientName(val) },
      { header: 'Ref / TXN ID', key: 'refNo', render: (val) => val || '---' },
      { 
        header: 'Receipt Type', 
        key: 'type', 
        sortable: true, 
        filterable: true, 
        render: (val) => <span className={`badge ${val === 'Bill Payment' ? 'badge-blue' : 'badge-green'}`}>{val || 'Bill Payment'}</span> 
      },
      { header: 'Mode', key: 'paymentMode', sortable: true, filterable: true, render: (val) => val },
      { header: 'Amount Received', key: 'amount', sortable: true, showTotal: true, render: (val) => <span style={{ color: '#34c759' }}>{currency}{val.toFixed(2)}</span> },
      { 
        header: 'Actions', 
        key: 'id', 
        sortable: false, 
        render: (id) => (
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <button className="btn btn-secondary" onClick={() => handleDelete('payments', id)} style={{ padding: '0.3rem' }}><Trash2 size={12} color="#ff3b30" /></button>
          </div>
        )
      }
    ];

    const filtered = (db.payments || []).filter(item => {
      const itemDate = item.date || (item.timestamp ? new Date(item.timestamp).toISOString().split('T')[0] : '');
      return itemDate >= dateRange.start && itemDate <= dateRange.end;
    });

    return (
      <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '1rem' }}>
        <DataTable data={filtered} columns={columns} emptyMessage="No payment receipts found in this date range." />
      </div>
    );
  };

  const renderModal = () => {
    if (!showModal) return null;

    const availableProducts = db.products.filter(p => p.isActive !== false || p.id === formData.productId);
    const configs = db.productConfigs.filter(c => c.productId === formData.productId);

    const title = (editId ? 'Edit' : 'New') + ' ' + (
      activeTab === 'inward' ? 'Material Inward Entry' : 
      activeTab === 'issue' ? 'Store Issue Voucher' : 
      activeTab === 'production' ? 'Karigar Production Report' : 
      activeTab === 'loss' ? 'Factory Loss Voucher' : 
      activeTab === 'outward' ? 'Delivery Challan (Outward)' : 
      activeTab === 'billing' ? 'Sales Invoice Voucher' :
      'Payment Journal Voucher'
    );

    return (
      <div className="fade-in" style={{ width: '100%', paddingBottom: '3rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
          <button 
            type="button" 
            className="btn btn-secondary btn-tiny"
            onClick={() => setShowModal(false)}
            style={{ fontWeight: 600, padding: '0.4rem 0.8rem' }}
          >
            ← Back to List
          </button>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>{title}</h2>
          <div style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            Press <kbd style={{ background: 'var(--bg-hover)', padding: '2px 6px', border: '1px solid var(--border)', borderRadius: '4px' }}>Ctrl + S</kbd> to Save • <kbd style={{ background: 'var(--bg-hover)', padding: '2px 6px', border: '1px solid var(--border)', borderRadius: '4px' }}>Esc</kbd> to Cancel
          </div>
        </div>

        <form ref={formRef} onSubmit={handleSubmit}>
          {/* Card 1: Voucher Header Details */}
          <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '1.2rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
              Voucher Header Details
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1.5rem' }}>
              <div className="input-group">
                <label>
                  {activeTab === 'inward' ? 'Inward Date' :
                   activeTab === 'issue' ? 'Issue Date' :
                   activeTab === 'production' ? 'Production Date' :
                   activeTab === 'loss' ? 'Loss Date' :
                   activeTab === 'outward' ? 'Challan Date' :
                   activeTab === 'billing' ? 'Invoice Date' :
                   'Receipt Date'}
                </label>
                <input type="date" className="input-field" required value={formData.date || ''} onChange={(e) => setFormData({...formData, date: e.target.value})} style={{ marginBottom: 0 }} />
              </div>
              <div className="input-group">
                <label>Current Time</label>
                <input type="text" className="input-field" required value={formData.time || ''} onChange={(e) => setFormData({...formData, time: e.target.value})} placeholder="10:00 AM" style={{ marginBottom: 0 }} />
              </div>
              
              {/* Document Number Column */}
              {activeTab === 'outward' && (
                <div className="input-group">
                  <label>Challan Number</label>
                  <input type="text" className="input-field" required value={formData.challanNo || ''} onChange={(e) => setFormData({...formData, challanNo: e.target.value.toUpperCase()})} placeholder="CHL-2026-001" style={{ marginBottom: 0 }} />
                </div>
              )}
              {activeTab === 'billing' && (
                <div className="input-group">
                  <label>Invoice Number</label>
                  <input type="text" className="input-field" required value={formData.invoiceNo || ''} onChange={(e) => setFormData({...formData, invoiceNo: e.target.value.toUpperCase()})} placeholder="INV-2026-001" style={{ marginBottom: 0 }} />
                </div>
              )}
              {activeTab === 'payments' && (
                <div className="input-group">
                  <label>Receipt Number</label>
                  <input type="text" className="input-field" required value={formData.receiptNo || ''} onChange={(e) => setFormData({...formData, receiptNo: e.target.value.toUpperCase()})} style={{ marginBottom: 0 }} />
                </div>
              )}
              {/* Spacer fillers */}
              {['inward', 'issue', 'production', 'loss'].includes(activeTab) && <div />}

              {/* Party Selection Column */}
              {activeTab === 'inward' && (
                <div className="input-group">
                  <label>Select Supplier</label>
                  <CustomSelect
                    required
                    value={formData.supplierId || ''}
                    onChange={(e) => setFormData({...formData, supplierId: e.target.value})}
                    placeholder="-- Choose Supplier --"
                    options={db.suppliers.map(s => ({ value: s.id, label: s.name }))}
                  />
                </div>
              )}
              {['issue', 'production', 'loss'].includes(activeTab) && (
                <div className="input-group">
                  <label>Factory Karigar</label>
                  <CustomSelect
                    required
                    value={formData.workerId || ''}
                    onChange={(e) => setFormData({...formData, workerId: e.target.value})}
                    placeholder="-- Select Worker --"
                    options={(db.workers || []).map(w => ({ value: w.id, label: w.name }))}
                  />
                </div>
              )}
              {['outward', 'billing', 'payments'].includes(activeTab) && (
                <div className="input-group">
                  <label>Select Client / Party</label>
                  <CustomSelect 
                    required 
                    value={formData.clientId || ''} 
                    onChange={(e) => {
                      const newClientId = e.target.value;
                      setFormData(prev => ({ ...prev, clientId: newClientId, invoiceId: '', amount: 0 }));
                      if (!editId) {
                        setSelectedChallanIds([]);
                      }
                    }} 
                    placeholder="-- Choose Client --"
                    options={db.clients.map(c => ({ value: c.id, label: c.name }))}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Card 2: Transaction Line Items */}
          <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '1.2rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
              Line Item details
            </h3>

            {activeTab === 'inward' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 1fr 1fr', gap: '1.5rem' }}>
                <div className="input-group">
                  <label>Select Raw Material</label>
                  <CustomSelect
                    required
                    value={formData.materialId || ''}
                    onChange={(e) => setFormData({...formData, materialId: e.target.value})}
                    placeholder="-- Choose Material --"
                    options={db.materials.map(m => ({ value: m.id, label: `${m.name} (${m.code})` }))}
                  />
                </div>
                <div className="input-group">
                  <label>Quantity Received</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input type="number" step="0.01" className="input-field" required value={formData.quantity || ''} onChange={(e) => setFormData({...formData, quantity: e.target.value})} placeholder="0.00" style={{ marginBottom: 0, flex: 1 }} />
                    <CustomSelect
                      value={formData.unit || 'KG'}
                      onChange={(e) => setFormData({...formData, unit: e.target.value})}
                      placeholder="Unit"
                      style={{ width: '90px' }}
                      options={[
                        { value: 'KG', label: 'KG' },
                        { value: 'PCS', label: 'PCS' }
                      ]}
                    />
                  </div>
                </div>
                <div className="input-group">
                  <label>Supplier Invoice / Bill Ref</label>
                  <input type="text" className="input-field" value={formData.supplierInvoiceNo || ''} onChange={(e) => setFormData({...formData, supplierInvoiceNo: e.target.value})} placeholder="e.g. INV-9981" style={{ marginBottom: 0 }} />
                </div>
                <div className="input-group">
                  <label>Transporter Vehicle Number</label>
                  <input type="text" className="input-field" value={formData.vehicleNo || ''} onChange={(e) => setFormData({...formData, vehicleNo: e.target.value.toUpperCase()})} placeholder="e.g. GJ-01-XX-1234" style={{ marginBottom: 0 }} />
                </div>
              </div>
            )}

            {activeTab === 'issue' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div className="input-group">
                  <label>Select Raw Material</label>
                  <CustomSelect
                    required
                    value={formData.materialId || ''}
                    onChange={(e) => setFormData({...formData, materialId: e.target.value})}
                    placeholder="-- Choose Material --"
                    options={db.materials.map(m => ({
                      value: m.id,
                      label: `${m.name} (Store Stock: ${getStoreMaterialStock(m.id)} ${m.unit})`
                    }))}
                  />
                </div>
                <div className="input-group">
                  <label>Quantity Issued</label>
                  <input type="number" step="0.01" className="input-field" required value={formData.quantity || ''} onChange={(e) => setFormData({...formData, quantity: e.target.value})} placeholder="0.00" style={{ marginBottom: 0 }} />
                </div>
              </div>
            )}

            {activeTab === 'loss' && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                  <div className="input-group">
                    <label>Lost Material</label>
                    <CustomSelect
                      required
                      value={formData.materialId || ''}
                      onChange={(e) => setFormData({...formData, materialId: e.target.value})}
                      placeholder="-- Choose Material --"
                      options={db.materials.map(m => ({
                        value: m.id,
                        label: `${m.name} (WIP Stock: ${formData.workerId ? getFactoryMaterialStock(m.id, formData.workerId) : getFactoryMaterialStock(m.id)} ${m.unit})`
                      }))}
                    />
                  </div>
                  <div className="input-group">
                    <label>Quantity Lost</label>
                    <input type="number" step="0.01" className="input-field" required value={formData.quantity || ''} onChange={(e) => setFormData({...formData, quantity: e.target.value})} placeholder="0.00" style={{ marginBottom: 0 }} />
                  </div>
                  <div className="input-group">
                    <label>Loss Category</label>
                    <CustomSelect
                      required
                      value={formData.lossCategory || ''}
                      onChange={(e) => setFormData({...formData, lossCategory: e.target.value})}
                      placeholder="-- Choose Category --"
                      options={(db.lossCategories || ['Machine Purge', 'Spillage', 'Scrap']).map(cat => ({ value: cat, label: cat }))}
                    />
                  </div>
                  <div className="input-group">
                    <label>Authorized By (Supervisor)</label>
                    <input type="text" className="input-field" value={formData.authorizedBy || ''} onChange={(e) => setFormData({...formData, authorizedBy: e.target.value})} placeholder="e.g. Rajesh Shah" style={{ marginBottom: 0 }} />
                  </div>
                </div>
                <div className="input-group">
                  <label>Reason for Loss / Remarks</label>
                  <input type="text" className="input-field" required value={formData.reason || ''} onChange={(e) => setFormData({...formData, reason: e.target.value})} placeholder="e.g. Machine fault, Burned plastic purging" style={{ marginBottom: 0 }} />
                </div>
              </>
            )}

            {activeTab === 'production' && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                  <div className="input-group">
                    <label>Choose Product</label>
                    <CustomSelect
                      required
                      value={formData.productId || ''}
                      onChange={(e) => setFormData({...formData, productId: e.target.value})}
                      placeholder="-- Select Product --"
                      options={availableProducts.map(p => ({ value: p.id, label: `${p.name} (${p.code})` }))}
                    />
                  </div>
                  <div className="input-group">
                    <label>Production Quantity (Total PCS)</label>
                    <input type="number" className="input-field" required value={formData.quantity || ''} onChange={(e) => setFormData({...formData, quantity: e.target.value})} placeholder="Enter pcs qty" style={{ marginBottom: 0 }} />
                  </div>
                  <div className="input-group">
                    <label>Machine ID / Production Line</label>
                    <input type="text" className="input-field" value={formData.machineNo || ''} onChange={(e) => setFormData({...formData, machineNo: e.target.value})} placeholder="e.g. MCH-LINE-02" style={{ marginBottom: 0 }} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>
                  <div className="input-group">
                    <label>Working Shift</label>
                    <CustomSelect
                      value={formData.shift || ''}
                      onChange={(e) => setFormData({...formData, shift: e.target.value})}
                      placeholder="-- Select Shift --"
                      options={(db.workingShifts || ['Morning', 'Evening', 'Night']).map(sh => ({ value: sh, label: sh }))}
                    />
                  </div>
                </div>
              </>
            )}

            {activeTab === 'outward' && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                  <div className="input-group">
                    <label>Select Product</label>
                    <CustomSelect
                      required
                      value={formData.productId || ''}
                      onChange={(e) => setFormData({...formData, productId: e.target.value})}
                      placeholder="-- Choose Product --"
                      options={db.products.filter(p => p.isActive !== false).map(p => ({
                        value: p.id,
                        label: `${p.name} (Stock: ${getProductStock(p.id)} PCS)`
                      }))}
                    />
                  </div>
                  <div className="input-group">
                    <label>Quantity Dispatched (PCS)</label>
                    <input type="number" className="input-field" required value={formData.quantity || ''} onChange={(e) => setFormData({...formData, quantity: Number(e.target.value)})} placeholder="0" style={{ marginBottom: 0 }} />
                  </div>
                  <div className="input-group">
                    <label>Transporter Name</label>
                    <input type="text" className="input-field" value={formData.transporterName || ''} onChange={(e) => setFormData({...formData, transporterName: e.target.value})} placeholder="e.g. V-Trans Logistics" style={{ marginBottom: 0 }} />
                  </div>
                  <div className="input-group">
                    <label>Vehicle Number</label>
                    <input type="text" className="input-field" value={formData.vehicleNo || ''} onChange={(e) => setFormData({...formData, vehicleNo: e.target.value.toUpperCase()})} placeholder="e.g. MH-43-BB-8891" style={{ marginBottom: 0 }} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: '1.5rem' }}>
                  <div className="input-group">
                    <label>E-Way Bill Number</label>
                    <input type="text" className="input-field" value={formData.ewayBillNo || ''} onChange={(e) => setFormData({...formData, ewayBillNo: e.target.value})} placeholder="e.g. 121098231221" style={{ marginBottom: 0 }} />
                  </div>
                </div>
              </>
            )}

            {activeTab === 'billing' && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1fr', gap: '1.2rem', marginBottom: '1.5rem' }}>
                  <div className="input-group">
                    <label>Select Product</label>
                    <CustomSelect
                      required
                      value={formData.productId || ''}
                      onChange={(e) => {
                        const pid = e.target.value;
                        const prod = db.products.find(p => p.id === pid);
                        setFormData({...formData, productId: pid, rate: prod?.defaultPrice || formData.rate || ''});
                      }}
                      placeholder="-- Choose Product --"
                      options={db.products.filter(p => p.isActive !== false).map(p => ({
                        value: p.id,
                        label: `${p.name} (Stock: ${getProductStock(p.id)})`
                      }))}
                    />
                  </div>
                  <div className="input-group">
                    <label>Invoice Qty (PCS)</label>
                    <input type="number" className="input-field" required value={formData.quantity || ''} onChange={(e) => setFormData({...formData, quantity: Number(e.target.value)})} placeholder="0" style={{ marginBottom: 0 }} />
                  </div>
                  <div className="input-group">
                    <label>Rate / Price ({currency})</label>
                    <input type="number" step="0.01" className="input-field" required value={formData.rate || ''} onChange={(e) => setFormData({...formData, rate: Number(e.target.value)})} placeholder="0.00" style={{ marginBottom: 0 }} />
                  </div>
                  <div className="input-group">
                    <label>Discount (%)</label>
                    <input type="number" step="0.01" className="input-field" value={formData.discountPct || ''} onChange={(e) => setFormData({...formData, discountPct: Number(e.target.value)})} placeholder="0.00" style={{ marginBottom: 0 }} />
                  </div>
                  <div className="input-group">
                    <label>Tax (%)</label>
                    <input type="number" step="0.01" className="input-field" value={formData.taxPct || ''} onChange={(e) => setFormData({...formData, taxPct: Number(e.target.value)})} placeholder="0.00" style={{ marginBottom: 0 }} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: '1.5rem' }}>
                  <div className="input-group">
                    <label>Purchase Order (PO) Number</label>
                    <input type="text" className="input-field" value={formData.poNo || ''} onChange={(e) => setFormData({...formData, poNo: e.target.value})} placeholder="e.g. PO-8871" style={{ marginBottom: 0 }} />
                  </div>
                  <div className="input-group">
                    <label>Payment Terms</label>
                    <CustomSelect
                      value={formData.paymentTerms || ''}
                      onChange={(e) => setFormData({...formData, paymentTerms: e.target.value})}
                      placeholder="-- Choose Terms --"
                      options={(db.paymentTerms || ['Due on Receipt', 'Net 15', 'Net 30', 'Net 60']).map(term => ({ value: term, label: term }))}
                    />
                  </div>
                </div>
              </>
            )}

            {activeTab === 'payments' && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr 1.2fr', gap: '1.2rem', marginBottom: '1.5rem' }}>
                  <div className="input-group">
                    <label>Receipt Type</label>
                    <CustomSelect 
                      required 
                      value={formData.type || 'Bill Payment'} 
                      onChange={(e) => {
                        const nextType = e.target.value;
                        const prefix = nextType === 'Bill Payment' ? 'REC-INV' : 'REC-CSH';
                        const year = new Date().getFullYear();
                        const filteredPayments = (db.payments || []).filter(p => p.type === nextType);
                        setFormData(prev => ({
                          ...prev,
                          type: nextType,
                          receiptNo: `${prefix}-${year}-${(filteredPayments.length + 1).toString().padStart(4, '0')}`,
                          invoiceId: '', 
                          amount: 0
                        }));
                      }}
                      options={[
                        { value: 'Bill Payment', label: 'Bill / Invoice Payment' },
                        { value: 'Direct Cash', label: 'Direct Cash Receipt (No Bill)' }
                      ]}
                    />
                  </div>
                  
                  {formData.type === 'Bill Payment' ? (
                    <div className="input-group">
                      <label>Select Pending Invoice</label>
                      {(() => {
                        const unpaidInvoices = (db.invoices || []).filter(inv => inv.clientId === formData.clientId && inv.pendingDues > 0);
                        if (unpaidInvoices.length === 0) {
                          return (
                            <CustomSelect
                              disabled
                              placeholder="No pending bills found"
                              options={[]}
                            />
                          );
                        }
                        return (
                          <CustomSelect 
                            required 
                            value={formData.invoiceId || ''} 
                            onChange={(e) => {
                              const invId = e.target.value;
                              const inv = db.invoices.find(i => i.id === invId);
                              setFormData(prev => ({
                                ...prev,
                                invoiceId: invId,
                                amount: inv ? Number(inv.pendingDues) : 0
                              }));
                            }}
                            placeholder="-- Choose Invoice --"
                            options={unpaidInvoices.map(inv => ({
                              value: inv.id,
                              label: `Invoice ${inv.invoiceNo} (Dues: ${currency}${inv.pendingDues})`
                            }))}
                          />
                        );
                      })()}
                    </div>
                  ) : <div />}
                  
                  <div className="input-group">
                    <label>Amount Received ({currency})</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      className="input-field" 
                      required 
                      value={formData.amount || ''} 
                      onChange={(e) => setFormData({...formData, amount: Number(e.target.value)})} 
                      placeholder="0.00" 
                      style={{ marginBottom: 0 }}
                    />
                  </div>

                  <div className="input-group">
                    <label>Payment Mode</label>
                    <select 
                      className="input-field" 
                      required 
                      value={formData.paymentMode || 'Cash'} 
                      onChange={(e) => setFormData({...formData, paymentMode: e.target.value})}
                      style={{ marginBottom: 0 }}
                    >
                      {(db.paymentModes || ['Cash', 'Bank Transfer', 'UPI', 'Cheque']).map(mode => (
                        <option key={mode} value={mode}>{mode}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 2.5fr', gap: '1.5rem' }}>
                  <div className="input-group">
                    <label>Transaction ID / Cheque / UPI Ref</label>
                    <input type="text" className="input-field" value={formData.refNo || ''} onChange={(e) => setFormData({...formData, refNo: e.target.value})} placeholder="e.g. TXN-99881231" style={{ marginBottom: 0 }} />
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Card 3: Additional details / checklist */}
          {activeTab === 'billing' && formData.clientId && (
            <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                Allocated Delivery Challans (Lots)
              </h3>
              
              {(() => {
                const unbilledChallans = (db.outward || []).filter(ch => ch.clientId === formData.clientId && (!ch.invoiceId || ch.invoiceId === editId));
                if (unbilledChallans.length === 0) {
                  return <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>No pending unbilled challans registered for this client.</p>;
                }
                return (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1rem' }}>
                    {unbilledChallans.map(ch => {
                      const isChecked = selectedChallanIds.includes(ch.id);
                      return (
                        <label key={ch.id} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.75rem', background: 'var(--bg-hover)', borderRadius: '8px', border: '1px solid var(--border)', cursor: 'pointer', margin: 0 }}>
                          <input 
                            type="checkbox" 
                            checked={isChecked} 
                            onChange={() => {
                              let nextIds;
                              if (isChecked) {
                                nextIds = selectedChallanIds.filter(id => id !== ch.id);
                              } else {
                                nextIds = [...selectedChallanIds, ch.id];
                              }
                              setSelectedChallanIds(nextIds);
                              
                              const selectedChs = db.outward.filter(o => nextIds.includes(o.id));
                              if (selectedChs.length > 0) {
                                const totalQty = selectedChs.reduce((sum, o) => sum + Number(o.quantity || 0), 0);
                                const productId = selectedChs[0].productId;
                                const prod = db.products.find(p => p.id === productId);
                                setFormData(prev => ({
                                  ...prev,
                                  productId,
                                  quantity: totalQty,
                                  rate: prod?.defaultPrice || prev.rate || 0
                                }));
                              } else {
                                setFormData(prev => ({
                                  ...prev,
                                  productId: '',
                                  quantity: 0
                                }));
                              }
                            }} 
                            style={{ width: '16px', height: '16px' }}
                          />
                          <span style={{ fontSize: '0.8rem' }}>
                            <b>Challan {ch.challanNo}</b>: {ch.quantity} PCS
                          </span>
                        </label>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          )}

          {activeTab === 'production' && formData.productId && formData.configId && (
            <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                BOM Material Consumption Breakdown
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
                <div style={{ background: 'var(--bg-info-subtle)', border: '1px solid var(--color-info)', padding: '1rem', borderRadius: '8px' }}>
                  <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-info)', marginBottom: '0.75rem', textTransform: 'uppercase' }}>Estimated BOM Usage</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {(calcResult.materialsUsed || []).map((m, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dotted var(--border)', paddingBottom: '0.25rem' }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>{m.name}</span>
                        <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-error)' }}>-{m.quantityUsed} KG</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', boxShadow: 'none', background: 'var(--bg-hover)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>AUTO BATCH CODE</span>
                  <h3 style={{ fontSize: '1.5rem', fontFamily: 'monospace', fontWeight: 800, marginTop: '0.4rem', color: 'var(--primary)', letterSpacing: '1px' }}>{calcResult.batchCode || '---'}</h3>
                </div>
              </div>
            </div>
          )}

          {/* Section 4: Summary / Payments & Calculations */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem', marginTop: '2rem', borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
            {/* Left side: Remarks & Payment entries */}
            <div>
              {activeTab === 'billing' ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem' }}>
                  <div className="input-group">
                    <label>Amount Paid ({currency})</label>
                    <input type="number" step="0.01" className="input-field" value={formData.amountPaid || ''} onChange={(e) => setFormData({...formData, amountPaid: Number(e.target.value)})} placeholder="0.00" style={{ marginBottom: 0 }} />
                  </div>
                  <div className="input-group">
                    <label>Payment Mode</label>
                    <CustomSelect
                      value={formData.paymentMode || 'Cash'}
                      onChange={(e) => setFormData({...formData, paymentMode: e.target.value})}
                      options={(db.paymentModes || ['Cash', 'Bank Transfer', 'UPI', 'Cheque']).map(mode => ({ value: mode, label: mode }))}
                    />
                  </div>
                </div>
              ) : activeTab === 'payments' ? (
                <div className="input-group">
                  <label>Remarks / Notes</label>
                  <input type="text" className="input-field" value={formData.remarks || ''} onChange={(e) => setFormData({...formData, remarks: e.target.value})} placeholder="e.g. Received by cashier" style={{ marginBottom: 0 }} />
                </div>
              ) : (
                <div className="input-group">
                  <label>Transaction Notes / Remarks</label>
                  <input type="text" className="input-field" value={formData.remarks || ''} onChange={(e) => setFormData({...formData, remarks: e.target.value})} placeholder="e.g. Inward batch details, Factory comments" style={{ marginBottom: 0 }} />
                </div>
              )}
            </div>

            {/* Right side: Calculation boxes */}
            <div>
              {activeTab === 'billing' && (
                <div className="card" style={{ background: 'var(--bg-success-subtle)', border: '1px solid var(--color-success)', padding: '1rem', boxShadow: 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-success)' }}>GRAND TOTAL AMOUNT</span>
                    <h3 style={{ fontSize: '1.25rem', color: 'var(--color-success)', margin: 0 }}>{currency}{calcResult.totalAmount || '0.00'}</h3>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-error)' }}>BALANCE PENDING DUES</span>
                    <h3 style={{ fontSize: '1.25rem', color: 'var(--color-error)', margin: 0 }}>{currency}{calcResult.pendingDues || '0.00'}</h3>
                  </div>
                </div>
              )}

              {activeTab === 'payments' && formData.type === 'Bill Payment' && formData.invoiceId && (() => {
                const inv = db.invoices.find(i => i.id === formData.invoiceId);
                if (!inv) return null;
                const outstandingAfter = Math.max(0, Number(inv.pendingDues || 0) - Number(formData.amount || 0));
                return (
                  <div className="card" style={{ background: 'var(--bg-info-subtle)', border: '1px solid var(--color-info)', padding: '1rem', boxShadow: 'none' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Invoice Due Balance</span>
                      <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>{currency}{Number(inv.pendingDues).toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed var(--border)', paddingTop: '0.6rem', marginTop: '0.6rem' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 700 }}>Outstanding Balance After Receipt</span>
                      <span style={{ fontSize: '1rem', fontWeight: 800, color: outstandingAfter > 0 ? 'var(--color-error)' : 'var(--color-success)' }}>{currency}{outstandingAfter.toFixed(2)}</span>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Save & Cancel Actions bar */}
          <div style={{ display: 'flex', gap: '1rem', marginTop: '2.5rem', borderTop: '1px solid var(--border)', paddingTop: '1.5rem', justifyContent: 'flex-end' }}>
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={() => setShowModal(false)} 
              style={{ width: '120px' }}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '250px', height: '3.2rem', fontWeight: 'bold' }}
            >
              {editId ? 'Save & Update Voucher' : `Record ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Voucher`}
            </button>
          </div>
        </form>
      </div>
    );
  };

  if (showModal) {
    return (
      <div className="fade-in" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {successMsg && (
          <div className="toast-success">
            <CheckCircle size={20} />
            {successMsg}
          </div>
        )}
        {renderModal()}
      </div>
    );
  }

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
          <h1 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
            {activeTab === 'inward' ? 'Store - Material Inward' :
             activeTab === 'issue' ? 'Store - Issue Material' :
             activeTab === 'production' ? 'Factory - Production Entry' :
             activeTab === 'loss' ? 'Factory - Material Loss' :
             activeTab === 'outward' ? 'Delivery Challan (Outward)' :
             activeTab === 'billing' ? 'Sales Invoices (Billing)' :
             'Payment Journal Receipts'}
          </h1>
        </div>
        <button className="btn btn-primary" onClick={handleOpenModal}>
          <Plus size={20} />
          {activeTab === 'inward' ? 'New Material Inward' :
           activeTab === 'issue' ? 'Issue Material' :
           activeTab === 'production' ? 'New Production Entry' :
           activeTab === 'loss' ? 'Log Material Loss' :
           activeTab === 'outward' ? 'New Delivery Challan' :
           activeTab === 'billing' ? 'New Sales Invoice' :
           'Record Payment'}
        </button>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem', display: 'flex', alignItems: 'center', gap: '2rem', background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
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
        {activeTab === 'payments' ? (
          <>
            <div className="card" style={{ padding: '1rem' }}>
              <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Direct Cash Receipts</p>
              <h2 style={{ fontSize: '1.25rem', marginTop: '0.2rem', color: 'var(--color-success)' }}>
                {currency}{(db.payments || []).filter(p => p.type === 'Direct Cash').reduce((sum, p) => sum + Number(p.amount || 0), 0).toFixed(2)}
              </h2>
            </div>
            <div className="card" style={{ padding: '1rem' }}>
              <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Invoice Payments</p>
              <h2 style={{ fontSize: '1.25rem', marginTop: '0.2rem', color: 'var(--color-success)' }}>
                {currency}{(db.payments || []).filter(p => p.type === 'Bill Payment').reduce((sum, p) => sum + Number(p.amount || 0), 0).toFixed(2)}
              </h2>
            </div>
            <div className="card" style={{ padding: '1rem' }}>
              <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Total Collected</p>
              <h2 style={{ fontSize: '1.25rem', marginTop: '0.2rem', color: 'var(--primary)' }}>
                {currency}{(db.payments || []).reduce((sum, p) => sum + Number(p.amount || 0), 0).toFixed(2)}
              </h2>
            </div>
            <div className="card" style={{ padding: '1rem' }}>
              <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Total Transactions</p>
              <h2 style={{ fontSize: '1.25rem', marginTop: '0.2rem' }}>
                {(db.payments || []).length} <span style={{ fontSize: '0.8rem', fontWeight: 400 }}>Receipts</span>
              </h2>
            </div>
          </>
        ) : (activeTab === 'outward' || activeTab === 'billing') ? (
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
          // Display Material Stocks for Store or Factory
          db.materials.slice(0, 4).map(m => {
            const isFactory = activeTab === 'production' || activeTab === 'loss';
            const stock = Number(isFactory ? getFactoryMaterialStock(m.id) : getStoreMaterialStock(m.id));
            return (
              <div key={m.id} className="card" style={{ padding: '1rem' }}>
                 <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                   {isFactory ? 'WIP ' : 'STORE '} {m.name}
                 </p>
                 <h2 style={{ fontSize: '1.25rem', marginTop: '0.2rem' }}>{stock} <span style={{ fontSize: '0.8rem', fontWeight: 400 }}>KG</span></h2>
                 <div className={`stock-indicator ${stock < 10 ? 'stock-low' : ''}`}>
                   {stock < 10 ? 'Low Stock' : 'In Stock'}
                 </div>
              </div>
            );
          })
        )}
      </div>

      {activeTab === 'inward' ? renderInwardList() :
       activeTab === 'issue' ? renderIssueList() :
       activeTab === 'production' ? renderProductionList() :
       activeTab === 'loss' ? renderLossList() :
       activeTab === 'outward' ? renderOutwardList() :
       activeTab === 'billing' ? renderBillingList() :
       renderPaymentsList()}
      
      {printEntry && (
        <ChallanPrint 
          entry={printEntry}
          company={db.companyProfile || {}}
          client={db.clients.find(c => c.id === printEntry.clientId) || {}}
          product={db.products.find(p => p.id === printEntry.productId) || {}}
          onClose={() => setPrintEntry(null)}
        />
      )}
    </div>
  );
};

export default Production;
