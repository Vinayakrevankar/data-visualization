
import * as d3 from 'd3'
export function parseYear(value){ if(value==null) return null; const s=String(value).trim(); const m=/^\d{4}/.exec(s); return m?+m[0]:(isFinite(+s)?+s:null) }
export function decadeOf(y){ if(y==null) return null; return Math.floor(y/10)*10 }
export const catColor=(cats)=>{ const map=new Map(); const pal=d3.schemeTableau10; let i=0; for(const c of cats){ map.set(c, pal[i%pal.length]); i++ } return (cat)=>map.get(cat)||'#999' }
