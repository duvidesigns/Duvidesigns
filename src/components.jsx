import { ROLE_BADGES, ROLE_COLORS } from "./data";

// ─── Styles ───────────────────────────────────────────────────────────────────
export const inp = { width:"100%", padding:"8px 11px", border:"1px solid #d1d5db", borderRadius:6, fontSize:13, outline:"none", background:"#f9fafb", boxSizing:"border-box" };
export const darkInp = { ...inp, background:"#0f172a", color:"#f1f5f9", border:"1px solid #334155" };
export const btn = (bg, fg="#fff", pad="8px 16px") => ({ background:bg, color:fg, border:"none", borderRadius:7, padding:pad, fontWeight:700, cursor:"pointer", fontSize:13, flexShrink:0 });

// ─── Small Components ─────────────────────────────────────────────────────────
export const Lbl  = ({c})  => <label style={{display:"block",fontWeight:600,fontSize:12,color:"#374151",marginBottom:5}}>{c}</label>;
export const Card = ({children,style={}}) => <div style={{background:"#fff",borderRadius:12,border:"1px solid #e2e8f0",overflow:"hidden",...style}}>{children}</div>;
export const Th   = ({c,right}) => <th style={{padding:"10px 13px",textAlign:right?"right":"left",fontWeight:700,fontSize:12,whiteSpace:"nowrap",background:"#0f172a",color:"#fff"}}>{c}</th>;
export const Td   = ({c,right,bold,color,style={}}) => <td style={{padding:"9px 13px",textAlign:right?"right":"left",fontWeight:bold?700:400,color:color||"inherit",fontSize:12,...style}}>{c}</td>;
export function Badge({label,color,bg}) { return <span style={{background:bg,color,borderRadius:6,padding:"3px 9px",fontSize:11,fontWeight:700,whiteSpace:"nowrap"}}>{label}</span>; }
export function RoleBadge({role}) { return <Badge label={`${ROLE_BADGES[role]} ${role}`} color={ROLE_COLORS[role]} bg={ROLE_COLORS[role]+"18"}/>; }
export function Toggle({on,onChange}) {
  return <div onClick={onChange} style={{width:36,height:20,borderRadius:10,background:on?"#10b981":"#d1d5db",cursor:"pointer",position:"relative",transition:"all 0.2s",flexShrink:0}}>
    <div style={{width:14,height:14,borderRadius:"50%",background:"#fff",position:"absolute",top:3,left:on?18:3,transition:"left 0.2s"}}/>
  </div>;
}
export function SectionBar({title,children}) {
  return <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,flexWrap:"wrap",gap:10}}>
    <h2 style={{margin:0,fontSize:20,fontWeight:800,color:"#0f172a"}}>{title}</h2>
    <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{children}</div>
  </div>;
}
export function EmptyState({icon,msg}) {
  return <div style={{textAlign:"center",padding:"40px 20px",color:"#94a3b8"}}>
    <div style={{fontSize:36,marginBottom:8}}>{icon}</div>
    <div style={{fontSize:13}}>{msg}</div>
  </div>;
}