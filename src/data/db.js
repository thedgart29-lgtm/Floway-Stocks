import { useState, useEffect } from 'react';

const getInitialDB = () => {
  const defaultDB = {
    suppliers: [],
    materials: [],
    materialInward: [],
    products: [],
    productConfigs: [],
    productions: [],
    clients: [],
    outward: [],
    workers: [],
    materialIssues: [],
    materialLosses: []
  };

  const saved = localStorage.getItem('pixivo_db');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      // Merge saved data with default DB to guarantee all array fields exist
      return { ...defaultDB, ...parsed };
    } catch (e) {
      console.error("Local storage DB corrupted", e);
    }
  }
  return defaultDB;
};

let IN_MEMORY_DB = getInitialDB();

// Global subscription for reactivity
let listeners = [];
export const subscribeDB = (listener) => {
  listeners.push(listener);
  return () => { listeners = listeners.filter(l => l !== listener); };
};

const notify = () => {
  localStorage.setItem('pixivo_db', JSON.stringify(IN_MEMORY_DB));
  // Create a new object reference so React detects the change and re-renders
  listeners.forEach(l => l({ ...IN_MEMORY_DB }));
};

export const getDB = () => IN_MEMORY_DB;

export const useDB = () => {
  const [db, setDb] = useState(getDB());
  useEffect(() => {
    return subscribeDB(setDb);
  }, []);
  return db;
};

// Simulated async delay to make it feel like real DB and allow UI transitions
const delay = (ms) => new Promise(res => setTimeout(res, ms));

export const fetchAllData = async () => {
  // It's already in memory, just notify to trigger re-renders if needed
  IN_MEMORY_DB = getInitialDB();
  notify();
};

const generateId = () => Math.random().toString(36).substr(2, 9);

// Generic Add Function
const addItem = async (store, item) => {
  await delay(50); // fast local response
  const newItem = { ...item, id: generateId(), createdAt: new Date().toISOString() };
  IN_MEMORY_DB[store] = [...(IN_MEMORY_DB[store] || []), newItem];
  notify();
  return newItem;
};

// Generic Delete Function
export const deleteItem = async (store, id) => {
  await delay(50);
  IN_MEMORY_DB[store] = (IN_MEMORY_DB[store] || []).filter(item => item.id !== id);
  notify();
};

// Generic Update Function
export const updateItem = async (store, id, updatedData) => {
  await delay(50);
  IN_MEMORY_DB[store] = (IN_MEMORY_DB[store] || []).map(item => 
    item.id === id ? { ...item, ...updatedData } : item
  );
  notify();
};

// Specialized CRUD wrappers
export const addSupplier = (s) => addItem('suppliers', s);
export const addClient = (c) => addItem('clients', c);
export const addMaterial = (m) => addItem('materials', m);
export const addProduct = (p) => addItem('products', { ...p, isActive: true });
export const addProductConfig = (c) => addItem('productConfigs', c);
export const addWorker = (w) => addItem('workers', w);

// Transaction Wrappers
export const addMaterialInward = async (entry) => addItem('materialInward', entry);
export const addMaterialIssue = async (entry) => addItem('materialIssues', entry);
export const addMaterialLoss = async (entry) => addItem('materialLosses', entry);
export const addProduction = async (entry) => addItem('productions', entry);
export const addOutward = async (entry) => addItem('outward', entry);

// Utilities
// Store Stock: Total Inward - Total Issued to Factory
export const getStoreMaterialStock = (materialId) => {
  const inward = (IN_MEMORY_DB.materialInward || []).filter(i => i.materialId === materialId).reduce((sum, i) => sum + Number(i.quantity || 0), 0);
  const issued = (IN_MEMORY_DB.materialIssues || []).filter(i => i.materialId === materialId).reduce((sum, i) => sum + Number(i.quantity || 0), 0);
  return (inward - issued).toFixed(3);
};

// Factory Stock: Total Issued - Total Consumed - Total Loss
// Can be filtered by workerId. If workerId is omitted, returns total factory WIP.
export const getFactoryMaterialStock = (materialId, workerId = null) => {
  const issues = (IN_MEMORY_DB.materialIssues || [])
    .filter(i => i.materialId === materialId && (!workerId || i.workerId === workerId))
    .reduce((sum, i) => sum + Number(i.quantity || 0), 0);
    
  const consumed = (IN_MEMORY_DB.productions || [])
    .filter(p => (!workerId || p.workerId === workerId))
    .reduce((sum, p) => {
      // New multiple materials structure
      if (p.materialsUsed && Array.isArray(p.materialsUsed)) {
        const mat = p.materialsUsed.find(m => m.materialId === materialId);
        if (mat) return sum + Number(mat.quantityUsed || 0);
      }
      // Legacy single material structure
      if (p.materialId === materialId) {
        return sum + Number(p.materialUsed || 0);
      }
      return sum;
    }, 0);
    
  const losses = (IN_MEMORY_DB.materialLosses || [])
    .filter(l => l.materialId === materialId && (!workerId || l.workerId === workerId))
    .reduce((sum, l) => sum + Number(l.quantity || 0), 0);
    
  return (issues - consumed - losses).toFixed(3);
};

// Legacy fallback (alias to store stock)
export const getMaterialStock = getStoreMaterialStock;

export const getProductStock = (productId) => {
  const produced = (IN_MEMORY_DB.productions || []).filter(p => p.productId === productId).reduce((sum, p) => sum + Number(p.quantity || 0), 0);
  const sold = (IN_MEMORY_DB.outward || []).filter(o => o.productId === productId).reduce((sum, o) => sum + Number(o.quantity || 0), 0);
  return produced - sold;
};

export const getStartOfMonth = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
};

export const getTodayDate = () => {
  return new Date().toISOString().split('T')[0];
};

export const logOut = () => {
  sessionStorage.removeItem('auth_token');
  sessionStorage.removeItem('user');
  window.location.reload();
}
