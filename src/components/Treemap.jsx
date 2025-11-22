
import React, { useEffect, useMemo, useRef, useState } from 'react'
import * as d3 from 'd3'

export default function Treemap({ data }){
  const svgRef = useRef(null)
  const [containerWidth, setContainerWidth] = useState(680)
  const root = useMemo(()=>{
    const byCatFilm = d3.rollups(data, v=> d3.rollups(v, vv=>vv.length, d=>d.Film), d=>d.Cat)
    const children = byCatFilm.map(([cat, arr])=>({ name:cat||'—', children: arr.map(([film,cnt])=>({name:film||'—', value:cnt})) }))
    return d3.hierarchy({name:'root', children}).sum(d=>d.value||0)
  },[data])
  
  const categories = useMemo(()=>Array.from(new Set(data.map(d=>d.Cat))).sort(),[data])

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
    const padding = containerWidth < 768 ? 32 : 48
    const width = Math.min(680, Math.max(300, containerWidth - padding))
    const height = containerWidth < 768 ? 400 : 400
    const m = {top:50,bottom:10,left:10,right:containerWidth < 600 ? 0 : 250}
    
    const svg=d3.select(svgRef.current)
      .attr('viewBox',`0 0 ${width} ${height}`)
      .attr('width','100%')
      .attr('height',height)
      .style('max-width','100%')
    svg.selectAll('*').remove()
    
    // Title
    svg.append('text').attr('x',10).attr('y',20).attr('fill','#e6eefc').attr('font-size',14).attr('font-weight','bold')
      .text('Films Grouped by Category')
    svg.append('text').attr('x',10).attr('y',35).attr('fill','#9fb0c9').attr('font-size',11)
      .text('Box size = number of nominations. Each color represents a category.')
    
    const chartHeight = height - m.top - m.bottom
    const chartWidth = width - m.left - m.right
    // Increased padding for better readability - inner padding between parent/child, outer padding around edges
    d3.treemap().size([chartWidth,chartHeight]).paddingInner(8).paddingOuter(4).paddingTop(20)(root)
    const color=d3.scaleOrdinal(d3.schemeTableau10)
    
    const g = svg.append('g').attr('transform',`translate(${m.left},${m.top})`)
    const nodes=g.selectAll('g').data(root.leaves()).join('g').attr('transform',d=>`translate(${d.x0},${d.y0})`)
    nodes.append('rect')
      .attr('class','treemap-rect')
      .attr('width',d=>d.x1-d.x0)
      .attr('height',d=>d.y1-d.y0)
      .attr('fill',d=>color(d.parent.data.name))
      .attr('opacity',0.85)
      .attr('stroke','#1b2750')
      .attr('stroke-width',1.5)
      .attr('rx',3)
      .attr('ry',3)
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
    nodes.filter(d=>(d.x1-d.x0)>50 && (d.y1-d.y0)>18)
      .append('text')
      .attr('x',6)
      .attr('y',(d)=>(d.y1-d.y0)/2 + 4)
      .attr('fill','#e6eefc')
      .attr('font-size',d=>Math.min(11, Math.max(8, (d.x1-d.x0)/8)))
      .attr('font-weight','500')
      .text(d=>{
        const maxLen = Math.floor((d.x1-d.x0)/6)
        return d.data.name.length>maxLen?d.data.name.slice(0,maxLen)+'…':d.data.name
      })
    
    // Legend - positioned to the right of the chart (or below on mobile)
    if (containerWidth >= 600) {
      const legendY = m.top + 10
      const legendX = width - 240
      const legendG = svg.append('g').attr('transform',`translate(${legendX},${legendY})`)
      legendG.append('text').attr('x',0).attr('y',0).attr('fill','#9fb0c9').attr('font-size',11).attr('font-weight','bold').text('Categories:')
      categories.slice(0,10).forEach((cat, i) => {
        const y = 15 + i * 15
        legendG.append('rect').attr('x',0).attr('y',y-8).attr('width',12).attr('height',12).attr('fill',color(cat)).attr('rx',2)
        legendG.append('text').attr('x',15).attr('y',y).attr('fill','#cdd7ea').attr('font-size',9)
          .text(cat)
      })
    }
  },[root, categories, containerWidth])

  return (<div><svg ref={svgRef}></svg></div>)
}
