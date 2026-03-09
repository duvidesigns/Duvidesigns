// @ts-nocheck
/* eslint-disable */
import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, get } from "firebase/database";

// ─── Firebase Config ──────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyAlvZ8nzjTdFpBw7mFxbMjpiHlTqrHfP6o",
  authDomain: "duvi-designs.firebaseapp.com",
  databaseURL: "https://duvi-designs-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "duvi-designs",
  storageBucket: "duvi-designs.firebasestorage.app",
  messagingSenderId: "290198968741",
  appId: "1:290198968741:web:222a0b01d04f9ae77cf04c"
};
const firebaseApp = initializeApp(firebaseConfig);
const db = getDatabase(firebaseApp);

// ─── Role Config ──────────────────────────────────────────────────────────────
const ROLE_COLORS = { Admin:"#8b5cf6", Manager:"#3b82f6", Warehouse:"#f59e0b", Viewer:"#94a3b8" };
const ROLE_BADGES = { Admin:"👑", Manager:"🏢", Warehouse:"🏭", Viewer:"👁" };
const CATEGORIES  = ["Metal","Polymer","Chemical","Rubber","Composite","Electronics","Other"];
const UNITS       = ["kg","g","m","L","pcs","rolls","boxes","sets"];
const PO_COLORS   = { Pending:"#f59e0b", Received:"#10b981", Closed:"#94a3b8", Cancelled:"#ef4444" };
const RUN_COLORS  = { Planned:"#3b82f6", "In Progress":"#f59e0b", Completed:"#10b981" };

