// ─── Helpers ──────────────────────────────────────────────────────────────────
export const fmtN  = (n) => (n??0).toLocaleString("en-IN",{maximumFractionDigits:2});
export let CURRENCY = "₹";
export const setCurrency = (s) => { CURRENCY = s || "₹"; };
export const fmtC  = (n) => CURRENCY+(n??0).toLocaleString("en-IN",{minimumFractionDigits:2,maximumFractionDigits:2});
export const uid   = () => Math.random().toString(36).slice(2,9).toUpperCase();
export const now   = () => new Date().toISOString();
export const today = () => new Date().toISOString().slice(0,10);
export const fmtTs = (ts) => { const d=new Date(ts); return d.toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"})+" "+d.toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"}); };

export function stockStatus(stock, thresh) {
  if (stock<=0)      return { label:"Out of Stock", color:"#ef4444", bg:"#fef2f2" };
  if (stock<=thresh) return { label:"Low Stock",    color:"#f59e0b", bg:"#fffbeb" };
  return                    { label:"OK",           color:"#10b981", bg:"#f0fdf4" };
}

export function getMonthlyData(transactions, materials) {
  const map = {};
  transactions.forEach((tx) => {
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

// ─── Forecasting ──────────────────────────────────────────────────────────────
export function getForecast(mat, txns, suppliers) {
  const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate()-30);
  const recentOuts = txns.filter(t=>t.materialId===mat.id && t.type==="OUT" && new Date(t.date)>=thirtyDaysAgo);
  const totalOut = recentOuts.reduce((s,t)=>s+t.qty, 0);
  const avgDailyUsage = totalOut / 30;
  const daysLeft = avgDailyUsage > 0 ? Math.floor(mat.stock / avgDailyUsage) : null;
  const sup = suppliers.find(s=>s.name===mat.supplier);
  const leadTime = sup?.lead || 7;
  const reorderDate = daysLeft !== null ? new Date(Date.now() + Math.max(0, daysLeft - leadTime) * 86400000).toISOString().slice(0,10) : null;
  const reorderQty = avgDailyUsage > 0 ? Math.ceil(avgDailyUsage * (leadTime + 14)) : null;
  const urgency = daysLeft === null ? "no-data" : daysLeft <= 7 ? "critical" : daysLeft <= 14 ? "warning" : daysLeft <= 30 ? "watch" : "ok";
  return { avgDailyUsage: +avgDailyUsage.toFixed(2), daysLeft, reorderDate, reorderQty, leadTime, urgency };
}

export function get30DayValueTrend(txns, mats) {
  const map = {};
  for (let i=29; i>=0; i--) {
    const d = new Date(); d.setDate(d.getDate()-i);
    const key = d.toISOString().slice(0,10);
    map[key] = { date: key, label: d.toLocaleDateString("en-IN",{month:"short",day:"numeric"}), value: 0 };
  }
  txns.forEach(tx => {
    const mat = mats.find(m=>m.id===tx.materialId);
    if (!mat || !map[tx.date]) return;
    const val = mat.unitCost * tx.qty;
    if (tx.type==="IN") map[tx.date].value += val;
    else map[tx.date].value -= val;
  });
  let running = mats.reduce((s,m)=>s+m.stock*m.unitCost, 0);
  const days = Object.values(map).reverse();
  days.forEach(d => { running += d.value; d.stockValue = +running.toFixed(2); });
  return days.reverse().map(d=>({ label: d.label, stockValue: d.stockValue }));
}

export function getCategoryBreakdown(mats) {
  const map = {};
  mats.forEach(m => {
    if (!map[m.category]) map[m.category] = 0;
    map[m.category] += m.stock * m.unitCost;
  });
  return Object.entries(map).map(([name,value])=>({ name, value: +value.toFixed(2) })).sort((a,b)=>b.value-a.value);
}

// ─── Sparkline ────────────────────────────────────────────────────────────────
export function Sparkline({ data, color="#38bdf8", width=80, height=32 }) {
  if (!data || data.length < 2) return null;
  const vals = data.map(d=>d.v);
  const min = Math.min(...vals); const max = Math.max(...vals);
  const range = max - min || 1;
  const pts = vals.map((v,i) => {
    const x = (i/(vals.length-1)) * width;
    const y = height - ((v-min)/range) * (height-4) - 2;
    return `${x},${y}`;
  }).join(" ");
  return <svg width={width} height={height} style={{overflow:"visible"}}>
    <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round"/>
  </svg>;
}
export function downloadFile(content, filename, type = "text/csv") {
  const blob = new Blob([content], { type });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href=url; a.download=filename; a.click();
  URL.revokeObjectURL(url);
}

export function toCSV(rows, cols) {
  const esc = (v) => { v=(v??"").toString(); return /[",\n]/.test(v) ? '"'+v.replace(/"/g,'""')+'"' : v; };
  const header = cols.map(c=>esc(c.label)).join(",");
  const body   = rows.map((r)=>cols.map(c=>esc(r[c.key])).join(",")).join("\n");
  return header+"\n"+body;
}

// Generic table sort. `accessors` maps a column key → a function returning the sortable value.
export function sortRows(rows, sort, accessors) {
  if (!sort || !sort.key) return rows;
  const acc = accessors[sort.key];
  if (!acc) return rows;
  const dir = sort.dir === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => {
    let x = acc(a), y = acc(b);
    if (x == null && y == null) return 0;
    if (x == null) return 1;
    if (y == null) return -1;
    if (typeof x === "number" && typeof y === "number") return (x - y) * dir;
    return String(x).localeCompare(String(y), undefined, { numeric: true }) * dir;
  });
}