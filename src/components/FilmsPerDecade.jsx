
import React, { useEffect, useMemo, useRef } from 'react'
import * as d3 from 'd3'

export default function FilmsPerDecade({ data }){
  const svgRef = useRef(null)
  const items = useMemo(()=>{
    const arr = d3.rollups(data.filter(d=>d.Decade!=null), v=> new Set(v.map(x=>x.Film)).size, d=>d.Decade)
      .map(([dec, uniq])=>({decade:+dec, films: uniq})).sort((a,b)=>a.decade-b.decade)
    return arr
  },[data])

  useEffect(()=>{
    const width=600, height=360, m={top:20,right:20,bottom:50,left:60}
    const svg=d3.select(svgRef.current).attr('viewBox',`0 0 ${width} ${height}`).attr('width',width).attr('height',height)
    svg.selectAll('*').remove()
    const x=d3.scaleBand().domain(items.map(d=>d.decade)).range([m.left,width-m.right]).padding(0.2)
    const y=d3.scaleLinear().domain([0,d3.max(items,d=>d.films)||1]).nice().range([height-m.bottom,m.top])
    svg.append('g').attr('transform',`translate(0,${height-m.bottom})`).call(d3.axisBottom(x).tickFormat(d=>`${d}s`)).selectAll('text').style('fill','#cdd7ea')
    svg.append('g').attr('transform',`translate(${m.left},0)`).call(d3.axisLeft(y)).selectAll('text').style('fill','#cdd7ea')
    
    // Axis labels
    svg.append('text').attr('x',width/2).attr('y',height-10).attr('fill','#9fb0c9').attr('font-size',12).attr('text-anchor','middle')
      .text('Decade')
    svg.append('text').attr('x',15).attr('y',height/2).attr('fill','#9fb0c9').attr('font-size',12).attr('text-anchor','middle')
      .attr('transform',`rotate(-90, 15, ${height/2})`)
      .text('Number of Unique Films')
    
    svg.append('g').selectAll('rect').data(items).join('rect').attr('class','hoverable')
      .attr('x',d=>x(d.decade)).attr('y',d=>y(d.films)).attr('width',x.bandwidth()).attr('height',d=>y(0)-y(d.films)).attr('fill','#6fcf97')
      .append('title').text(d=>`${d.decade}s: ${d.films} unique films`)
  },[items])

  return (<div><svg ref={svgRef}></svg></div>)
}
