import { useState, useEffect } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc, query, where, onSnapshot, writeBatch } from 'firebase/firestore';

// Firebase Configuration from Vite Env
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const isFirebaseConfigured = !!firebaseConfig.apiKey;
let firestoreDb = null;

if (isFirebaseConfigured) {
  try {
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    firestoreDb = getFirestore(app);
    console.log("🔥 Firebase initialized successfully.");
  } catch (err) {
    console.error("❌ Firebase initialization failed:", err);
  }
} else {
  console.warn("⚠️ Firebase configuration missing from .env. Running in offline localStorage fallback mode.");
}

const getInitialDB = () => {
  const defaultDB = {
    suppliers: [
      { id: "sup-1", name: "Plastico Industries", phone: "+91 98765 43210", email: "sales@plastico.com", createdAt: new Date().toISOString() },
      { id: "sup-2", name: "Apex Polymers", phone: "+91 99999 88888", email: "info@apexpoly.com", createdAt: new Date().toISOString() }
    ],
    materials: [
      { id: "mat-1", code: "PET-GRN", name: "PET Granules", category: "Raw Material", unit: "KG", minStock: "100", createdAt: new Date().toISOString() },
      { id: "mat-2", code: "PRF-24G", name: "24g Bottle Preforms", category: "Raw Material", unit: "PCS", minStock: "500", createdAt: new Date().toISOString() },
      { id: "mat-3", code: "PRF-18G", name: "18g Bottle Preforms", category: "Raw Material", unit: "PCS", minStock: "500", createdAt: new Date().toISOString() },
      { id: "mat-4", code: "CAP-28M", name: "28mm Plastic Caps", category: "Raw Material", unit: "PCS", minStock: "1000", createdAt: new Date().toISOString() },
      { id: "mat-5", code: "BOX-CTN", name: "Carton Packing Boxes", category: "Raw Material", unit: "PCS", minStock: "100", createdAt: new Date().toISOString() }
    ],
    materialInward: [],
    products: [
      { id: "prod-1", code: "BOT-1L", name: "1 Litre Mineral Water Bottle", defaultPrice: 12.00, isActive: true, createdAt: new Date().toISOString() },
      { id: "prod-2", code: "BOT-500M", name: "500ml Soda Bottle", defaultPrice: 8.50, isActive: true, createdAt: new Date().toISOString() }
    ],
    productConfigs: [
      {
        id: "cfg-1",
        productId: "prod-1",
        configCode: "BLU-1L",
        color: "Transparent Blue",
        materials: [
          { materialId: "mat-2", consumptionPerPc: "0.024" },
          { materialId: "mat-4", consumptionPerPc: "1.000" }
        ],
        createdAt: new Date().toISOString()
      },
      {
        id: "cfg-2",
        productId: "prod-2",
        configCode: "CLR-500M",
        color: "Clear",
        materials: [
          { materialId: "mat-3", consumptionPerPc: "0.018" },
          { materialId: "mat-4", consumptionPerPc: "1.000" }
        ],
        createdAt: new Date().toISOString()
      }
    ],
    productions: [],
    clients: [
      { id: "cli-1", name: "Aqua Springs Beverages", phone: "+91 91234 56789", email: "procurement@aquaspring.com", createdAt: new Date().toISOString() },
      { id: "cli-2", name: "Daily Needs Retailers", phone: "+91 90000 00000", email: "orders@dailyneeds.com", createdAt: new Date().toISOString() }
    ],
    outward: [],
    workers: [
      { id: "wrk-1", name: "Ramesh Bhai", role: "Machine Operator", phone: "+91 88888 77777", createdAt: new Date().toISOString() },
      { id: "wrk-2", name: "Suresh Singh", role: "Packer", phone: "+91 77777 66666", createdAt: new Date().toISOString() }
    ],
    materialIssues: [],
    materialLosses: [],
    companyProfile: {
      name: "Bottle Production",
      gstin: "22AAAAA0000A1Z5",
      phone: "+91 9999999999",
      address: "Phase 1, Industrial Area, GIDC",
      email: "info@bottleproduction.com"
    },
    preferences: {
      currency: "₹",
      lowStockThreshold: 100
    },
    invoices: [],
    payments: [],
    materialCategories: ['Raw Material', 'Colorant', 'Chemical'],
    stockUnits: ['KG', 'GM', 'LTR', 'PCS'],
    paymentModes: ['Cash', 'Bank Transfer', 'UPI', 'Cheque'],
    lossCategories: ['Machine Purge', 'Spillage', 'Scrap'],
    workingShifts: ['Morning', 'Evening', 'Night'],
    paymentTerms: ['Due on Receipt', 'Net 15', 'Net 30', 'Net 60']
  };

  const saved = localStorage.getItem('pixivo_db');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      const merged = { ...defaultDB, ...parsed };
      // Ensure arrays are merged properly
      Object.keys(defaultDB).forEach(key => {
        if (Array.isArray(defaultDB[key]) && (!merged[key] || merged[key].length === 0)) {
          merged[key] = defaultDB[key];
        }
      });
      return merged;
    } catch (e) {
      console.error("Local storage DB corrupted", e);
    }
  }
  return defaultDB;
};

