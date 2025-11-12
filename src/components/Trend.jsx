
import React, { useEffect, useMemo, useRef, useState } from 'react'
import * as d3 from 'd3'
import { catColor } from '../utils'

export default function Trend({ data }){
  const svgRef = useRef(null), tipRef = useRef(null)
  const cats = useMemo(()=>Array.from(new Set(data.map(d=>d.Cat))).sort(),[data])
  const [cat,setCat] = useState(cats[0]||'')
  const [containerWidth, setContainerWidth] = useState(860)
  const color = useMemo(()=>catColor(cats),[cats])

  const yearly = useMemo(()=>{
    const arr = d3.rollups(data.filter(d=>d.Cat===cat && d.YearParsed!=null), v=>v.length, d=>d.YearParsed)
      .map(([y,c])=>({year:+y, count:c})).sort((a,b)=>a.year-b.year)
    return arr
  },[data,cat])

  useEffect(()=>{
    const updateWidth = () => {
      if (svgRef.current?.parentElement) {
        setContainerWidth(svgRef.current.parentElement.clientWidth)
      }
    }
    updateWidth()
    window.addEventListener('resize', updateWidth)
    return () => window.removeEventListener('resize', updateWidth)
  }, [])

  useEffect(()=>{
    const width = Math.min(860, containerWidth - 32) // Account for padding
    const height = 260
    const m = {top:20,right:20,bottom:40,left:50}
    // Adjust left margin for mobile
    if (containerWidth < 600) m.left = 45
    if (containerWidth < 400) m.left = 40
    
    const svg=d3.select(svgRef.current)
    svg.attr('viewBox',`0 0 ${width} ${height}`).attr('width','100%').attr('height',height).style('max-width','100%')
    svg.selectAll('*').remove()
    const x=d3.scaleLinear().domain(d3.extent(yearly,d=>d.year)).range([m.left,width-m.right])
    const y=d3.scaleLinear().domain([0,d3.max(yearly,d=>d.count)||1]).nice().range([height-m.bottom,m.top])
    const tickFontSize = containerWidth < 600 ? 10 : 12
    svg.append('g').attr('transform',`translate(0,${height-m.bottom})`).call(d3.axisBottom(x).ticks(containerWidth < 600 ? 6 : 8).tickFormat(d3.format('d'))).selectAll('text').style('fill','#cdd7ea').style('font-size',tickFontSize)
    svg.append('g').attr('transform',`translate(${m.left},0)`).call(d3.axisLeft(y)).selectAll('text').style('fill','#cdd7ea').style('font-size',tickFontSize)
    
    // Axis labels
    const fontSize = containerWidth < 600 ? 10 : 12
    svg.append('text').attr('x',width/2).attr('y',height-10).attr('fill','#9fb0c9').attr('font-size',fontSize).attr('text-anchor','middle')
      .text('Year')
    svg.append('text').attr('x',15).attr('y',height/2).attr('fill','#9fb0c9').attr('font-size',fontSize).attr('text-anchor','middle')
      .attr('transform',`rotate(-90, 15, ${height/2})`)
      .text('Number of Nominations')
    
    const line=d3.line().x(d=>x(d.year)).y(d=>y(d.count))
    svg.append('path').datum(yearly).attr('fill','none').attr('stroke',color(cat)).attr('stroke-width',2).attr('d',line)
    const tooltip=d3.select(tipRef.current)
    svg.append('g').selectAll('circle').data(yearly).join('circle')
      .attr('class','hoverable')
      .attr('cx',d=>x(d.year)).attr('cy',d=>y(d.count)).attr('r',3.5).attr('fill',color(cat))
      .on('mousemove',(ev,d)=>{
        tooltip.style('display','block').style('left',ev.clientX+'px').style('top',(ev.clientY-12)+'px')
          .html(`<b>${cat}</b><br>Year: ${d.year}<br>Count: ${d.count}`)
      })
      .on('mouseleave',()=>tooltip.style('display','none'))
    svg.append('text').attr('x',m.left).attr('y',m.top-6).attr('fill','#9fb0c9').attr('font-size',fontSize).text(`${cat} per year`)
  },[yearly,cat,containerWidth])

  return (<div>
    <div className="toolbar">
      <label className="sub">Category</label>
      <select className="select" value={cat} onChange={e=>setCat(e.target.value)}>{cats.map(c=><option key={c} value={c}>{c}</option>)}</select>
    </div>
    <svg ref={svgRef}></svg>
    <div ref={tipRef} className="tooltip" style={{display:'none'}} />
  </div>)
}
