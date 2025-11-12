
import React, { useEffect, useMemo, useRef, useState } from 'react'
import * as d3 from 'd3'

export default function TopWinners({ data }){
  const svgRef = useRef(null), tipRef = useRef(null)
  const [topN,setTopN] = useState(10)
  const items = useMemo(()=>{
    const winners = data.filter(d=>d.WinnerFlag===1 && d.Name)
    const base = winners.length ? winners : data.filter(d=>d.Name)
    const arr = d3.rollups(base, v=>v.length, d=>d.Name).map(([name,cnt])=>({name, count:cnt})).sort((a,b)=>d3.descending(a.count,b.count)).slice(0,topN)
    return arr
  },[data,topN])

  useEffect(()=>{
    const width=600, height=360, m={top:20,right:20,bottom:40,left:180}
    const svg=d3.select(svgRef.current).attr('viewBox',`0 0 ${width} ${height}`).attr('width',width).attr('height',height)
    svg.selectAll('*').remove()
    const tooltip=d3.select(tipRef.current)
    const y=d3.scaleBand().domain(items.map(d=>d.name)).range([m.top,height-m.bottom]).padding(0.15)
    const x=d3.scaleLinear().domain([0,d3.max(items,d=>d.count)||1]).range([m.left,width-m.right])
    svg.append('g').attr('transform',`translate(0,${height-m.bottom})`).call(d3.axisBottom(x).ticks(5)).selectAll('text').style('fill','#cdd7ea')
    svg.append('g').attr('transform',`translate(${m.left},0)`).call(d3.axisLeft(y)).selectAll('text').style('fill','#cdd7ea')
    
    // Axis labels
    svg.append('text').attr('x',width/2).attr('y',height-10).attr('fill','#9fb0c9').attr('font-size',12).attr('text-anchor','middle')
      .text('Number of Awards')
    svg.append('text').attr('x',15).attr('y',height/2).attr('fill','#9fb0c9').attr('font-size',12).attr('text-anchor','middle')
      .attr('transform',`rotate(-90, 15, ${height/2})`)
      .text('Winner / Nominee')
    
    svg.append('g').selectAll('rect').data(items).join('rect')
      .attr('class','hoverable')
      .attr('x',m.left).attr('y',d=>y(d.name)).attr('height',y.bandwidth()).attr('width',d=>x(d.count)-m.left).attr('fill','#4da3ff').attr('opacity',0.9)
      .on('mousemove',(ev,d)=>{
        tooltip.style('display','block').style('left',ev.clientX+'px').style('top',(ev.clientY-12)+'px')
          .html(`<b>${d.name}</b><br>Total: ${d.count}`)
      })
      .on('mouseleave',()=>tooltip.style('display','none'))
    svg.append('text').attr('x',m.left).attr('y',m.top-6).attr('fill','#9fb0c9').attr('font-size',12).text('Top people by count (winners preferred when available)')
  },[items])

  return (<div>
    <div className="toolbar">
      <label className="sub">Top N</label>
      <input className="range" type="range" min="5" max="25" step="1" value={topN} onChange={e=>setTopN(+e.target.value)} />
      <span className="sub">{topN}</span>
    </div>
    <svg ref={svgRef}></svg>
    <div ref={tipRef} className="tooltip" style={{display:'none'}} />
  </div>)
}
