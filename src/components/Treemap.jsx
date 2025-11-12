
import React, { useEffect, useMemo, useRef } from 'react'
import * as d3 from 'd3'

export default function Treemap({ data }){
  const svgRef = useRef(null)
  const root = useMemo(()=>{
    const byCatFilm = d3.rollups(data, v=> d3.rollups(v, vv=>vv.length, d=>d.Film), d=>d.Cat)
    const children = byCatFilm.map(([cat, arr])=>({ name:cat||'—', children: arr.map(([film,cnt])=>({name:film||'—', value:cnt})) }))
    return d3.hierarchy({name:'root', children}).sum(d=>d.value||0)
  },[data])
  
  const categories = useMemo(()=>Array.from(new Set(data.map(d=>d.Cat))).sort(),[data])

  useEffect(()=>{
    const width=680, height=400, m={top:50,bottom:10,left:10,right:250}
    const svg=d3.select(svgRef.current).attr('viewBox',`0 0 ${width} ${height}`).attr('width',width).attr('height',height)
    svg.selectAll('*').remove()
    
    // Title
    svg.append('text').attr('x',10).attr('y',20).attr('fill','#e6eefc').attr('font-size',14).attr('font-weight','bold')
      .text('Films Grouped by Category')
    svg.append('text').attr('x',10).attr('y',35).attr('fill','#9fb0c9').attr('font-size',11)
      .text('Box size = number of nominations. Each color represents a category.')
    
    const chartHeight = height - m.top - m.bottom
    const chartWidth = width - m.left - m.right
    d3.treemap().size([chartWidth,chartHeight]).padding(2)(root)
    const color=d3.scaleOrdinal(d3.schemeTableau10)
    
    const g = svg.append('g').attr('transform',`translate(${m.left},${m.top})`)
    const nodes=g.selectAll('g').data(root.leaves()).join('g').attr('transform',d=>`translate(${d.x0},${d.y0})`)
    nodes.append('rect')
      .attr('class','treemap-rect')
      .attr('width',d=>d.x1-d.x0)
      .attr('height',d=>d.y1-d.y0)
      .attr('fill',d=>color(d.parent.data.name))
      .attr('opacity',0.9)
      .attr('stroke','transparent')
      .attr('stroke-width',2)
      .on('mouseenter', function(event, d) {
        d3.select(this)
          .attr('opacity', 1)
          .attr('stroke', '#4da3ff')
          .attr('stroke-width', 3)
          .raise()
      })
      .on('mouseleave', function(event, d) {
        d3.select(this)
          .attr('opacity', 0.9)
          .attr('stroke', 'transparent')
          .attr('stroke-width', 2)
      })
    nodes.append('title').text(d=>`Category: ${d.parent.data.name}\nFilm: ${d.data.name}\nNominations: ${d.value}`)
    nodes.filter(d=>(d.x1-d.x0)>60 && (d.y1-d.y0)>20)
      .append('text').attr('x',4).attr('y',14).attr('fill','#e6eefc').attr('font-size',11)
      .text(d=>d.data.name.length>22?d.data.name.slice(0,22)+'…':d.data.name)
    
    // Legend - positioned to the right of the chart
    const legendY = m.top + 10
    const legendX = width - 240
    const legendG = svg.append('g').attr('transform',`translate(${legendX},${legendY})`)
    legendG.append('text').attr('x',0).attr('y',0).attr('fill','#9fb0c9').attr('font-size',11).attr('font-weight','bold').text('Categories:')
    categories.slice(0,10).forEach((cat, i) => {
      const y = 15 + i * 15
      legendG.append('rect').attr('x',0).attr('y',y-8).attr('width',12).attr('height',12).attr('fill',color(cat))
      // Show full category name without truncation
      legendG.append('text').attr('x',15).attr('y',y).attr('fill','#cdd7ea').attr('font-size',9)
        .text(cat)
    })
  },[root, categories])

  return (<div><svg ref={svgRef}></svg></div>)
}
