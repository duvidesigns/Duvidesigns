// ─── Role Config ──────────────────────────────────────────────────────────────
export const ROLE_COLORS = { Admin:"#8b5cf6", Manager:"#3b82f6", Warehouse:"#f59e0b", Viewer:"#94a3b8" };
export const ROLE_BADGES = { Admin:"👑", Manager:"🏢", Warehouse:"🏭", Viewer:"👁" };
export const CATEGORIES  = ["Metal","Polymer","Chemical","Rubber","Composite","Electronics","Other"];
export const UNITS       = ["kg","g","m","L","pcs","rolls","boxes","sets"];
export const PO_COLORS   = { Pending:"#f59e0b", Received:"#10b981", Closed:"#94a3b8", Cancelled:"#ef4444" };
export const RUN_COLORS  = { Planned:"#3b82f6", "In Progress":"#f59e0b", Completed:"#10b981" };

// ─── Default Permissions ──────────────────────────────────────────────────────
export const DEFAULT_PERMS = {
  Admin: {
    tabs:    { dashboard:true,  inventory:true,  transactions:true,  purchaseOrders:true,  productionRuns:true,  suppliers:true,  costs:true,  auditLog:true,  admin:true  },
    actions: { stockIn:true,  stockOut:true,  addMat:true,  editMat:true,  delMat:true,  editThresh:true,  addSup:true,  editSup:true,  delSup:true,  createPO:true,  receivePO:true,  closePO:true,  createRun:true,  completeRun:true,  delRun:true,  exportData:true,  backupRestore:true  },
    data:    { viewCosts:true,  viewContacts:true,  viewAllTxn:true,  viewAuditLog:true  },
  },
  Manager: {
    tabs:    { dashboard:true,  inventory:true,  transactions:true,  purchaseOrders:true,  productionRuns:true,  suppliers:true,  costs:true,  auditLog:false, admin:false },
    actions: { stockIn:true,  stockOut:true,  addMat:true,  editMat:true,  delMat:false, editThresh:true,  addSup:true,  editSup:true,  delSup:false, createPO:true,  receivePO:true,  closePO:true,  createRun:true,  completeRun:true,  delRun:false, exportData:true,  backupRestore:false },
    data:    { viewCosts:true,  viewContacts:true,  viewAllTxn:true,  viewAuditLog:false },
  },
  Warehouse: {
    tabs:    { dashboard:true,  inventory:true,  transactions:true,  purchaseOrders:false, productionRuns:true,  suppliers:false, costs:false, auditLog:false, admin:false },
    actions: { stockIn:true,  stockOut:true,  addMat:false, editMat:false, delMat:false, editThresh:false, addSup:false, editSup:false, delSup:false, createPO:false, receivePO:false, closePO:false, createRun:true,  completeRun:true,  delRun:false, exportData:false, backupRestore:false },
    data:    { viewCosts:false, viewContacts:false, viewAllTxn:false, viewAuditLog:false },
  },
  Viewer: {
    tabs:    { dashboard:true,  inventory:true,  transactions:false, purchaseOrders:false, productionRuns:false, suppliers:false, costs:false, auditLog:false, admin:false },
    actions: { stockIn:false, stockOut:false, addMat:false, editMat:false, delMat:false, editThresh:false, addSup:false, editSup:false, delSup:false, createPO:false, receivePO:false, closePO:false, createRun:false, completeRun:false, delRun:false, exportData:false, backupRestore:false },
    data:    { viewCosts:false, viewContacts:false, viewAllTxn:false, viewAuditLog:false },
  },
};

