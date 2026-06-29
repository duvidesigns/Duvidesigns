// @ts-nocheck
/* eslint-disable */
import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { LayoutDashboard, Package, ArrowLeftRight, FileText, Factory, Truck, BarChart3, TrendingUp, ScrollText, Settings, Boxes, Bell, CircleHelp, LogOut, Sun, Moon, Monitor, AlertTriangle, RefreshCw, Mail, Lock, Eye, EyeOff, ChevronDown, User, Calendar, Shield, Phone } from "lucide-react";
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from "recharts";
import { ref, set, get } from "firebase/database";
import { db } from "./firebase";
import { supabase } from "./supabase";
import { ROLE_COLORS, ROLE_BADGES, CATEGORIES, UNITS, PO_COLORS, RUN_COLORS, DEFAULT_PERMS, SEED_USERS, SEED_MATERIALS, SEED_SUPPLIERS, SEED_TXN, SEED_POs, SEED_RUNS, SEED_AUDIT } from "./data";
import { fmtN, fmtC, uid, now, today, fmtTs, stockStatus, getMonthlyData, getForecast, get30DayValueTrend, getCategoryBreakdown, downloadFile, toCSV } from "./helpers";
import { inp, btn, Lbl, Card, Th, Td, Badge, RoleBadge, Toggle, SectionBar, EmptyState } from "./components";

// ═════════════════════════════════════════════════════════════════════════════
// MAIN APP
// ═════════════════════════════════════════════════════════════════════════════
const TAB_ICONS = {
  "Dashboard":LayoutDashboard, "Inventory":Package, "Transactions":ArrowLeftRight,
  "Purchase Orders":FileText, "Production Runs":Factory, "Suppliers":Truck,
  "Cost & Analytics":BarChart3, "Forecasting":TrendingUp, "Audit Log":ScrollText, "Admin":Settings,
};

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
  const [session,  setSession]  = useState(()=>{ try { const s=localStorage.getItem("io-session"); return s?JSON.parse(s):null; } catch(e){return null;} });
  const [tab,      setTab]      = useState("Dashboard");
  const [modal,    setModal]    = useState(null);
  const [form,     setForm]     = useState({});
  const [target,   setTarget]   = useState(null);
  const [toast,    setToast]    = useState(null);
  const [search,   setSearch]   = useState("");
  const [showTour, setShowTour] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const [syncing,  setSyncing]  = useState(false);
  const [loginF,   setLoginF]   = useState({ username:"", password:"", name:"", phone:"", gender:"", dob:"", error:"", info:"" });
  const [authView, setAuthView] = useState("signin");
  const [showPw,   setShowPw]   = useState(false);
  const [showNotif,setShowNotif]= useState(false);
  const [poFilter, setPoFilter] = useState("All");
  const [runFilter,setRunFilter]= useState("All");
  const [theme,    setTheme]    = useState(()=>{ try { return localStorage.getItem("io-theme")||"system"; } catch(e){ return "system"; } });
  const [clock, setClock] = useState(new Date());
  useEffect(()=>{ const t=setInterval(()=>setClock(new Date()),1000); return ()=>clearInterval(t); },[]);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [acct, setAcct] = useState({ name:"", phone:"", gender:"", dob:"", curPw:"", newPw:"", confPw:"", error:"", info:"", loading:false });
  const [acctOpen, setAcctOpen] = useState(null);
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  const [profileUsers, setProfileUsers] = useState([]);
  useEffect(()=>{
    try { localStorage.setItem("io-theme", theme); } catch(e){}
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = ()=>{ const r = theme==="system" ? (mq.matches?"dark":"light") : theme; document.documentElement.setAttribute("data-theme", r); };
    apply(); mq.addEventListener("change", apply);
    return ()=>mq.removeEventListener("change", apply);
  },[theme]);
  const restoreRef = useRef();

  // ── Storage ─────────────────────────────────────────────────────────────────
