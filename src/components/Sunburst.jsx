
import React, { useEffect, useMemo, useRef } from 'react'
import * as d3 from 'd3'

export default function Sunburst({ data }){
  const svgRef = useRef(null), tipRef = useRef(null)
  const root = useMemo(()=>{
    const byClass = d3.rollups(
      data,
      v => d3.rollups(v, vv=> d3.rollups(vv, vvv=>vvv.length, d=>d.Film), d=>d.Cat),
      d => d.Class
    )
    const children = byClass.map(([cls, cats]) => ({ name: cls||'—', children: cats.map(([cat, films])=>({name:cat||'—', children: films.map(([film,cnt])=>({name:film||'—', value:cnt}))})) }))
    return d3.hierarchy({name:'root', children}).sum(d=>d.value||0)
  },[data])
  
  const classes = useMemo(()=>Array.from(new Set(data.map(d=>d.Class))).filter(Boolean).sort(),[data])

  useEffect(()=>{
    const width=680, height=400, r=Math.min(width-200,height-80)/2
    const svg=d3.select(svgRef.current).attr('viewBox',`0 0 ${width} ${height}`).attr('width',width).attr('height',height)
    svg.selectAll('*').remove()
    
    // Title
    svg.append('text').attr('x',width/2).attr('y',20).attr('fill','#e6eefc').attr('font-size',14).attr('font-weight','bold').attr('text-anchor','middle')
      .text('Oscars Hierarchy: Class → Category → Film')
    svg.append('text').attr('x',width/2).attr('y',35).attr('fill','#9fb0c9').attr('font-size',11).attr('text-anchor','middle')
      .text('Inner ring = Class, Middle = Category, Outer = Films (size = nominations)')
    
    const centerX = width/2, centerY = height/2 + 20
    const g=svg.append('g').attr('transform',`translate(${centerX},${centerY})`)
    d3.partition().size([2*Math.PI, r])(root)
    const color=d3.scaleOrdinal(d3.schemeTableau10)
    const arc=d3.arc().startAngle(d=>d.x0).endAngle(d=>d.x1).innerRadius(d=>d.y0).outerRadius(d=>d.y1)
    const tooltip=d3.select(tipRef.current)
    
    g.selectAll('path').data(root.descendants().filter(d=>d.depth)).join('path')
      .attr('class','hoverable')
      .attr('d',arc).attr('fill',d=>{
        const ancestors = d.ancestors().map(a=>a.data.name).slice(1)
        return color(ancestors[0] || d.data.name)
      }).attr('opacity',0.95)
      .on('mousemove',(ev,d)=>{
        const path = d.ancestors().map(a=>a.data.name).reverse().slice(1).join(' → ')
        tooltip.style('display','block').style('left',ev.clientX+'px').style('top',(ev.clientY-12)+'px')
          .html(`<b>${path}</b><br>Nominations: ${d.value}`)
      })
      .on('mouseleave',()=>tooltip.style('display','none'))
    
    // Legend
    const legendX = width - 180, legendY = 50
    const legendG = svg.append('g').attr('transform',`translate(${legendX},${legendY})`)
    legendG.append('text').attr('x',0).attr('y',0).attr('fill','#9fb0c9').attr('font-size',11).attr('font-weight','bold').text('Classes:')
    classes.slice(0,10).forEach((cls, i) => {
      const y = 15 + i * 15
      legendG.append('rect').attr('x',0).attr('y',y-8).attr('width',12).attr('height',12).attr('fill',color(cls))
      legendG.append('text').attr('x',15).attr('y',y).attr('fill','#cdd7ea').attr('font-size',10)
        .text(cls.length > 18 ? cls.slice(0,18)+'…' : cls)
    })
  },[root, classes])

  return (<div>
    <svg ref={svgRef}></svg>
    <div ref={tipRef} className="tooltip" style={{display:'none'}} />
  </div>)
}
