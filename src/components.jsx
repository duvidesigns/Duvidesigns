import { ROLE_BADGES, ROLE_COLORS } from "./data";

// ─── Styles ───────────────────────────────────────────────────────────────────
export const inp = { width:"100%", padding:"9px 12px", border:"1px solid var(--border)", borderRadius:8, fontSize:13, outline:"none", background:"var(--input-bg)", color:"var(--text)", boxSizing:"border-box" };
export const darkInp = inp;
export const btn = (bg, fg="#fff", pad="8px 16px") => ({ background:bg, color:fg, border:"none", borderRadius:8, padding:pad, fontWeight:600, cursor:"pointer", fontSize:13, flexShrink:0, fontFamily:"inherit", transition:"opacity .15s" });

// ─── Small Components ─────────────────────────────────────────────────────────
export const Lbl  = ({c})  => <label style={{display:"block",fontWeight:500,fontSize:12,color:"var(--text-secondary)",marginBottom:6}}>{c}</label>;
export const Card = ({children,style={}}) => <div style={{background:"var(--panel)",borderRadius:14,border:"1px solid var(--border)",boxShadow:"0 1px 2px rgba(0,0,0,0.05), 0 10px 26px rgba(0,0,0,0.10)",overflow:"hidden",...style}}>{children}</div>;
export const Th   = ({c,right}) => <th style={{padding:"10px 14px",textAlign:right?"right":"left",fontWeight:500,fontSize:11,letterSpacing:"0.03em",textTransform:"uppercase",whiteSpace:"nowrap",color:"var(--text-muted)",background:"var(--panel-2)",borderBottom:"1px solid var(--border)"}}>{c}</th>;
export const Td   = ({c,right,bold,color,style={}}) => <td style={{padding:"10px 14px",textAlign:right?"right":"left",fontWeight:bold?600:400,color:color||"var(--text)",fontSize:13,borderBottom:"1px solid var(--border)",...style}}>{c}</td>;
export function Badge({label,color,bg}) { return <span style={{background:bg,color,borderRadius:6,padding:"3px 9px",fontSize:11,fontWeight:600,whiteSpace:"nowrap"}}>{label}</span>; }
export function RoleBadge({role}) { return <Badge label={role} color={ROLE_COLORS[role]} bg={ROLE_COLORS[role]+"22"}/>; }
export function Toggle({on,onChange}) {
  return <div onClick={onChange} style={{width:38,height:22,borderRadius:11,background:on?"var(--accent)":"var(--border)",cursor:"pointer",position:"relative",transition:"background .2s",flexShrink:0}}>
    <div style={{width:16,height:16,borderRadius:"50%",background:"#fff",position:"absolute",top:3,left:on?19:3,transition:"left .2s",boxShadow:"0 1px 2px rgba(0,0,0,0.2)"}}/>
  </div>;
}
export function SectionBar({title,children}) {
  return <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18,flexWrap:"wrap",gap:10}}>
    <h2 style={{margin:0,fontSize:19,fontWeight:600,color:"var(--text)",letterSpacing:"-0.3px"}}>{title}</h2>
    <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{children}</div>
  </div>;
}
export function EmptyState({icon,msg}) {
  return <div style={{textAlign:"center",padding:"44px 20px",color:"var(--text-muted)"}}>
    <div style={{fontSize:32,marginBottom:8,opacity:.5}}>{icon}</div>
    <div style={{fontSize:13}}>{msg}</div>
  </div>;
}

export function Pager({ page, setPage, total, pageSize = 50 }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (total <= pageSize) return null;
  const b = { background:"var(--panel-2)", border:"1px solid var(--border)", borderRadius:7, padding:"5px 12px", fontSize:12, color:"var(--text)", fontFamily:"inherit" };
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"flex-end", gap:12, padding:"10px 16px" }}>
      <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page<=1} style={{...b, opacity:page<=1?0.4:1, cursor:page<=1?"default":"pointer"}}>‹ Prev</button>
      <span style={{ fontSize:12, color:"var(--text-secondary)" }}>Page {page} of {pages} · {total} total</span>
      <button onClick={()=>setPage(p=>Math.min(pages,p+1))} disabled={page>=pages} style={{...b, opacity:page>=pages?0.4:1, cursor:page>=pages?"default":"pointer"}}>Next ›</button>
    </div>
  );
}