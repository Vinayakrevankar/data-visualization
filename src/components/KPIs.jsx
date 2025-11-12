
import React, { useMemo } from 'react'
import * as d3 from 'd3'
export default function KPIs({ data }){
  const { total, span, cats, films, people } = useMemo(()=>{
    const years = Array.from(new Set(data.map(d=>d.YearParsed).filter(Boolean))).sort((a,b)=>a-b)
    const span = years.length? `${years[0]}–${years[years.length-1]}` : '—'
    return {
      total: data.length,
      span,
      cats: new Set(data.map(d=>d.Cat)).size,
      films: new Set(data.map(d=>d.Film)).size,
      people: new Set(data.map(d=>d.Name)).size
    }
  },[data])
  return (<div className="kpis">
    <div className="kpi"><div className="label">Rows</div><div className="value">{d3.format(',d')(total)}</div></div>
    <div className="kpi"><div className="label">Span</div><div className="value">{span}</div></div>
    <div className="kpi"><div className="label">Categories</div><div className="value">{cats}</div></div>
    <div className="kpi"><div className="label">Films</div><div className="value">{films}</div></div>
    <div className="kpi"><div className="label">People</div><div className="value">{people}</div></div>
  </div>)
}