const save = useCallback(async (key, val) => {
    if (key === "io-mats") {
      const rows = (val||[]).map(m => ({ id:m.id, name:m.name, category:m.category, supplier:m.supplier, unit:m.unit, stock:m.stock, threshold:m.threshold, unitcost:m.unitCost }));
      await supabase.from("materials").upsert(rows); return;
    }
    if (key === "io-txns") {
      const rows=(val||[]).map(t=>({ id:t.id, date:t.date, materialid:t.materialId, type:t.type, qty:t.qty, ref:t.ref, userid:t.userId, source:t.source }));
      await supabase.from("transactions").upsert(rows); return;
    }
    if (key === "io-pos") {
      const rows=(val||[]).map(o=>({ id:o.id, date:o.date, supplierid:o.supplierId, materialid:o.materialId, qty:o.qty, unitcost:o.unitCost, status:o.status, notes:o.notes, expecteddate:o.expectedDate, receiveddate:o.receivedDate }));
      await supabase.from("purchase_orders").upsert(rows); return;
    }
    if (key === "io-runs") {
      const rows=(val||[]).map(r=>({ id:r.id, date:r.date, name:r.name, ref:r.ref, items:r.items, userid:r.userId, status:r.status, notes:r.notes }));
      await supabase.from("production_runs").upsert(rows); return;
    }
    if (key === "io-audit") {
      const rows=(val||[]).map(a=>({ id:a.id, ts:a.ts, userid:a.userId, username:a.userName, userrole:a.userRole, action:a.action, entity:a.entity, entityid:a.entityId, details:a.details }));
      await supabase.from("audit_log").upsert(rows); return;
    }
    if (key === "io-perms") {
      await supabase.from("app_config").upsert({ key:"perms", value:val }); return;
    }
    try { await set(ref(db, "duvidesigns/" + key), JSON.stringify(val)); } catch(e){}
  }, []);
  const load = useCallback(async (key) => {
    if (key === "io-mats") {
      const { data } = await supabase.from("materials").select("*");
      if (!data || data.length===0) return null;
      return data.map(r => ({ id:r.id, name:r.name, category:r.category, supplier:r.supplier, unit:r.unit, stock:Number(r.stock), threshold:Number(r.threshold), unitCost:Number(r.unitcost) }));
    }
    if (key === "io-txns") {
      const { data } = await supabase.from("transactions").select("*");
      if (!data || data.length===0) return null;
      return data.map(r=>({ id:r.id, date:r.date, materialId:r.materialid, type:r.type, qty:Number(r.qty), ref:r.ref, userId:r.userid, source:r.source }));
    }
    if (key === "io-pos") {
      const { data } = await supabase.from("purchase_orders").select("*");
      if (!data || data.length===0) return null;
      return data.map(r=>({ id:r.id, date:r.date, supplierId:r.supplierid, materialId:r.materialid, qty:Number(r.qty), unitCost:Number(r.unitcost), status:r.status, notes:r.notes, expectedDate:r.expecteddate, receivedDate:r.receiveddate }));
    }
    if (key === "io-runs") {
      const { data } = await supabase.from("production_runs").select("*");
      if (!data || data.length===0) return null;
      return data.map(r=>({ id:r.id, date:r.date, name:r.name, ref:r.ref, items:r.items||[], userId:r.userid, status:r.status, notes:r.notes }));
    }
    if (key === "io-audit") {
      const { data } = await supabase.from("audit_log").select("*").order("ts",{ascending:false}).limit(500);
      if (!data || data.length===0) return null;
      return data.map(r=>({ id:r.id, ts:r.ts, userId:r.userid, userName:r.username, userRole:r.userrole, action:r.action, entity:r.entity, entityId:r.entityid, details:r.details }));
    }
    if (key === "io-perms") {
      const { data } = await supabase.from("app_config").select("value").eq("key","perms").maybeSingle();
      return data?.value ?? null;
    }
    try { const snap = await get(ref(db, "duvidesigns/" + key)); return snap.exists() ? JSON.parse(snap.val()) : null; } catch(e){ return null; }
  }, []);
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
      const { data: supData } = await supabase.from("suppliers").select("*");
      setSups(supData||[]);
      setLoading(false);
    })();
  },[]);

  // ── Refresh (shared by poll + realtime) ──────────────────────────────────────
  const refreshData = useCallback(async () => {
    const [m,t,po,r,u,p,a] = await Promise.all([
      load("io-mats"),load("io-txns"),load("io-pos"),load("io-runs"),
      load("io-users"),load("io-perms"),load("io-audit"),
    ]);
    if(m) setMats(m); if(t) setTxns(t); if(po) setPOs(po); if(r) setRuns(r);
    if(u) setUsers(u); if(a) setAudit(a);
    const { data: supPoll } = await supabase.from("suppliers").select("*");
    if(supPoll) setSups(supPoll);
    if(p) { setPerms(p); setSession(prev=>prev?{...prev,perms:p[prev.user.role]}:prev); }
  },[load]);

  // ── Poll (fallback safety net) ───────────────────────────────────────────────
  useEffect(() => {
    if (!session) return;
    const iv = setInterval(refreshData, 10000);
    return ()=>clearInterval(iv);
  },[session, refreshData]);

  // ── Real-time (instant updates via Supabase) ─────────────────────────────────
  useEffect(() => {
    if (!session) return;
    let timer=null;
    const ping=()=>{ clearTimeout(timer); timer=setTimeout(refreshData,400); };
    const ch = supabase.channel("io-realtime").on("postgres_changes",{event:"*",schema:"public"},ping).subscribe();
    return ()=>{ clearTimeout(timer); supabase.removeChannel(ch); };
  },[session, refreshData]);

  // ── Stock Alert Push Notifications ─────────────────────────────────────────
  useEffect(() => {
    if (!session) return;
    const role = session?.user?.role;
    if (role !== "Admin" && role !== "Manager") return;
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    const criticalMats = mats.filter(m => m.stock <= m.threshold);
    const notifKey = `io-notif-sent-${today()}`;
    try {
      const sent = JSON.parse(localStorage.getItem(notifKey)||"[]");
      criticalMats.forEach(m => {
        if (!sent.includes(m.id)) {
          new Notification("InventoryOS Stock Alert", {
            body: `${m.name} is running low — only ${m.stock} ${m.unit} left (threshold: ${m.threshold})`,
            icon: "/logo192.png"
          });
          sent.push(m.id);
        }
      });
      localStorage.setItem(notifKey, JSON.stringify(sent));
    } catch(e) {}
  }, [mats, session]);

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
  // ── Listen for password-recovery links ──
  useEffect(()=>{
    const { data:sub } = supabase.auth.onAuthStateChange((event)=>{
      if (event==="PASSWORD_RECOVERY") setAuthView("reset");
    });
    return ()=>sub?.subscription?.unsubscribe?.();
  },[]);

  async function handleSignup() {
    if (loginF.loading) return;
    const name=(loginF.name||"").trim(), email=(loginF.username||"").trim();
    if (!name)  { setLoginF(f=>({...f,error:"Please enter your name."})); return; }
    if (!email||!loginF.password) { setLoginF(f=>({...f,error:"Email and password are required."})); return; }
    if (loginF.password.length<6) { setLoginF(f=>({...f,error:"Password must be at least 6 characters."})); return; }
    setLoginF(f=>({...f,error:"",info:"",loading:true}));
    const { data, error } = await supabase.auth.signUp({ email, password: loginF.password });
    if (error) { setLoginF(f=>({...f,error:error.message,loading:false})); return; }
    if (data?.user?.id) {
      await supabase.from("profiles").insert({ id:data.user.id, name, email, role:"Pending", phone:(loginF.phone||"").trim()||null, gender:loginF.gender||null, dob:loginF.dob||null });
    }
    setAuthView("signin");
    setLoginF(f=>({...f,password:"",name:"",phone:"",gender:"",dob:"",loading:false,info:"Account created! An admin will assign your access — you can sign in once approved."}));
  }

  async function handleForgot() {
    if (loginF.loading) return;
    const email=(loginF.username||"").trim();
    if (!email) { setLoginF(f=>({...f,error:"Enter your email first."})); return; }
    setLoginF(f=>({...f,error:"",info:"",loading:true}));
    await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
    setAuthView("signin");
    setLoginF(f=>({...f,loading:false,info:"If that email exists, a reset link is on its way. Check your inbox (and spam)."}));
  }

  async function handleReset() {
    if (loginF.loading) return;
    if ((loginF.password||"").length<6) { setLoginF(f=>({...f,error:"Password must be at least 6 characters."})); return; }
    setLoginF(f=>({...f,error:"",loading:true}));
    const { error } = await supabase.auth.updateUser({ password: loginF.password });
    if (error) { setLoginF(f=>({...f,error:error.message,loading:false})); return; }
    setAuthView("signin");
    setLoginF(f=>({...f,password:"",loading:false,info:"Password updated! You can sign in now."}));
  }

  async function saveProfile(fields, okMsg) {
    setAcct(x=>({...x,error:"",info:"",loading:true}));
    const { error } = await supabase.from("profiles").update(fields).eq("id", session.user.id);
    if (error) { setAcct(x=>({...x,error:error.message,loading:false})); return; }
    const ns={...session, user:{...session.user, ...fields}};
    setSession(ns); try{localStorage.setItem("io-session",JSON.stringify(ns));}catch(e){}
    setAcct(x=>({...x,loading:false,info:okMsg||"Saved."}));
  }

  async function changePassword() {
    if (!acct.curPw||!acct.newPw) { setAcct(x=>({...x,error:"Fill in all password fields."})); return; }
    if (acct.newPw.length<6) { setAcct(x=>({...x,error:"New password must be at least 6 characters."})); return; }
    if (acct.newPw!==acct.confPw) { setAcct(x=>({...x,error:"New passwords don't match."})); return; }
    setAcct(x=>({...x,error:"",info:"",loading:true}));
    const { error:reErr } = await supabase.auth.signInWithPassword({ email: session.user.email, password: acct.curPw });
    if (reErr) { setAcct(x=>({...x,error:"Current password is incorrect.",loading:false})); return; }
    const { error } = await supabase.auth.updateUser({ password: acct.newPw });
    if (error) { setAcct(x=>({...x,error:error.message,loading:false})); return; }
    setAcct(x=>({...x,curPw:"",newPw:"",confPw:"",loading:false,info:"Password changed."}));
  }

  async function loadProfiles() {
    const { data, error } = await supabase.from("profiles").select("*").order("name",{ascending:true});
    if (!error && data) setProfileUsers(data);
  }
  async function changeUserRole(id, role) {
    const { error } = await supabase.from("profiles").update({ role }).eq("id", id);
    if (error) { alert("Couldn't update role: "+error.message); return; }
    const tgt=profileUsers.find(p=>p.id===id);
    setProfileUsers(ps=>ps.map(p=>p.id===id?{...p,role}:p));
    const entry=addAuditEntry("ROLE_CHANGE","User",id,`${tgt?.name||id} role set to ${role}`, session.user);
    const newA=[entry,...audit].slice(0,500); setAudit(newA); save("io-audit",newA);
  }
  async function removeProfile(id) {
    if (!window.confirm("Remove this user's access? They'll need to sign up and be approved again to log in.")) return;
    const { error } = await supabase.from("profiles").delete().eq("id", id);
    if (error) { alert("Couldn't remove user: "+error.message); return; }
    setProfileUsers(ps=>ps.filter(p=>p.id!==id));
  }
  useEffect(()=>{ if (session && tab==="Admin") loadProfiles(); },[tab, session]);

  async function handleLogin() {
    if (loginF.loading) return;
    setLoginF(f=>({...f,error:"",loading:true}));
    // 1) Sign in with Supabase Auth (email + password)
    const { data:authData, error:authErr } = await supabase.auth.signInWithPassword({
      email: (loginF.username||"").trim(),
      password: loginF.password,
    });
    if (authErr || !authData?.user) {
      setLoginF(f=>({...f,error:"Incorrect email or password.",loading:false})); return;
    }
    // 2) Fetch this user's profile (name + role)
    const { data:profile, error:profErr } = await supabase
      .from("profiles").select("*").eq("id", authData.user.id).single();
    if (profErr || !profile) {
      await supabase.auth.signOut();
      setLoginF(f=>({...f,error:"No profile found for this account. Contact an admin.",loading:false})); return;
    }
    // 3) Build the app session
    const u = { id:authData.user.id, name:profile.name, role:profile.role, email:authData.user.email, phone:profile.phone||"", gender:profile.gender||"", dob:profile.dob||"" };
    const p = perms[u.role]??DEFAULT_PERMS[u.role];
    const sess = { user:u, perms:p };
    setSession(sess);
    setLoginF(f=>({...f,loading:false}));
    try { localStorage.setItem("io-session", JSON.stringify(sess)); } catch(e){}
    // Request push notification permission for Admin and Manager
    if ((u.role==="Admin"||u.role==="Manager") && "Notification" in window && Notification.permission==="default") {
      Notification.requestPermission();
    }
    // Show onboarding tour on first login
    const tourKey = `io-tour-${u.id}`;
    try { if (!localStorage.getItem(tourKey)) { setShowTour(true); setTourStep(0); } } catch(e){}
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
    await supabase.from("materials").delete().eq("id", id);
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
    const sup={ id:form.id, name:form.name, contact:form.contact, email:form.email, phone:form.phone||"", lead:parseInt(form.lead)||7, materials:form.materials||"", status:form.status||"Active" };
    const { error } = await supabase.from("suppliers").upsert(sup);
    if (error) { toast$("Save failed: "+error.message,"err"); return; }
    const newSups=isEdit?sups.map(s=>s.id===target.id?sup:s):[...sups,sup];
    const entry=addAuditEntry(isEdit?"SUP_EDIT":"SUP_ADD","Supplier",sup.id,isEdit?`Edited: ${sup.name}`:`Added: ${sup.name}`);
    const newA=[entry,...audit].slice(0,500);
    setSups(newSups); setAudit(newA);
    await syncAll({"io-audit":newA});
    toast$(isEdit?"Supplier updated ✓":"Supplier added ✓"); closeModal();
  }

  async function deleteSup(id) {
    if (!window.confirm("Delete this supplier?")) return;
    const sup=sups.find(s=>s.id===id);
    const { error } = await supabase.from("suppliers").delete().eq("id", id);
    if (error) { toast$("Delete failed: "+error.message,"err"); return; }
    const newSups=sups.filter(s=>s.id!==id);
    const entry=addAuditEntry("SUP_DEL","Supplier",id,`Deleted: ${sup?.name}`);
    const newA=[entry,...audit].slice(0,500);
    setSups(newSups); setAudit(newA);
    await syncAll({"io-audit":newA});
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
    await supabase.from("production_runs").delete().eq("id", id);
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
  const todayCostIn  = txns.filter(t=>t.type==="IN"&&t.date===today()).reduce((s,t)=>{ const m=mats.find(x=>x.id===t.materialId); return s+(m?m.unitCost*t.qty:0); },0);
  const todayCostOut = txns.filter(t=>t.type==="OUT"&&t.date===today()).reduce((s,t)=>{ const m=mats.find(x=>x.id===t.materialId); return s+(m?m.unitCost*t.qty:0); },0);
  const forecasts    = useMemo(()=>mats.map(m=>({...m, forecast:getForecast(m,txns,sups)})),[mats,txns,sups]);
  const categoryData = useMemo(()=>getCategoryBreakdown(mats),[mats]);
  const trendData    = useMemo(()=>get30DayValueTrend(txns,mats),[txns,mats]);
  const top5Mats     = useMemo(()=>[...mats].sort((a,b)=>b.stock*b.unitCost-a.stock*a.unitCost).slice(0,5),[mats]);
  const visibleTxn = useMemo(()=>{
    const sorted=[...txns].sort((a,b)=>b.date.localeCompare(a.date));
    return data("viewAllTxn")?sorted:sorted.filter(t=>t.userId===session?.user?.id);
  },[txns,session,perms]);
  const filteredMats = useMemo(()=>mats.filter(m=>!search||m.name.toLowerCase().includes(search.toLowerCase())||m.id.toLowerCase().includes(search.toLowerCase())),[mats,search]);
  const monthlyData  = useMemo(()=>getMonthlyData(txns,mats),[txns,mats]);
  const fmtCompact = (n) => { n=Number(n)||0; const neg=n<0; n=Math.abs(n); let r; if(n>=1e7) r="₹"+(n/1e7).toFixed(2)+" Cr"; else if(n>=1e5) r="₹"+(n/1e5).toFixed(2)+" L"; else if(n>=1e3) r="₹"+(n/1e3).toFixed(1)+"K"; else r="₹"+n.toFixed(0); return (neg?"-":"")+r; };
  const healthSplit = useMemo(()=>{
    let healthy=0, low=0, out=0;
    mats.forEach(m=>{ if(m.stock<=0) out++; else if(m.stock<=m.threshold) low++; else healthy++; });
    const total=mats.length||1;
    return { healthy, low, out, total:mats.length, pct:Math.round(healthy/total*100), gp:healthy/total*100, ap:(healthy+low)/total*100 };
  },[mats]);
  const topMovers = useMemo(()=>{
    const since=new Date(); since.setDate(since.getDate()-30);
    const map={};
    txns.forEach(t=>{ if(new Date(t.date)<since) return; if(!map[t.materialId]) map[t.materialId]={inn:0,out:0}; if(t.type==="IN") map[t.materialId].inn+=t.qty; else map[t.materialId].out+=t.qty; });
    return Object.entries(map).map(([id,v])=>{ const m=mats.find(x=>x.id===id); return { id, name:(m&&m.name)||id, unit:(m&&m.unit)||"", inn:v.inn, out:v.out, moved:v.inn+v.out, net:v.inn-v.out }; }).sort((a,b)=>b.moved-a.moved).slice(0,5);
  },[txns,mats]);
  const needsAttention = useMemo(()=>{
    return mats.filter(m=>m.stock<=m.threshold).map(m=>{ const f=getForecast(m,txns,sups); return { id:m.id, name:m.name, unit:m.unit, stock:m.stock, threshold:m.threshold, reorderQty:f.reorderQty }; }).sort((a,b)=>(a.stock/(a.threshold||1))-(b.stock/(b.threshold||1))).slice(0,6);
  },[mats,txns,sups]);

  const TAB_MAP = [
    {key:"Dashboard",label:"Dashboard",perm:"dashboard"},
    {key:"Inventory",label:"Inventory",perm:"inventory"},
    {key:"Transactions",label:"Transactions",perm:"transactions"},
    {key:"Purchase Orders",label:"Purchase Orders",perm:"purchaseOrders"},
    {key:"Production Runs",label:"Production Runs",perm:"productionRuns"},
    {key:"Suppliers",label:"Suppliers",perm:"suppliers"},
    {key:"Cost & Analytics",label:"Cost & Analytics",perm:"costs"},
    {key:"Forecasting",label:"🔮 Forecasting",perm:"costs"},
    {key:"Audit Log",label:"Audit Log",perm:"auditLog"},
    {key:"Admin",label:"Admin",perm:"admin"},
  ];
  const visibleTabs = TAB_MAP.filter(t=>see(t.perm));

  // ════════════════════════════════════════════════════════════════════════════
  // LOADING
  if (loading) return <div style={{minHeight:"100vh",background:"var(--bg)",display:"flex",alignItems:"center",justifyContent:"center",color:"var(--accent)",fontSize:16,fontFamily:"'DM Sans',sans-serif"}}>Loading InventoryOS…</div>;

  // ════════════════════════════════════════════════════════════════════════════
  // LOGIN
  if (!session) {
    const C={panel:"#232326",inb:"#1a1a1c",bd:"rgba(255,255,255,0.10)",or:"#f2911b",tx:"#f5f5f3",mut:"#9a9a94",fnt:"#6f6f69"};
    const wrapS={display:"flex",alignItems:"center",gap:9,background:C.inb,border:"1px solid "+C.bd,borderRadius:9,padding:"0 12px",height:42,margin:"6px 0 15px"};
    const selS={width:"100%",height:42,background:C.inb,border:"1px solid "+C.bd,borderRadius:9,padding:"0 12px",color:C.tx,fontSize:14,margin:"6px 0 15px",fontFamily:"inherit"};
    const inS={flex:1,background:"transparent",border:"none",outline:"none",color:C.tx,fontSize:14};
    const lblS={color:"#cfcfc9",fontSize:12,fontWeight:500};
    const orBtn={background:C.or,color:"#1a1208",border:"none",borderRadius:9,padding:"12px",fontWeight:600,fontSize:14.5,cursor:"pointer",width:"100%"};
    const ghBtn={background:"transparent",border:"1px solid rgba(242,145,27,0.4)",color:C.or,borderRadius:9,padding:"11px",fontWeight:600,fontSize:14,cursor:"pointer",width:"100%"};
    const lk={color:C.or,fontSize:12.5,fontWeight:600,cursor:"pointer",background:"none",border:"none",padding:0};
    const eyeBtn={background:"none",border:"none",cursor:"pointer",color:C.mut,display:"flex",padding:0};
    const setF=(k,v)=>setLoginF(f=>({...f,[k]:v,error:""}));
    const msg = loginF.error
      ? <div style={{background:"rgba(248,113,113,0.12)",borderRadius:8,padding:"9px 12px",color:"#f87171",fontSize:12,fontWeight:500,marginBottom:14}}>{loginF.error}</div>
      : loginF.info
      ? <div style={{background:"rgba(242,145,27,0.12)",borderRadius:8,padding:"9px 12px",color:C.or,fontSize:12,fontWeight:500,marginBottom:14}}>{loginF.info}</div>
      : null;
    return (
      <div style={{minHeight:"100vh",display:"flex",background:C.inb,fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}}>
        <div style={{flex:"1.05",background:"#1a1a1c",padding:"36px",display:"flex",flexDirection:"column",justifyContent:"space-between",position:"relative",overflow:"hidden"}}>
          <Truck size={230} style={{position:"absolute",right:-30,bottom:-26,color:"rgba(242,145,27,0.05)"}}/>
          <div style={{position:"relative"}}>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <div style={{width:42,height:42,borderRadius:10,background:C.or,display:"flex",alignItems:"center",justifyContent:"center",color:"#1a1a1c"}}><Settings size={23}/></div>
              <div style={{color:C.tx,fontSize:21,fontWeight:600,letterSpacing:"0.12em"}}>DUVI DESIGNS</div>
            </div>
            <div style={{color:C.or,fontSize:11,fontWeight:600,letterSpacing:"0.1em",marginTop:9}}>BUILDING QUALITY, DELIVERING EXPERIENCE</div>
          </div>
          <div style={{position:"relative"}}>
            <div style={{color:C.tx,fontSize:31,fontWeight:600,lineHeight:1.18,letterSpacing:"-0.5px"}}>Keep the<br/>workshop moving.</div>
            <div style={{color:C.mut,fontSize:14,marginTop:14,maxWidth:315,lineHeight:1.6}}>Every part, purchase, and build — tracked from the floor to the finished vehicle.</div>
          </div>
          <div style={{color:C.fnt,fontSize:12,position:"relative"}}>ರೈತರ ವಾಹನ · farmers' vehicles</div>
        </div>
        <div style={{flex:"0.95",background:C.panel,padding:"38px",display:"flex",flexDirection:"column",justifyContent:"center",minWidth:330,overflowY:"auto"}}>
          {authView==="signin" && (<>
            <div style={{color:C.tx,fontSize:22,fontWeight:600}}>Welcome back</div>
            <div style={{color:C.mut,fontSize:13,marginTop:5,marginBottom:24}}>Sign in to continue</div>
            {msg}
            <label style={lblS}>Email</label>
            <div style={wrapS}><Mail size={17} color={C.mut}/><input type="email" placeholder="you@company.com" value={loginF.username} onChange={e=>setF("username",e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleLogin()} style={inS} autoFocus/></div>
            <label style={lblS}>Password</label>
            <div style={{...wrapS,margin:"6px 0 8px"}}><Lock size={17} color={C.mut}/><input type={showPw?"text":"password"} placeholder="••••••••" value={loginF.password} onChange={e=>setF("password",e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleLogin()} style={inS}/><button onClick={()=>setShowPw(s=>!s)} style={eyeBtn}>{showPw?<EyeOff size={17}/>:<Eye size={17}/>}</button></div>
            <div style={{textAlign:"right",marginBottom:18}}><button style={lk} onClick={()=>{setLoginF(f=>({...f,error:"",info:""}));setAuthView("forgot");}}>Forgot password?</button></div>
            <button style={orBtn} onClick={handleLogin}>{loginF.loading?"Signing in…":"Sign in"}</button>
            <div style={{display:"flex",alignItems:"center",gap:12,margin:"20px 0"}}><div style={{flex:1,height:1,background:"rgba(255,255,255,0.10)"}}/><span style={{color:C.mut,fontSize:11.5}}>New here?</span><div style={{flex:1,height:1,background:"rgba(255,255,255,0.10)"}}/></div>
            <button style={ghBtn} onClick={()=>{setLoginF(f=>({...f,error:"",info:""}));setAuthView("signup");}}>Create an account</button>
            <div style={{textAlign:"center",color:C.fnt,fontSize:11,lineHeight:1.6,marginTop:16}}>New accounts start with limited access<br/>until an admin assigns your role.</div>
          </>)}
          {authView==="signup" && (<>
            <div style={{color:C.tx,fontSize:22,fontWeight:600}}>Create your account</div>
            <div style={{color:C.mut,fontSize:13,marginTop:5,marginBottom:24}}>Request access to Duvi Designs</div>
            {msg}
            <label style={lblS}>Full name</label>
            <div style={wrapS}><input type="text" placeholder="Your name" value={loginF.name} onChange={e=>setF("name",e.target.value)} style={inS} autoFocus/></div>
            <label style={lblS}>Email</label>
            <div style={wrapS}><Mail size={17} color={C.mut}/><input type="email" placeholder="you@company.com" value={loginF.username} onChange={e=>setF("username",e.target.value)} style={inS}/></div>
            <label style={lblS}>Phone</label>
            <div style={wrapS}><Phone size={17} color={C.mut}/><input type="tel" placeholder="Phone number" value={loginF.phone} onChange={e=>setF("phone",e.target.value)} style={inS}/></div>
            <label style={lblS}>Gender</label>
            <select value={loginF.gender} onChange={e=>setF("gender",e.target.value)} style={selS}><option value="">Prefer not to say</option><option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option></select>
            <label style={lblS}>Date of birth</label>
            <input type="date" value={loginF.dob} onChange={e=>setF("dob",e.target.value)} style={selS}/>
            <label style={lblS}>Password</label>
            <div style={{...wrapS,margin:"6px 0 16px"}}><Lock size={17} color={C.mut}/><input type={showPw?"text":"password"} placeholder="At least 6 characters" value={loginF.password} onChange={e=>setF("password",e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleSignup()} style={inS}/><button onClick={()=>setShowPw(s=>!s)} style={eyeBtn}>{showPw?<EyeOff size={17}/>:<Eye size={17}/>}</button></div>
            <button style={orBtn} onClick={handleSignup}>{loginF.loading?"Creating…":"Create account"}</button>
            <div style={{textAlign:"center",marginTop:18}}><span style={{color:C.mut,fontSize:12.5}}>Already have an account? </span><button style={lk} onClick={()=>{setLoginF(f=>({...f,error:"",info:""}));setAuthView("signin");}}>Sign in</button></div>
          </>)}
          {authView==="forgot" && (<>
            <div style={{color:C.tx,fontSize:22,fontWeight:600}}>Reset password</div>
            <div style={{color:C.mut,fontSize:13,marginTop:5,marginBottom:24}}>We'll email you a reset link</div>
            {msg}
            <label style={lblS}>Email</label>
            <div style={{...wrapS,margin:"6px 0 16px"}}><Mail size={17} color={C.mut}/><input type="email" placeholder="you@company.com" value={loginF.username} onChange={e=>setF("username",e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleForgot()} style={inS} autoFocus/></div>
            <button style={orBtn} onClick={handleForgot}>{loginF.loading?"Sending…":"Send reset link"}</button>
            <div style={{textAlign:"center",marginTop:18}}><button style={lk} onClick={()=>{setLoginF(f=>({...f,error:"",info:""}));setAuthView("signin");}}>Back to sign in</button></div>
          </>)}
          {authView==="reset" && (<>
            <div style={{color:C.tx,fontSize:22,fontWeight:600}}>Set a new password</div>
            <div style={{color:C.mut,fontSize:13,marginTop:5,marginBottom:24}}>Enter a new password for your account</div>
            {msg}
            <label style={lblS}>New password</label>
            <div style={{...wrapS,margin:"6px 0 16px"}}><Lock size={17} color={C.mut}/><input type={showPw?"text":"password"} placeholder="At least 6 characters" value={loginF.password} onChange={e=>setF("password",e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleReset()} style={inS} autoFocus/><button onClick={()=>setShowPw(s=>!s)} style={eyeBtn}>{showPw?<EyeOff size={17}/>:<Eye size={17}/>}</button></div>
            <button style={orBtn} onClick={handleReset}>{loginF.loading?"Updating…":"Update password"}</button>
          </>)}
        </div>
      </div>
    );
  }

  const user=session.user;
  const menuItem={display:"flex",alignItems:"center",gap:9,width:"100%",padding:"9px 10px",background:"transparent",border:"none",cursor:"pointer",borderRadius:8,fontSize:13,color:"var(--text)",fontFamily:"inherit",textAlign:"left"};
  const stRow={display:"flex",alignItems:"center",gap:13,width:"100%",padding:"13px 18px",background:"transparent",border:"none",borderTop:"1px solid var(--border)",cursor:"pointer",fontFamily:"inherit",textAlign:"left"};
  const stRowRo={...stRow,cursor:"default"};
  const stMain={flex:1,minWidth:0};
  const stLabel={fontSize:14,color:"var(--text)"};
  const stVal={fontSize:12.5,color:"var(--text-secondary)",marginTop:2,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"};
  const stSec={fontSize:11,fontWeight:600,color:"var(--text-muted)",textTransform:"uppercase",letterSpacing:"0.04em",padding:"16px 18px 4px"};
  const stTag={fontSize:11.5,color:"var(--text-muted)"};
  const stExp={padding:"0 18px 14px",background:"var(--panel-2)",borderTop:"1px solid var(--border)"};
  const stSave={background:"var(--accent)",color:"#fff",border:"none",borderRadius:9,padding:"9px 16px",fontWeight:600,fontSize:13,cursor:"pointer",marginTop:12};
  const clockStr = clock.toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"})+" · "+clock.toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit",hour12:true});

  if (user.role==="Pending") return (
    <div style={{minHeight:"100vh",background:"var(--bg)",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{maxWidth:420,textAlign:"center",background:"var(--panel)",border:"1px solid var(--border)",borderRadius:16,padding:"36px 30px"}}>
        <div style={{width:54,height:54,borderRadius:14,background:"var(--warning-bg)",color:"var(--warning)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px"}}><AlertTriangle size={26}/></div>
        <div style={{fontSize:19,fontWeight:600,color:"var(--text)"}}>Account awaiting approval</div>
        <div style={{fontSize:13.5,color:"var(--text-secondary)",marginTop:10,lineHeight:1.6}}>Hi {user.name}, your account is created. An administrator needs to assign your role before you can access the system. Please check back soon.</div>
        <button onClick={()=>{ supabase.auth.signOut(); setSession(null); try{localStorage.removeItem("io-session");}catch(e){} }} style={{marginTop:22,background:"var(--accent)",color:"#fff",border:"none",borderRadius:9,padding:"10px 22px",fontWeight:600,fontSize:13.5,cursor:"pointer"}}>Sign out</button>
      </div>
    </div>
  );

  // ── Tour slides per role ────────────────────────────────────────────────────
  const TOUR_SLIDES_BASE = [
    { icon:"⚙️", title:`Welcome, ${user.name}!`, desc:"InventoryOS helps you manage your manufacturing raw materials in real time. This quick tour will show you how everything works." },
    { icon:"📊", title:"Dashboard", desc:"Your home screen. See a live overview of stock levels, total inventory value, alerts for low stock, and recent activity at a glance." },
    { icon:"📦", title:"Inventory", desc:"View all your raw materials, their stock levels, thresholds, and costs. Add, edit, or delete materials and do stock in/out from here." },
  ];
  const TOUR_SLIDES_WAREHOUSE = [
    { icon:"📋", title:"Transactions", desc:"Every stock movement is recorded here — stock in, stock out, purchase order receipts, and production run consumptions." },
    { icon:"🏭", title:"Production Runs", desc:"Log production runs that consume multiple materials at once. The app automatically deducts stock from inventory." },
  ];
  const TOUR_SLIDES_MANAGER = [
    { icon:"🧾", title:"Purchase Orders", desc:"Create POs to restock materials, assign them to suppliers, and mark them as received when goods arrive." },
    { icon:"💰", title:"Cost & Analytics", desc:"Track your total inventory value, cost trends over time, and category-wise cost breakdown. Includes 30-day trend charts." },
    { icon:"🔮", title:"Forecasting", desc:"AI-powered demand forecasting predicts how many days each material will last, when to reorder, and how much to order." },
  ];
  const TOUR_SLIDES_ADMIN = [
    { icon:"⚙", title:"Admin Panel", desc:"Manage users, roles, and permissions. Create new accounts, assign roles, and control what each user can see and do." },
  ];
  const TOUR_SLIDES_END = [
    { icon:"🔔", title:"Alerts & Notifications", desc:"You'll get browser notifications when stock drops below threshold. The bell icon in the header shows all alerts." },
    { icon:"✅", title:"You're all set!", desc:"That's everything! You can replay this tour anytime by clicking the ❓ button in the header. Good luck!" },
  ];
  const getTourSlides = (role) => {
    if (role==="Admin") return [...TOUR_SLIDES_BASE, ...TOUR_SLIDES_WAREHOUSE, ...TOUR_SLIDES_MANAGER, ...TOUR_SLIDES_ADMIN, ...TOUR_SLIDES_END];
    if (role==="Manager") return [...TOUR_SLIDES_BASE, ...TOUR_SLIDES_MANAGER, ...TOUR_SLIDES_END];
    if (role==="Warehouse") return [...TOUR_SLIDES_BASE, ...TOUR_SLIDES_WAREHOUSE, ...TOUR_SLIDES_END];
    return [...TOUR_SLIDES_BASE, ...TOUR_SLIDES_END];
  };
  const tourSlides = getTourSlides(user.role);
  const closeTour = () => {
    setShowTour(false);
    try { localStorage.setItem(`io-tour-${user.id}`, "done"); } catch(e){}
  };

  // ════════════════════════════════════════════════════════════════════════════
  // MAIN APP
  return (
    <div style={{display:"flex",minHeight:"100vh",background:"var(--bg)",color:"var(--text)"}}>

      {/* Onboarding Tour Modal */}
      {showTour&&tourSlides[tourStep]&&(
        <div style={{position:"fixed",inset:0,zIndex:10000,background:"rgba(0,0,0,0.7)",display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
          <div style={{background:"var(--panel)",borderRadius:20,width:"100%",maxWidth:460,padding:"36px 36px 28px",boxShadow:"0 30px 80px rgba(0,0,0,0.4)",position:"relative"}}>
            {/* Progress bar */}
            <div style={{position:"absolute",top:0,left:0,right:0,height:4,background:"var(--panel-2)",borderRadius:"20px 20px 0 0",overflow:"hidden"}}>
              <div style={{height:"100%",background:"linear-gradient(90deg,#38bdf8,#6366f1)",width:`${((tourStep+1)/tourSlides.length)*100}%`,transition:"width 0.4s"}}/>
            </div>
            <div style={{textAlign:"center",padding:"10px 0 20px"}}>
              <div style={{fontSize:52,marginBottom:14}}>{tourSlides[tourStep].icon}</div>
              <div style={{fontSize:20,fontWeight:900,color:"var(--text)",marginBottom:10}}>{tourSlides[tourStep].title}</div>
              <div style={{fontSize:14,color:"var(--text-secondary)",lineHeight:1.7}}>{tourSlides[tourStep].desc}</div>
            </div>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:8}}>
              <div style={{fontSize:12,color:"var(--text-muted)"}}>{tourStep+1} of {tourSlides.length}</div>
              <div style={{display:"flex",gap:8}}>
                <button style={{...btn("var(--panel-2)","var(--text-muted)","8px 16px"),fontSize:13}} onClick={closeTour}>Skip</button>
                {tourStep>0&&<button style={{...btn("var(--accent-soft)","var(--accent)","8px 16px"),fontSize:13}} onClick={()=>setTourStep(s=>s-1)}>← Back</button>}
                {tourStep<tourSlides.length-1
                  ? <button style={{...btn("var(--accent)","#fff","8px 20px"),fontSize:13}} onClick={()=>setTourStep(s=>s+1)}>Next →</button>
                  : <button style={{...btn("var(--success)","#fff","8px 20px"),fontSize:13}} onClick={closeTour}>Get Started ✓</button>
                }
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast&&<div style={{position:"fixed",bottom:24,right:24,zIndex:9999,background:toast.type==="err"?"#ef4444":"#10b981",color:"#fff",borderRadius:10,padding:"12px 20px",fontWeight:700,fontSize:13,boxShadow:"0 8px 24px rgba(0,0,0,0.25)"}}>
        {toast.type==="err"?"❌":"✅"} {toast.msg}
      </div>}

      {/* Notification Panel */}
      {showNotif&&<div style={{position:"fixed",top:54,right:16,zIndex:500,background:"var(--panel)",borderRadius:12,border:"1px solid #e2e8f0",width:340,boxShadow:"0 8px 30px rgba(0,0,0,0.15)",maxHeight:400,overflowY:"auto"}}>
        <div style={{padding:"12px 16px",borderBottom:"1px solid #f1f5f9",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{fontWeight:700,fontSize:14}}>Notifications</span>
          <button style={{...btn("var(--panel-2)","var(--text-secondary)","4px 10px"),fontSize:11}} onClick={()=>{setNotifs(n=>n.map(x=>({...x,read:true})));setShowNotif(false);}}>Clear all</button>
        </div>
        {notifs.length===0?<EmptyState icon="🔔" msg="No notifications"/>:notifs.slice(0,20).map(n=>(
          <div key={n.id} onClick={()=>setNotifs(prev=>prev.map(x=>x.id===n.id?{...x,read:true}:x))} style={{padding:"10px 16px",borderBottom:"1px solid #f8fafc",background:n.read?"#fff":"#fefce8",cursor:"pointer"}}>
            <div style={{fontSize:12,fontWeight:n.read?400:700,color:"var(--text)"}}>{n.msg}</div>
            <div style={{fontSize:11,color:"var(--text-muted)",marginTop:2}}>{n.date}</div>
          </div>
        ))}
      </div>}

      {/* Sidebar */}
      <aside style={{width:230,flexShrink:0,background:"var(--sidebar-bg)",borderRight:"1px solid var(--sidebar-border)",height:"100vh",position:"sticky",top:0,display:"flex",flexDirection:"column",padding:"16px 12px",zIndex:100}}>
        <div style={{display:"flex",alignItems:"center",gap:10,padding:"4px 8px 18px"}}>
          <div style={{width:30,height:30,borderRadius:8,background:"var(--accent)",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Boxes size={18}/></div>
          <span style={{fontSize:15,fontWeight:600,color:"var(--sidebar-text)",letterSpacing:"-0.3px"}}>InventoryOS</span>
        </div>
        <nav style={{display:"flex",flexDirection:"column",gap:2,overflowY:"auto",flex:1}}>
          {visibleTabs.map(t=>{ const Icon=TAB_ICONS[t.key]||LayoutDashboard; const active=tab===t.key; return (
            <button key={t.key} onClick={()=>{setTab(t.key);setShowNotif(false);}} style={{display:"flex",alignItems:"center",gap:11,padding:"9px 11px",borderRadius:9,border:"none",cursor:"pointer",background:active?"var(--sidebar-active-bg)":"transparent",color:active?"var(--sidebar-active-text)":"var(--sidebar-muted)",fontSize:13,fontWeight:active?500:400,fontFamily:"inherit",textAlign:"left",width:"100%",transition:"background .15s,color .15s"}}>
              <Icon size={17} style={{flexShrink:0}}/>{t.key}
            </button>
          );})}
        </nav>
        <div style={{marginTop:12,paddingTop:12,borderTop:"1px solid var(--sidebar-border)",position:"relative"}}>
          {showProfileMenu && (<>
            <div onClick={()=>{setShowProfileMenu(false);setThemeMenuOpen(false);}} style={{position:"fixed",inset:0,zIndex:60}}/>
            <div style={{position:"absolute",bottom:"calc(100% + 8px)",left:0,right:0,background:"var(--panel)",border:"1px solid var(--border)",borderRadius:12,boxShadow:"0 12px 30px rgba(0,0,0,0.28)",padding:8,zIndex:61}}>
              <div style={{padding:"8px 10px 10px"}}>
                <div style={{fontSize:13,fontWeight:600,color:"var(--text)"}}>{user.name}</div>
                <div style={{fontSize:11,color:"var(--text-muted)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{user.email}</div>
                <div style={{marginTop:7}}><RoleBadge role={user.role}/></div>
              </div>
              <div style={{height:1,background:"var(--border)",margin:"4px 6px 6px"}}/>
              <button onClick={()=>{ setAcct({name:user.name,phone:user.phone||"",gender:user.gender||"",dob:user.dob||"",curPw:"",newPw:"",confPw:"",error:"",info:"",loading:false}); setAcctOpen(null); setShowSettings(true); setShowProfileMenu(false); }} style={menuItem}><Settings size={15}/>Account settings</button>
              <button onClick={()=>{ supabase.auth.signOut(); setSession(null); try{localStorage.removeItem("io-session");}catch(e){} }} style={{...menuItem,color:"var(--danger)"}}><LogOut size={15}/>Sign out</button>
            </div>
          </>)}
          <div style={{display:"flex",alignItems:"center",gap:10,padding:"6px"}}>
            <button onClick={()=>setShowProfileMenu(v=>!v)} title="Open menu" style={{width:32,height:32,borderRadius:"50%",background:"var(--sidebar-active-bg)",color:"var(--sidebar-text)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:600,flexShrink:0,border:"none",cursor:"pointer",fontFamily:"inherit"}}>{user.name.charAt(0)}</button>
            <div style={{flex:1,minWidth:0,lineHeight:1.3}}>
              <div style={{fontSize:12,fontWeight:500,color:"var(--sidebar-text)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{user.name}</div>
              <div style={{fontSize:11,color:"var(--sidebar-muted)",display:"flex",alignItems:"center",gap:5}}><span style={{width:6,height:6,borderRadius:"50%",background:ROLE_COLORS[user.role],display:"inline-block"}}></span>{user.role}</div>
            </div>
          </div>
        </div>
      </aside>

      <div style={{flex:1,minWidth:0,padding:"22px",background:"var(--bg)"}}>
        {/* Top bar */}
        <header style={{margin:"-22px -22px 20px",padding:"0 22px",height:60,background:"var(--header-bg)",borderBottom:"1px solid var(--border)",display:"flex",alignItems:"center",gap:14,position:"sticky",top:0,zIndex:50}}>
          <div style={{fontSize:16,fontWeight:600,color:"var(--text)",letterSpacing:"-0.3px"}}>{tab}</div>
          <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:12}}>
            <span style={{color:"var(--text-secondary)",fontSize:12.5,fontWeight:500,whiteSpace:"nowrap"}}>{clockStr}</span>
            {syncing&&<span style={{color:"var(--text-muted)",fontSize:12,display:"flex",alignItems:"center",gap:5}}><RefreshCw size={13} className="io-spin"/>Syncing</span>}
            {alerts.length>0&&<button onClick={()=>setTab("Inventory")} style={{display:"flex",alignItems:"center",gap:6,background:"var(--warning-bg)",color:"var(--warning)",border:"none",borderRadius:8,padding:"6px 11px",fontSize:12,fontWeight:500,cursor:"pointer"}}><AlertTriangle size={14}/>{alerts.length} alert{alerts.length>1?"s":""}</button>}
            <button onClick={()=>setShowNotif(v=>!v)} style={{position:"relative",background:"transparent",border:"none",cursor:"pointer",color:"var(--text-secondary)",display:"flex",padding:6}}>
              <Bell size={19}/>{unread>0&&<span style={{position:"absolute",top:0,right:0,minWidth:15,height:15,padding:"0 3px",boxSizing:"border-box",background:"var(--danger)",color:"#fff",borderRadius:8,fontSize:9,fontWeight:600,display:"flex",alignItems:"center",justifyContent:"center"}}>{unread}</span>}
            </button>
            <button onClick={()=>{ setShowTour(true); setTourStep(0); }} title="Help" style={{background:"transparent",border:"none",cursor:"pointer",color:"var(--text-secondary)",display:"flex",padding:6}}><CircleHelp size={19}/></button>
          </div>
        </header>

        {showSettings && (
          <div onClick={()=>setShowSettings(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:120,padding:20}}>
            <div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:440,background:"var(--panel)",border:"1px solid var(--border)",borderRadius:16,maxHeight:"90vh",overflowY:"auto"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 18px",borderBottom:"1px solid var(--border)",position:"sticky",top:0,background:"var(--panel)",zIndex:1}}>
                <div style={{fontSize:16,fontWeight:600,color:"var(--text)"}}>Account settings</div>
                <button onClick={()=>setShowSettings(false)} style={{background:"transparent",border:"none",cursor:"pointer",color:"var(--text-muted)",fontSize:22,lineHeight:1}}>&times;</button>
              </div>
              {(acct.error||acct.info)&&<div style={{padding:"12px 18px 0"}}><div style={{background:acct.error?"var(--danger-bg)":"var(--success-bg)",color:acct.error?"var(--danger)":"var(--success)",borderRadius:8,padding:"9px 12px",fontSize:12,fontWeight:500}}>{acct.error||acct.info}</div></div>}

              <div style={stSec}>Profile</div>
              <button style={stRow} onClick={()=>setAcctOpen(o=>o==="name"?null:"name")}><User size={18} color="var(--text-secondary)"/><div style={stMain}><div style={stLabel}>Display name</div><div style={stVal}>{user.name}</div></div><ChevronDown size={16} color="var(--text-muted)" style={{transform:acctOpen==="name"?"rotate(180deg)":"none"}}/></button>
              {acctOpen==="name"&&<div style={stExp}><input value={acct.name} onChange={e=>setAcct(x=>({...x,name:e.target.value,error:"",info:""}))} style={{...inp,marginTop:10}}/><button onClick={()=>{ const n=(acct.name||"").trim(); if(!n){setAcct(x=>({...x,error:"Name can't be empty."}));return;} saveProfile({name:n},"Name updated."); }} style={stSave}>{acct.loading?"Saving…":"Save"}</button></div>}
              <div style={stRowRo}><Mail size={18} color="var(--text-secondary)"/><div style={stMain}><div style={stLabel}>Email</div><div style={stVal}>{user.email}</div></div><span style={stTag}>Login email</span></div>
              <div style={stRowRo}><Shield size={18} color="var(--text-secondary)"/><div style={stMain}><div style={stLabel}>Role</div><div style={stVal}>{user.role}</div></div><span style={stTag}>Set by admin</span></div>

              <div style={stSec}>Personal info</div>
              <button style={stRow} onClick={()=>setAcctOpen(o=>o==="gender"?null:"gender")}><User size={18} color="var(--text-secondary)"/><div style={stMain}><div style={stLabel}>Gender</div><div style={stVal}>{user.gender||"Not set"}</div></div><ChevronDown size={16} color="var(--text-muted)" style={{transform:acctOpen==="gender"?"rotate(180deg)":"none"}}/></button>
              {acctOpen==="gender"&&<div style={stExp}><select value={acct.gender} onChange={e=>setAcct(x=>({...x,gender:e.target.value,error:"",info:""}))} style={{...inp,marginTop:10}}><option value="">Prefer not to say</option><option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option></select><button onClick={()=>saveProfile({gender:acct.gender},"Gender updated.")} style={stSave}>{acct.loading?"Saving…":"Save"}</button></div>}
              <button style={stRow} onClick={()=>setAcctOpen(o=>o==="dob"?null:"dob")}><Calendar size={18} color="var(--text-secondary)"/><div style={stMain}><div style={stLabel}>Date of birth</div><div style={stVal}>{user.dob||"Not set"}</div></div><ChevronDown size={16} color="var(--text-muted)" style={{transform:acctOpen==="dob"?"rotate(180deg)":"none"}}/></button>
              {acctOpen==="dob"&&<div style={stExp}><input type="date" value={acct.dob||""} onChange={e=>setAcct(x=>({...x,dob:e.target.value,error:"",info:""}))} style={{...inp,marginTop:10}}/><button onClick={()=>saveProfile({dob:acct.dob||null},"Date of birth updated.")} style={stSave}>{acct.loading?"Saving…":"Save"}</button></div>}

              <button style={stRow} onClick={()=>setAcctOpen(o=>o==="phone"?null:"phone")}><Phone size={18} color="var(--text-secondary)"/><div style={stMain}><div style={stLabel}>Phone</div><div style={stVal}>{user.phone||"Not set"}</div></div><ChevronDown size={16} color="var(--text-muted)" style={{transform:acctOpen==="phone"?"rotate(180deg)":"none"}}/></button>
              {acctOpen==="phone"&&<div style={stExp}><input type="tel" value={acct.phone} onChange={e=>setAcct(x=>({...x,phone:e.target.value,error:"",info:""}))} placeholder="Phone number" style={{...inp,marginTop:10}}/><button onClick={()=>saveProfile({phone:(acct.phone||"").trim()||null},"Phone updated.")} style={stSave}>{acct.loading?"Saving…":"Save"}</button></div>}
              <div style={stSec}>Appearance</div>
              <button style={stRow} onClick={()=>setAcctOpen(o=>o==="theme"?null:"theme")}><Sun size={18} color="var(--text-secondary)"/><div style={stMain}><div style={stLabel}>Theme</div><div style={{...stVal,textTransform:"capitalize"}}>{theme}</div></div><ChevronDown size={16} color="var(--text-muted)" style={{transform:acctOpen==="theme"?"rotate(180deg)":"none"}}/></button>
              {acctOpen==="theme"&&<div style={stExp}><div style={{display:"flex",gap:6,marginTop:10}}>{[["system",Monitor],["light",Sun],["dark",Moon]].map(([m,Icon])=>(<button key={m} onClick={()=>setTheme(m)} style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:6,padding:"9px 0",borderRadius:8,border:"1px solid var(--border)",cursor:"pointer",background:theme===m?"var(--accent)":"var(--panel)",color:theme===m?"#fff":"var(--text-secondary)",fontSize:12,textTransform:"capitalize",fontFamily:"inherit"}}><Icon size={15}/>{m}</button>))}</div></div>}

              <div style={stSec}>Security</div>
              <button style={stRow} onClick={()=>setAcctOpen(o=>o==="pw"?null:"pw")}><Lock size={18} color="var(--text-secondary)"/><div style={stMain}><div style={stLabel}>Password</div><div style={stVal}>Change your password</div></div><ChevronDown size={16} color="var(--text-muted)" style={{transform:acctOpen==="pw"?"rotate(180deg)":"none"}}/></button>
              {acctOpen==="pw"&&<div style={{...stExp,paddingBottom:18}}><div style={{marginTop:10}}><Lbl c="Current password"/><input type="password" value={acct.curPw} onChange={e=>setAcct(x=>({...x,curPw:e.target.value,error:"",info:""}))} style={inp}/></div><div style={{marginTop:10}}><Lbl c="New password"/><input type="password" value={acct.newPw} onChange={e=>setAcct(x=>({...x,newPw:e.target.value,error:"",info:""}))} style={inp}/></div><div style={{marginTop:10}}><Lbl c="Confirm new password"/><input type="password" value={acct.confPw} onChange={e=>setAcct(x=>({...x,confPw:e.target.value,error:"",info:""}))} style={inp}/></div><button onClick={changePassword} style={stSave}>{acct.loading?"Updating…":"Update password"}</button></div>}
              <div style={{height:16}}/>
            </div>
          </div>
        )}

        {/* ══ DASHBOARD ════════════════════════════════════════════════════ */}
        {tab==="Dashboard"&&(
          <div>
            {/* Hero band */}
            <div style={{display:"flex",alignItems:"stretch",flexWrap:"wrap",gap:20,background:"var(--panel)",border:"1px solid var(--border)",borderRadius:14,padding:"18px 22px",marginBottom:13}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"center"}}>
                <div style={{width:104,height:104,borderRadius:"50%",position:"relative",background:`conic-gradient(var(--success) 0 ${healthSplit.gp}%, var(--warning) ${healthSplit.gp}% ${healthSplit.ap}%, var(--danger) ${healthSplit.ap}% 100%)`}}>
                  <div style={{position:"absolute",inset:11,borderRadius:"50%",background:"var(--panel)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
                    <div style={{fontSize:23,fontWeight:600,color:"var(--text)",letterSpacing:"-0.5px",lineHeight:1}}>{healthSplit.pct}%</div>
                    <div style={{fontSize:11,color:"var(--text-muted)",marginTop:3}}>healthy</div>
                  </div>
                </div>
              </div>
              <div style={{borderLeft:"1px solid var(--border)",paddingLeft:22,display:"flex",flexDirection:"column",justifyContent:"center"}}>
                <div style={{fontSize:11,color:"var(--text-muted)",textTransform:"uppercase",letterSpacing:"0.04em",marginBottom:12}}>Stock health · {healthSplit.total} items</div>
                {[["var(--success)",healthSplit.healthy,"healthy"],["var(--warning)",healthSplit.low,"low stock"],["var(--danger)",healthSplit.out,"out of stock"]].map(([c,n,l])=>(
                  <div key={l} style={{display:"flex",alignItems:"center",gap:9,marginBottom:9,fontSize:13,color:"var(--text)"}}>
                    <span style={{width:8,height:8,borderRadius:"50%",background:c,flexShrink:0}}></span>
                    <b style={{fontWeight:600,width:34}}>{fmtN(n)}</b><span style={{color:"var(--text-muted)"}}>{l}</span>
                  </div>
                ))}
              </div>
              {data("viewCosts")&&(
                <div style={{borderLeft:"1px solid var(--border)",paddingLeft:22,display:"flex",flexDirection:"column",justifyContent:"center"}}>
                  <div style={{fontSize:11,color:"var(--text-muted)",textTransform:"uppercase",letterSpacing:"0.04em",marginBottom:10}}>Total stock value</div>
                  <div style={{fontSize:30,fontWeight:600,color:"var(--text)",letterSpacing:"-1px",lineHeight:1}}>{fmtCompact(stockVal)}</div>
                  <div style={{fontSize:12,color:"var(--text-muted)",marginTop:8}}>across {mats.length} materials</div>
                </div>
              )}
            </div>

            {/* Main row */}
            <div style={{display:"grid",gridTemplateColumns:"1.6fr 1fr",gap:13,marginBottom:13}}>
              <div style={{background:"var(--panel)",border:"1px solid var(--border)",borderRadius:14,padding:"15px 18px"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                  <span style={{fontSize:13,fontWeight:600,color:"var(--text)"}}>Most active materials</span>
                  <span style={{fontSize:11,color:"var(--text-muted)"}}>last 30 days · by qty moved</span>
                </div>
                {topMovers.length===0
                  ? <EmptyState icon="—" msg="No stock movement in the last 30 days"/>
                  : topMovers.map(mv=>{ const moved=mv.moved||1; const inPct=Math.round(mv.inn/moved*100); return (
                    <div key={mv.id} style={{display:"flex",alignItems:"center",gap:12,padding:"9px 0",borderTop:"1px solid var(--border)"}}>
                      <span style={{width:120,fontSize:13,color:"var(--text)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{mv.name}</span>
                      <div style={{flex:1,height:7,borderRadius:4,background:"var(--panel-2)",overflow:"hidden",display:"flex"}}>
                        <span style={{width:`${inPct}%`,background:"var(--accent)"}}></span>
                        <span style={{width:`${100-inPct}%`,background:"var(--text-muted)",opacity:.5}}></span>
                      </div>
                      <span style={{width:74,textAlign:"right",fontSize:12,fontWeight:600,color:mv.net>0?"var(--success)":mv.net<0?"var(--danger)":"var(--text-muted)"}}>{mv.net>0?"+":""}{fmtN(mv.net)} {mv.unit}</span>
                    </div>
                  );})}
                {topMovers.length>0&&<div style={{display:"flex",gap:16,marginTop:11,fontSize:11,color:"var(--text-muted)"}}><span><span style={{display:"inline-block",width:9,height:9,borderRadius:2,background:"var(--accent)",marginRight:6,verticalAlign:"middle"}}></span>In</span><span><span style={{display:"inline-block",width:9,height:9,borderRadius:2,background:"var(--text-muted)",opacity:.5,marginRight:6,verticalAlign:"middle"}}></span>Out</span></div>}
              </div>

              <div style={{background:"var(--panel)",border:"1px solid var(--border)",borderRadius:14,padding:"15px 18px"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                  <span style={{fontSize:13,fontWeight:600,color:"var(--text)"}}>Needs attention</span>
                  <span style={{fontSize:11,color:"var(--text-muted)"}}>{needsAttention.length}</span>
                </div>
                {needsAttention.length===0
                  ? <div style={{display:"flex",alignItems:"center",gap:9,padding:"14px 0",fontSize:13,color:"var(--text-muted)"}}><span style={{width:8,height:8,borderRadius:"50%",background:"var(--success)"}}></span>All materials above threshold</div>
                  : needsAttention.map(m=>{ const isOut=m.stock<=0; return (
                    <div key={m.id} style={{display:"flex",alignItems:"center",gap:11,padding:"9px 0",borderTop:"1px solid var(--border)"}}>
                      <span style={{width:8,height:8,borderRadius:"50%",background:isOut?"var(--danger)":"var(--warning)",flexShrink:0}}></span>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:13,color:"var(--text)",fontWeight:500,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{m.name}</div>
                        <div style={{fontSize:11,color:"var(--text-muted)"}}>{m.reorderQty?`reorder ~${fmtN(m.reorderQty)} ${m.unit}`:"below threshold"}</div>
                      </div>
                      <span style={{fontSize:12,fontWeight:600,color:isOut?"var(--danger)":"var(--warning)",whiteSpace:"nowrap"}}>{fmtN(m.stock)} {m.unit}</span>
                    </div>
                  );})}
              </div>
            </div>

            {/* Secondary strip */}
            <div style={{display:"flex",flexWrap:"wrap",background:"var(--panel)",border:"1px solid var(--border)",borderRadius:14,overflow:"hidden"}}>
              {[
                ...(data("viewCosts")?[["Cost in · this month",fmtCompact(totalCostIn)],["Cost out · this month",fmtCompact(totalCostOut)]]:[]),
                ["Pending POs", String(pos.filter(p=>p.status==="Pending").length)],
                ["Active runs", String(runs.filter(r=>r.status==="Planned"||r.status==="In Progress").length)],
              ].map(([l,v],i)=>(
                <div key={l} style={{flex:1,minWidth:130,padding:"14px 18px",borderLeft:i===0?"none":"1px solid var(--border)"}}>
                  <div style={{fontSize:11,color:"var(--text-muted)",marginBottom:6}}>{l}</div>
                  <div style={{fontSize:17,fontWeight:600,color:"var(--text)",letterSpacing:"-0.3px"}}>{v}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══ INVENTORY ════════════════════════════════════════════════════ */}
        {tab==="Inventory"&&(
          <div>
            <SectionBar title="Inventory">
              <input placeholder="Search…" value={search} onChange={e=>setSearch(e.target.value)} style={{...inp,width:170}}/>
              {can("exportData")&&<button style={btn("var(--text-secondary)")} onClick={exportInventoryCSV}>⬇ Export CSV</button>}
              {can("addMat")&&<button style={btn("var(--accent)")} onClick={()=>openModal("addMat")}>＋ Add Material</button>}
              {can("stockIn")&&<button style={btn("var(--success)")} onClick={()=>openModal("txnIn")}>📥 Stock In</button>}
              {can("stockOut")&&<button style={btn("var(--danger)")} onClick={()=>openModal("txnOut")}>📤 Stock Out</button>}
            </SectionBar>
            <Card style={{overflow:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                <thead><tr>
                  <Th c="ID"/><Th c="Material"/><Th c="Category"/><Th c="Supplier"/><Th c="Unit"/>
                  <Th c="Stock" right/><Th c="Threshold" right/><Th c="Status"/>
                  {data("viewCosts")&&<><Th c="Unit Cost" right/><Th c="Stock Value" right/></>}
                  <Th c="Actions"/>
                </tr></thead>
                <tbody>
                  {filteredMats.map((m,i)=>{const s=stockStatus(m.stock,m.threshold); return(
                    <tr key={m.id} style={{background:i%2===0?"var(--panel-2)":"var(--panel)"}}>
                      <Td c={m.id} color="#3b82f6" bold style={{fontSize:11}}/>
                      <Td c={m.name} bold/>
                      <Td c={m.category} color="var(--text-muted)"/>
                      <Td c={m.supplier} color="var(--text-muted)"/>
                      <Td c={m.unit} color="var(--text-muted)"/>
                      <td style={{padding:"9px 13px",textAlign:"right",fontSize:12}}>
                        <div style={{fontWeight:700,color:s.color}}>{fmtN(m.stock)}</div>
                        <div style={{marginTop:4,marginLeft:"auto",width:64,height:4,background:"var(--border)",borderRadius:3,overflow:"hidden"}}>
                          <div style={{height:"100%",width:`${Math.max(5,Math.min(100,(m.threshold>0?(m.stock/(m.threshold*2)):1)*100))}%`,background:s.color,borderRadius:3}}/>
                        </div>
                      </td>
                      <td style={{padding:"9px 13px",textAlign:"right",fontSize:12}}>
                        <span style={{display:"flex",alignItems:"center",justifyContent:"flex-end",gap:5}}>
                          {fmtN(m.threshold)}
                          {can("editThresh")&&<span onClick={()=>openModal("editThreshold",m)} style={{cursor:"pointer",color:"var(--text-muted)",fontSize:10}}>✏</span>}
                        </span>
                      </td>
                      <td style={{padding:"9px 13px"}}><Badge label={`● ${s.label}`} color={s.color} bg={s.bg}/></td>
                      {data("viewCosts")&&<><Td c={fmtC(m.unitCost)} right/><Td c={fmtC(m.stock*m.unitCost)} right bold/></>}
                      <td style={{padding:"9px 13px"}}>
                        <div style={{display:"flex",gap:5}}>
                          {can("editMat")&&<button style={{...btn("var(--accent-soft)","var(--accent)","4px 9px"),fontSize:11}} onClick={()=>openModal("editMat",m)}>Edit</button>}
                          {can("delMat")&&<button style={{...btn("var(--danger-bg)","var(--danger)","4px 9px"),fontSize:11}} onClick={()=>deleteMat(m.id)}>Del</button>}
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
            <SectionBar title={<>Transactions {!data("viewAllTxn")&&<span style={{fontSize:12,color:"var(--text-muted)",fontWeight:400}}>(your entries only)</span>}</>}>
              {can("exportData")&&<button style={btn("var(--text-secondary)")} onClick={exportTxnCSV}>⬇ Export CSV</button>}
              {can("stockIn")&&<button style={btn("var(--success)")} onClick={()=>openModal("txnIn")}>📥 Stock In</button>}
              {can("stockOut")&&<button style={btn("var(--danger)")} onClick={()=>openModal("txnOut")}>📤 Stock Out</button>}
            </SectionBar>
            <Card style={{overflow:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                <thead><tr>
                  <Th c="TXN ID"/><Th c="Date"/><Th c="Material"/><Th c="Type"/><Th c="Qty" right/>
                  {data("viewCosts")&&<><Th c="Unit Cost" right/><Th c="Total" right/></>}
                  <Th c="Reference"/><Th c="Source"/><Th c="By"/>
                </tr></thead>
                <tbody>
                  {visibleTxn.map((tx,i)=>{
                    const m=mats.find(x=>x.id===tx.materialId);
                    const u=users.find(x=>x.id===tx.userId);
                    return(
                      <tr key={tx.id} style={{background:i%2===0?"var(--panel-2)":"var(--panel)"}}>
                        <Td c={tx.id} color="#6366f1" style={{fontSize:11}}/>
                        <Td c={tx.date} color="var(--text-muted)"/>
                        <Td c={m?.name||tx.materialId} bold/>
                        <td style={{padding:"9px 13px"}}><Badge label={tx.type} color={tx.type==="IN"?"var(--success)":"var(--danger)"} bg={tx.type==="IN"?"#d1fae5":"var(--danger-bg)"}/></td>
                        <Td c={`${fmtN(tx.qty)} ${m?.unit||""}`} right bold/>
                        {data("viewCosts")&&<>
                          <Td c={fmtC(m?.unitCost||0)} right/>
                          <td style={{padding:"9px 13px",textAlign:"right",fontWeight:700,color:tx.type==="IN"?"#10b981":"#f43f5e",fontSize:12}}>{fmtC((m?.unitCost||0)*tx.qty)}</td>
                        </>}
                        <Td c={tx.ref} color="var(--text-muted)"/>
                        <td style={{padding:"9px 13px"}}><Badge label={tx.source||"manual"} color={tx.source==="po"?"#3b82f6":tx.source==="run"?"#8b5cf6":"var(--text-muted)"} bg={tx.source==="po"?"#eff6ff":tx.source==="run"?"#f5f3ff":"var(--panel-2)"}/></td>
                        <td style={{padding:"9px 13px"}}><span style={{background:ROLE_COLORS[u?.role]+"18",color:ROLE_COLORS[u?.role]||"var(--text-muted)",borderRadius:6,padding:"2px 8px",fontSize:11,fontWeight:700}}>{u?.name||"—"}</span></td>
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
              {["All","Pending","Received","Closed"].map(f=><button key={f} style={{...btn(poFilter===f?"#0f172a":"var(--border)",poFilter===f?"#fff":"var(--text-secondary)")}} onClick={()=>setPoFilter(f)}>{f}</button>)}
              {can("createPO")&&<button style={btn("var(--accent)")} onClick={()=>openModal("addPO")}>＋ Create PO</button>}
            </SectionBar>
            <Card style={{overflow:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                <thead><tr>
                  <Th c="PO ID"/><Th c="Date"/><Th c="Supplier"/><Th c="Material"/><Th c="Qty" right/>
                  {data("viewCosts")&&<Th c="PO Value" right/>}
                  <Th c="Expected"/><Th c="Status"/><Th c="Actions"/>
                </tr></thead>
                <tbody>
                  {pos.filter(p=>poFilter==="All"||p.status===poFilter).map((po,i)=>{
                    const mat=mats.find(m=>m.id===po.materialId);
                    const sup=sups.find(s=>s.id===po.supplierId);
                    const c=PO_COLORS[po.status]||"var(--text-muted)";
                    return(
                      <tr key={po.id} style={{background:i%2===0?"var(--panel-2)":"var(--panel)"}}>
                        <Td c={po.id} color="#6366f1" bold style={{fontSize:11}}/>
                        <Td c={po.date} color="var(--text-muted)"/>
                        <Td c={sup?.name||po.supplierId}/>
                        <Td c={mat?.name||po.materialId} bold/>
                        <Td c={`${fmtN(po.qty)} ${mat?.unit||""}`} right bold/>
                        {data("viewCosts")&&<Td c={fmtC(po.qty*po.unitCost)} right bold color="#6366f1"/>}
                        <Td c={po.expectedDate} color="var(--text-muted)"/>
                        <td style={{padding:"9px 13px"}}><Badge label={po.status} color={c} bg={c+"18"}/></td>
                        <td style={{padding:"9px 13px"}}>
                          <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                            {can("editPO")&&po.status==="Pending"&&<button style={{...btn("var(--accent-soft)","var(--accent)","4px 9px"),fontSize:11}} onClick={()=>openModal("editPO",po)}>Edit</button>}
                            {can("receivePO")&&po.status==="Pending"&&<button style={{...btn("var(--success-bg)","var(--success)","4px 9px"),fontSize:11}} onClick={()=>receivePO(po)}>✓ Receive</button>}
                            {can("closePO")&&po.status==="Pending"&&<button style={{...btn("var(--danger-bg)","var(--danger)","4px 9px"),fontSize:11}} onClick={()=>closePO(po)}>Close</button>}
                            {po.status!=="Pending"&&<span style={{fontSize:11,color:"var(--text-muted)"}}>{po.receivedDate||po.status}</span>}
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
              {["All","Planned","In Progress","Completed"].map(f=><button key={f} style={{...btn(runFilter===f?"#0f172a":"var(--border)",runFilter===f?"#fff":"var(--text-secondary)")}} onClick={()=>setRunFilter(f)}>{f}</button>)}
              {can("createRun")&&<button style={btn("var(--accent)")} onClick={()=>openModal("addRun")}>＋ New Run</button>}
            </SectionBar>
            <div style={{display:"grid",gap:14}}>
              {runs.filter(r=>runFilter==="All"||r.status===runFilter).map(run=>{
                const c=RUN_COLORS[run.status]||"var(--text-muted)";
                const u=users.find(x=>x.id===run.userId);
                return(
                  <Card key={run.id} style={{padding:18}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12,flexWrap:"wrap",gap:8}}>
                      <div>
                        <div style={{fontWeight:800,fontSize:15,color:"var(--text)"}}>{run.name}</div>
                        <div style={{fontSize:12,color:"var(--text-muted)",marginTop:2}}>{run.date} · {run.ref} · <span style={{color:ROLE_COLORS[u?.role]||"var(--text-muted)"}}>{u?.name||"—"}</span></div>
                        {run.notes&&<div style={{fontSize:11,color:"var(--text-muted)",marginTop:2}}>{run.notes}</div>}
                      </div>
                      <div style={{display:"flex",gap:8,alignItems:"center"}}>
                        <Badge label={run.status} color={c} bg={c+"18"}/>
                        {can("createRun")&&run.status!=="Completed"&&<button style={{...btn("var(--accent-soft)","var(--accent)","5px 11px"),fontSize:11}} onClick={()=>openModal("editRun",run)}>Edit</button>}
                        {can("completeRun")&&run.status!=="Completed"&&<button style={{...btn("var(--success-bg)","var(--success)","5px 11px"),fontSize:11}} onClick={()=>completeRun(run)}>✓ Complete</button>}
                        {can("delRun")&&run.status!=="Completed"&&<button style={{...btn("var(--danger-bg)","var(--danger)","5px 11px"),fontSize:11}} onClick={()=>deleteRun(run.id)}>Del</button>}
                      </div>
                    </div>
                    <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                      {run.items.map((item,idx)=>{
                        const m=mats.find(x=>x.id===item.materialId);
                        const sufficient=m&&m.stock>=item.qty;
                        return(
                          <div key={idx} style={{background:run.status==="Completed"?"var(--success-bg)":sufficient?"var(--panel-2)":"var(--danger-bg)",border:`1px solid ${run.status==="Completed"?"var(--success)":sufficient?"var(--border)":"var(--danger)"}`,borderRadius:8,padding:"6px 12px",fontSize:12}}>
                            <span style={{fontWeight:700}}>{m?.name||item.materialId}</span>
                            <span style={{color:"var(--text-muted)",marginLeft:6}}>{fmtN(item.qty)} {m?.unit}</span>
                            {run.status!=="Completed"&&!sufficient&&<span style={{color:"#ef4444",marginLeft:4,fontWeight:700}}>low</span>}
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
              {can("addSup")&&<button style={btn("var(--accent)")} onClick={()=>openModal("addSup")}>＋ Add Supplier</button>}
            </SectionBar>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(290px,1fr))",gap:14}}>
              {sups.map(s=>(
                <Card key={s.id} style={{padding:18}}>
                  <div style={{display:"flex",alignItems:"flex-start",gap:12,marginBottom:12}}>
                    <div style={{width:40,height:40,background:"#eff6ff",borderRadius:9,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>🏢</div>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:800,fontSize:14,color:"var(--text)"}}>{s.name}</div>
                      <div style={{fontSize:11,color:"var(--text-muted)"}}>{s.id}</div>
                    </div>
                    <Badge label={s.status} color={s.status==="Active"?"var(--success)":"var(--danger)"} bg={s.status==="Active"?"#d1fae5":"var(--danger-bg)"}/>
                  </div>
                  <div style={{fontSize:12,display:"grid",gap:5,marginBottom:12}}>
                    {data("viewContacts")?(
                      <>
                        <div><span style={{color:"var(--text-muted)"}}>Contact: </span><b>{s.contact}</b></div>
                        <div><span style={{color:"var(--text-muted)"}}>Email: </span><a href={`mailto:${s.email}`} style={{color:"#3b82f6",textDecoration:"none"}}>{s.email}</a></div>
                        <div><span style={{color:"var(--text-muted)"}}>Phone: </span>{s.phone}</div>
                      </>
                    ):<div style={{color:"var(--text-muted)",fontStyle:"italic",fontSize:11}}>Contact details restricted</div>}
                    <div><span style={{color:"var(--text-muted)"}}>Lead Time: </span><b style={{color:"#6366f1"}}>{s.lead} days</b></div>
                    <div><span style={{color:"var(--text-muted)"}}>Materials: </span><span style={{color:"var(--text-secondary)"}}>{s.materials}</span></div>
                  </div>
                  {(can("editSup")||can("delSup"))&&(
                    <div style={{display:"flex",gap:8}}>
                      {can("editSup")&&<button style={{...btn("var(--accent-soft)","var(--accent)"),flex:1}} onClick={()=>openModal("editSup",s)}>Edit</button>}
                      {can("delSup")&&<button style={{...btn("var(--danger-bg)","var(--danger)"),flex:1}} onClick={()=>deleteSup(s.id)}>Delete</button>}
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
            <h2 style={{margin:"0 0 16px",fontSize:20,fontWeight:800,color:"var(--text)"}}>Cost & Analytics</h2>

            {/* 4 Metric Cards */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:14,marginBottom:20}}>
              {[
                {label:"Total Inventory Value",val:fmtC(stockVal),icon:"💎",color:"#6366f1",bg:"var(--panel)",border:"#6366f133",change:null},
                {label:"Today's Stock In",val:fmtC(todayCostIn),icon:"📥",color:"#10b981",bg:"var(--panel)",border:"#10b98133",change:todayCostIn>0?"+":null},
                {label:"Today's Stock Out",val:fmtC(todayCostOut),icon:"📤",color:"#f43f5e",bg:"var(--panel)",border:"#f43f5e33",change:todayCostOut>0?"-":null},
                {label:"Total Cost In (All Time)",val:fmtC(totalCostIn),icon:"📈",color:"#3b82f6",bg:"var(--panel)",border:"#3b82f633",change:null},
              ].map(({label,val,icon,color,bg,border,change})=>(
                <div key={label} style={{background:bg,borderRadius:16,padding:"22px 24px",border:`1px solid ${border}`,boxShadow:"0 2px 8px rgba(0,0,0,0.06)"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                    <div style={{fontSize:28}}>{icon}</div>
                    {change&&<span style={{background:change==="+"?"var(--success-bg)":"#ffe4e6",color:change==="+"?"#16a34a":"#dc2626",borderRadius:20,padding:"2px 10px",fontSize:11,fontWeight:700}}>{change} Today</span>}
                  </div>
                  <div style={{fontSize:22,fontWeight:900,color,marginBottom:4}}>{val}</div>
                  <div style={{fontSize:12,color:"var(--text-muted)"}}>{label}</div>
                </div>
              ))}
            </div>

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:20}}>
              {/* Donut Chart — Category Breakdown */}
              <Card style={{padding:20}}>
                <div style={{fontWeight:700,fontSize:14,color:"var(--text)",marginBottom:16}}>🍩 Value by Category</div>
                {categoryData.length>0?(
                  <div style={{display:"flex",alignItems:"center",gap:20}}>
                    <ResponsiveContainer width={160} height={160}>
                      <PieChart>
                        <Pie data={categoryData} cx="50%" cy="50%" innerRadius={45} outerRadius={72} dataKey="value" paddingAngle={3}>
                          {categoryData.map((entry,i)=>(
                            <Cell key={i} fill={["#6366f1","#3b82f6","#10b981","#f59e0b","#f43f5e","#8b5cf6","#06b6d4"][i%7]}/>
                          ))}
                        </Pie>
                        <Tooltip formatter={v=>fmtC(v)}/>
                      </PieChart>
                    </ResponsiveContainer>
                    <div style={{flex:1,display:"grid",gap:7}}>
                      {categoryData.map((c,i)=>(
                        <div key={c.name} style={{display:"flex",alignItems:"center",gap:8,fontSize:12}}>
                          <div style={{width:10,height:10,borderRadius:"50%",background:["#6366f1","#3b82f6","#10b981","#f59e0b","#f43f5e","#8b5cf6","#06b6d4"][i%7],flexShrink:0}}/>
                          <span style={{flex:1,color:"var(--text-secondary)"}}>{c.name}</span>
                          <span style={{fontWeight:700,color:"var(--text)"}}>{fmtC(c.value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ):<EmptyState icon="📊" msg="No data yet"/>}
              </Card>

              {/* Top 5 Most Valuable Materials */}
              <Card style={{padding:20}}>
                <div style={{fontWeight:700,fontSize:14,color:"var(--text)",marginBottom:16}}>🏆 Top 5 Most Valuable Stock</div>
                <div style={{display:"grid",gap:10}}>
                  {top5Mats.map((m,i)=>{
                    const val = m.stock*m.unitCost;
                    const maxVal = top5Mats[0].stock*top5Mats[0].unitCost;
                    const pct = maxVal>0 ? (val/maxVal)*100 : 0;
                    return(
                      <div key={m.id}>
                        <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:3}}>
                          <span style={{fontWeight:700,color:"var(--text)"}}>{i+1}. {m.name}</span>
                          <span style={{fontWeight:700,color:"#6366f1"}}>{fmtC(val)}</span>
                        </div>
                        <div style={{height:6,background:"var(--panel-2)",borderRadius:3,overflow:"hidden"}}>
                          <div style={{height:"100%",width:`${pct}%`,background:"linear-gradient(90deg,#6366f1,#38bdf8)",borderRadius:3,transition:"width 0.6s"}}/>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>

            {/* 30-Day Inventory Value Trend */}
            <Card style={{padding:20,marginBottom:20}}>
              <div style={{fontWeight:700,fontSize:14,color:"var(--text)",marginBottom:16}}>30-Day Inventory Value Trend</div>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={trendData} margin={{top:5,right:10,left:10,bottom:0}}>
                  <defs>
                    <linearGradient id="stockGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--panel-2)"/>
                  <XAxis dataKey="label" tick={{fontSize:10}} stroke="var(--text-muted)" interval={4}/>
                  <YAxis tick={{fontSize:10}} stroke="var(--text-muted)" tickFormatter={v=>`₹${(v/1000).toFixed(0)}k`}/>
                  <Tooltip formatter={v=>[fmtC(v),"Stock Value"]} labelStyle={{fontWeight:700}}/>
                  <Area type="monotone" dataKey="stockValue" stroke="#6366f1" strokeWidth={2} fill="url(#stockGrad)"/>
                </AreaChart>
              </ResponsiveContainer>
            </Card>

            {/* Material Cost Breakdown Table */}
            <Card style={{overflow:"auto"}}>
              <div style={{padding:"12px 16px",borderBottom:"1px solid #f1f5f9",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span style={{fontWeight:700,fontSize:14,color:"var(--text)"}}>Material Cost Breakdown</span>
                {can("exportData")&&<button style={{...btn("var(--text-secondary)","#fff","5px 12px"),fontSize:11}} onClick={exportInventoryCSV}>⬇ Export CSV</button>}
              </div>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                <thead><tr>
                  <Th c="Material"/><Th c="Category"/><Th c="Unit Cost" right/><Th c="Stock" right/><Th c="Stock Value" right/><Th c="Cost In" right/><Th c="Cost Out" right/><Th c="Net" right/>
                </tr></thead>
                <tbody>
                  {mats.map((m,i)=>{
                    const tIn=txns.filter(t=>t.materialId===m.id&&t.type==="IN").reduce((s,t)=>s+t.qty,0);
                    const tOut=txns.filter(t=>t.materialId===m.id&&t.type==="OUT").reduce((s,t)=>s+t.qty,0);
                    const net=tIn*m.unitCost-tOut*m.unitCost;
                    return(
                      <tr key={m.id} style={{background:i%2===0?"var(--panel-2)":"var(--panel)"}}>
                        <Td c={m.name} bold/>
                        <Td c={m.category} color="var(--text-muted)"/>
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

        {/* ══ FORECASTING ══════════════════════════════════════════════════ */}
        {tab==="Forecasting"&&(
          <div>
            <h2 style={{margin:"0 0 6px",fontSize:20,fontWeight:800,color:"var(--text)"}}>🔮 Demand Forecasting</h2>
            <p style={{margin:"0 0 20px",fontSize:13,color:"var(--text-muted)"}}>Based on your last 30 days of stock-out history. Predictions update automatically as you add transactions.</p>

            {/* Summary Alert Bands */}
            {["critical","warning","watch"].map(level=>{
              const items = forecasts.filter(f=>f.forecast.urgency===level);
              if (!items.length) return null;
              const cfg = {
                critical:{bg:"var(--danger-bg)",border:"var(--danger)",color:"var(--danger)",label:"🚨 Critical — Runs out within 7 days"},
                warning: {bg:"var(--warning-bg)",border:"#fcd34d",color:"#92400e",label:"Warning — Runs out within 14 days"},
                watch:   {bg:"#eff6ff",border:"#93c5fd",color:"#1e40af",label:"👀 Watch — Runs out within 30 days"},
              }[level];
              return(
                <div key={level} style={{background:cfg.bg,border:`1px solid ${cfg.border}`,borderRadius:12,padding:"10px 16px",marginBottom:12}}>
                  <div style={{fontWeight:700,fontSize:13,color:cfg.color,marginBottom:8}}>{cfg.label}</div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                    {items.map(m=>(
                      <div key={m.id} style={{background:"var(--panel)",borderRadius:8,padding:"6px 12px",border:`1px solid ${cfg.border}`,fontSize:12}}>
                        <span style={{fontWeight:700}}>{m.name}</span>
                        <span style={{color:"var(--text-muted)",marginLeft:6}}>{m.forecast.daysLeft} days left</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Forecast Table */}
            <Card style={{overflow:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                <thead><tr>
                  <Th c="Material"/>
                  <Th c="Current Stock" right/>
                  <Th c="Avg Daily Usage" right/>
                  <Th c="Days Left" right/>
                  <Th c="Reorder By" right/>
                  <Th c="Suggested Qty" right/>
                  <Th c="Status"/>
                </tr></thead>
                <tbody>
                  {forecasts.map((m,i)=>{
                    const f = m.forecast;
                    const urgCfg = {
                      critical:{color:"#ef4444",bg:"var(--danger-bg)",label:"🚨 Critical"},
                      warning: {color:"#f59e0b",bg:"var(--warning-bg)",label:"Warning"},
                      watch:   {color:"#3b82f6",bg:"#eff6ff",label:"👀 Watch"},
                      ok:      {color:"#10b981",bg:"var(--success-bg)",label:"OK"},
                      "no-data":{color:"var(--text-muted)",bg:"var(--panel-2)",label:"— No data"},
                    }[f.urgency];
                    return(
                      <tr key={m.id} style={{background:i%2===0?"var(--panel-2)":"var(--panel)"}}>
                        <td style={{padding:"10px 13px"}}>
                          <div style={{fontWeight:700,fontSize:12}}>{m.name}</div>
                          <div style={{fontSize:11,color:"var(--text-muted)"}}>{m.id} · {m.unit}</div>
                        </td>
                        <Td c={`${fmtN(m.stock)} ${m.unit}`} right bold/>
                        <Td c={f.avgDailyUsage>0?`${f.avgDailyUsage} ${m.unit}/day`:"—"} right color="var(--text-muted)"/>
                        <Td c={f.daysLeft!==null?`${f.daysLeft} days`:"—"} right bold color={urgCfg.color}/>
                        <Td c={f.reorderDate||"—"} right color="var(--text-secondary)"/>
                        <Td c={f.reorderQty?`${f.reorderQty} ${m.unit}`:"—"} right bold color="#6366f1"/>
                        <td style={{padding:"10px 13px"}}>
                          <Badge label={urgCfg.label} color={urgCfg.color} bg={urgCfg.bg}/>
                        </td>
                      </tr>
                    );
                  })}
                  {forecasts.length===0&&<tr><td colSpan={7}><EmptyState icon="🔮" msg="Add materials and transactions to see forecasts"/></td></tr>}
                </tbody>
              </table>
            </Card>
          </div>
        )}

        {/* ══ AUDIT LOG ════════════════════════════════════════════════════ */}
        {tab==="Audit Log"&&(
          <div>
            <SectionBar title="Audit Log">
              <span style={{fontSize:12,color:"var(--text-muted)",fontWeight:400,alignSelf:"center"}}>Complete history of all actions</span>
              {can("exportData")&&<button style={btn("var(--text-secondary)")} onClick={()=>{ const csv=toCSV(audit,[{label:"ID",key:"id"},{label:"Timestamp",key:"ts"},{label:"User",key:"userName"},{label:"Role",key:"userRole"},{label:"Action",key:"action"},{label:"Entity",key:"entity"},{label:"Details",key:"details"}]); downloadFile(csv,`audit_${today()}.csv`); toast$("Audit log exported ✓"); }}>⬇ Export</button>}
            </SectionBar>
            <Card style={{overflow:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                <thead><tr>
                  <Th c="Timestamp"/><Th c="User"/><Th c="Action"/><Th c="Entity"/><Th c="Details"/>
                </tr></thead>
                <tbody>
                  {[...audit].sort((a,b)=>b.ts.localeCompare(a.ts)).map((entry,i)=>(
                    <tr key={entry.id} style={{background:i%2===0?"var(--panel-2)":"var(--panel)"}}>
                      <Td c={fmtTs(entry.ts)} color="var(--text-muted)" style={{fontSize:11,whiteSpace:"nowrap"}}/>
                      <td style={{padding:"9px 13px"}}>
                        <div style={{fontWeight:700,fontSize:12}}>{entry.userName}</div>
                        <RoleBadge role={entry.userRole||"Viewer"}/>
                      </td>
                      <td style={{padding:"9px 13px"}}>
                        <span style={{background:"var(--panel-2)",borderRadius:6,padding:"3px 8px",fontSize:11,fontWeight:700,color:"var(--text-secondary)",fontFamily:"monospace"}}>{entry.action}</span>
                      </td>
                      <Td c={entry.entity} color="var(--text-muted)"/>
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
            <h2 style={{margin:"0 0 20px",fontSize:20,fontWeight:800,color:"var(--text)"}}>Admin Panel</h2>

            {/* User Management (Supabase profiles) */}
            <Card style={{marginBottom:20}}>
              <div style={{padding:"14px 18px",borderBottom:"1px solid var(--border)"}}>
                <div style={{fontWeight:600,fontSize:14,color:"var(--text)"}}>User management</div>
                <div style={{fontSize:12,color:"var(--text-muted)",marginTop:3}}>People sign up themselves. Assign a role to grant access — set to "Pending" to revoke it.</div>
              </div>
              <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                <thead><tr style={{background:"var(--panel-2)"}}>
                  <Th c="Name"/><Th c="Email"/><Th c="Phone"/><Th c="Role"/><Th c="Actions"/>
                </tr></thead>
                <tbody>
                  {profileUsers.length===0&&<tr><td colSpan={5} style={{padding:"16px 18px",color:"var(--text-muted)"}}>No users yet.</td></tr>}
                  {profileUsers.map(u=>{ const self=u.id===session.user.id; const pending=u.role==="Pending"; return (
                    <tr key={u.id} style={{background:pending?"var(--warning-bg)":"transparent",borderTop:"1px solid var(--border)"}}>
                      <td style={{padding:"11px 14px",fontWeight:600,color:"var(--text)"}}>{u.name||"—"} {self&&<span style={{fontSize:10,color:"var(--text-muted)",fontWeight:400}}>(you)</span>}</td>
                      <td style={{padding:"11px 14px",color:"var(--text-secondary)"}}>{u.email||"—"}</td>
                      <td style={{padding:"11px 14px",color:"var(--text-secondary)"}}>{u.phone||"—"}</td>
                      <td style={{padding:"11px 14px"}}>
                        <select value={u.role} disabled={self} onChange={e=>changeUserRole(u.id,e.target.value)} style={{...inp,width:140,height:34,marginBottom:0,opacity:self?0.6:1,cursor:self?"not-allowed":"pointer"}}>
                          <option value="Pending">Pending</option><option value="Viewer">Viewer</option><option value="Warehouse">Warehouse</option><option value="Manager">Manager</option><option value="Admin">Admin</option>
                        </select>
                      </td>
                      <td style={{padding:"11px 14px"}}>{!self&&<button onClick={()=>removeProfile(u.id)} style={{...btn("var(--danger-bg)","var(--danger)","5px 12px"),fontSize:11}}>Remove</button>}</td>
                    </tr>
                  );})}
                </tbody>
              </table>
              </div>
            </Card>

            {/* Permissions */}
            <div style={{fontWeight:800,fontSize:14,color:"var(--text)",marginBottom:12}}>Role Permissions</div>
            <div style={{display:"grid",gap:14,marginBottom:20}}>
              {["Manager","Warehouse","Viewer"].map(role=>{
                const rp=perms[role]??DEFAULT_PERMS[role];
                return(
                  <Card key={role}>
                    <div style={{padding:"12px 18px",borderBottom:"1px solid #f1f5f9",display:"flex",alignItems:"center",gap:10}}>
                      <RoleBadge role={role}/>
                      <span style={{fontSize:12,color:"var(--text-muted)"}}>Manage what this role can access</span>
                    </div>
                    <div style={{padding:"16px 18px",display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(250px,1fr))",gap:20}}>
                      <div>
                        <div style={{fontWeight:700,fontSize:12,color:"var(--text-secondary)",marginBottom:10,paddingBottom:6,borderBottom:"1px solid #f1f5f9"}}>📑 Visible Tabs</div>
                        {Object.entries(rp.tabs).filter(([k])=>k!=="admin").map(([key,val])=>(
                          <div key={key} style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                            <span style={{fontSize:12,color:"var(--text-secondary)",textTransform:"capitalize"}}>{key==="costs"?"Cost & Analytics":key==="purchaseOrders"?"Purchase Orders":key==="productionRuns"?"Production Runs":key==="auditLog"?"Audit Log":key}</span>
                            <Toggle on={val} onChange={()=>togglePerm(role,"tabs",key)}/>
                          </div>
                        ))}
                      </div>
                      <div>
                        <div style={{fontWeight:700,fontSize:12,color:"var(--text-secondary)",marginBottom:10,paddingBottom:6,borderBottom:"1px solid #f1f5f9"}}>⚡ Actions Allowed</div>
                        {[["stockIn","Stock In"],["stockOut","Stock Out"],["addMat","Add Material"],["editMat","Edit Material"],["delMat","Delete Material"],["editThresh","Edit Threshold"],["createPO","Create PO"],["receivePO","Receive PO"],["createRun","Create Production Run"],["completeRun","Complete Run"],["exportData","Export CSV"]].map(([key,label])=>(
                          <div key={key} style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                            <span style={{fontSize:12,color:"var(--text-secondary)"}}>{label}</span>
                            <Toggle on={rp.actions[key]} onChange={()=>togglePerm(role,"actions",key)}/>
                          </div>
                        ))}
                      </div>
                      <div>
                        <div style={{fontWeight:700,fontSize:12,color:"var(--text-secondary)",marginBottom:10,paddingBottom:6,borderBottom:"1px solid #f1f5f9"}}>Data Visibility</div>
                        {[["viewCosts","Unit Costs & Prices"],["viewContacts","Supplier Contacts"],["viewAllTxn","All Transactions (not just own)"],["viewAuditLog","Audit Log Access"]].map(([key,label])=>(
                          <div key={key} style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                            <span style={{fontSize:12,color:"var(--text-secondary)"}}>{label}</span>
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
                <div style={{fontWeight:800,fontSize:14,color:"var(--text)",marginBottom:4}}>💾 Backup & Restore</div>
                <div style={{fontSize:12,color:"var(--text-muted)",marginBottom:16}}>Download a full backup of all data, or restore from a previous backup file.</div>
                <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
                  <button style={btn("var(--accent)")} onClick={handleBackup}>⬇ Download Backup (.json)</button>
                  <button style={btn("var(--warning)")} onClick={()=>restoreRef.current?.click()}>⬆ Restore from Backup</button>
                  <input ref={restoreRef} type="file" accept=".json" style={{display:"none"}} onChange={handleRestore}/>
                </div>
                <div style={{marginTop:12,fontSize:11,color:"var(--text-muted)"}}>Restoring a backup will replace ALL current data. Make sure to download a backup first.</div>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* ══ MODALS ════════════════════════════════════════════════════════════ */}
      {modal&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:300,padding:16}} onClick={e=>e.target===e.currentTarget&&closeModal()}>
          <div style={{background:"var(--panel)",borderRadius:14,padding:26,width:"100%",maxWidth:480,boxShadow:"0 25px 60px rgba(0,0,0,0.3)",maxHeight:"92vh",overflowY:"auto"}}>

            {/* Stock In/Out */}
            {(modal==="txnIn"||modal==="txnOut")&&<>
              <div style={{fontWeight:800,fontSize:17,marginBottom:18,color:"var(--text)"}}>{modal==="txnIn"?"📥 Record Stock In":"📤 Record Stock Out"}</div>
              <div style={{display:"grid",gap:12}}>
                <div><Lbl c="Material *"/>
                  <select value={form.materialId||""} onChange={e=>fset("materialId",e.target.value)} style={inp}>
                    <option value="">Select material…</option>
                    {mats.map(m=><option key={m.id} value={m.id}>{m.id} — {m.name}</option>)}
                  </select>
                </div>
                <div><Lbl c="Quantity *"/>
                  <input type="number" min={1} placeholder="Enter quantity" value={form.qty||""} onChange={e=>fset("qty",e.target.value)} style={inp}/>
                  {form.materialId&&<div style={{fontSize:11,color:"var(--text-muted)",marginTop:3}}>Current stock: {fmtN(mats.find(m=>m.id===form.materialId)?.stock)} {mats.find(m=>m.id===form.materialId)?.unit}</div>}
                </div>
                <div><Lbl c="Reference / PO Number"/><input placeholder="e.g. PO-003, Production note…" value={form.ref||""} onChange={e=>fset("ref",e.target.value)} style={inp}/></div>
                <div style={{display:"flex",gap:10,marginTop:4}}>
                  <button style={{...btn(modal==="txnIn"?"#10b981":"#f43f5e"),flex:1}} onClick={()=>submitTxn(modal==="txnIn"?"in":"out")}>Confirm</button>
                  <button style={btn("var(--panel-2)","var(--text-secondary)")} onClick={closeModal}>Cancel</button>
                </div>
              </div>
            </>}

            {/* Add/Edit Material */}
            {(modal==="addMat"||modal==="editMat")&&<>
              <div style={{fontWeight:800,fontSize:17,marginBottom:18,color:"var(--text)"}}>{modal==="addMat"?"➕ Add Material":"Edit Material"}</div>
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
                  <button style={{...btn("var(--accent)"),flex:1}} onClick={()=>submitMat(modal==="editMat")}>{modal==="addMat"?"Add Material":"Save Changes"}</button>
                  <button style={btn("var(--panel-2)","var(--text-secondary)")} onClick={closeModal}>Cancel</button>
                </div>
              </div>
            </>}

            {/* Edit Threshold */}
            {modal==="editThreshold"&&<>
              <div style={{fontWeight:800,fontSize:17,marginBottom:6,color:"var(--text)"}}>Edit Low Stock Threshold</div>
              <div style={{fontSize:12,color:"var(--text-muted)",marginBottom:14}}>{target?.name}</div>
              <Lbl c={`Threshold (${target?.unit})`}/>
              <input type="number" min={0} value={form.threshold||""} onChange={e=>fset("threshold",e.target.value)} style={{...inp,marginBottom:14}}/>
              <div style={{display:"flex",gap:10}}>
                <button style={{...btn("var(--warning)"),flex:1}} onClick={submitThreshold}>Update</button>
                <button style={btn("var(--panel-2)","var(--text-secondary)")} onClick={closeModal}>Cancel</button>
              </div>
            </>}

            {/* Add/Edit Supplier */}
            {(modal==="addSup"||modal==="editSup")&&<>
              <div style={{fontWeight:800,fontSize:17,marginBottom:18,color:"var(--text)"}}>{modal==="addSup"?"➕ Add Supplier":"Edit Supplier"}</div>
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
                  <button style={{...btn("var(--accent)"),flex:1}} onClick={()=>submitSup(modal==="editSup")}>{modal==="addSup"?"Add Supplier":"Save Changes"}</button>
                  <button style={btn("var(--panel-2)","var(--text-secondary)")} onClick={closeModal}>Cancel</button>
                </div>
              </div>
            </>}

            {/* Add/Edit PO */}
            {(modal==="addPO"||modal==="editPO")&&<>
              <div style={{fontWeight:800,fontSize:17,marginBottom:18,color:"var(--text)"}}>{modal==="addPO"?"Create Purchase Order":"Edit PO"}</div>
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
                {form.qty&&form.unitCost&&<div style={{background:"var(--success-bg)",borderRadius:8,padding:"10px 14px",fontSize:12,color:"var(--success)",fontWeight:700}}>
                  PO Total: {fmtC(parseFloat(form.qty||0)*parseFloat(form.unitCost||0))}
                </div>}
                <div style={{display:"flex",gap:10,marginTop:4}}>
                  <button style={{...btn("var(--accent)"),flex:1}} onClick={()=>submitPO(modal==="editPO")}>{modal==="addPO"?"Create PO":"Save Changes"}</button>
                  <button style={btn("var(--panel-2)","var(--text-secondary)")} onClick={closeModal}>Cancel</button>
                </div>
              </div>
            </>}

            {/* Add/Edit Production Run */}
            {(modal==="addRun"||modal==="editRun")&&<>
              <div style={{fontWeight:800,fontSize:17,marginBottom:18,color:"var(--text)"}}>{modal==="addRun"?"New Production Run":"Edit Run"}</div>
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
                    <button style={{...btn("var(--accent)","#fff","4px 10px"),fontSize:11}} onClick={()=>fset("items",[...(form.items||[]),{materialId:"",qty:""}])}>＋ Add</button>
                  </div>
                  {(form.items||[]).map((item,idx)=>(
                    <div key={idx} style={{display:"grid",gridTemplateColumns:"1fr 100px 30px",gap:8,marginBottom:8,alignItems:"center"}}>
                      <select value={item.materialId||""} onChange={e=>{ const items=[...(form.items||[])]; items[idx]={...items[idx],materialId:e.target.value}; fset("items",items); }} style={{...inp,marginBottom:0}}>
                        <option value="">Select material…</option>
                        {mats.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}
                      </select>
                      <input type="number" min={1} placeholder="Qty" value={item.qty||""} onChange={e=>{ const items=[...(form.items||[])]; items[idx]={...items[idx],qty:e.target.value}; fset("items",items); }} style={{...inp,marginBottom:0}}/>
                      <button onClick={()=>fset("items",(form.items||[]).filter((_,i)=>i!==idx))} style={{background:"var(--danger-bg)",color:"var(--danger)",border:"none",borderRadius:6,cursor:"pointer",padding:"6px",fontWeight:700}}>×</button>
                    </div>
                  ))}
                  {(form.items||[]).length===0&&<div style={{fontSize:12,color:"var(--text-muted)",fontStyle:"italic"}}>No materials added yet</div>}
                </div>
                <div><Lbl c="Notes"/><input placeholder="Optional notes…" value={form.notes||""} onChange={e=>fset("notes",e.target.value)} style={inp}/></div>
                <div style={{display:"flex",gap:10,marginTop:4}}>
                  <button style={{...btn("var(--accent)"),flex:1}} onClick={()=>submitRun(modal==="editRun")}>{modal==="addRun"?"Create Run":"Save Changes"}</button>
                  <button style={btn("var(--panel-2)","var(--text-secondary)")} onClick={closeModal}>Cancel</button>
                </div>
              </div>
            </>}

            {/* Add/Edit User */}
            {(modal==="addUser"||modal==="editUser")&&<>
              <div style={{fontWeight:800,fontSize:17,marginBottom:18,color:"var(--text)"}}>{modal==="addUser"?"➕ Add User":"Edit User"}</div>
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
                  <button style={{...btn("var(--accent)"),flex:1}} onClick={()=>submitUser(modal==="editUser")}>{modal==="addUser"?"Create User":"Save Changes"}</button>
                  <button style={btn("var(--panel-2)","var(--text-secondary)")} onClick={closeModal}>Cancel</button>
                </div>
              </div>
            </>}

          </div>
        </div>
      )}
    </div>
  );
}