// ─── Default Permissions ──────────────────────────────────────────────────────
const DEFAULT_PERMS = {
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
const SEED_USERS = [
  { id:"u1", username:"admin",      password:"admin123",   name:"Admin",            role:"Admin"     },
  { id:"u2", username:"manager1",   password:"manager123", name:"Sarah (Manager)",  role:"Manager"   },
  { id:"u3", username:"warehouse1", password:"wh123",      name:"Tom (Warehouse)",  role:"Warehouse" },
  { id:"u4", username:"viewer1",    password:"view123",    name:"Guest Viewer",     role:"Viewer"    },
];
const SEED_MATERIALS = [
  { id:"RM-001", name:"Steel Rods (Grade A)",  category:"Metal",     supplier:"MetalWorks Co.",    unit:"kg",  stock:900,  threshold:300,  unitCost:18.50 },
  { id:"RM-002", name:"Copper Wire",           category:"Metal",     supplier:"ElectraSupply Ltd", unit:"m",   stock:50,   threshold:150,  unitCost:4.20  },
  { id:"RM-003", name:"PVC Resin",             category:"Polymer",   supplier:"ChemBase Inc.",     unit:"kg",  stock:380,  threshold:200,  unitCost:2.75  },
  { id:"RM-004", name:"Aluminium Sheets",      category:"Metal",     supplier:"MetalWorks Co.",    unit:"pcs", stock:150,  threshold:80,   unitCost:35.00 },
  { id:"RM-005", name:"Rubber Gaskets",        category:"Rubber",    supplier:"RubberTech",        unit:"pcs", stock:1200, threshold:500,  unitCost:0.85  },
  { id:"RM-006", name:"Epoxy Resin",           category:"Chemical",  supplier:"ChemBase Inc.",     unit:"L",   stock:60,   threshold:60,   unitCost:12.40 },
  { id:"RM-007", name:"Stainless Steel Bolts", category:"Metal",     supplier:"FastenPro",         unit:"pcs", stock:2500, threshold:1000, unitCost:0.15  },
  { id:"RM-008", name:"Carbon Fiber Roll",     category:"Composite", supplier:"CompTech Ltd.",     unit:"m",   stock:35,   threshold:25,   unitCost:145.0 },
];
const SEED_SUPPLIERS = [
  { id:"SUP-001", name:"MetalWorks Co.",    contact:"John Davis",  email:"j.davis@metalworks.com",   phone:"555-0101", lead:7,  materials:"Steel Rods, Aluminium", status:"Active" },
  { id:"SUP-002", name:"ElectraSupply Ltd", contact:"Sarah Chen",  email:"s.chen@electrasupply.com", phone:"555-0102", lead:10, materials:"Copper Wire",           status:"Active" },
  { id:"SUP-003", name:"ChemBase Inc.",     contact:"Mike Torres", email:"m.torres@chembase.com",    phone:"555-0103", lead:14, materials:"PVC Resin, Epoxy",      status:"Active" },
  { id:"SUP-004", name:"RubberTech",        contact:"Amy Wilson",  email:"a.wilson@rubbertech.com",  phone:"555-0104", lead:5,  materials:"Rubber Gaskets",        status:"Active" },
  { id:"SUP-005", name:"FastenPro",         contact:"Tom Hill",    email:"t.hill@fastenpro.com",     phone:"555-0105", lead:3,  materials:"Steel Bolts",           status:"Active" },
];
const SEED_TXN = [
  { id:"TXN-001", date:"2025-01-05", materialId:"RM-001", type:"IN",  qty:500, ref:"Opening Balance",    userId:"u1", source:"manual" },
  { id:"TXN-002", date:"2025-01-08", materialId:"RM-002", type:"IN",  qty:400, ref:"PO-001",             userId:"u2", source:"po"     },
  { id:"TXN-003", date:"2025-01-10", materialId:"RM-001", type:"OUT", qty:200, ref:"RUN-001",            userId:"u3", source:"run"    },
  { id:"TXN-004", date:"2025-02-15", materialId:"RM-006", type:"OUT", qty:80,  ref:"RUN-002",            userId:"u3", source:"run"    },
  { id:"TXN-005", date:"2025-02-20", materialId:"RM-002", type:"OUT", qty:350, ref:"RUN-002",            userId:"u2", source:"run"    },
  { id:"TXN-006", date:"2025-03-01", materialId:"RM-003", type:"IN",  qty:200, ref:"PO-002",             userId:"u2", source:"po"     },
  { id:"TXN-007", date:"2025-03-05", materialId:"RM-004", type:"OUT", qty:50,  ref:"Manual adjustment",  userId:"u3", source:"manual" },
];
const SEED_POs = [
  { id:"PO-001", date:"2025-01-06", supplierId:"SUP-002", materialId:"RM-002", qty:400, unitCost:4.20,  status:"Received",  notes:"Urgent restock",   expectedDate:"2025-01-15", receivedDate:"2025-01-08" },
  { id:"PO-002", date:"2025-02-28", supplierId:"SUP-003", materialId:"RM-003", qty:200, unitCost:2.75,  status:"Received",  notes:"",                 expectedDate:"2025-03-14", receivedDate:"2025-03-01" },
  { id:"PO-003", date:"2025-03-04", supplierId:"SUP-001", materialId:"RM-001", qty:600, unitCost:18.50, status:"Pending",   notes:"Q2 restock",       expectedDate:"2025-03-18", receivedDate:null         },
  { id:"PO-004", date:"2025-03-06", supplierId:"SUP-004", materialId:"RM-005", qty:1000,unitCost:0.85,  status:"Pending",   notes:"",                 expectedDate:"2025-03-12", receivedDate:null         },
];
const SEED_RUNS = [
  { id:"RUN-001", date:"2025-01-10", name:"Production Run #101", ref:"PR-101", items:[{materialId:"RM-001",qty:200},{materialId:"RM-003",qty:80}],  userId:"u3", status:"Completed", notes:"Batch A - Steel components" },
  { id:"RUN-002", date:"2025-02-15", name:"Production Run #102", ref:"PR-102", items:[{materialId:"RM-006",qty:80}, {materialId:"RM-002",qty:350}], userId:"u3", status:"Completed", notes:"Batch B - Wiring assemblies" },
  { id:"RUN-003", date:"2025-03-10", name:"Production Run #103", ref:"PR-103", items:[{materialId:"RM-004",qty:30},{materialId:"RM-007",qty:500}],  userId:"u2", status:"Planned",   notes:"Scheduled next week" },
];
const SEED_AUDIT = [
  { id:"AUD-001", ts:"2025-01-05T08:00:00Z", userId:"u1", userName:"Admin",          userRole:"Admin",     action:"LOGIN",    entity:"Auth",     entityId:"u1",     details:"Admin logged in" },
  { id:"AUD-002", ts:"2025-01-05T08:05:00Z", userId:"u1", userName:"Admin",          userRole:"Admin",     action:"STOCK_IN", entity:"Material", entityId:"RM-001", details:"Stock IN · 500 kg · Steel Rods (Grade A)" },
  { id:"AUD-003", ts:"2025-01-08T09:00:00Z", userId:"u2", userName:"Sarah (Manager)",userRole:"Manager",   action:"PO_RECV",  entity:"PO",       entityId:"PO-001", details:"PO Received · 400 m Copper Wire from ElectraSupply Ltd" },
  { id:"AUD-004", ts:"2025-01-10T10:00:00Z", userId:"u3", userName:"Tom (Warehouse)",userRole:"Warehouse", action:"RUN_DONE", entity:"Run",      entityId:"RUN-001",details:"Production Run #101 completed · 2 materials consumed" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtN  = (n) => (n??0).toLocaleString("en-IN",{maximumFractionDigits:2});
const fmtC  = (n) => "₹"+(n??0).toLocaleString("en-IN",{minimumFractionDigits:2,maximumFractionDigits:2});
const uid   = () => Math.random().toString(36).slice(2,9).toUpperCase();
const now   = () => new Date().toISOString();
const today = () => new Date().toISOString().slice(0,10);
const fmtTs = (ts: string) => { const d=new Date(ts); return d.toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"})+" "+d.toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"}); };

function stockStatus(stock: number, thresh: number) {
  if (stock<=0)      return { label:"Out of Stock", color:"#ef4444", bg:"#fef2f2" };
  if (stock<=thresh) return { label:"Low Stock",    color:"#f59e0b", bg:"#fffbeb" };
  return                    { label:"OK",           color:"#10b981", bg:"#f0fdf4" };
}

function getMonthlyData(transactions: any[], materials: any[]) {
  const map = {};
  transactions.forEach((tx: any) => {
    const m  = tx.date.slice(0,7);
    const mat= materials.find(x=>x.id===tx.materialId);
    const cost=(mat?.unitCost||0)*tx.qty;
    if (!map[m]) map[m]={ month:m, "Cost In":0, "Cost Out":0, Transactions:0 };
    if (tx.type==="IN")  map[m]["Cost In"]  += cost;
    if (tx.type==="OUT") map[m]["Cost Out"] += cost;
    map[m].Transactions++;
  });
  return Object.values(map).sort((a,b)=>a.month.localeCompare(b.month)).slice(-6).map(d=>({
    ...d, month: d.month.slice(5)+" '"+d.month.slice(2,4),
    "Cost In": +d["Cost In"].toFixed(2), "Cost Out": +d["Cost Out"].toFixed(2),
  }));
}

function downloadFile(content: string, filename: string, type="text/csv") {
  const blob = new Blob([content], { type });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href=url; a.download=filename; a.click();
  URL.revokeObjectURL(url);
}

function toCSV(rows: any[], cols: {label: string, key: string}[]) {
  const header = cols.map(c=>c.label).join(",");
  const body   = rows.map((r: any)=>cols.map(c=>{ const v=r[c.key]??""; return typeof v==="string"&&v.includes(",") ? `"${v}"` : v; }).join(",")).join("\n");
  return header+"\n"+body;
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const inp = { width:"100%", padding:"8px 11px", border:"1px solid #d1d5db", borderRadius:6, fontSize:13, outline:"none", background:"#f9fafb", boxSizing:"border-box" };
const darkInp = { ...inp, background:"#0f172a", color:"#f1f5f9", border:"1px solid #334155" };
const btn = (bg, fg="#fff", pad="8px 16px") => ({ background:bg, color:fg, border:"none", borderRadius:7, padding:pad, fontWeight:700, cursor:"pointer", fontSize:13, flexShrink:0 });

// ─── Small Components ─────────────────────────────────────────────────────────
const Lbl  = ({c})  => <label style={{display:"block",fontWeight:600,fontSize:12,color:"#374151",marginBottom:5}}>{c}</label>;
const Card = ({children,style={}}) => <div style={{background:"#fff",borderRadius:12,border:"1px solid #e2e8f0",overflow:"hidden",...style}}>{children}</div>;
const Th   = ({c,right}) => <th style={{padding:"10px 13px",textAlign:right?"right":"left",fontWeight:700,fontSize:12,whiteSpace:"nowrap",background:"#0f172a",color:"#fff"}}>{c}</th>;
const Td   = ({c,right,bold,color,style={}}) => <td style={{padding:"9px 13px",textAlign:right?"right":"left",fontWeight:bold?700:400,color:color||"inherit",fontSize:12,...style}}>{c}</td>;
function Badge({label,color,bg}) { return <span style={{background:bg,color,borderRadius:6,padding:"3px 9px",fontSize:11,fontWeight:700,whiteSpace:"nowrap"}}>{label}</span>; }
function RoleBadge({role}) { return <Badge label={`${ROLE_BADGES[role]} ${role}`} color={ROLE_COLORS[role]} bg={ROLE_COLORS[role]+"18"}/>; }
function Toggle({on,onChange}) {
  return <div onClick={onChange} style={{width:36,height:20,borderRadius:10,background:on?"#10b981":"#d1d5db",cursor:"pointer",position:"relative",transition:"all 0.2s",flexShrink:0}}>
    <div style={{width:14,height:14,borderRadius:"50%",background:"#fff",position:"absolute",top:3,left:on?18:3,transition:"left 0.2s"}}/>
  </div>;
}
function SectionBar({title,children}) {
  return <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,flexWrap:"wrap",gap:10}}>
    <h2 style={{margin:0,fontSize:20,fontWeight:800,color:"#0f172a"}}>{title}</h2>
    <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{children}</div>
  </div>;
}
function EmptyState({icon,msg}) {
  return <div style={{textAlign:"center",padding:"40px 20px",color:"#94a3b8"}}>
    <div style={{fontSize:36,marginBottom:8}}>{icon}</div>
    <div style={{fontSize:13}}>{msg}</div>
  </div>;
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN APP
// ═════════════════════════════════════════════════════════════════════════════
export default function App() {
  // ── State ──────────────────────────────────────────────────────────────────
  const [users,    setUsers]    = useState([]);
  const [mats,     setMats]     = useState([]);
  const [sups,     setSups]     = useState([]);
  const [txns,     setTxns]     = useState([]);
  const [pos,      setPOs]      = useState([]);
  const [runs,     setRuns]     = useState([]);
  const [audit,    setAudit]    = useState([]);
  const [perms,    setPerms]    = useState({});
  const [notifs,   setNotifs]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [session,  setSession]  = useState(null);
  const [tab,      setTab]      = useState("Dashboard");
  const [modal,    setModal]    = useState(null);
  const [form,     setForm]     = useState({});
  const [target,   setTarget]   = useState(null);
  const [toast,    setToast]    = useState(null);
  const [search,   setSearch]   = useState("");
  const [syncing,  setSyncing]  = useState(false);
  const [loginF,   setLoginF]   = useState({ username:"", password:"", error:"" });
  const [showNotif,setShowNotif]= useState(false);
  const [poFilter, setPoFilter] = useState("All");
  const [runFilter,setRunFilter]= useState("All");
  const restoreRef = useRef();

  // ── Storage ─────────────────────────────────────────────────────────────────
  const save = useCallback(async (key, val) => { try { await set(ref(db, "duvidesigns/" + key), JSON.stringify(val)); } catch(e){} }, []);
  const load = useCallback(async (key) => { try { const snap = await get(ref(db, "duvidesigns/" + key)); return snap.exists() ? JSON.parse(snap.val()) : null; } catch(e){ return null; } }, []);

  // ── Boot ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const [u,m,s,t,p,po,r,a] = await Promise.all([
        load("io-users"),load("io-mats"),load("io-sups"),load("io-txns"),
        load("io-perms"),load("io-pos"),load("io-runs"),load("io-audit"),
      ]);
      setUsers(u??SEED_USERS);   setMats(m??SEED_MATERIALS); setSups(s??SEED_SUPPLIERS);
      setTxns(t??SEED_TXN);     setPerms(p??DEFAULT_PERMS); setPOs(po??SEED_POs);
      setRuns(r??SEED_RUNS);    setAudit(a??SEED_AUDIT);
      if(!u) save("io-users",SEED_USERS); if(!m) save("io-mats",SEED_MATERIALS);
      if(!s) save("io-sups",SEED_SUPPLIERS); if(!t) save("io-txns",SEED_TXN);
      if(!p) save("io-perms",DEFAULT_PERMS); if(!po) save("io-pos",SEED_POs);
      if(!r) save("io-runs",SEED_RUNS); if(!a) save("io-audit",SEED_AUDIT);
      setLoading(false);
    })();
  },[]);

  // ── Poll ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!session) return;
    const iv = setInterval(async () => {
      const [m,t,po,r,u,p,a,s] = await Promise.all([
        load("io-mats"),load("io-txns"),load("io-pos"),load("io-runs"),
        load("io-users"),load("io-perms"),load("io-audit"),load("io-sups"),
      ]);
      if(m) setMats(m); if(t) setTxns(t); if(po) setPOs(po); if(r) setRuns(r);
      if(u) setUsers(u); if(s) setSups(s); if(a) setAudit(a);
      if(p) { setPerms(p); setSession(prev=>prev?{...prev,perms:p[prev.user.role]}:prev); }
    },10000);
    return ()=>clearInterval(iv);
  },[session]);

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const syncAll = async (updates) => {
    setSyncing(true);
    await Promise.all(Object.entries(updates).map(([k,v])=>save(k,v)));
    setSyncing(false);
  };

  const toast$ = (msg, type="ok") => { setToast({msg,type}); setTimeout(()=>setToast(null),3000); };

  const addAudit = (action, entity, entityId, details, extras={}) => ({
    id:`AUD-${uid()}`, ts:now(),
    userId:session?.user?.id, userName:session?.user?.name, userRole:session?.user?.role,
    action, entity, entityId, details, ...extras,
  });

  const checkNotifs = (newMats) => {
    const alerts = newMats.filter(m=>m.stock<=m.threshold&&m.stock>=0);
    if (alerts.length===0) return;
    const newN = alerts.map(m=>({ id:`N-${uid()}`, date:today(), materialId:m.id, msg:`Low stock: ${m.name} (${fmtN(m.stock)} ${m.unit} remaining)`, read:false, type:"low_stock" }));
    setNotifs(prev=>[...newN.filter(n=>!prev.some(p=>p.materialId===n.materialId&&p.date===n.date)),...prev].slice(0,50));
  };

  const can  = a => session?.perms?.actions?.[a] ?? false;
  const see  = t => session?.perms?.tabs?.[t]    ?? false;
  const data = k => session?.perms?.data?.[k]    ?? false;

  const unread = notifs.filter(n=>!n.read).length;

  // ── Login ───────────────────────────────────────────────────────────────────
  function handleLogin() {
    const u = users.find(x=>x.username===loginF.username&&x.password===loginF.password);
    if (!u) { setLoginF(f=>({...f,error:"Incorrect username or password."})); return; }
    const p = perms[u.role]??DEFAULT_PERMS[u.role];
    setSession({ user:u, perms:p });
    setTab("Dashboard");
    const entry = addAuditEntry("LOGIN","Auth",u.id,`${u.name} logged in`, u);
    const newA=[entry,...audit].slice(0,500);
    setAudit(newA); save("io-audit",newA);
  }
  function addAuditEntry(action,entity,entityId,details, sessionUser) {
    const su = sessionUser||session?.user;
    return { id:`AUD-${uid()}`, ts:now(), userId:su?.id, userName:su?.name, userRole:su?.role, action, entity, entityId, details };
  }

  // ── Transactions ───────────────────────────────────────────────────────────
  async function submitTxn(type) {
    const mat=mats.find(x=>x.id===form.materialId);
    const qty=parseInt(form.qty);
    if (!mat||!qty||qty<=0) { toast$("Fill all fields","err"); return; }
    if (type==="out"&&qty>mat.stock) { toast$(`Only ${mat.stock} ${mat.unit} in stock`,"err"); return; }
    const tx={id:`TXN-${uid()}`,date:today(),materialId:form.materialId,type:type.toUpperCase(),qty,ref:form.ref||"Manual Entry",userId:session.user.id,source:"manual"};
    const newTxns=[tx,...txns];
    const newMats=mats.map(x=>x.id===form.materialId?{...x,stock:type==="in"?x.stock+qty:x.stock-qty}:x);
    const entry=addAuditEntry(type==="in"?"STOCK_IN":"STOCK_OUT","Material",form.materialId,`Stock ${type.toUpperCase()} · ${qty} ${mat.unit} · ${mat.name}`);
    const newA=[entry,...audit].slice(0,500);
    setTxns(newTxns); setMats(newMats); setAudit(newA);
    checkNotifs(newMats);
    await syncAll({"io-txns":newTxns,"io-mats":newMats,"io-audit":newA});
    toast$(`Stock ${type.toUpperCase()} recorded ✓`); closeModal();
  }

  // ── Materials ───────────────────────────────────────────────────────────────
  async function submitMat(isEdit) {
    const {id,name,supplier,stock,threshold,unitCost}=form;
    if (!id||!name||!supplier||stock===""||threshold===""||unitCost==="") { toast$("Fill all required fields","err"); return; }
    if (!isEdit&&mats.find(m=>m.id===id)) { toast$("Material ID already exists","err"); return; }
    const mat={...form,stock:parseFloat(stock),threshold:parseFloat(threshold),unitCost:parseFloat(unitCost)};
    const newMats=isEdit?mats.map(m=>m.id===target.id?mat:m):[...mats,mat];
    const entry=addAuditEntry(isEdit?"MAT_EDIT":"MAT_ADD","Material",mat.id,isEdit?`Edited: ${mat.name}`:`Added: ${mat.name}`);
    const newA=[entry,...audit].slice(0,500);
    setMats(newMats); setAudit(newA);
    await syncAll({"io-mats":newMats,"io-audit":newA});
    toast$(isEdit?"Material updated ✓":"Material added ✓"); closeModal();
  }

  async function deleteMat(id) {
    if (!window.confirm("Delete this material? This cannot be undone.")) return;
    const mat=mats.find(m=>m.id===id);
    const newMats=mats.filter(m=>m.id!==id);
    const entry=addAuditEntry("MAT_DEL","Material",id,`Deleted: ${mat?.name}`);
    const newA=[entry,...audit].slice(0,500);
    setMats(newMats); setAudit(newA);
    await syncAll({"io-mats":newMats,"io-audit":newA});
    toast$("Material deleted");
  }

  async function submitThreshold() {
    const newMats=mats.map(m=>m.id===target.id?{...m,threshold:parseFloat(form.threshold)}:m);
    const entry=addAuditEntry("THRESH_EDIT","Material",target.id,`Threshold updated: ${target.name} → ${form.threshold}`);
    const newA=[entry,...audit].slice(0,500);
    setMats(newMats); setAudit(newA);
    await syncAll({"io-mats":newMats,"io-audit":newA});
    toast$("Threshold updated ✓"); closeModal();
  }

  // ── Suppliers ───────────────────────────────────────────────────────────────
  async function submitSup(isEdit) {
    if (!form.id||!form.name||!form.contact||!form.email) { toast$("Fill required fields","err"); return; }
    const sup={...form,lead:parseInt(form.lead)||7};
    const newSups=isEdit?sups.map(s=>s.id===target.id?sup:s):[...sups,sup];
    const entry=addAuditEntry(isEdit?"SUP_EDIT":"SUP_ADD","Supplier",sup.id,isEdit?`Edited: ${sup.name}`:`Added: ${sup.name}`);
    const newA=[entry,...audit].slice(0,500);
    setSups(newSups); setAudit(newA);
    await syncAll({"io-sups":newSups,"io-audit":newA});
    toast$(isEdit?"Supplier updated ✓":"Supplier added ✓"); closeModal();
  }

  async function deleteSup(id) {
    if (!window.confirm("Delete this supplier?")) return;
    const sup=sups.find(s=>s.id===id);
    const newSups=sups.filter(s=>s.id!==id);
    const entry=addAuditEntry("SUP_DEL","Supplier",id,`Deleted: ${sup?.name}`);
    const newA=[entry,...audit].slice(0,500);
    setSups(newSups); setAudit(newA);
    await syncAll({"io-sups":newSups,"io-audit":newA});
    toast$("Supplier deleted");
  }

  // ── Purchase Orders ─────────────────────────────────────────────────────────
  async function submitPO(isEdit) {
    if (!form.id||!form.supplierId||!form.materialId||!form.qty||!form.unitCost||!form.expectedDate) { toast$("Fill all required fields","err"); return; }
    if (!isEdit&&pos.find(p=>p.id===form.id)) { toast$("PO ID already exists","err"); return; }
    const po={...form,qty:parseFloat(form.qty),unitCost:parseFloat(form.unitCost),status:isEdit?form.status:"Pending",receivedDate:form.receivedDate||null};
    const newPos=isEdit?pos.map(p=>p.id===target.id?po:p):[...pos,po];
    const entry=addAuditEntry(isEdit?"PO_EDIT":"PO_CREATE","PO",po.id,isEdit?`Edited PO: ${po.id}`:`Created PO: ${po.id} · ${po.qty} ${mats.find(m=>m.id===po.materialId)?.unit||""} of ${mats.find(m=>m.id===po.materialId)?.name||""}`);
    const newA=[entry,...audit].slice(0,500);
    setPOs(newPos); setAudit(newA);
    await syncAll({"io-pos":newPos,"io-audit":newA});
    toast$(isEdit?"PO updated ✓":"PO created ✓"); closeModal();
  }

  async function receivePO(po) {
    const mat=mats.find(m=>m.id===po.materialId);
    if (!mat) { toast$("Material not found","err"); return; }
    const tx={id:`TXN-${uid()}`,date:today(),materialId:po.materialId,type:"IN",qty:po.qty,ref:po.id,userId:session.user.id,source:"po"};
    const newTxns=[tx,...txns];
    const newMats=mats.map(m=>m.id===po.materialId?{...m,stock:m.stock+po.qty}:m);
    const newPos=pos.map(p=>p.id===po.id?{...p,status:"Received",receivedDate:today()}:p);
    const entry=addAuditEntry("PO_RECV","PO",po.id,`PO Received · ${po.qty} ${mat.unit} of ${mat.name} from ${sups.find(s=>s.id===po.supplierId)?.name||""}`);
    const newA=[entry,...audit].slice(0,500);
    setTxns(newTxns); setMats(newMats); setPOs(newPos); setAudit(newA);
    checkNotifs(newMats);
    await syncAll({"io-txns":newTxns,"io-mats":newMats,"io-pos":newPos,"io-audit":newA});
    toast$("PO marked as Received · Stock updated ✓");
  }

  async function closePO(po) {
    if (!window.confirm("Mark this PO as Closed/Cancelled?")) return;
    const newPos=pos.map(p=>p.id===po.id?{...p,status:"Closed"}:p);
    const entry=addAuditEntry("PO_CLOSE","PO",po.id,`PO Closed: ${po.id}`);
    const newA=[entry,...audit].slice(0,500);
    setPOs(newPos); setAudit(newA);
    await syncAll({"io-pos":newPos,"io-audit":newA});
    toast$("PO closed");
  }

  // ── Production Runs ─────────────────────────────────────────────────────────
  async function submitRun(isEdit) {
    if (!form.name||!form.date) { toast$("Fill all required fields","err"); return; }
    const items=(form.items||[]).filter(i=>i.materialId&&parseInt(i.qty)>0);
    if (items.length===0) { toast$("Add at least one material","err"); return; }
    const run={ id:isEdit?target.id:`RUN-${uid()}`, date:form.date, name:form.name, ref:form.ref||"", items:items.map(i=>({materialId:i.materialId,qty:parseInt(i.qty)})), userId:session.user.id, status:form.status||"Planned", notes:form.notes||"" };
    const newRuns=isEdit?runs.map(r=>r.id===target.id?run:r):[...runs,run];
    const entry=addAuditEntry(isEdit?"RUN_EDIT":"RUN_CREATE","Run",run.id,isEdit?`Edited Run: ${run.name}`:`Created: ${run.name}`);
    const newA=[entry,...audit].slice(0,500);
    setRuns(newRuns); setAudit(newA);
    await syncAll({"io-runs":newRuns,"io-audit":newA});
    toast$(isEdit?"Run updated ✓":"Run created ✓"); closeModal();
  }

  async function completeRun(run) {
    const insufficients = run.items.filter(item=>{ const m=mats.find(x=>x.id===item.materialId); return !m||m.stock<item.qty; });
    if (insufficients.length>0) { toast$(`Insufficient stock for: ${insufficients.map(i=>mats.find(m=>m.id===i.materialId)?.name||i.materialId).join(", ")}`,"err"); return; }
    const newTxList=run.items.map(item=>({ id:`TXN-${uid()}`, date:today(), materialId:item.materialId, type:"OUT", qty:item.qty, ref:run.id, userId:session.user.id, source:"run" }));
    const newTxns=[...newTxList,...txns];
    const newMats=mats.map(m=>{ const item=run.items.find(i=>i.materialId===m.id); return item?{...m,stock:m.stock-item.qty}:m; });
    const newRuns=runs.map(r=>r.id===run.id?{...r,status:"Completed"}:r);
    const entry=addAuditEntry("RUN_DONE","Run",run.id,`Completed: ${run.name} · ${run.items.length} materials consumed`);
    const newA=[entry,...audit].slice(0,500);
    setTxns(newTxns); setMats(newMats); setRuns(newRuns); setAudit(newA);
    checkNotifs(newMats);
    await syncAll({"io-txns":newTxns,"io-mats":newMats,"io-runs":newRuns,"io-audit":newA});
    toast$("Production run completed · Stock updated ✓");
  }

  async function deleteRun(id) {
    if (!window.confirm("Delete this run?")) return;
    const run=runs.find(r=>r.id===id);
    const newRuns=runs.filter(r=>r.id!==id);
    const entry=addAuditEntry("RUN_DEL","Run",id,`Deleted: ${run?.name}`);
    const newA=[entry,...audit].slice(0,500);
    setRuns(newRuns); setAudit(newA);
    await syncAll({"io-runs":newRuns,"io-audit":newA});
    toast$("Run deleted");
  }

  // ── Users ───────────────────────────────────────────────────────────────────
  async function submitUser(isEdit) {
    if (!form.username||!form.password||!form.name) { toast$("Fill all fields","err"); return; }
    if (!isEdit&&users.find(u=>u.username===form.username)) { toast$("Username taken","err"); return; }
    const user=isEdit?{...target,...form}:{...form,id:`u-${uid()}`};
    const newUsers=isEdit?users.map(u=>u.id===target.id?user:u):[...users,user];
    const entry=addAuditEntry(isEdit?"USER_EDIT":"USER_ADD","User",user.id,isEdit?`Edited user: ${user.username}`:`Created user: ${user.username} (${user.role})`);
    const newA=[entry,...audit].slice(0,500);
    setUsers(newUsers); setAudit(newA);
    await syncAll({"io-users":newUsers,"io-audit":newA});
    toast$(isEdit?"User updated ✓":"User created ✓"); closeModal();
  }

  async function deleteUser(id) {
    if (id===session.user.id) { toast$("Cannot delete your own account","err"); return; }
    if (!window.confirm("Delete this user?")) return;
    const u=users.find(x=>x.id===id);
    const newUsers=users.filter(x=>x.id!==id);
    const entry=addAuditEntry("USER_DEL","User",id,`Deleted user: ${u?.username}`);
    const newA=[entry,...audit].slice(0,500);
    setUsers(newUsers); setAudit(newA);
    await syncAll({"io-users":newUsers,"io-audit":newA});
    toast$("User deleted");
  }

  async function togglePerm(role,group,key) {
    const updated={...perms,[role]:{...perms[role],[group]:{...perms[role][group],[key]:!perms[role][group][key]}}};
    setPerms(updated);
    setSession(prev=>prev&&prev.user.role===role?{...prev,perms:updated[role]}:prev);
    const entry=addAuditEntry("PERM_CHANGE","Permission",role,`${role} · ${group}.${key} → ${!perms[role][group][key]}`);
    const newA=[entry,...audit].slice(0,500);
    setAudit(newA);
    await syncAll({"io-perms":updated,"io-audit":newA});
    toast$("Permission updated ✓");
  }

  // ── Export ──────────────────────────────────────────────────────────────────
  function exportInventoryCSV() {
    const csv=toCSV(mats,[
      {label:"ID",key:"id"},{label:"Name",key:"name"},{label:"Category",key:"category"},
      {label:"Supplier",key:"supplier"},{label:"Unit",key:"unit"},{label:"Stock",key:"stock"},
      {label:"Threshold",key:"threshold"},{label:"Unit Cost",key:"unitCost"},
    ]);
    downloadFile(csv,`inventory_${today()}.csv`);
    toast$("Inventory exported ✓");
  }

  function exportTxnCSV() {
    const rows=txns.map(t=>({ ...t, materialName:mats.find(m=>m.id===t.materialId)?.name||"", by:users.find(u=>u.id===t.userId)?.name||"" }));
    const csv=toCSV(rows,[
      {label:"ID",key:"id"},{label:"Date",key:"date"},{label:"Material",key:"materialName"},
      {label:"Type",key:"type"},{label:"Qty",key:"qty"},{label:"Reference",key:"ref"},{label:"By",key:"by"},
    ]);
    downloadFile(csv,`transactions_${today()}.csv`);
    toast$("Transactions exported ✓");
  }

  // ── Backup / Restore ─────────────────────────────────────────────────────────
  function handleBackup() {
    const payload=JSON.stringify({users,mats,sups,txns,pos,runs,audit,perms,exportedAt:now()},null,2);
    downloadFile(payload,`inventoryos_backup_${today()}.json`,"application/json");
    toast$("Backup downloaded ✓");
  }

  async function handleRestore(e) {
    const file=e.target.files[0];
    if (!file) return;
    if (!window.confirm("Restore this backup? ALL current data will be replaced.")) { e.target.value=""; return; }
    try {
      const text=await file.text();
      const d=JSON.parse(text);
      if (!d.users||!d.mats||!d.txns) { toast$("Invalid backup file","err"); return; }
      setUsers(d.users); setMats(d.mats); setSups(d.sups||[]); setTxns(d.txns);
      setPOs(d.pos||[]); setRuns(d.runs||[]); setAudit(d.audit||[]); setPerms(d.perms||DEFAULT_PERMS);
      await syncAll({"io-users":d.users,"io-mats":d.mats,"io-sups":d.sups||[],"io-txns":d.txns,"io-pos":d.pos||[],"io-runs":d.runs||[],"io-audit":d.audit||[],"io-perms":d.perms||DEFAULT_PERMS});
      toast$("Backup restored successfully ✓");
    } catch(err) { toast$("Failed to read backup file","err"); }
    e.target.value="";
  }

  // ── Modal helpers ────────────────────────────────────────────────────────────
  function openModal(type, tgt=null) {
    setTarget(tgt);
    if (type==="txnIn"||type==="txnOut") setForm({materialId:"",qty:"",ref:""});
    if (type==="addMat")   setForm({id:"",name:"",category:"Metal",supplier:"",unit:"kg",stock:"",threshold:"",unitCost:""});
    if (type==="editMat")  setForm({...tgt});
    if (type==="editThreshold") setForm({threshold:tgt.threshold});
    if (type==="addSup")   setForm({id:"",name:"",contact:"",email:"",phone:"",lead:"",materials:"",status:"Active"});
    if (type==="editSup")  setForm({...tgt});
    if (type==="addPO")    setForm({id:`PO-${uid()}`,supplierId:"",materialId:"",qty:"",unitCost:"",expectedDate:"",notes:"",status:"Pending"});
    if (type==="editPO")   setForm({...tgt});
    if (type==="addRun")   setForm({name:"",date:today(),ref:"",notes:"",status:"Planned",items:[{materialId:"",qty:""}]});
    if (type==="editRun")  setForm({...tgt,items:[...tgt.items.map(i=>({...i}))]});
    if (type==="addUser")  setForm({username:"",password:"",name:"",role:"Warehouse"});
    if (type==="editUser") setForm({...tgt});
    setModal(type);
  }
  const closeModal = () => { setModal(null); setForm({}); setTarget(null); };
  const fset = (k,v) => setForm(f=>({...f,[k]:v}));

  // ── Derived ──────────────────────────────────────────────────────────────────
  const alerts     = mats.filter(m=>m.stock<=m.threshold);
  const stockVal   = mats.reduce((s,m)=>s+m.stock*m.unitCost,0);
  const totalCostIn  = txns.filter(t=>t.type==="IN").reduce((s,t)=>{ const m=mats.find(x=>x.id===t.materialId); return s+(m?m.unitCost*t.qty:0); },0);
  const totalCostOut = txns.filter(t=>t.type==="OUT").reduce((s,t)=>{ const m=mats.find(x=>x.id===t.materialId); return s+(m?m.unitCost*t.qty:0); },0);
  const visibleTxn = useMemo(()=>{
    const sorted=[...txns].sort((a,b)=>b.date.localeCompare(a.date));
    return data("viewAllTxn")?sorted:sorted.filter(t=>t.userId===session?.user?.id);
  },[txns,session,perms]);
  const filteredMats = useMemo(()=>mats.filter(m=>!search||m.name.toLowerCase().includes(search.toLowerCase())||m.id.toLowerCase().includes(search.toLowerCase())),[mats,search]);
  const monthlyData  = useMemo(()=>getMonthlyData(txns,mats),[txns,mats]);

  const TAB_MAP = [
    {key:"Dashboard",label:"📊 Dashboard",perm:"dashboard"},
    {key:"Inventory",label:"📦 Inventory",perm:"inventory"},
    {key:"Transactions",label:"📋 Transactions",perm:"transactions"},
    {key:"Purchase Orders",label:"🧾 Purchase Orders",perm:"purchaseOrders"},
    {key:"Production Runs",label:"🏭 Production Runs",perm:"productionRuns"},
    {key:"Suppliers",label:"🏢 Suppliers",perm:"suppliers"},
    {key:"Cost & Analytics",label:"💰 Cost & Analytics",perm:"costs"},
    {key:"Audit Log",label:"🔍 Audit Log",perm:"auditLog"},
    {key:"Admin",label:"⚙ Admin",perm:"admin"},
  ];
  const visibleTabs = TAB_MAP.filter(t=>see(t.perm));

  // ════════════════════════════════════════════════════════════════════════════
  // LOADING
  if (loading) return <div style={{minHeight:"100vh",background:"#0f172a",display:"flex",alignItems:"center",justifyContent:"center",color:"#38bdf8",fontSize:16,fontFamily:"'DM Sans',sans-serif"}}>Loading InventoryOS…</div>;

  // ════════════════════════════════════════════════════════════════════════════
  // LOGIN
  if (!session) return (
    <div style={{minHeight:"100vh",background:"linear-gradient(135deg,#0f172a 0%,#1e293b 100%)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'DM Sans','Segoe UI',sans-serif",padding:16}}>
      <div style={{background:"#1e293b",borderRadius:16,padding:"40px 44px",width:"100%",maxWidth:400,boxShadow:"0 30px 60px rgba(0,0,0,0.5)"}}>
        <div style={{textAlign:"center",marginBottom:30}}>
          <div style={{fontSize:44,marginBottom:10}}>⚙️</div>
          <div style={{color:"#38bdf8",fontSize:22,fontWeight:900}}>InventoryOS</div>
          <div style={{color:"#475569",fontSize:12,marginTop:4}}>Manufacturing · Raw Materials · Multi-User</div>
        </div>
        <div style={{display:"grid",gap:13}}>
          <div><Lbl c={<span style={{color:"#94a3b8"}}>Username</span>}/>
            <input placeholder="Enter username" value={loginF.username} onChange={e=>setLoginF(f=>({...f,username:e.target.value,error:""}))} onKeyDown={e=>e.key==="Enter"&&handleLogin()} style={darkInp} autoFocus/>
          </div>
          <div><Lbl c={<span style={{color:"#94a3b8"}}>Password</span>}/>
            <input type="password" placeholder="Enter password" value={loginF.password} onChange={e=>setLoginF(f=>({...f,password:e.target.value,error:""}))} onKeyDown={e=>e.key==="Enter"&&handleLogin()} style={darkInp}/>
          </div>
          {loginF.error&&<div style={{background:"#fef2f2",borderRadius:7,padding:"8px 12px",color:"#991b1b",fontSize:12,fontWeight:600}}>❌ {loginF.error}</div>}
          <button style={{...btn("#38bdf8","#0f172a","11px"),width:"100%",fontSize:14}} onClick={handleLogin}>Sign In →</button>
        </div>
        <div style={{marginTop:22,borderTop:"1px solid #334155",paddingTop:18}}>
          <div style={{color:"#475569",fontSize:11,marginBottom:8,fontWeight:700}}>Demo Credentials</div>
          {[["admin","admin123","Admin"],["manager1","manager123","Manager"],["warehouse1","wh123","Warehouse"],["viewer1","view123","Viewer"]].map(([u,p,r])=>(
            <div key={u} onClick={()=>setLoginF({username:u,password:p,error:""})} style={{display:"flex",alignItems:"center",gap:10,padding:"6px 10px",borderRadius:7,cursor:"pointer",marginBottom:4,background:"#0f172a",border:"1px solid #1e293b"}}>
              <RoleBadge role={r}/>
              <span style={{color:"#64748b",fontSize:11}}>{u} / {p}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const user=session.user;

  // ════════════════════════════════════════════════════════════════════════════
  // MAIN APP
  return (
    <div style={{fontFamily:"'DM Sans','Segoe UI',sans-serif",background:"#f1f5f9",minHeight:"100vh"}}>

      {/* Toast */}
      {toast&&<div style={{position:"fixed",bottom:24,right:24,zIndex:9999,background:toast.type==="err"?"#ef4444":"#10b981",color:"#fff",borderRadius:10,padding:"12px 20px",fontWeight:700,fontSize:13,boxShadow:"0 8px 24px rgba(0,0,0,0.25)"}}>
        {toast.type==="err"?"❌":"✅"} {toast.msg}
      </div>}

      {/* Notification Panel */}
      {showNotif&&<div style={{position:"fixed",top:54,right:16,zIndex:500,background:"#fff",borderRadius:12,border:"1px solid #e2e8f0",width:340,boxShadow:"0 8px 30px rgba(0,0,0,0.15)",maxHeight:400,overflowY:"auto"}}>
        <div style={{padding:"12px 16px",borderBottom:"1px solid #f1f5f9",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{fontWeight:700,fontSize:14}}>Notifications</span>
          <button style={{...btn("#f1f5f9","#374151","4px 10px"),fontSize:11}} onClick={()=>{setNotifs(n=>n.map(x=>({...x,read:true})));setShowNotif(false);}}>Clear all</button>
        </div>
        {notifs.length===0?<EmptyState icon="🔔" msg="No notifications"/>:notifs.slice(0,20).map(n=>(
          <div key={n.id} onClick={()=>setNotifs(prev=>prev.map(x=>x.id===n.id?{...x,read:true}:x))} style={{padding:"10px 16px",borderBottom:"1px solid #f8fafc",background:n.read?"#fff":"#fefce8",cursor:"pointer"}}>
            <div style={{fontSize:12,fontWeight:n.read?400:700,color:"#0f172a"}}>{n.msg}</div>
            <div style={{fontSize:11,color:"#94a3b8",marginTop:2}}>{n.date}</div>
          </div>
        ))}
      </div>}

      {/* Header */}
      <div style={{background:"#0f172a",color:"#fff",padding:"0 20px",display:"flex",alignItems:"center",gap:14,height:52,position:"sticky",top:0,zIndex:100}}>
        <span style={{fontSize:17,fontWeight:900,color:"#38bdf8",letterSpacing:"-0.5px"}}>⚙ InventoryOS</span>
        <span style={{color:"#334155",fontSize:12,borderLeft:"1px solid #334155",paddingLeft:14,display:"none"}}>Manufacturing</span>
        <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:10}}>
          {syncing&&<span style={{color:"#38bdf8",fontSize:11,fontStyle:"italic"}}>⟳ Syncing…</span>}
          <div onClick={()=>setShowNotif(v=>!v)} style={{position:"relative",cursor:"pointer",background:"#1e293b",border:"1px solid #334155",borderRadius:8,padding:"5px 10px",fontSize:16}}>
            🔔{unread>0&&<span style={{position:"absolute",top:-4,right:-4,background:"#ef4444",color:"#fff",borderRadius:"50%",width:16,height:16,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700}}>{unread}</span>}
          </div>
          {alerts.length>0&&<div onClick={()=>setTab("Inventory")} style={{background:"#f59e0b",color:"#fff",borderRadius:20,padding:"3px 11px",fontSize:11,fontWeight:700,cursor:"pointer"}}>⚠ {alerts.length} Alert{alerts.length>1?"s":""}</div>}
          <div style={{background:"#1e293b",border:"1px solid #334155",borderRadius:20,padding:"4px 12px",fontSize:12,display:"flex",alignItems:"center",gap:7}}>
            <span style={{color:ROLE_COLORS[user.role],fontWeight:700}}>{ROLE_BADGES[user.role]} {user.role}</span>
            <span style={{color:"#64748b"}}>·</span>
            <span style={{color:"#94a3b8"}}>{user.name}</span>
          </div>
          <button onClick={()=>setSession(null)} style={{...btn("#1e293b","#64748b","5px 10px"),border:"1px solid #334155",fontSize:11}}>Sign Out</button>
        </div>
      </div>

      {/* Nav */}
      <div style={{background:"#1e293b",display:"flex",padding:"0 20px",gap:1,overflowX:"auto",position:"sticky",top:52,zIndex:99}}>
        {visibleTabs.map(t=>(
          <button key={t.key} onClick={()=>{setTab(t.key);setShowNotif(false);}} style={{padding:"9px 13px",border:"none",cursor:"pointer",fontSize:11,fontWeight:700,background:tab===t.key?"#0f172a":"transparent",color:tab===t.key?"#38bdf8":"#64748b",borderBottom:tab===t.key?"2px solid #38bdf8":"2px solid transparent",whiteSpace:"nowrap"}}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{padding:"20px",maxWidth:1400,margin:"0 auto"}}>

        {/* ══ DASHBOARD ════════════════════════════════════════════════════ */}
        {tab==="Dashboard"&&(
          <div>
            <h2 style={{margin:"0 0 16px",fontSize:20,fontWeight:800,color:"#0f172a"}}>Overview</h2>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:12,marginBottom:20}}>
              {[
                {label:"Materials",val:mats.length,icon:"📦",color:"#3b82f6",bg:"#eff6ff"},
                ...(data("viewCosts")?[
                  {label:"Stock Value",val:fmtC(stockVal),icon:"💎",color:"#6366f1",bg:"#eef2ff"},
                  {label:"Cost In",val:fmtC(totalCostIn),icon:"📥",color:"#10b981",bg:"#f0fdf4"},
                  {label:"Cost Out",val:fmtC(totalCostOut),icon:"📤",color:"#f43f5e",bg:"#fff1f2"},
                ]:[]),
                {label:"Low Stock Alerts",val:alerts.length,icon:"⚠",color:"#f59e0b",bg:"#fffbeb"},
                {label:"Pending POs",val:pos.filter(p=>p.status==="Pending").length,icon:"🧾",color:"#06b6d4",bg:"#ecfeff"},
                {label:"Active Runs",val:runs.filter(r=>r.status==="Planned"||r.status==="In Progress").length,icon:"🏭",color:"#8b5cf6",bg:"#f5f3ff"},
              ].map(({label,val,icon,color,bg})=>(
                <div key={label} style={{background:bg,borderRadius:12,padding:"15px 17px",border:`1px solid ${color}22`}}>
                  <div style={{fontSize:22,marginBottom:6}}>{icon}</div>
                  <div style={{fontSize:18,fontWeight:900,color}}>{val}</div>
                  <div style={{fontSize:11,color:"#64748b",marginTop:2}}>{label}</div>
                </div>
              ))}
            </div>

            {data("viewCosts")&&monthlyData.length>0&&(
              <Card style={{padding:20,marginBottom:20}}>
                <div style={{fontWeight:700,fontSize:14,color:"#0f172a",marginBottom:16}}>📈 Monthly Cost Flow (last 6 months)</div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={monthlyData} margin={{top:0,right:10,left:10,bottom:0}}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
                    <XAxis dataKey="month" tick={{fontSize:11}} stroke="#94a3b8"/>
                    <YAxis tick={{fontSize:11}} stroke="#94a3b8" tickFormatter={v=>`$${(v/1000).toFixed(0)}k`}/>
                    <Tooltip formatter={(v,n)=>[fmtC(v),n]} labelStyle={{fontWeight:700}}/>
                    <Legend wrapperStyle={{fontSize:12}}/>
                    <Bar dataKey="Cost In" fill="#10b981" radius={[4,4,0,0]}/>
                    <Bar dataKey="Cost Out" fill="#f43f5e" radius={[4,4,0,0]}/>
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            )}

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
              {alerts.length>0&&(
                <Card style={{border:"1px solid #fde68a"}}>
                  <div style={{background:"#fef3c7",padding:"10px 16px",fontWeight:800,color:"#92400e",fontSize:13}}>⚠ Stock Alerts ({alerts.length})</div>
                  {alerts.map(m=>{const s=stockStatus(m.stock,m.threshold); return(
                    <div key={m.id} style={{display:"flex",alignItems:"center",padding:"9px 16px",borderTop:"1px solid #fef9c3",gap:10}}>
                      <div style={{flex:1}}>
                        <div style={{fontWeight:700,fontSize:12}}>{m.name}</div>
                        <div style={{fontSize:11,color:"#64748b"}}>{m.id}</div>
                      </div>
                      <Badge label={`${fmtN(m.stock)} ${m.unit}`} color={s.color} bg={s.bg}/>
                      <Badge label={s.label} color={s.color} bg={s.bg}/>
                    </div>
                  );})}
                </Card>
              )}
              <Card>
                <div style={{padding:"10px 16px",borderBottom:"1px solid #f1f5f9",fontWeight:700,fontSize:13,color:"#0f172a",display:"flex",justifyContent:"space-between"}}>
                  Recent Activity
                  <span style={{fontSize:11,color:"#94a3b8",fontWeight:400}}>Auto-refresh 10s</span>
                </div>
                {visibleTxn.slice(0,6).map(tx=>{
                  const m=mats.find(x=>x.id===tx.materialId);
                  const u=users.find(x=>x.id===tx.userId);
                  return(
                    <div key={tx.id} style={{display:"flex",alignItems:"center",padding:"9px 16px",borderBottom:"1px solid #f8fafc",gap:10}}>
                      <Badge label={tx.type} color={tx.type==="IN"?"#065f46":"#991b1b"} bg={tx.type==="IN"?"#d1fae5":"#fee2e2"}/>
                      <div style={{flex:1}}>
                        <div style={{fontWeight:600,fontSize:12}}>{m?.name||tx.materialId}</div>
                        <div style={{fontSize:11,color:"#64748b"}}>{tx.ref} · <span style={{color:ROLE_COLORS[u?.role]||"#94a3b8"}}>{u?.name||"—"}</span></div>
                      </div>
                      <div style={{textAlign:"right"}}>
                        <div style={{fontWeight:700,fontSize:12}}>{fmtN(tx.qty)} {m?.unit}</div>
                        <div style={{fontSize:11,color:"#94a3b8"}}>{tx.date}</div>
                      </div>
                    </div>
                  );
                })}
              </Card>
            </div>
          </div>
        )}

        {/* ══ INVENTORY ════════════════════════════════════════════════════ */}
        {tab==="Inventory"&&(
          <div>
            <SectionBar title="Inventory">
              <input placeholder="🔍 Search…" value={search} onChange={e=>setSearch(e.target.value)} style={{...inp,width:170}}/>
              {can("exportData")&&<button style={btn("#475569")} onClick={exportInventoryCSV}>⬇ Export CSV</button>}
              {can("addMat")&&<button style={btn("#6366f1")} onClick={()=>openModal("addMat")}>＋ Add Material</button>}
              {can("stockIn")&&<button style={btn("#10b981")} onClick={()=>openModal("txnIn")}>📥 Stock In</button>}
              {can("stockOut")&&<button style={btn("#f43f5e")} onClick={()=>openModal("txnOut")}>📤 Stock Out</button>}
            </SectionBar>
            <Card style={{overflow:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                <thead><tr>
                  <Th c="ID"/> <Th c="Material"/> <Th c="Category"/> <Th c="Supplier"/> <Th c="Unit"/>
                  <Th c="Stock" right/> <Th c="Threshold" right/> <Th c="Status"/>
                  {data("viewCosts")&&<><Th c="Unit Cost" right/><Th c="Stock Value" right/></>}
                  <Th c="Actions"/>
                </tr></thead>
                <tbody>
                  {filteredMats.map((m,i)=>{const s=stockStatus(m.stock,m.threshold); return(
                    <tr key={m.id} style={{background:i%2===0?"#f8fafc":"#fff"}}>
                      <Td c={m.id} color="#3b82f6" bold style={{fontSize:11}}/>
                      <Td c={m.name} bold/>
                      <Td c={m.category} color="#64748b"/>
                      <Td c={m.supplier} color="#64748b"/>
                      <Td c={m.unit} color="#94a3b8"/>
                      <td style={{padding:"9px 13px",textAlign:"right",fontWeight:700,color:s.color,fontSize:12}}>{fmtN(m.stock)}</td>
                      <td style={{padding:"9px 13px",textAlign:"right",fontSize:12}}>
                        <span style={{display:"flex",alignItems:"center",justifyContent:"flex-end",gap:5}}>
                          {fmtN(m.threshold)}
                          {can("editThresh")&&<span onClick={()=>openModal("editThreshold",m)} style={{cursor:"pointer",color:"#94a3b8",fontSize:10}}>✏</span>}
                        </span>
                      </td>
                      <td style={{padding:"9px 13px"}}><Badge label={`● ${s.label}`} color={s.color} bg={s.bg}/></td>
                      {data("viewCosts")&&<><Td c={fmtC(m.unitCost)} right/><Td c={fmtC(m.stock*m.unitCost)} right bold/></>}
                      <td style={{padding:"9px 13px"}}>
                        <div style={{display:"flex",gap:5}}>
                          {can("editMat")&&<button style={{...btn("#e0f2fe","#0369a1","4px 9px"),fontSize:11}} onClick={()=>openModal("editMat",m)}>Edit</button>}
                          {can("delMat")&&<button style={{...btn("#fee2e2","#991b1b","4px 9px"),fontSize:11}} onClick={()=>deleteMat(m.id)}>Del</button>}
                        </div>
                      </td>
                    </tr>
                  );})}
                </tbody>
              </table>
              {filteredMats.length===0&&<EmptyState icon="📦" msg="No materials found"/>}
            </Card>
          </div>
        )}

        {/* ══ TRANSACTIONS ══════════════════════════════════════════════════ */}
        {tab==="Transactions"&&(
          <div>
            <SectionBar title={<>Transactions {!data("viewAllTxn")&&<span style={{fontSize:12,color:"#94a3b8",fontWeight:400}}>(your entries only)</span>}</>}>
              {can("exportData")&&<button style={btn("#475569")} onClick={exportTxnCSV}>⬇ Export CSV</button>}
              {can("stockIn")&&<button style={btn("#10b981")} onClick={()=>openModal("txnIn")}>📥 Stock In</button>}
              {can("stockOut")&&<button style={btn("#f43f5e")} onClick={()=>openModal("txnOut")}>📤 Stock Out</button>}
            </SectionBar>
            <Card style={{overflow:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                <thead><tr>
                  <Th c="TXN ID"/> <Th c="Date"/> <Th c="Material"/> <Th c="Type"/> <Th c="Qty" right/>
                  {data("viewCosts")&&<><Th c="Unit Cost" right/><Th c="Total" right/></>}
                  <Th c="Reference"/> <Th c="Source"/> <Th c="By"/>
                </tr></thead>
                <tbody>
                  {visibleTxn.map((tx,i)=>{
                    const m=mats.find(x=>x.id===tx.materialId);
                    const u=users.find(x=>x.id===tx.userId);
                    return(
                      <tr key={tx.id} style={{background:i%2===0?"#f8fafc":"#fff"}}>
                        <Td c={tx.id} color="#6366f1" style={{fontSize:11}}/>
                        <Td c={tx.date} color="#64748b"/>
                        <Td c={m?.name||tx.materialId} bold/>
                        <td style={{padding:"9px 13px"}}><Badge label={tx.type} color={tx.type==="IN"?"#065f46":"#991b1b"} bg={tx.type==="IN"?"#d1fae5":"#fee2e2"}/></td>
                        <Td c={`${fmtN(tx.qty)} ${m?.unit||""}`} right bold/>
                        {data("viewCosts")&&<>
                          <Td c={fmtC(m?.unitCost||0)} right/>
                          <td style={{padding:"9px 13px",textAlign:"right",fontWeight:700,color:tx.type==="IN"?"#10b981":"#f43f5e",fontSize:12}}>{fmtC((m?.unitCost||0)*tx.qty)}</td>
                        </>}
                        <Td c={tx.ref} color="#64748b"/>
                        <td style={{padding:"9px 13px"}}><Badge label={tx.source||"manual"} color={tx.source==="po"?"#3b82f6":tx.source==="run"?"#8b5cf6":"#64748b"} bg={tx.source==="po"?"#eff6ff":tx.source==="run"?"#f5f3ff":"#f1f5f9"}/></td>
                        <td style={{padding:"9px 13px"}}><span style={{background:ROLE_COLORS[u?.role]+"18",color:ROLE_COLORS[u?.role]||"#94a3b8",borderRadius:6,padding:"2px 8px",fontSize:11,fontWeight:700}}>{u?.name||"—"}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {visibleTxn.length===0&&<EmptyState icon="📋" msg="No transactions yet"/>}
            </Card>
          </div>
        )}

        {/* ══ PURCHASE ORDERS ═══════════════════════════════════════════════ */}
        {tab==="Purchase Orders"&&(
          <div>
            <SectionBar title="Purchase Orders">
              {["All","Pending","Received","Closed"].map(f=><button key={f} style={{...btn(poFilter===f?"#0f172a":"#e2e8f0",poFilter===f?"#fff":"#374151")}} onClick={()=>setPoFilter(f)}>{f}</button>)}
              {can("createPO")&&<button style={btn("#6366f1")} onClick={()=>openModal("addPO")}>＋ Create PO</button>}
            </SectionBar>
            <Card style={{overflow:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                <thead><tr>
                  <Th c="PO ID"/> <Th c="Date"/> <Th c="Supplier"/> <Th c="Material"/> <Th c="Qty" right/>
                  {data("viewCosts")&&<Th c="PO Value" right/>}
                  <Th c="Expected"/> <Th c="Status"/> <Th c="Actions"/>
                </tr></thead>
                <tbody>
                  {pos.filter(p=>poFilter==="All"||p.status===poFilter).map((po,i)=>{
                    const mat=mats.find(m=>m.id===po.materialId);
                    const sup=sups.find(s=>s.id===po.supplierId);
                    const c=PO_COLORS[po.status]||"#94a3b8";
                    return(
                      <tr key={po.id} style={{background:i%2===0?"#f8fafc":"#fff"}}>
                        <Td c={po.id} color="#6366f1" bold style={{fontSize:11}}/>
                        <Td c={po.date} color="#64748b"/>
                        <Td c={sup?.name||po.supplierId}/>
                        <Td c={mat?.name||po.materialId} bold/>
                        <Td c={`${fmtN(po.qty)} ${mat?.unit||""}`} right bold/>
                        {data("viewCosts")&&<Td c={fmtC(po.qty*po.unitCost)} right bold color="#6366f1"/>}
                        <Td c={po.expectedDate} color="#64748b"/>
                        <td style={{padding:"9px 13px"}}><Badge label={po.status} color={c} bg={c+"18"}/></td>
                        <td style={{padding:"9px 13px"}}>
                          <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                            {can("editPO")&&po.status==="Pending"&&<button style={{...btn("#e0f2fe","#0369a1","4px 9px"),fontSize:11}} onClick={()=>openModal("editPO",po)}>Edit</button>}
                            {can("receivePO")&&po.status==="Pending"&&<button style={{...btn("#d1fae5","#065f46","4px 9px"),fontSize:11}} onClick={()=>receivePO(po)}>✓ Receive</button>}
                            {can("closePO")&&po.status==="Pending"&&<button style={{...btn("#fee2e2","#991b1b","4px 9px"),fontSize:11}} onClick={()=>closePO(po)}>Close</button>}
                            {po.status!=="Pending"&&<span style={{fontSize:11,color:"#94a3b8"}}>{po.receivedDate||po.status}</span>}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {pos.filter(p=>poFilter==="All"||p.status===poFilter).length===0&&<EmptyState icon="🧾" msg="No purchase orders found"/>}
            </Card>
          </div>
        )}

        {/* ══ PRODUCTION RUNS ═══════════════════════════════════════════════ */}
        {tab==="Production Runs"&&(
          <div>
            <SectionBar title="Production Runs">
              {["All","Planned","In Progress","Completed"].map(f=><button key={f} style={{...btn(runFilter===f?"#0f172a":"#e2e8f0",runFilter===f?"#fff":"#374151")}} onClick={()=>setRunFilter(f)}>{f}</button>)}
              {can("createRun")&&<button style={btn("#8b5cf6")} onClick={()=>openModal("addRun")}>＋ New Run</button>}
            </SectionBar>
            <div style={{display:"grid",gap:14}}>
              {runs.filter(r=>runFilter==="All"||r.status===runFilter).map(run=>{
                const c=RUN_COLORS[run.status]||"#94a3b8";
                const u=users.find(x=>x.id===run.userId);
                return(
                  <Card key={run.id} style={{padding:18}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12,flexWrap:"wrap",gap:8}}>
                      <div>
                        <div style={{fontWeight:800,fontSize:15,color:"#0f172a"}}>{run.name}</div>
                        <div style={{fontSize:12,color:"#64748b",marginTop:2}}>{run.date} · {run.ref} · <span style={{color:ROLE_COLORS[u?.role]||"#94a3b8"}}>{u?.name||"—"}</span></div>
                        {run.notes&&<div style={{fontSize:11,color:"#94a3b8",marginTop:2}}>{run.notes}</div>}
                      </div>
                      <div style={{display:"flex",gap:8,alignItems:"center"}}>
                        <Badge label={run.status} color={c} bg={c+"18"}/>
                        {can("createRun")&&run.status!=="Completed"&&<button style={{...btn("#e0f2fe","#0369a1","5px 11px"),fontSize:11}} onClick={()=>openModal("editRun",run)}>Edit</button>}
                        {can("completeRun")&&run.status!=="Completed"&&<button style={{...btn("#d1fae5","#065f46","5px 11px"),fontSize:11}} onClick={()=>completeRun(run)}>✓ Complete</button>}
                        {can("delRun")&&run.status!=="Completed"&&<button style={{...btn("#fee2e2","#991b1b","5px 11px"),fontSize:11}} onClick={()=>deleteRun(run.id)}>Del</button>}
                      </div>
                    </div>
                    <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                      {run.items.map((item,idx)=>{
                        const m=mats.find(x=>x.id===item.materialId);
                        const sufficient=m&&m.stock>=item.qty;
                        return(
                          <div key={idx} style={{background:run.status==="Completed"?"#f0fdf4":sufficient?"#f8fafc":"#fef2f2",border:`1px solid ${run.status==="Completed"?"#bbf7d0":sufficient?"#e2e8f0":"#fecaca"}`,borderRadius:8,padding:"6px 12px",fontSize:12}}>
                            <span style={{fontWeight:700}}>{m?.name||item.materialId}</span>
                            <span style={{color:"#64748b",marginLeft:6}}>{fmtN(item.qty)} {m?.unit}</span>
                            {run.status!=="Completed"&&!sufficient&&<span style={{color:"#ef4444",marginLeft:4,fontWeight:700}}>⚠ low</span>}
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                );
              })}
              {runs.filter(r=>runFilter==="All"||r.status===runFilter).length===0&&<EmptyState icon="🏭" msg="No production runs found"/>}
            </div>
          </div>
        )}

        {/* ══ SUPPLIERS ════════════════════════════════════════════════════ */}
        {tab==="Suppliers"&&(
          <div>
            <SectionBar title="Suppliers">
              {can("addSup")&&<button style={btn("#6366f1")} onClick={()=>openModal("addSup")}>＋ Add Supplier</button>}
            </SectionBar>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(290px,1fr))",gap:14}}>
              {sups.map(s=>(
                <Card key={s.id} style={{padding:18}}>
                  <div style={{display:"flex",alignItems:"flex-start",gap:12,marginBottom:12}}>
                    <div style={{width:40,height:40,background:"#eff6ff",borderRadius:9,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>🏢</div>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:800,fontSize:14,color:"#0f172a"}}>{s.name}</div>
                      <div style={{fontSize:11,color:"#94a3b8"}}>{s.id}</div>
                    </div>
                    <Badge label={s.status} color={s.status==="Active"?"#065f46":"#991b1b"} bg={s.status==="Active"?"#d1fae5":"#fee2e2"}/>
                  </div>
                  <div style={{fontSize:12,display:"grid",gap:5,marginBottom:12}}>
                    {data("viewContacts")?(
                      <>
                        <div><span style={{color:"#94a3b8"}}>Contact: </span><b>{s.contact}</b></div>
                        <div><span style={{color:"#94a3b8"}}>Email: </span><a href={`mailto:${s.email}`} style={{color:"#3b82f6",textDecoration:"none"}}>{s.email}</a></div>
                        <div><span style={{color:"#94a3b8"}}>Phone: </span>{s.phone}</div>
                      </>
                    ):<div style={{color:"#94a3b8",fontStyle:"italic",fontSize:11}}>🔒 Contact details restricted</div>}
                    <div><span style={{color:"#94a3b8"}}>Lead Time: </span><b style={{color:"#6366f1"}}>{s.lead} days</b></div>
                    <div><span style={{color:"#94a3b8"}}>Materials: </span><span style={{color:"#374151"}}>{s.materials}</span></div>
                  </div>
                  {(can("editSup")||can("delSup"))&&(
                    <div style={{display:"flex",gap:8}}>
                      {can("editSup")&&<button style={{...btn("#e0f2fe","#0369a1"),flex:1}} onClick={()=>openModal("editSup",s)}>Edit</button>}
                      {can("delSup")&&<button style={{...btn("#fee2e2","#991b1b"),flex:1}} onClick={()=>deleteSup(s.id)}>Delete</button>}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* ══ COST & ANALYTICS ══════════════════════════════════════════════ */}
        {tab==="Cost & Analytics"&&(
          <div>
            <h2 style={{margin:"0 0 16px",fontSize:20,fontWeight:800,color:"#0f172a"}}>Cost & Analytics</h2>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14,marginBottom:20}}>
              {[
                {label:"Total Cost In",val:fmtC(totalCostIn),color:"#10b981",bg:"#f0fdf4",icon:"📥"},
                {label:"Total Cost Out",val:fmtC(totalCostOut),color:"#f43f5e",bg:"#fff1f2",icon:"📤"},
                {label:"Net Stock Value",val:fmtC(stockVal),color:"#6366f1",bg:"#eef2ff",icon:"💎"},
              ].map(({label,val,color,bg,icon})=>(
                <div key={label} style={{background:bg,borderRadius:14,padding:"22px 24px",border:`1px solid ${color}33`}}>
                  <div style={{fontSize:26,marginBottom:8}}>{icon}</div>
                  <div style={{fontSize:24,fontWeight:900,color}}>{val}</div>
                  <div style={{fontSize:12,color:"#64748b",marginTop:4}}>{label}</div>
                </div>
              ))}
            </div>

            {monthlyData.length>0&&(
              <Card style={{padding:20,marginBottom:20}}>
                <div style={{fontWeight:700,fontSize:14,color:"#0f172a",marginBottom:16}}>📊 Transaction Volume (last 6 months)</div>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
                    <XAxis dataKey="month" tick={{fontSize:11}} stroke="#94a3b8"/>
                    <YAxis tick={{fontSize:11}} stroke="#94a3b8"/>
                    <Tooltip/>
                    <Legend wrapperStyle={{fontSize:12}}/>
                    <Line type="monotone" dataKey="Transactions" stroke="#6366f1" strokeWidth={2} dot={{r:3}}/>
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            )}

            <Card style={{overflow:"auto"}}>
              <div style={{padding:"12px 16px",borderBottom:"1px solid #f1f5f9",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span style={{fontWeight:700,fontSize:14,color:"#0f172a"}}>Material Cost Breakdown</span>
                {can("exportData")&&<button style={{...btn("#475569","#fff","5px 12px"),fontSize:11}} onClick={exportInventoryCSV}>⬇ Export CSV</button>}
              </div>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                <thead><tr>
                  <Th c="Material"/> <Th c="Category"/> <Th c="Unit Cost" right/> <Th c="Stock" right/> <Th c="Stock Value" right/> <Th c="Cost In" right/> <Th c="Cost Out" right/> <Th c="Net" right/>
                </tr></thead>
                <tbody>
                  {mats.map((m,i)=>{
                    const tIn=txns.filter(t=>t.materialId===m.id&&t.type==="IN").reduce((s,t)=>s+t.qty,0);
                    const tOut=txns.filter(t=>t.materialId===m.id&&t.type==="OUT").reduce((s,t)=>s+t.qty,0);
                    const net=tIn*m.unitCost-tOut*m.unitCost;
                    return(
                      <tr key={m.id} style={{background:i%2===0?"#f8fafc":"#fff"}}>
                        <Td c={m.name} bold/>
                        <Td c={m.category} color="#64748b"/>
                        <Td c={fmtC(m.unitCost)} right/>
                        <Td c={`${fmtN(m.stock)} ${m.unit}`} right bold/>
                        <Td c={fmtC(m.stock*m.unitCost)} right bold color="#6366f1"/>
                        <Td c={fmtC(tIn*m.unitCost)} right bold color="#10b981"/>
                        <Td c={fmtC(tOut*m.unitCost)} right bold color="#f43f5e"/>
                        <Td c={fmtC(net)} right bold color={net>=0?"#10b981":"#f43f5e"}/>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Card>
          </div>
        )}

        {/* ══ AUDIT LOG ════════════════════════════════════════════════════ */}
        {tab==="Audit Log"&&(
          <div>
            <SectionBar title="Audit Log">
              <span style={{fontSize:12,color:"#94a3b8",fontWeight:400,alignSelf:"center"}}>Complete history of all actions</span>
              {can("exportData")&&<button style={btn("#475569")} onClick={()=>{ const csv=toCSV(audit,[{label:"ID",key:"id"},{label:"Timestamp",key:"ts"},{label:"User",key:"userName"},{label:"Role",key:"userRole"},{label:"Action",key:"action"},{label:"Entity",key:"entity"},{label:"Details",key:"details"}]); downloadFile(csv,`audit_${today()}.csv`); toast$("Audit log exported ✓"); }}>⬇ Export</button>}
            </SectionBar>
            <Card style={{overflow:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                <thead><tr>
                  <Th c="Timestamp"/> <Th c="User"/> <Th c="Action"/> <Th c="Entity"/> <Th c="Details"/>
                </tr></thead>
                <tbody>
                  {[...audit].sort((a,b)=>b.ts.localeCompare(a.ts)).map((entry,i)=>(
                    <tr key={entry.id} style={{background:i%2===0?"#f8fafc":"#fff"}}>
                      <Td c={fmtTs(entry.ts)} color="#64748b" style={{fontSize:11,whiteSpace:"nowrap"}}/>
                      <td style={{padding:"9px 13px"}}>
                        <div style={{fontWeight:700,fontSize:12}}>{entry.userName}</div>
                        <RoleBadge role={entry.userRole||"Viewer"}/>
                      </td>
                      <td style={{padding:"9px 13px"}}>
                        <span style={{background:"#f1f5f9",borderRadius:6,padding:"3px 8px",fontSize:11,fontWeight:700,color:"#374151",fontFamily:"monospace"}}>{entry.action}</span>
                      </td>
                      <Td c={entry.entity} color="#64748b"/>
                      <Td c={entry.details}/>
                    </tr>
                  ))}
                </tbody>
              </table>
              {audit.length===0&&<EmptyState icon="🔍" msg="No audit entries yet"/>}
            </Card>
          </div>
        )}

        {/* ══ ADMIN ════════════════════════════════════════════════════════ */}
        {tab==="Admin"&&(
          <div>
            <h2 style={{margin:"0 0 20px",fontSize:20,fontWeight:800,color:"#0f172a"}}>⚙ Admin Panel</h2>

            {/* User Management */}
            <Card style={{marginBottom:20}}>
              <div style={{padding:"12px 18px",borderBottom:"1px solid #f1f5f9",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span style={{fontWeight:800,fontSize:14,color:"#0f172a"}}>👥 User Management</span>
                <button style={btn("#6366f1")} onClick={()=>openModal("addUser")}>＋ Add User</button>
              </div>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                <thead><tr style={{background:"#f8fafc"}}>
                  <th style={{padding:"10px 13px",textAlign:"left",fontWeight:700,fontSize:12}}>Name</th>
                  <th style={{padding:"10px 13px",textAlign:"left",fontWeight:700,fontSize:12}}>Username</th>
                  <th style={{padding:"10px 13px",textAlign:"left",fontWeight:700,fontSize:12}}>Role</th>
                  <th style={{padding:"10px 13px",textAlign:"left",fontWeight:700,fontSize:12}}>Actions</th>
                </tr></thead>
                <tbody>
                  {users.map((u,i)=>(
                    <tr key={u.id} style={{background:i%2===0?"#fff":"#f8fafc"}}>
                      <td style={{padding:"10px 13px",fontWeight:700,fontSize:12}}>{u.name} {u.id===session.user.id&&<span style={{fontSize:10,color:"#94a3b8"}}>(you)</span>}</td>
                      <Td c={u.username} color="#64748b"/>
                      <td style={{padding:"10px 13px"}}><RoleBadge role={u.role}/></td>
                      <td style={{padding:"10px 13px"}}>
                        <div style={{display:"flex",gap:6}}>
                          <button style={{...btn("#e0f2fe","#0369a1","4px 10px"),fontSize:11}} onClick={()=>openModal("editUser",u)}>Edit</button>
                          {u.id!==session.user.id&&<button style={{...btn("#fee2e2","#991b1b","4px 10px"),fontSize:11}} onClick={()=>deleteUser(u.id)}>Delete</button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>

            {/* Permissions */}
            <div style={{fontWeight:800,fontSize:14,color:"#0f172a",marginBottom:12}}>🔐 Role Permissions</div>
            <div style={{display:"grid",gap:14,marginBottom:20}}>
              {["Manager","Warehouse","Viewer"].map(role=>{
                const rp=perms[role]??DEFAULT_PERMS[role];
                return(
                  <Card key={role}>
                    <div style={{padding:"12px 18px",borderBottom:"1px solid #f1f5f9",display:"flex",alignItems:"center",gap:10}}>
                      <RoleBadge role={role}/>
                      <span style={{fontSize:12,color:"#94a3b8"}}>Manage what this role can access</span>
                    </div>
                    <div style={{padding:"16px 18px",display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(250px,1fr))",gap:20}}>
                      <div>
                        <div style={{fontWeight:700,fontSize:12,color:"#374151",marginBottom:10,paddingBottom:6,borderBottom:"1px solid #f1f5f9"}}>📑 Visible Tabs</div>
                        {Object.entries(rp.tabs).filter(([k])=>k!=="admin").map(([key,val])=>(
                          <div key={key} style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                            <span style={{fontSize:12,color:"#475569",textTransform:"capitalize"}}>{key==="costs"?"Cost & Analytics":key==="purchaseOrders"?"Purchase Orders":key==="productionRuns"?"Production Runs":key==="auditLog"?"Audit Log":key}</span>
                            <Toggle on={val} onChange={()=>togglePerm(role,"tabs",key)}/>
                          </div>
                        ))}
                      </div>
                      <div>
                        <div style={{fontWeight:700,fontSize:12,color:"#374151",marginBottom:10,paddingBottom:6,borderBottom:"1px solid #f1f5f9"}}>⚡ Actions Allowed</div>
                        {[["stockIn","Stock In"],["stockOut","Stock Out"],["addMat","Add Material"],["editMat","Edit Material"],["delMat","Delete Material"],["editThresh","Edit Threshold"],["createPO","Create PO"],["receivePO","Receive PO"],["createRun","Create Production Run"],["completeRun","Complete Run"],["exportData","Export CSV"]].map(([key,label])=>(
                          <div key={key} style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                            <span style={{fontSize:12,color:"#475569"}}>{label}</span>
                            <Toggle on={rp.actions[key]} onChange={()=>togglePerm(role,"actions",key)}/>
                          </div>
                        ))}
                      </div>
                      <div>
                        <div style={{fontWeight:700,fontSize:12,color:"#374151",marginBottom:10,paddingBottom:6,borderBottom:"1px solid #f1f5f9"}}>🔒 Data Visibility</div>
                        {[["viewCosts","Unit Costs & Prices"],["viewContacts","Supplier Contacts"],["viewAllTxn","All Transactions (not just own)"],["viewAuditLog","Audit Log Access"]].map(([key,label])=>(
                          <div key={key} style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                            <span style={{fontSize:12,color:"#475569"}}>{label}</span>
                            <Toggle on={rp.data[key]} onChange={()=>togglePerm(role,"data",key)}/>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* Backup & Restore */}
            {can("backupRestore")&&(
              <Card style={{padding:20}}>
                <div style={{fontWeight:800,fontSize:14,color:"#0f172a",marginBottom:4}}>💾 Backup & Restore</div>
                <div style={{fontSize:12,color:"#64748b",marginBottom:16}}>Download a full backup of all data, or restore from a previous backup file.</div>
                <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
                  <button style={btn("#0f172a")} onClick={handleBackup}>⬇ Download Backup (.json)</button>
                  <button style={btn("#f59e0b")} onClick={()=>restoreRef.current?.click()}>⬆ Restore from Backup</button>
                  <input ref={restoreRef} type="file" accept=".json" style={{display:"none"}} onChange={handleRestore}/>
                </div>
                <div style={{marginTop:12,fontSize:11,color:"#94a3b8"}}>⚠ Restoring a backup will replace ALL current data. Make sure to download a backup first.</div>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* ══ MODALS ════════════════════════════════════════════════════════════ */}
      {modal&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:300,padding:16}} onClick={e=>e.target===e.currentTarget&&closeModal()}>
          <div style={{background:"#fff",borderRadius:14,padding:26,width:"100%",maxWidth:480,boxShadow:"0 25px 60px rgba(0,0,0,0.3)",maxHeight:"92vh",overflowY:"auto"}}>

            {/* Stock In/Out */}
            {(modal==="txnIn"||modal==="txnOut")&&<>
              <div style={{fontWeight:800,fontSize:17,marginBottom:18,color:"#0f172a"}}>{modal==="txnIn"?"📥 Record Stock In":"📤 Record Stock Out"}</div>
              <div style={{display:"grid",gap:12}}>
                <div><Lbl c="Material *"/>
                  <select value={form.materialId||""} onChange={e=>fset("materialId",e.target.value)} style={inp}>
                    <option value="">Select material…</option>
                    {mats.map(m=><option key={m.id} value={m.id}>{m.id} — {m.name}</option>)}
                  </select>
                </div>
                <div><Lbl c="Quantity *"/>
                  <input type="number" min={1} placeholder="Enter quantity" value={form.qty||""} onChange={e=>fset("qty",e.target.value)} style={inp}/>
                  {form.materialId&&<div style={{fontSize:11,color:"#94a3b8",marginTop:3}}>Current stock: {fmtN(mats.find(m=>m.id===form.materialId)?.stock)} {mats.find(m=>m.id===form.materialId)?.unit}</div>}
                </div>
                <div><Lbl c="Reference / PO Number"/><input placeholder="e.g. PO-003, Production note…" value={form.ref||""} onChange={e=>fset("ref",e.target.value)} style={inp}/></div>
                <div style={{display:"flex",gap:10,marginTop:4}}>
                  <button style={{...btn(modal==="txnIn"?"#10b981":"#f43f5e"),flex:1}} onClick={()=>submitTxn(modal==="txnIn"?"in":"out")}>Confirm</button>
                  <button style={btn("#f1f5f9","#374151")} onClick={closeModal}>Cancel</button>
                </div>
              </div>
            </>}

            {/* Add/Edit Material */}
            {(modal==="addMat"||modal==="editMat")&&<>
              <div style={{fontWeight:800,fontSize:17,marginBottom:18,color:"#0f172a"}}>{modal==="addMat"?"➕ Add Material":"✏️ Edit Material"}</div>
              <div style={{display:"grid",gap:11}}>
                <div><Lbl c="Material ID *"/><input placeholder="e.g. RM-009" value={form.id||""} onChange={e=>fset("id",e.target.value)} disabled={modal==="editMat"} style={{...inp,opacity:modal==="editMat"?0.6:1}}/></div>
                <div><Lbl c="Material Name *"/><input placeholder="Name" value={form.name||""} onChange={e=>fset("name",e.target.value)} style={inp}/></div>
                <div><Lbl c="Supplier *"/><input placeholder="Supplier name" value={form.supplier||""} onChange={e=>fset("supplier",e.target.value)} style={inp}/></div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                  <div><Lbl c="Category"/>
                    <select value={form.category||"Metal"} onChange={e=>fset("category",e.target.value)} style={inp}>
                      {CATEGORIES.map(c=><option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div><Lbl c="Unit"/>
                    <select value={form.unit||"kg"} onChange={e=>fset("unit",e.target.value)} style={inp}>
                      {UNITS.map(u=><option key={u}>{u}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
                  <div><Lbl c="Current Stock *"/><input type="number" min={0} value={form.stock||""} onChange={e=>fset("stock",e.target.value)} style={inp}/></div>
                  <div><Lbl c="Alert Threshold *"/><input type="number" min={0} value={form.threshold||""} onChange={e=>fset("threshold",e.target.value)} style={inp}/></div>
                  <div><Lbl c="Unit Cost ($) *"/><input type="number" min={0} step={0.01} value={form.unitCost||""} onChange={e=>fset("unitCost",e.target.value)} style={inp}/></div>
                </div>
                <div style={{display:"flex",gap:10,marginTop:4}}>
                  <button style={{...btn("#6366f1"),flex:1}} onClick={()=>submitMat(modal==="editMat")}>{modal==="addMat"?"Add Material":"Save Changes"}</button>
                  <button style={btn("#f1f5f9","#374151")} onClick={closeModal}>Cancel</button>
                </div>
              </div>
            </>}

            {/* Edit Threshold */}
            {modal==="editThreshold"&&<>
              <div style={{fontWeight:800,fontSize:17,marginBottom:6,color:"#0f172a"}}>✏️ Edit Low Stock Threshold</div>
              <div style={{fontSize:12,color:"#64748b",marginBottom:14}}>{target?.name}</div>
              <Lbl c={`Threshold (${target?.unit})`}/>
              <input type="number" min={0} value={form.threshold||""} onChange={e=>fset("threshold",e.target.value)} style={{...inp,marginBottom:14}}/>
              <div style={{display:"flex",gap:10}}>
                <button style={{...btn("#f59e0b"),flex:1}} onClick={submitThreshold}>Update</button>
                <button style={btn("#f1f5f9","#374151")} onClick={closeModal}>Cancel</button>
              </div>
            </>}

            {/* Add/Edit Supplier */}
            {(modal==="addSup"||modal==="editSup")&&<>
              <div style={{fontWeight:800,fontSize:17,marginBottom:18,color:"#0f172a"}}>{modal==="addSup"?"➕ Add Supplier":"✏️ Edit Supplier"}</div>
              <div style={{display:"grid",gap:11}}>
                {[["id","Supplier ID *"],["name","Company Name *"],["contact","Contact Person *"],["email","Email *"],["phone","Phone"],["materials","Materials Supplied"]].map(([k,label])=>(
                  <div key={k}><Lbl c={label}/><input placeholder={label} value={form[k]||""} onChange={e=>fset(k,e.target.value)} style={inp}/></div>
                ))}
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                  <div><Lbl c="Lead Time (days)"/><input type="number" min={1} value={form.lead||""} onChange={e=>fset("lead",e.target.value)} style={inp}/></div>
                  <div><Lbl c="Status"/>
                    <select value={form.status||"Active"} onChange={e=>fset("status",e.target.value)} style={inp}>
                      <option>Active</option><option>Inactive</option>
                    </select>
                  </div>
                </div>
                <div style={{display:"flex",gap:10,marginTop:4}}>
                  <button style={{...btn("#6366f1"),flex:1}} onClick={()=>submitSup(modal==="editSup")}>{modal==="addSup"?"Add Supplier":"Save Changes"}</button>
                  <button style={btn("#f1f5f9","#374151")} onClick={closeModal}>Cancel</button>
                </div>
              </div>
            </>}

            {/* Add/Edit PO */}
            {(modal==="addPO"||modal==="editPO")&&<>
              <div style={{fontWeight:800,fontSize:17,marginBottom:18,color:"#0f172a"}}>{modal==="addPO"?"🧾 Create Purchase Order":"✏️ Edit PO"}</div>
              <div style={{display:"grid",gap:11}}>
                <div><Lbl c="PO ID *"/><input value={form.id||""} onChange={e=>fset("id",e.target.value)} style={inp}/></div>
                <div><Lbl c="Supplier *"/>
                  <select value={form.supplierId||""} onChange={e=>fset("supplierId",e.target.value)} style={inp}>
                    <option value="">Select supplier…</option>
                    {sups.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div><Lbl c="Material *"/>
                  <select value={form.materialId||""} onChange={e=>{ fset("materialId",e.target.value); const m=mats.find(x=>x.id===e.target.value); if(m) fset("unitCost",m.unitCost); }} style={inp}>
                    <option value="">Select material…</option>
                    {mats.map(m=><option key={m.id} value={m.id}>{m.id} — {m.name}</option>)}
                  </select>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                  <div><Lbl c="Quantity *"/><input type="number" min={1} value={form.qty||""} onChange={e=>fset("qty",e.target.value)} style={inp}/></div>
                  <div><Lbl c="Unit Cost ($) *"/><input type="number" min={0} step={0.01} value={form.unitCost||""} onChange={e=>fset("unitCost",e.target.value)} style={inp}/></div>
                </div>
                <div><Lbl c="Expected Delivery Date *"/><input type="date" value={form.expectedDate||""} onChange={e=>fset("expectedDate",e.target.value)} style={inp}/></div>
                <div><Lbl c="Notes"/><input placeholder="Optional notes…" value={form.notes||""} onChange={e=>fset("notes",e.target.value)} style={inp}/></div>
                {form.qty&&form.unitCost&&<div style={{background:"#f0fdf4",borderRadius:8,padding:"10px 14px",fontSize:12,color:"#065f46",fontWeight:700}}>
                  PO Total: {fmtC(parseFloat(form.qty||0)*parseFloat(form.unitCost||0))}
                </div>}
                <div style={{display:"flex",gap:10,marginTop:4}}>
                  <button style={{...btn("#6366f1"),flex:1}} onClick={()=>submitPO(modal==="editPO")}>{modal==="addPO"?"Create PO":"Save Changes"}</button>
                  <button style={btn("#f1f5f9","#374151")} onClick={closeModal}>Cancel</button>
                </div>
              </div>
            </>}

            {/* Add/Edit Production Run */}
            {(modal==="addRun"||modal==="editRun")&&<>
              <div style={{fontWeight:800,fontSize:17,marginBottom:18,color:"#0f172a"}}>{modal==="addRun"?"🏭 New Production Run":"✏️ Edit Run"}</div>
              <div style={{display:"grid",gap:11}}>
                <div><Lbl c="Run Name *"/><input placeholder="e.g. Production Run #104" value={form.name||""} onChange={e=>fset("name",e.target.value)} style={inp}/></div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                  <div><Lbl c="Date *"/><input type="date" value={form.date||""} onChange={e=>fset("date",e.target.value)} style={inp}/></div>
                  <div><Lbl c="Reference/Batch"/><input placeholder="e.g. PR-104" value={form.ref||""} onChange={e=>fset("ref",e.target.value)} style={inp}/></div>
                </div>
                <div><Lbl c="Status"/>
                  <select value={form.status||"Planned"} onChange={e=>fset("status",e.target.value)} style={inp}>
                    <option>Planned</option><option>In Progress</option>
                  </select>
                </div>
                <div>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                    <Lbl c="Materials to Consume *"/>
                    <button style={{...btn("#6366f1","#fff","4px 10px"),fontSize:11}} onClick={()=>fset("items",[...(form.items||[]),{materialId:"",qty:""}])}>＋ Add</button>
                  </div>
                  {(form.items||[]).map((item,idx)=>(
                    <div key={idx} style={{display:"grid",gridTemplateColumns:"1fr 100px 30px",gap:8,marginBottom:8,alignItems:"center"}}>
                      <select value={item.materialId||""} onChange={e=>{ const items=[...(form.items||[])]; items[idx]={...items[idx],materialId:e.target.value}; fset("items",items); }} style={{...inp,marginBottom:0}}>
                        <option value="">Select material…</option>
                        {mats.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}
                      </select>
                      <input type="number" min={1} placeholder="Qty" value={item.qty||""} onChange={e=>{ const items=[...(form.items||[])]; items[idx]={...items[idx],qty:e.target.value}; fset("items",items); }} style={{...inp,marginBottom:0}}/>
                      <button onClick={()=>fset("items",(form.items||[]).filter((_,i)=>i!==idx))} style={{background:"#fee2e2",color:"#991b1b",border:"none",borderRadius:6,cursor:"pointer",padding:"6px",fontWeight:700}}>×</button>
                    </div>
                  ))}
                  {(form.items||[]).length===0&&<div style={{fontSize:12,color:"#94a3b8",fontStyle:"italic"}}>No materials added yet</div>}
                </div>
                <div><Lbl c="Notes"/><input placeholder="Optional notes…" value={form.notes||""} onChange={e=>fset("notes",e.target.value)} style={inp}/></div>
                <div style={{display:"flex",gap:10,marginTop:4}}>
                  <button style={{...btn("#8b5cf6"),flex:1}} onClick={()=>submitRun(modal==="editRun")}>{modal==="addRun"?"Create Run":"Save Changes"}</button>
                  <button style={btn("#f1f5f9","#374151")} onClick={closeModal}>Cancel</button>
                </div>
              </div>
            </>}

            {/* Add/Edit User */}
            {(modal==="addUser"||modal==="editUser")&&<>
              <div style={{fontWeight:800,fontSize:17,marginBottom:18,color:"#0f172a"}}>{modal==="addUser"?"➕ Add User":"✏️ Edit User"}</div>
              <div style={{display:"grid",gap:11}}>
                <div><Lbl c="Full Name *"/><input placeholder="e.g. Ahmed Al-Rashid" value={form.name||""} onChange={e=>fset("name",e.target.value)} style={inp}/></div>
                <div><Lbl c="Username *"/><input placeholder="e.g. ahmed.rashid" value={form.username||""} onChange={e=>fset("username",e.target.value)} style={inp}/></div>
                <div><Lbl c="Password *"/><input placeholder="Set a password" value={form.password||""} onChange={e=>fset("password",e.target.value)} style={inp}/></div>
                <div><Lbl c="Role"/>
                  <select value={form.role||"Warehouse"} onChange={e=>fset("role",e.target.value)} style={inp}>
                    {["Admin","Manager","Warehouse","Viewer"].map(r=><option key={r}>{r}</option>)}
                  </select>
                  <div style={{marginTop:8,background:ROLE_COLORS[form.role||"Warehouse"]+"11",borderRadius:7,padding:"8px 12px",fontSize:11,color:ROLE_COLORS[form.role||"Warehouse"],fontWeight:600}}>
                    {ROLE_BADGES[form.role||"Warehouse"]} {
                      form.role==="Admin"?"Full access — users, permissions, backup, all data":
                      form.role==="Manager"?"Costs, POs, runs, suppliers — no deletions":
                      form.role==="Warehouse"?"Stock in/out, production runs — no cost data":
                      "Read-only — dashboard & inventory view only"
                    }
                  </div>
                </div>
                <div style={{display:"flex",gap:10,marginTop:4}}>
                  <button style={{...btn("#6366f1"),flex:1}} onClick={()=>submitUser(modal==="editUser")}>{modal==="addUser"?"Create User":"Save Changes"}</button>
                  <button style={btn("#f1f5f9","#374151")} onClick={closeModal}>Cancel</button>
                </div>
              </div>
            </>}

          </div>
        </div>
      )}
    </div>
  );
}
