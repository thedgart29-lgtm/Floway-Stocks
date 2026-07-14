import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { Printer, X, Settings2, FileText, Copy } from 'lucide-react';

const ChallanPrint = ({ entry, company, client, product, onClose }) => {
  const [paperSize, setPaperSize] = useState('A4');
  const [copies, setCopies] = useState(1);

  const getPageDimensions = () => {
    switch (paperSize) {
      case 'A5': return { width: '148mm', minHeight: '210mm' };
      case 'Letter': return { width: '215.9mm', minHeight: '279.4mm' };
      case 'Receipt': return { width: '80mm', minHeight: 'auto' };
      default: return { width: '210mm', minHeight: '297mm' }; // A4
    }
  };

  const dimensions = getPageDimensions();

  const isInvoice = !!entry.invoiceNo;
  const currency = '₹';

  // Render a single challan page
  const renderChallan = (copyIndex) => (
    <div key={copyIndex} className="challan-container printable-area" style={{ width: dimensions.width, minHeight: dimensions.minHeight }}>
      
      {/* Top Section (Fixed Height) */}
      <div>
        <div className="challan-header">
          <h1 className="challan-title">{isInvoice ? 'TAX INVOICE' : 'DELIVERY CHALLAN'}</h1>
          <div className="challan-meta">
            <div><b>{isInvoice ? 'Invoice No' : 'Challan No'}:</b> {entry.invoiceNo || entry.challanNo || entry.id}</div>
            <div><b>Date:</b> {new Date(entry.createdAt || entry.timestamp).toLocaleDateString('en-IN')}</div>
            {copies > 1 && <div style={{ fontSize: '10px', marginTop: '4px' }}>Copy {copyIndex + 1} of {copies}</div>}
          </div>
        </div>

        <div className="challan-parties" style={{ flexDirection: paperSize === 'Receipt' ? 'column' : 'row' }}>
          <div className="party-box from-party">
            <h3>From:</h3>
            <h4>{company?.name || 'Company Name Not Set'}</h4>
            {company?.address && <p>{company.address}</p>}
            {company?.gstin && <p><b>GSTIN:</b> {company.gstin}</p>}
            {company?.phone && <p><b>Phone:</b> {company.phone}</p>}
            {company?.email && <p><b>Email:</b> {company.email}</p>}
          </div>
          <div className="party-box to-party">
            <h3>To:</h3>
            <h4>{client?.name || 'Unknown Client'}</h4>
            {client?.address && <p>{client.address}</p>}
            {client?.phone && <p><b>Phone:</b> {client.phone}</p>}
          </div>
        </div>
      </div>

      {/* Middle Section (Stretches to fill space) */}
      <div className="table-wrapper">
        <table className="challan-table">
          <thead>
            <tr>
              <th>Sr. No.</th>
              <th>Description of Goods</th>
              {!isInvoice && <th style={{ textAlign: 'center' }}>HSN / SAC</th>}
              <th style={{ textAlign: 'center' }}>Quantity (PCS)</th>
              {isInvoice && <th style={{ textAlign: 'right' }}>Rate</th>}
              {isInvoice && entry.discountPct > 0 && <th style={{ textAlign: 'right' }}>Discount</th>}
              {isInvoice && entry.taxPct > 0 && <th style={{ textAlign: 'right' }}>Tax</th>}
              {isInvoice && <th style={{ textAlign: 'right' }}>Amount</th>}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>1</td>
              <td>{product?.name || 'Unknown Product'} {product?.code ? `(${product.code})` : ''}</td>
              {!isInvoice && <td style={{ textAlign: 'center' }}>---</td>}
              <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{entry.quantity}</td>
              {isInvoice && <td style={{ textAlign: 'right' }}>{currency}{Number(entry.rate || 0).toFixed(2)}</td>}
              {isInvoice && entry.discountPct > 0 && <td style={{ textAlign: 'right' }}>{entry.discountPct}%</td>}
              {isInvoice && entry.taxPct > 0 && <td style={{ textAlign: 'right' }}>{entry.taxPct}%</td>}
              {isInvoice && <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{currency}{Number(entry.totalAmount || 0).toFixed(2)}</td>}
            </tr>
            {/* Filler row that pushes the bottom border down without taking space from real rows */}
            <tr className="filler-row">
              <td></td><td></td><td></td><td></td>
              {isInvoice && <td></td>}
              {isInvoice && entry.discountPct > 0 && <td></td>}
              {isInvoice && entry.taxPct > 0 && <td></td>}
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={isInvoice ? (3 + (entry.discountPct > 0 ? 1 : 0) + (entry.taxPct > 0 ? 1 : 0)) : 3} style={{ textAlign: 'right', fontWeight: 'bold' }}>Total:</td>
              <td style={{ textAlign: isInvoice ? 'right' : 'center', fontWeight: 'bold' }}>
                {isInvoice ? `${currency}${Number(entry.totalAmount || 0).toFixed(2)}` : `${entry.quantity} PCS`}
              </td>
            </tr>
            {isInvoice && Number(entry.amountPaid || 0) > 0 && (
              <tr>
                <td colSpan={isInvoice ? (3 + (entry.discountPct > 0 ? 1 : 0) + (entry.taxPct > 0 ? 1 : 0)) : 3} style={{ textAlign: 'right', fontWeight: 'bold', color: '#22c55e' }}>Amount Paid:</td>
                <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#22c55e' }}>
                  {currency}{Number(entry.amountPaid).toFixed(2)}
                </td>
              </tr>
            )}
            {isInvoice && Number(entry.pendingDues || 0) > 0 && (
              <tr>
                <td colSpan={isInvoice ? (3 + (entry.discountPct > 0 ? 1 : 0) + (entry.taxPct > 0 ? 1 : 0)) : 3} style={{ textAlign: 'right', fontWeight: 'bold', color: '#ef4444' }}>Pending Balance:</td>
                <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#ef4444' }}>
                  {currency}{Number(entry.pendingDues).toFixed(2)}
                </td>
              </tr>
            )}
          </tfoot>
        </table>
      </div>

      {/* Bottom Section (Fixed Height) */}
      <div className="challan-footer" style={{ flexDirection: paperSize === 'Receipt' ? 'column' : 'row', gap: paperSize === 'Receipt' ? '2rem' : '0' }}>
        <div className="terms">
          <h4>Terms & Conditions:</h4>
          <ol>
            <li>Goods once sold will not be taken back.</li>
            <li>Subject to local jurisdiction.</li>
            <li>This is a computer generated document.</li>
          </ol>
        </div>
        <div className="signatures">
          <div className="sig-box">
            <p>Receiver's Signature</p>
          </div>
          <div className="sig-box">
            <p>For <b>{company?.name || 'Company'}</b></p>
            <br/>{paperSize !== 'Receipt' && <br/>}
            <p>Authorized Signatory</p>
          </div>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(
    <div className="print-overlay">
      
      {/* Print Settings Sidebar */}
      <div className="print-settings no-print fade-in">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Settings2 size={20} color="var(--primary)" /> Print Setup
          </h2>
          <button className="btn btn-secondary" onClick={onClose} style={{ padding: '0.4rem', border: 'none' }}><X size={20} /></button>
        </div>

        <div className="input-group" style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><FileText size={16} /> Paper Size</label>
          <select className="input-field" value={paperSize} onChange={(e) => setPaperSize(e.target.value)}>
            <option value="A4">A4 (Standard 210x297mm)</option>
            <option value="A5">A5 (Half Size 148x210mm)</option>
            <option value="Letter">US Letter (216x279mm)</option>
            <option value="Receipt">Thermal Receipt (80mm)</option>
          </select>
        </div>

        <div className="input-group" style={{ marginBottom: '2.5rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Copy size={16} /> Number of Copies</label>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <input type="range" min="1" max="5" value={copies} onChange={(e) => setCopies(Number(e.target.value))} style={{ flex: 1 }} />
            <span style={{ fontWeight: 700, fontSize: '1.1rem', background: 'var(--bg-app)', padding: '0.2rem 0.8rem', borderRadius: '4px' }}>{copies}</span>
          </div>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Set to 2 for Original + Duplicate.</p>
        </div>

        <button className="btn btn-primary" onClick={() => window.print()} style={{ width: '100%', height: '3.5rem', fontSize: '1.1rem', fontWeight: 700, background: '#34c759', borderColor: '#34c759' }}>
          <Printer size={20} /> Print {copies} {copies === 1 ? 'Copy' : 'Copies'}
        </button>
        
        <button className="btn btn-secondary" onClick={onClose} style={{ width: '100%', height: '3rem', marginTop: '1rem' }}>
          Cancel
        </button>
      </div>

      {/* Pages Container */}
      <div className="pages-container">
        {[...Array(copies)].map((_, i) => renderChallan(i))}
      </div>
      
      <style>{`
        .print-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: #eef2f6;
          z-index: 9999;
          overflow-y: auto;
          display: flex;
        }
        
        .print-settings {
          width: 350px;
          background: white;
          border-right: 1px solid #ddd;
          padding: 2rem;
          box-shadow: 2px 0 20px rgba(0,0,0,0.05);
          display: flex;
          flex-direction: column;
          position: sticky;
          top: 0;
          height: 100vh;
          overflow-y: auto;
        }
        
        .pages-container {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 2rem;
          gap: 2rem;
          overflow-y: auto;
        }

        .challan-container {
          background: white;
          padding: ${paperSize === 'Receipt' ? '5mm' : '15mm'};
          box-shadow: 0 10px 30px rgba(0,0,0,0.1);
          color: #000;
          font-family: Arial, sans-serif;
          box-sizing: border-box;
          page-break-after: always;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
        }
        
        .challan-container:last-child {
          page-break-after: auto;
        }

        .table-wrapper {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .challan-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 2px solid #000;
          padding-bottom: 0.5rem;
          margin-bottom: ${paperSize === 'Receipt' ? '1rem' : '1.5rem'};
          flex-direction: ${paperSize === 'Receipt' ? 'column' : 'row'};
          gap: ${paperSize === 'Receipt' ? '0.5rem' : '0'};
        }
        .challan-title {
          font-size: ${paperSize === 'Receipt' ? '16px' : '22px'};
          margin: 0;
          color: #000;
          letter-spacing: 1px;
        }
        .challan-meta div {
          font-size: ${paperSize === 'Receipt' ? '11px' : '12px'};
          text-align: ${paperSize === 'Receipt' ? 'left' : 'right'};
          margin-bottom: 3px;
        }
        .challan-parties {
          display: flex;
          justify-content: space-between;
          margin-bottom: ${paperSize === 'Receipt' ? '1rem' : '1.5rem'};
          gap: ${paperSize === 'Receipt' ? '1rem' : '2rem'};
        }
        .party-box {
          flex: 1;
          border: 1px solid #000;
          padding: 0.8rem;
          border-radius: 4px;
        }
        .party-box h3 {
          margin-top: 0;
          font-size: 11px;
          color: #444;
          text-transform: uppercase;
        }
        .party-box h4 {
          margin: 0 0 5px 0;
          font-size: 14px;
          color: #000;
        }
        .party-box p {
          margin: 0 0 3px 0;
          font-size: 12px;
        }
        .challan-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: ${paperSize === 'Receipt' ? '1rem' : '1.5rem'};
          height: 100%;
        }
        .challan-table tbody {
          vertical-align: top;
        }
        .challan-table th, .challan-table td {
          border: 1px solid #000;
          padding: ${paperSize === 'Receipt' ? '4px' : '6px 8px'};
          font-size: ${paperSize === 'Receipt' ? '11px' : '12px'};
        }
        .challan-table th {
          background: #f5f5f5;
          text-transform: uppercase;
          font-size: 11px;
          height: 1px; /* force tight header */
        }
        .challan-table tbody tr:not(.filler-row) td {
          height: 1px;
          border-bottom: none;
        }
        .filler-row td {
          border-top: none !important;
          height: auto;
        }
        .challan-table tbody tr:last-child td {
          border-bottom: 1px solid #000;
        }
        .challan-footer {
          display: flex;
          justify-content: space-between;
          margin-top: ${paperSize === 'Receipt' ? '1rem' : '2rem'};
        }
        .terms h4 {
          margin: 0 0 5px 0;
          font-size: 12px;
        }
        .terms ol {
          margin: 0;
          padding-left: 15px;
          font-size: 10px;
          color: #222;
        }
        .signatures {
          display: flex;
          gap: ${paperSize === 'Receipt' ? '1rem' : '3rem'};
          margin-top: ${paperSize === 'Receipt' ? '1rem' : '0'};
          justify-content: ${paperSize === 'Receipt' ? 'space-between' : 'flex-end'};
        }
        .sig-box {
          text-align: center;
          font-size: 12px;
        }
        
        @media print {
          .no-print { display: none !important; }
          .print-overlay {
            position: static;
            background: white;
            padding: 0;
            display: block;
          }
          .pages-container {
            padding: 0;
            gap: 0;
            display: block;
          }
          .challan-container {
            width: 100% !important;
            height: auto !important;
            min-height: 0 !important;
            box-shadow: none;
            padding: ${paperSize === 'Receipt' ? '2mm' : '10mm'};
            margin: 0;
            border: none;
          }
          @page { 
            margin: 0; 
            size: ${paperSize === 'Receipt' ? '80mm auto' : paperSize}; 
          }
          body {
            margin: 0;
            background: white;
          }
          #root {
            display: none !important;
          }
          .printable-area {
            position: static;
          }
        }
      `}</style>
    </div>,
    document.body
  );
};

export default ChallanPrint;
