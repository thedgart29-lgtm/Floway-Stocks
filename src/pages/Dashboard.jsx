import React, { useState, useMemo } from 'react';
import { useDB, getStoreMaterialStock } from '../data/db';
import { 
  AlertTriangle, Users, Package, HardHat, FileBox, IndianRupee, Activity, Box, Filter, TrendingUp, TrendingDown
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import DataTable from '../components/DataTable';

const Dashboard = () => {
  const db = useDB();
  const currency = db.preferences?.currency || '₹';

  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  const formatDateForInput = (d) => {
    const offset = d.getTimezoneOffset();
    const date = new Date(d.getTime() - (offset*60*1000));
    return date.toISOString().split('T')[0];
  };

  const [fromDate, setFromDate] = useState(formatDateForInput(firstDay));
  const [toDate, setToDate] = useState(formatDateForInput(today));
  const [showComparison, setShowComparison] = useState(false);

  const fromTime = new Date(fromDate).setHours(0,0,0,0);
  const toTime = new Date(toDate).setHours(23,59,59,999);
  const diffTime = toTime - fromTime;
  const prevToTime = fromTime - 1;
  const prevFromTime = prevToTime - diffTime;

  const isWithinDate = (dateStr) => {
    if (!dateStr) return false;
    const t = new Date(dateStr).getTime();
    return t >= fromTime && t <= toTime;
  };
  
  const isWithinPrevDate = (dateStr) => {
    if (!dateStr) return false;
    const t = new Date(dateStr).getTime();
    return t >= prevFromTime && t <= prevToTime;
  };

  const currentSales = (db.invoices || []).filter(x => isWithinDate(x.timestamp));
  const prevSales = (db.invoices || []).filter(x => isWithinPrevDate(x.timestamp));
  const currentSalesAmount = currentSales.reduce((sum, x) => sum + Number(x.totalAmount || 0), 0);
  const prevSalesAmount = prevSales.reduce((sum, x) => sum + Number(x.totalAmount || 0), 0);

  const currentDispatches = (db.outward || []).filter(x => isWithinDate(x.timestamp));

  const currentProd = (db.productions || []).filter(x => isWithinDate(x.createdAt));
  const prevProd = (db.productions || []).filter(x => isWithinPrevDate(x.createdAt));
  const currentProdQty = currentProd.reduce((sum, x) => sum + Number(x.quantity || 0), 0);
  const prevProdQty = prevProd.reduce((sum, x) => sum + Number(x.quantity || 0), 0);
  
  const currentInward = (db.materialInward || []).filter(x => isWithinDate(x.createdAt));
  const prevInward = (db.materialInward || []).filter(x => isWithinPrevDate(x.createdAt));
  const currentInwardQty = currentInward.reduce((sum, x) => sum + Number(x.quantity || 0), 0);
  const prevInwardQty = prevInward.reduce((sum, x) => sum + Number(x.quantity || 0), 0);

  const calculateChange = (current, prev) => {
    if (prev === 0 && current > 0) return { val: 100, type: 'up' };
    if (prev === 0 && current === 0) return { val: 0, type: 'flat' };
    const diff = current - prev;
    const perc = (diff / prev) * 100;
    return { val: Math.abs(perc).toFixed(1), type: diff >= 0 ? 'up' : 'down' };
  };

  const renderTrend = (current, prev) => {
    if (!showComparison) return null;
    const change = calculateChange(current, prev);
    if (change.type === 'flat') return <span style={{ fontSize: '0.8rem', color: '#888' }}>- 0%</span>;
    return (
      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: change.type === 'up' ? '#34c759' : '#ff3b30', display: 'flex', alignItems: 'center', gap: '2px' }}>
        {change.type === 'up' ? <TrendingUp size={14}/> : <TrendingDown size={14}/>} {change.val}%
      </span>
    );
  };

  const chartData = useMemo(() => {
    const days = {};
    const d = new Date(fromTime);
    while (d <= new Date(toTime)) {
      const label = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
      days[label] = { date: label, production: 0, sales: 0 };
      d.setDate(d.getDate() + 1);
    }
    
    (db.productions || []).forEach(p => {
      if (!p.createdAt) return;
      const t = new Date(p.createdAt).getTime();
      if (t >= fromTime && t <= toTime) {
        const label = new Date(p.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
        if (days[label]) days[label].production += Number(p.quantity || 0);
      }
    });
    
    (db.invoices || []).forEach(s => {
      if (!s.timestamp) return;
      const t = new Date(s.timestamp).getTime();
      if (t >= fromTime && t <= toTime) {
        const label = new Date(s.timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
        if (days[label]) days[label].sales += Number(s.totalAmount || 0);
      }
    });
    return Object.values(days);
  }, [db.productions, db.invoices, fromTime, toTime]);

  // Low Stock Calculation
  const lowStockMaterials = db.materials.map(m => {
    const storeStock = getStoreMaterialStock(m.id);
    return { ...m, storeStock };
  }).filter(m => Number(m.minStock || 0) > 0 && m.storeStock <= Number(m.minStock || 0));

  const lowStockColumns = [
    { header: 'Material Code', key: 'code', render: (val) => <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{val}</span> },
    { header: 'Name', key: 'name', render: (val) => <span style={{ fontWeight: 600 }}>{val}</span> },
    { header: 'Min Stock', key: 'minStock', render: (val) => `${val || 0} KG` },
    { header: 'Current Stock', key: 'storeStock', render: (val) => <span style={{ color: '#ff3b30', fontWeight: 800 }}>{val} KG</span> }
  ];

  // Recent Sales Calculation
  const recentSales = currentSales.slice(-5).reverse();
  const salesColumns = [
    { header: 'Date', key: 'timestamp', render: (val, row) => <span>{val ? new Date(val).toLocaleDateString() : (row.date || '---')}</span> },
    { header: 'Invoice', key: 'invoiceNo', render: (val) => <span className="badge badge-grey">{val || '---'}</span> },
    { header: 'Client', key: 'clientId', render: (val) => <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{db.clients.find(c => c.id === val)?.name || 'Unknown'}</span> },
    { header: 'Amount', key: 'totalAmount', render: (val) => <span style={{ color: '#22c55e', fontWeight: 600 }}>{currency}{val}</span> },
    { 
      header: 'Status', 
      key: 'status', 
      render: (val) => {
        const s = val || 'Pending';
        return <span className={`badge ${s === 'Paid' ? 'badge-green' : s === 'Partial' ? 'badge-blue' : 'badge-red'}`}>{s}</span>;
      }
    }
  ];

  // Pending Dues Calculation
  const totalPendingDues = (db.invoices || []).reduce((acc, curr) => acc + Number(curr.pendingDues || 0), 0);

  // Master Ledger Calculation
  const getMatName = id => db.materials.find(m => m.id === id)?.name || 'Unknown';
  const getProdName = id => db.products.find(p => p.id === id)?.name || 'Unknown';
  
  const ledger = [
    ...(db.materialInward || []).filter(x => isWithinDate(x.createdAt)).map(x => ({ ...x, _type: 'Inward', _desc: `Received ${getMatName(x.materialId)}`, _impact: `+${x.quantity} KG`, _color: 'badge-blue' })),
    ...(db.materialIssues || []).filter(x => isWithinDate(x.createdAt)).map(x => ({ ...x, _type: 'Issue', _desc: `Issued ${getMatName(x.materialId)}`, _impact: `-${x.quantity} KG`, _color: 'badge-grey' })),
    ...currentProd.map(x => ({ ...x, _type: 'Production', _desc: `Produced ${getProdName(x.productId)}`, _impact: `+${x.quantity} PCS`, _color: 'badge-green' })),
    ...(db.materialLosses || []).filter(x => isWithinDate(x.createdAt)).map(x => ({ ...x, _type: 'Loss', _desc: `Lost ${getMatName(x.materialId)}`, _impact: `-${x.quantity} KG`, _color: 'badge-red' })),
    ...currentDispatches.map(x => ({ ...x, _type: 'Dispatch', _desc: `Dispatched ${getProdName(x.productId)}`, _impact: `-${x.quantity} PCS`, _color: 'badge-grey' })),
    ...currentSales.map(x => ({ ...x, _type: 'Invoice', _desc: `Billed ${getProdName(x.productId)}`, _impact: `+${currency}${x.totalAmount}`, _color: 'badge-blue' }))
  ].sort((a, b) => new Date(b.createdAt || b.timestamp) - new Date(a.createdAt || a.timestamp));

  const ledgerColumns = [
    { header: 'Date', key: 'createdAt', render: (val, row) => <span>{new Date(val || row.timestamp).toLocaleString('en-IN')}</span> },
    { header: 'Type', key: '_type', render: (val, row) => <span className={`badge ${row._color}`}>{val}</span> },
    { header: 'Description', key: '_desc', render: (val) => <span style={{ fontWeight: 600 }}>{val}</span> },
    { header: 'Impact', key: '_impact', render: (val) => <span style={{ fontWeight: 700, color: val.startsWith('+') ? '#34c759' : '#ff3b30' }}>{val}</span> }
  ];

  return (
    <div className="fade-in" style={{ padding: '1rem 0 2rem 0', overflowY: 'auto', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>Overview Dashboard</h1>
        </div>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 500 }}>
            <input type="checkbox" checked={showComparison} onChange={e => setShowComparison(e.target.checked)} style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }} />
            Compare Previous Period
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-card)', padding: '0.4rem 0.8rem', borderRadius: '8px', border: '1px solid var(--border)', boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
            <Filter size={16} color="var(--text-secondary)" />
            <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-main)' }} />
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>to</span>
            <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-main)' }} />
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="stats-bar" style={{ marginBottom: '2rem' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(34, 197, 94, 0.12)' }}><IndianRupee size={20} color="#22c55e" /></div>
          <div className="stat-info"><p>Total Sales</p><div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.6rem' }}><h3>{currency}{currentSalesAmount.toFixed(2)}</h3>{renderTrend(currentSalesAmount, prevSalesAmount)}</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.12)' }}><Package size={20} color="var(--primary)" /></div>
          <div className="stat-info"><p>Production Volume</p><div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.6rem' }}><h3>{currentProdQty} <span style={{fontSize:'0.9rem', fontWeight:400}}>PCS</span></h3>{renderTrend(currentProdQty, prevProdQty)}</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.12)' }}><Box size={20} color="#f59e0b" /></div>
          <div className="stat-info"><p>Material Inward</p><div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.6rem' }}><h3>{currentInwardQty.toFixed(1)} <span style={{fontSize:'0.9rem', fontWeight:400}}>KG</span></h3>{renderTrend(currentInwardQty, prevInwardQty)}</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(239, 68, 68, 0.12)' }}><AlertTriangle size={20} color="#ef4444" /></div>
          <div className="stat-info"><p>Pending Dues (All Time)</p><h3>{currency}{totalPendingDues.toFixed(2)}</h3></div>
        </div>
      </div>

      {/* Analytics Chart */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
           <h3 className="section-title" style={{ marginBottom: 0 }}>
             Production vs Sales Trend
           </h3>
        </div>
        <div style={{ height: '300px', width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorProd" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0a84ff" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#0a84ff" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#30d158" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#30d158" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} dy={10} />
              <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} />
              <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} />
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <RechartsTooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-main)', boxShadow: 'var(--shadow)' }} />
              <Area yAxisId="left" type="monotone" dataKey="production" name="Production (PCS)" stroke="#0a84ff" fillOpacity={1} fill="url(#colorProd)" />
              <Area yAxisId="right" type="monotone" dataKey="sales" name="Sales (₹)" stroke="#30d158" fillOpacity={1} fill="url(#colorSales)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        
        {/* Low Stock Alerts */}
        <div className="card" style={lowStockMaterials.length > 0 ? { border: '1px solid var(--border)' } : {}}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
             <h3 className="section-title" style={{ color: lowStockMaterials.length > 0 ? '#ef4444' : 'inherit' }}>
               Material Low Stock Alerts
             </h3>
             {lowStockMaterials.length > 0 && <span className="badge badge-red">{lowStockMaterials.length} Alerts</span>}
          </div>
          <DataTable data={lowStockMaterials} columns={lowStockColumns} emptyMessage="No low stock alerts. All materials are sufficiently stocked!" />
        </div>

        {/* Recent Invoices */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
             <h3 className="section-title">
               Recent Invoices (Billing)
             </h3>
          </div>
          <DataTable data={recentSales} columns={salesColumns} emptyMessage="No recent invoices recorded." />
        </div>
      </div>

      {/* Master Activity Ledger */}
      <div className="card" style={{ marginTop: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
           <h3 className="section-title">
             Master Activity Ledger (Har Ek Entry)
           </h3>
        </div>
        <DataTable data={ledger} columns={ledgerColumns} emptyMessage="No activity recorded in the system yet." />
      </div>
    </div>
  );
};

export default Dashboard;