let IN_MEMORY_DB = getInitialDB();
let unsubscribeListeners = [];

// Global subscription for React reactivity
let listeners = [];
export const subscribeDB = (listener) => {
  listeners.push(listener);
  // Trigger initial callback
  listener({ ...IN_MEMORY_DB });
  return () => { listeners = listeners.filter(l => l !== listener); };
};

const notify = () => {
  localStorage.setItem('pixivo_db', JSON.stringify(IN_MEMORY_DB));
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

// Start Firestore Sync for logged in user's company
export const startFirebaseSync = (companyId) => {
  if (!firestoreDb || !companyId) return () => {};
  
  // Unsubscribe existing listeners first
  stopFirebaseSync();
  console.log(`📡 Starting Firebase Firestore Realtime Sync for Company: ${companyId}`);

  const collectionsToSync = [
    'suppliers', 'materials', 'materialInward', 'products', 'productConfigs',
    'productions', 'clients', 'outward', 'workers', 'materialIssues',
    'materialLosses', 'invoices', 'payments'
  ];

  // 1. Sync structured user collections
  collectionsToSync.forEach(colName => {
    const q = query(collection(firestoreDb, colName), where("companyId", "==", companyId));
    const unsub = onSnapshot(q, (snapshot) => {
      const items = [];
      snapshot.forEach(doc => {
        items.push({ id: doc.id, ...doc.data() });
      });
      IN_MEMORY_DB[colName] = items;
      notify();
    }, (error) => {
      console.error(`Error syncing collection ${colName}:`, error);
    });
    unsubscribeListeners.push(unsub);
  });

  // 2. Sync Company Profile, Preferences, and custom listings (stored in `companies` document)
  const compDocRef = doc(firestoreDb, "companies", companyId);
  const unsubComp = onSnapshot(compDocRef, (snap) => {
    if (snap.exists()) {
      const data = snap.data();
      IN_MEMORY_DB.companyProfile = data.companyProfile || IN_MEMORY_DB.companyProfile;
      IN_MEMORY_DB.preferences = data.preferences || IN_MEMORY_DB.preferences;
      // Taxonomies
      const taxonomies = ['materialCategories', 'stockUnits', 'paymentModes', 'lossCategories', 'workingShifts', 'paymentTerms'];
      taxonomies.forEach(tax => {
        if (data[tax]) {
          IN_MEMORY_DB[tax] = data[tax];
        }
      });
      notify();
    }
  });
  unsubscribeListeners.push(unsubComp);
};

export const stopFirebaseSync = () => {
  unsubscribeListeners.forEach(unsub => unsub());
  unsubscribeListeners = [];
  console.log("🔌 Stopped Firebase Firestore listener.");
};

// Simulated async delay to match latency
const delay = (ms) => new Promise(res => setTimeout(res, ms));

export const fetchAllData = async () => {
  const currentUserStr = sessionStorage.getItem('user') || localStorage.getItem('auth_user');
  if (currentUserStr) {
    const user = JSON.parse(currentUserStr);
    if (user.companyId && firestoreDb) {
      startFirebaseSync(user.companyId);
    }
  }
  // Local notification fallback
  IN_MEMORY_DB = getInitialDB();
  notify();
};

const generateId = () => Math.random().toString(36).substr(2, 9);

// Generic Add Function
const addItem = async (store, item) => {
  await delay(50);
  const id = generateId();
  const timestamp = new Date().toISOString();
  
  const currentUser = JSON.parse(sessionStorage.getItem('user') || localStorage.getItem('auth_user') || '{}');
  const companyId = currentUser.companyId || 'local-company';

  const newItem = { ...item, id, companyId, createdAt: timestamp };

  if (firestoreDb && companyId !== 'local-company') {
    try {
      await setDoc(doc(firestoreDb, store, id), newItem);
    } catch (e) {
      console.error(`Firebase Write Error in ${store}:`, e);
    }
  } else {
    IN_MEMORY_DB[store] = [...(IN_MEMORY_DB[store] || []), newItem];
    notify();
  }
  return newItem;
};

// Generic Delete Function
export const deleteItem = async (store, id) => {
  await delay(50);
  
  const currentUser = JSON.parse(sessionStorage.getItem('user') || localStorage.getItem('auth_user') || '{}');
  const companyId = currentUser.companyId || 'local-company';

  if (firestoreDb && companyId !== 'local-company') {
    try {
      if (store === 'invoices') {
        const batch = writeBatch(firestoreDb);
        // Delete invoice
        batch.delete(doc(firestoreDb, 'invoices', id));
        // Remove linkings in outward/challans
        const challans = IN_MEMORY_DB.outward || [];
        challans.forEach(ch => {
          if (ch.invoiceId === id) {
            const chRef = doc(firestoreDb, 'outward', ch.id);
            batch.update(chRef, { invoiceId: null, invoiceNo: null });
          }
        });
        await batch.commit();
      } else {
        await deleteDoc(doc(firestoreDb, store, id));
      }
    } catch (e) {
      console.error(`Firebase Delete Error in ${store}:`, e);
    }
  } else {
    IN_MEMORY_DB[store] = (IN_MEMORY_DB[store] || []).filter(item => item.id !== id);
    if (store === 'invoices') {
      IN_MEMORY_DB.outward = (IN_MEMORY_DB.outward || []).map(ch => {
        if (ch.invoiceId === id) {
          const { invoiceId: _id, invoiceNo: _no, ...rest } = ch;
          return rest;
        }
        return ch;
      });
    }
    notify();
  }
};

// Generic Update Function
export const updateItem = async (store, id, updatedData) => {
  await delay(50);
  
  const currentUser = JSON.parse(sessionStorage.getItem('user') || localStorage.getItem('auth_user') || '{}');
  const companyId = currentUser.companyId || 'local-company';

  if (firestoreDb && companyId !== 'local-company') {
    try {
      await updateDoc(doc(firestoreDb, store, id), updatedData);
    } catch (e) {
      console.error(`Firebase Update Error in ${store}:`, e);
    }
  } else {
    IN_MEMORY_DB[store] = (IN_MEMORY_DB[store] || []).map(item => 
      item.id === id ? { ...item, ...updatedData } : item
    );
    notify();
  }
};

// Specialized CRUD wrappers
export const addSupplier = (s) => addItem('suppliers', s);
export const addClient = (c) => addItem('clients', c);
export const addMaterial = (m) => addItem('materials', m);
export const addProduct = (p) => addItem('products', { ...p, isActive: true });
export const addProductConfig = (c) => addItem('productConfigs', c);
export const addWorker = (w) => addItem('workers', w);

export const saveCompanyProfile = async (data) => {
  await delay(50);
  const currentUser = JSON.parse(sessionStorage.getItem('user') || localStorage.getItem('auth_user') || '{}');
  const companyId = currentUser.companyId || 'local-company';

  if (firestoreDb && companyId !== 'local-company') {
    try {
      await setDoc(doc(firestoreDb, "companies", companyId), { companyProfile: data }, { merge: true });
    } catch (e) {
      console.error("Firebase Company Profile Save Error:", e);
    }
  } else {
    IN_MEMORY_DB.companyProfile = { ...IN_MEMORY_DB.companyProfile, ...data };
    notify();
  }
};

export const saveSystemPreferences = async (prefs) => {
  await delay(50);
  const currentUser = JSON.parse(sessionStorage.getItem('user') || localStorage.getItem('auth_user') || '{}');
  const companyId = currentUser.companyId || 'local-company';

  if (firestoreDb && companyId !== 'local-company') {
    try {
      await setDoc(doc(firestoreDb, "companies", companyId), { preferences: prefs }, { merge: true });
    } catch (e) {
      console.error("Firebase Preferences Save Error:", e);
    }
  } else {
    IN_MEMORY_DB.preferences = { ...IN_MEMORY_DB.preferences, ...prefs };
    notify();
  }
};

export const saveTaxonomies = async (taxonomies) => {
  await delay(50);
  const currentUser = JSON.parse(sessionStorage.getItem('user') || localStorage.getItem('auth_user') || '{}');
  const companyId = currentUser.companyId || 'local-company';

  if (firestoreDb && companyId !== 'local-company') {
    try {
      await setDoc(doc(firestoreDb, "companies", companyId), taxonomies, { merge: true });
    } catch (e) {
      console.error("Firebase Taxonomies Save Error:", e);
    }
  } else {
    IN_MEMORY_DB = { ...IN_MEMORY_DB, ...taxonomies };
    notify();
  }
};

export const resetDatabase = async () => {
  await delay(100);
  const currentUser = JSON.parse(sessionStorage.getItem('user') || localStorage.getItem('auth_user') || '{}');
  const companyId = currentUser.companyId || 'local-company';

  if (firestoreDb && companyId !== 'local-company') {
    alert("Database is synced on Cloud (Firebase). Automatic reset cannot write empty values directly. Please delete records manually or contact administrator.");
  } else {
    localStorage.removeItem('pixivo_db');
    IN_MEMORY_DB = getInitialDB();
    notify();
  }
};

// Transaction Wrappers
export const addMaterialInward = async (entry) => addItem('materialInward', entry);
export const addMaterialIssue = async (entry) => addItem('materialIssues', entry);
export const addMaterialLoss = async (entry) => addItem('materialLosses', entry);
export const addProduction = async (entry) => addItem('productions', entry);
export const addOutward = async (entry) => addItem('outward', entry);

export const addInvoice = async (invoiceData, challanIds = []) => {
  await delay(50);
  const id = generateId();
  const timestamp = new Date().toISOString();
  
  const currentUser = JSON.parse(sessionStorage.getItem('user') || localStorage.getItem('auth_user') || '{}');
  const companyId = currentUser.companyId || 'local-company';

  const newInvoice = { ...invoiceData, id, companyId, createdAt: timestamp };

  if (firestoreDb && companyId !== 'local-company') {
    try {
      const batch = writeBatch(firestoreDb);
      // Create Invoice doc
      batch.set(doc(firestoreDb, 'invoices', id), newInvoice);
      // Link Challans
      if (Array.isArray(challanIds) && challanIds.length > 0) {
        challanIds.forEach(chId => {
          const chRef = doc(firestoreDb, 'outward', chId);
          batch.update(chRef, { invoiceId: id, invoiceNo: invoiceData.invoiceNo });
        });
      }
      await batch.commit();
    } catch (e) {
      console.error("Firebase Add Invoice Error:", e);
    }
  } else {
    IN_MEMORY_DB.invoices = [...(IN_MEMORY_DB.invoices || []), newInvoice];
    if (Array.isArray(challanIds) && challanIds.length > 0) {
      IN_MEMORY_DB.outward = (IN_MEMORY_DB.outward || []).map(ch => {
        if (challanIds.includes(ch.id)) {
          return { ...ch, invoiceId: newInvoice.id, invoiceNo: newInvoice.invoiceNo };
        }
        return ch;
      });
    }
    notify();
  }
  return newInvoice;
};

export const updateInvoice = async (id, invoiceData, challanIds = []) => {
  await delay(50);

  const currentUser = JSON.parse(sessionStorage.getItem('user') || localStorage.getItem('auth_user') || '{}');
  const companyId = currentUser.companyId || 'local-company';

  if (firestoreDb && companyId !== 'local-company') {
    try {
      const batch = writeBatch(firestoreDb);
      // Update Invoice
      batch.update(doc(firestoreDb, 'invoices', id), invoiceData);
      
      // Reset currently linked challans of this invoice
      const oldChallans = IN_MEMORY_DB.outward || [];
      oldChallans.forEach(ch => {
        if (ch.invoiceId === id) {
          batch.update(doc(firestoreDb, 'outward', ch.id), { invoiceId: null, invoiceNo: null });
        }
      });

      // Link new ones
      if (Array.isArray(challanIds) && challanIds.length > 0) {
        challanIds.forEach(chId => {
          batch.update(doc(firestoreDb, 'outward', chId), { invoiceId: id, invoiceNo: invoiceData.invoiceNo });
        });
      }
      await batch.commit();
    } catch (e) {
      console.error("Firebase Update Invoice Error:", e);
    }
  } else {
    IN_MEMORY_DB.invoices = (IN_MEMORY_DB.invoices || []).map(item => 
      item.id === id ? { ...item, ...invoiceData } : item
    );
    
    IN_MEMORY_DB.outward = (IN_MEMORY_DB.outward || []).map(ch => {
      if (ch.invoiceId === id) {
        const { invoiceId: _id, invoiceNo: _no, ...rest } = ch;
        return rest;
      }
      return ch;
    });

    if (Array.isArray(challanIds) && challanIds.length > 0) {
      IN_MEMORY_DB.outward = (IN_MEMORY_DB.outward || []).map(ch => {
        if (challanIds.includes(ch.id)) {
          return { ...ch, invoiceId: id, invoiceNo: invoiceData.invoiceNo };
        }
        return ch;
      });
    }
    notify();
  }
};

export const addPayment = async (payment) => {
  await delay(50);
  const id = generateId();
  const timestamp = new Date().toISOString();

  const currentUser = JSON.parse(sessionStorage.getItem('user') || localStorage.getItem('auth_user') || '{}');
  const companyId = currentUser.companyId || 'local-company';

  const newPayment = { ...payment, id, companyId, createdAt: timestamp };

  if (firestoreDb && companyId !== 'local-company') {
    try {
      const batch = writeBatch(firestoreDb);
      batch.set(doc(firestoreDb, 'payments', id), newPayment);
      
      // Update Invoice dues
      if (payment.type === 'Bill Payment' && payment.invoiceId) {
        const invoice = (IN_MEMORY_DB.invoices || []).find(inv => inv.id === payment.invoiceId);
        if (invoice) {
          const amountPaid = Number(invoice.amountPaid || 0) + Number(payment.amount || 0);
          const pendingDues = Math.max(0, Number(invoice.totalAmount || 0) - amountPaid);
          const status = pendingDues <= 0 ? 'Paid' : (amountPaid > 0 ? 'Partial' : 'Pending');
          batch.update(doc(firestoreDb, 'invoices', payment.invoiceId), { amountPaid, pendingDues, status });
        }
      }
      await batch.commit();
    } catch (e) {
      console.error("Firebase Add Payment Error:", e);
    }
  } else {
    IN_MEMORY_DB.payments = [...(IN_MEMORY_DB.payments || []), newPayment];
    
    if (payment.type === 'Bill Payment' && payment.invoiceId) {
      IN_MEMORY_DB.invoices = (IN_MEMORY_DB.invoices || []).map(inv => {
        if (inv.id === payment.invoiceId) {
          const amountPaid = Number(inv.amountPaid || 0) + Number(payment.amount || 0);
          const pendingDues = Math.max(0, Number(inv.totalAmount || 0) - amountPaid);
          const status = pendingDues <= 0 ? 'Paid' : (amountPaid > 0 ? 'Partial' : 'Pending');
          return { ...inv, amountPaid, pendingDues, status };
        }
        return inv;
      });
    }
    notify();
  }
  return newPayment;
};

export const deletePayment = async (id) => {
  await delay(50);
  const payment = (IN_MEMORY_DB.payments || []).find(p => p.id === id);
  if (!payment) return;

  const currentUser = JSON.parse(sessionStorage.getItem('user') || localStorage.getItem('auth_user') || '{}');
  const companyId = currentUser.companyId || 'local-company';

  if (firestoreDb && companyId !== 'local-company') {
    try {
      const batch = writeBatch(firestoreDb);
      batch.delete(doc(firestoreDb, 'payments', id));

      if (payment.type === 'Bill Payment' && payment.invoiceId) {
        const invoice = (IN_MEMORY_DB.invoices || []).find(inv => inv.id === payment.invoiceId);
        if (invoice) {
          const amountPaid = Math.max(0, Number(invoice.amountPaid || 0) - Number(payment.amount || 0));
          const pendingDues = Math.max(0, Number(invoice.totalAmount || 0) - amountPaid);
          const status = pendingDues <= 0 ? 'Paid' : (amountPaid > 0 ? 'Partial' : 'Pending');
          batch.update(doc(firestoreDb, 'invoices', payment.invoiceId), { amountPaid, pendingDues, status });
        }
      }
      await batch.commit();
    } catch (e) {
      console.error("Firebase Delete Payment Error:", e);
    }
  } else {
    IN_MEMORY_DB.payments = (IN_MEMORY_DB.payments || []).filter(p => p.id !== id);
    
    if (payment.type === 'Bill Payment' && payment.invoiceId) {
      IN_MEMORY_DB.invoices = (IN_MEMORY_DB.invoices || []).map(inv => {
        if (inv.id === payment.invoiceId) {
          const amountPaid = Math.max(0, Number(inv.amountPaid || 0) - Number(payment.amount || 0));
          const pendingDues = Math.max(0, Number(inv.totalAmount || 0) - amountPaid);
          const status = pendingDues <= 0 ? 'Paid' : (amountPaid > 0 ? 'Partial' : 'Pending');
          return { ...inv, amountPaid, pendingDues, status };
        }
        return inv;
      });
    }
    notify();
  }
};

// Real-time Cloud Auth Calls
export const firebaseRegister = async (email, companyName, username, password) => {
  if (!firestoreDb) {
    // Offline storage registration
    await delay(300);
    const usersStr = localStorage.getItem('offline_users') || '[]';
    const users = JSON.parse(usersStr);
    if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
      throw new Error("Username already exists offline");
    }
    const newCompanyId = generateId();
    const newUser = { id: generateId(), username, password, role: 'ADMIN', companyId: newCompanyId };
    users.push(newUser);
    localStorage.setItem('offline_users', JSON.stringify(users));
    return newUser;
  }

  // Firestore signup flow
  const usersRef = collection(firestoreDb, "users");
  const q = query(usersRef, where("username", "==", username));
  const snap = await getDocs(q);
  if (!snap.empty) {
    throw new Error("Username already taken. Please choose another username.");
  }

  const companyId = generateId();
  const userId = generateId();

  // Create Company document with default templates
  const defaultDB = getInitialDB();
  const companyDocData = {
    id: companyId,
    email,
    companyProfile: {
      name: companyName,
      gstin: "Not Configured",
      phone: "",
      address: "",
      email: email
    },
    preferences: defaultDB.preferences,
    materialCategories: defaultDB.materialCategories,
    stockUnits: defaultDB.stockUnits,
    paymentModes: defaultDB.paymentModes,
    lossCategories: defaultDB.lossCategories,
    workingShifts: defaultDB.workingShifts,
    paymentTerms: defaultDB.paymentTerms,
    createdAt: new Date().toISOString()
  };

  const userDocData = {
    id: userId,
    username,
    password, // Store input password (plaintext or simpler hash since it's a private app client-side setup)
    role: 'ADMIN',
    companyId,
    createdAt: new Date().toISOString()
  };

  const batch = writeBatch(firestoreDb);
  batch.set(doc(firestoreDb, "companies", companyId), companyDocData);
  batch.set(doc(firestoreDb, "users", userId), userDocData);

  // Seed default productConfigs, materials, & products for the new company
  defaultDB.materials.forEach(m => {
    batch.set(doc(firestoreDb, "materials", generateId()), { ...m, companyId });
  });
  defaultDB.products.forEach(p => {
    batch.set(doc(firestoreDb, "products", generateId()), { ...p, companyId });
  });

  await batch.commit();
  console.log(`✅ Company and Admin registered successfully in Cloud Firestore!`);
  return userDocData;
};