// ─── Seed Data ────────────────────────────────────────────────────────────────
export const SEED_USERS = [
  { id:"u1", username:"admin",      password:"admin123",   name:"Admin",            role:"Admin"     },
  { id:"u2", username:"manager1",   password:"manager123", name:"Sarah (Manager)",  role:"Manager"   },
  { id:"u3", username:"warehouse1", password:"wh123",      name:"Tom (Warehouse)",  role:"Warehouse" },
  { id:"u4", username:"viewer1",    password:"view123",    name:"Guest Viewer",     role:"Viewer"    },
];
export const SEED_MATERIALS = [
  { id:"RM-001", name:"Steel Rods (Grade A)",  category:"Metal",     supplier:"MetalWorks Co.",    unit:"kg",  stock:900,  threshold:300,  unitCost:18.50 },
  { id:"RM-002", name:"Copper Wire",           category:"Metal",     supplier:"ElectraSupply Ltd", unit:"m",   stock:50,   threshold:150,  unitCost:4.20  },
  { id:"RM-003", name:"PVC Resin",             category:"Polymer",   supplier:"ChemBase Inc.",     unit:"kg",  stock:380,  threshold:200,  unitCost:2.75  },
  { id:"RM-004", name:"Aluminium Sheets",      category:"Metal",     supplier:"MetalWorks Co.",    unit:"pcs", stock:150,  threshold:80,   unitCost:35.00 },
  { id:"RM-005", name:"Rubber Gaskets",        category:"Rubber",    supplier:"RubberTech",        unit:"pcs", stock:1200, threshold:500,  unitCost:0.85  },
  { id:"RM-006", name:"Epoxy Resin",           category:"Chemical",  supplier:"ChemBase Inc.",     unit:"L",   stock:60,   threshold:60,   unitCost:12.40 },
  { id:"RM-007", name:"Stainless Steel Bolts", category:"Metal",     supplier:"FastenPro",         unit:"pcs", stock:2500, threshold:1000, unitCost:0.15  },
  { id:"RM-008", name:"Carbon Fiber Roll",     category:"Composite", supplier:"CompTech Ltd.",     unit:"m",   stock:35,   threshold:25,   unitCost:145.0 },
];
export const SEED_SUPPLIERS = [
  { id:"SUP-001", name:"MetalWorks Co.",    contact:"John Davis",  email:"j.davis@metalworks.com",   phone:"555-0101", lead:7,  materials:"Steel Rods, Aluminium", status:"Active" },
  { id:"SUP-002", name:"ElectraSupply Ltd", contact:"Sarah Chen",  email:"s.chen@electrasupply.com", phone:"555-0102", lead:10, materials:"Copper Wire",           status:"Active" },
  { id:"SUP-003", name:"ChemBase Inc.",     contact:"Mike Torres", email:"m.torres@chembase.com",    phone:"555-0103", lead:14, materials:"PVC Resin, Epoxy",      status:"Active" },
  { id:"SUP-004", name:"RubberTech",        contact:"Amy Wilson",  email:"a.wilson@rubbertech.com",  phone:"555-0104", lead:5,  materials:"Rubber Gaskets",        status:"Active" },
  { id:"SUP-005", name:"FastenPro",         contact:"Tom Hill",    email:"t.hill@fastenpro.com",     phone:"555-0105", lead:3,  materials:"Steel Bolts",           status:"Active" },
];
export const SEED_TXN = [
  { id:"TXN-001", date:"2025-01-05", materialId:"RM-001", type:"IN",  qty:500, ref:"Opening Balance",    userId:"u1", source:"manual" },
  { id:"TXN-002", date:"2025-01-08", materialId:"RM-002", type:"IN",  qty:400, ref:"PO-001",             userId:"u2", source:"po"     },
  { id:"TXN-003", date:"2025-01-10", materialId:"RM-001", type:"OUT", qty:200, ref:"RUN-001",            userId:"u3", source:"run"    },
  { id:"TXN-004", date:"2025-02-15", materialId:"RM-006", type:"OUT", qty:80,  ref:"RUN-002",            userId:"u3", source:"run"    },
  { id:"TXN-005", date:"2025-02-20", materialId:"RM-002", type:"OUT", qty:350, ref:"RUN-002",            userId:"u2", source:"run"    },
  { id:"TXN-006", date:"2025-03-01", materialId:"RM-003", type:"IN",  qty:200, ref:"PO-002",             userId:"u2", source:"po"     },
  { id:"TXN-007", date:"2025-03-05", materialId:"RM-004", type:"OUT", qty:50,  ref:"Manual adjustment",  userId:"u3", source:"manual" },
];
export const SEED_POs = [
  { id:"PO-001", date:"2025-01-06", supplierId:"SUP-002", materialId:"RM-002", qty:400, unitCost:4.20,  status:"Received",  notes:"Urgent restock",   expectedDate:"2025-01-15", receivedDate:"2025-01-08" },
  { id:"PO-002", date:"2025-02-28", supplierId:"SUP-003", materialId:"RM-003", qty:200, unitCost:2.75,  status:"Received",  notes:"",                 expectedDate:"2025-03-14", receivedDate:"2025-03-01" },
  { id:"PO-003", date:"2025-03-04", supplierId:"SUP-001", materialId:"RM-001", qty:600, unitCost:18.50, status:"Pending",   notes:"Q2 restock",       expectedDate:"2025-03-18", receivedDate:null         },
  { id:"PO-004", date:"2025-03-06", supplierId:"SUP-004", materialId:"RM-005", qty:1000,unitCost:0.85,  status:"Pending",   notes:"",                 expectedDate:"2025-03-12", receivedDate:null         },
];
export const SEED_RUNS = [
  { id:"RUN-001", date:"2025-01-10", name:"Production Run #101", ref:"PR-101", items:[{materialId:"RM-001",qty:200},{materialId:"RM-003",qty:80}],  userId:"u3", status:"Completed", notes:"Batch A - Steel components" },
  { id:"RUN-002", date:"2025-02-15", name:"Production Run #102", ref:"PR-102", items:[{materialId:"RM-006",qty:80}, {materialId:"RM-002",qty:350}], userId:"u3", status:"Completed", notes:"Batch B - Wiring assemblies" },
  { id:"RUN-003", date:"2025-03-10", name:"Production Run #103", ref:"PR-103", items:[{materialId:"RM-004",qty:30},{materialId:"RM-007",qty:500}],  userId:"u2", status:"Planned",   notes:"Scheduled next week" },
];
export const SEED_AUDIT = [
  { id:"AUD-001", ts:"2025-01-05T08:00:00Z", userId:"u1", userName:"Admin",          userRole:"Admin",     action:"LOGIN",    entity:"Auth",     entityId:"u1",     details:"Admin logged in" },
  { id:"AUD-002", ts:"2025-01-05T08:05:00Z", userId:"u1", userName:"Admin",          userRole:"Admin",     action:"STOCK_IN", entity:"Material", entityId:"RM-001", details:"Stock IN · 500 kg · Steel Rods (Grade A)" },
  { id:"AUD-003", ts:"2025-01-08T09:00:00Z", userId:"u2", userName:"Sarah (Manager)",userRole:"Manager",   action:"PO_RECV",  entity:"PO",       entityId:"PO-001", details:"PO Received · 400 m Copper Wire from ElectraSupply Ltd" },
  { id:"AUD-004", ts:"2025-01-10T10:00:00Z", userId:"u3", userName:"Tom (Warehouse)",userRole:"Warehouse", action:"RUN_DONE", entity:"Run",      entityId:"RUN-001",details:"Production Run #101 completed · 2 materials consumed" },
];