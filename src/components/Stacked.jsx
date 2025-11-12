
import React, { useEffect, useMemo, useRef, useState } from 'react'
import * as d3 from 'd3'
import { catColor } from '../utils'

export default function Stacked({ data }){
  const svgRef = useRef(null), tipRef = useRef(null)
  const [mode,setMode] = useState('counts')
  const cats = useMemo(()=>Array.from(new Set(data.map(d=>d.Cat))).sort(),[data])
  const color = useMemo(()=>catColor(cats),[cats])
  const allDecs = useMemo(()=>{
    const arr = Array.from(new Set(data.map(d=>d.Decade).filter(v=>v!=null))).sort((a,b)=>a-b)
    return [arr[0]||1900, arr[arr.length-1]||2020]
  },[data])
  const [decRange,setDecRange] = useState(allDecs)

  const decadeRows = useMemo(()=>{
    const filtered = data.filter(d=>d.Decade!=null && d.Decade>=decRange[0] && d.Decade<=decRange[1])
    const roll = d3.rollups(filtered, v=>{
      const byCat = d3.rollups(v, vv=>vv.length, d=>d.Cat)
      const counts = Object.fromEntries(byCat)
      for (const c of cats) if(!counts[c]) counts[c]=0
      const total = d3.sum(Object.values(counts))
      const pct = Object.fromEntries(Object.entries(counts).map(([k,val])=>[k,total?val/total:0]))
      return {counts,pct,total}
    }, d=>d.Decade).map(([dec,vals])=>({decade:+dec, ...vals})).sort((a,b)=>a.decade-b.decade)
    return roll
  },[data,cats,decRange])

  useEffect(()=>{
    const svg=d3.select(svgRef.current), width=860, height=360, m={top:20,right:20,bottom:50,left:60}
    svg.attr('viewBox',`0 0 ${width} ${height}`).attr('width',width).attr('height',height)
    svg.selectAll('*').remove()
    const x=d3.scaleBand().domain(decadeRows.map(d=>d.decade)).range([m.left,width-m.right]).padding(0.2)
    const yMax = d3.max(decadeRows, d=> mode==='counts'? d.total : 1)
    const y=d3.scaleLinear().domain([0,yMax]).range([height-m.bottom,m.top]).nice()
    const keys=cats
    const stack=d3.stack().keys(keys).value((d,key)=> mode==='counts'? d.counts[key] : d.pct[key])
    const series=stack(decadeRows)
    const fmt = mode==='counts'? d3.format(',d') : d3.format('.0%')
    svg.append('g').attr('transform',`translate(0,${height-m.bottom})`).call(d3.axisBottom(x).tickFormat(d=>`${d}s`)).selectAll('text').style('fill','#cdd7ea')
    svg.append('g').attr('transform',`translate(${m.left},0)`).call(d3.axisLeft(y).ticks(6).tickFormat(fmt)).selectAll('text').style('fill','#cdd7ea')
    
    // Axis labels
    svg.append('text').attr('x',width/2).attr('y',height-10).attr('fill','#9fb0c9').attr('font-size',12).attr('text-anchor','middle')
      .text('Decade')
    svg.append('text').attr('x',15).attr('y',height/2).attr('fill','#9fb0c9').attr('font-size',12).attr('text-anchor','middle')
      .attr('transform',`rotate(-90, 15, ${height/2})`)
      .text(mode==='counts' ? 'Number of Nominations' : 'Percentage Share')
    
    const tooltip=d3.select(tipRef.current)
    const layer=svg.append('g').selectAll('g').data(series).join('g').attr('fill',d=>color(d.key))
    layer.selectAll('rect').data(d=>d.map(v=>Object.assign({},v,{key:d.key}))).join('rect')
      .attr('class','hoverable')
      .attr('x',d=>x(d.data.decade)).attr('width',x.bandwidth()).attr('y',height-m.bottom).attr('height',0)
      .transition().duration(700).attr('y',d=>y(d[1])).attr('height',d=>y(d[0])-y(d[1]))
    svg.selectAll('rect').on('mousemove',(ev,d)=>{
      const val = mode==='counts'? d.data.counts[d.key] : d.data.pct[d.key]
      const pct = d3.format('.1%')(d.data.pct[d.key])
      tooltip.style('display','block').style('left',ev.clientX+'px').style('top',(ev.clientY-12)+'px')
        .html(`<b>${d.key}</b><br>${d.data.decade}s<br>Value: ${fmt(val)}<br>Share: ${pct}`)
    }).on('mouseleave',()=>tooltip.style('display','none'))
    svg.append('text').attr('x',m.left).attr('y',m.top-6).attr('fill','#9fb0c9').attr('font-size',12).text(mode==='counts'?'Counts per decade':'Share within decade')
  },[decadeRows,mode,cats])

  return (<div>
    <div className="toolbar">
      <button className="btn" onClick={()=>setMode(m=>m==='counts'?'percent':'counts')}>Mode: {mode==='counts'?'Counts':'Percentages'}</button>
      <span className="sub">Decade: {decRange[0]}s to {decRange[1]}s</span>
    </div>
    <svg ref={svgRef}></svg>
    <div ref={tipRef} className="tooltip" style={{display:'none'}} />
    <div style={{marginTop:10, display:'flex', flexDirection:'column', gap:8}}>
      <div style={{display:'flex', alignItems:'center', gap:10}}>
        <label className="sub" style={{minWidth:100}}>Start Decade:</label>
        <input className="range" type="range" min={allDecs[0]} max={allDecs[1]} step="10" value={decRange[0]} onChange={e=>setDecRange([+e.target.value, decRange[1]])} />
        <span className="sub" style={{minWidth:60}}>{decRange[0]}s</span>
      </div>
      <div style={{display:'flex', alignItems:'center', gap:10}}>
        <label className="sub" style={{minWidth:100}}>End Decade:</label>
        <input className="range" type="range" min={allDecs[0]} max={allDecs[1]} step="10" value={decRange[1]} onChange={e=>setDecRange([decRange[0], +e.target.value])} />
        <span className="sub" style={{minWidth:60}}>{decRange[1]}s</span>
      </div>
    </div>
  </div>)
}