export const firebaseLogin = async (username, password) => {
  if (!firestoreDb) {
    // Offline local storage login
    await delay(300);
    const usernameClean = username.trim().toLowerCase();
    
    // Default fallback
    if (usernameClean === 'admin' && password === 'admin') {
      return { id: 'admin-local', username: 'admin', role: 'ADMIN', companyId: 'local-company' };
    }

    const usersStr = localStorage.getItem('offline_users') || '[]';
    const users = JSON.parse(usersStr);
    const matched = users.find(u => u.username.toLowerCase() === usernameClean && u.password === password);
    if (!matched) throw new Error("Invalid username or password");
    return matched;
  }

  // Firestore check
  const usersRef = collection(firestoreDb, "users");
  const q = query(usersRef, where("username", "==", username.trim()));
  const snap = await getDocs(q);
  
  if (snap.empty) {
    throw new Error("Invalid username or password");
  }

  let matchedUser = null;
  snap.forEach(doc => {
    const data = doc.data();
    if (data.password === password) {
      matchedUser = { id: doc.id, ...data };
    }
  });

  if (!matchedUser) {
    throw new Error("Invalid username or password");
  }

  // Start Syncing for user company
  startFirebaseSync(matchedUser.companyId);
  return matchedUser;
};

// Utilities
export const getStoreMaterialStock = (materialId) => {
  const inward = (IN_MEMORY_DB.materialInward || []).filter(i => i.materialId === materialId).reduce((sum, i) => sum + Number(i.quantity || 0), 0);
  const issued = (IN_MEMORY_DB.materialIssues || []).filter(i => i.materialId === materialId).reduce((sum, i) => sum + Number(i.quantity || 0), 0);
  return (inward - issued).toFixed(3);
};

export const getFactoryMaterialStock = (materialId, workerId = null) => {
  const issues = (IN_MEMORY_DB.materialIssues || [])
    .filter(i => i.materialId === materialId && (!workerId || i.workerId === workerId))
    .reduce((sum, i) => sum + Number(i.quantity || 0), 0);
    
  const consumed = (IN_MEMORY_DB.productions || [])
    .filter(p => (!workerId || p.workerId === workerId))
    .reduce((sum, p) => {
      if (p.materialsUsed && Array.isArray(p.materialsUsed)) {
        const mat = p.materialsUsed.find(m => m.materialId === materialId);
        if (mat) return sum + Number(mat.quantityUsed || 0);
      }
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
  stopFirebaseSync();
  sessionStorage.removeItem('auth_token');
  sessionStorage.removeItem('user');
  localStorage.removeItem('auth_token');
  localStorage.removeItem('auth_user');
  window.location.reload();
};
