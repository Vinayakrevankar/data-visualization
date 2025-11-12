
import React, { useEffect, useMemo, useRef } from 'react'
import * as d3 from 'd3'

export default function Heatmap({ data }){
  const svgRef = useRef(null)
  const cats = useMemo(()=>Array.from(new Set(data.map(d=>d.Cat))).sort(),[data])
  const grid = useMemo(()=>{
    const rows = d3.rollups(data.filter(d=>d.Decade!=null), v=> d3.rollups(v, vv=>vv.length, d=>d.Cat), d=>d.Decade)
      .map(([dec, arr])=>{
        const row = {decade:+dec}
        for (const c of cats) row[c]=0
        for (const [cat,cnt] of arr) row[cat]=cnt
        return row
      }).sort((a,b)=>a.decade-b.decade)
    return rows
  },[data,cats])

  useEffect(()=>{
    const wrapText = (selection, width) => {
      selection.each(function(){
        const text = d3.select(this)
        const words = text.text().split(/\s+/).filter(Boolean).reverse()
        let word
        let line = []
        const lineHeight = 1.1
        const x = text.attr('x') || 0
        const y = text.attr('y') || 0
        const dy = parseFloat(text.attr('dy') || '0') || 0
        let lineNumber = 0
        text.text(null)
        let tspan = text.append('tspan').attr('x', x).attr('y', y).attr('dy', `${dy}em`)
        while((word = words.pop())){
          line.push(word)
          tspan.text(line.join(' '))
          if(tspan.node().getComputedTextLength() > width){
            line.pop()
            tspan.text(line.join(' '))
            line = [word]
            tspan = text.append('tspan').attr('x', x).attr('y', y).attr('dy', `${++lineNumber * lineHeight + dy}em`).text(word)
          }
        }
      })
    }

    const width=860, m={top:50,right:140,bottom:110,left:200}
    const rowHeight = 14
    const height = Math.max(600, m.top + m.bottom + (rowHeight * cats.length))
    const svg=d3.select(svgRef.current).attr('viewBox',`0 0 ${width} ${height}`).attr('width',width).attr('height',height)
    svg.selectAll('*').remove()
    const xVals = grid.map(r=>r.decade), yVals=cats
    const x=d3.scaleBand().domain(xVals).range([m.left,width-m.right]).padding(0.1)
    const y=d3.scaleBand().domain(yVals).range([m.top,height-m.bottom]).padding(0.1)
    const maxVal=d3.max(grid.flatMap(r=>cats.map(c=>r[c])))
    const color=d3.scaleSequential(d3.interpolateYlGnBu).domain([0,maxVal||1])
    
    // Title
    svg.append('text').attr('x',m.left).attr('y',20).attr('fill','#e6eefc').attr('font-size',14).attr('font-weight','bold')
      .text('Number of Nominations by Category and Decade')
    svg.append('text').attr('x',m.left).attr('y',35).attr('fill','#9fb0c9').attr('font-size',11)
      .text('Darker colors = more nominations')
    
    // Axes
    const axisBottom = d3.axisBottom(x).tickFormat(d=>`${d}s`).tickSizeOuter(0).tickPadding(10)
    const xAxis = svg.append('g').attr('transform',`translate(0,${height-m.bottom})`).call(axisBottom)
    xAxis.selectAll('text')
      .style('fill','#cdd7ea')
      .attr('font-size',9)
      .attr('font-weight','500')
      .attr('text-anchor','middle')
      .attr('dy','1.2em')
    xAxis.selectAll('line').style('stroke','#1b2750')
    xAxis.selectAll('path').style('stroke','#1b2750')
    const yAxis = svg.append('g').attr('transform',`translate(${m.left},0)`).call(d3.axisLeft(y))
    yAxis.selectAll('text')
      .style('fill','#cdd7ea')
      .attr('font-size',9)
      .attr('text-anchor','end')
      .attr('dx',-12)
      .call(wrapText, 150)
    yAxis.selectAll('line,path').style('stroke','#1b2750')
    
    // Axis labels
    svg.append('text').attr('x',width/2).attr('y',height-15).attr('fill','#9fb0c9').attr('font-size',12).attr('text-anchor','middle')
      .text('Decade')
    svg.append('text').attr('x',20).attr('y',height/2).attr('fill','#9fb0c9').attr('font-size',12).attr('text-anchor','middle')
      .attr('transform',`rotate(-90, 20, ${height/2})`).text('Category')
    
    // Color legend
    const legendWidth = 100, legendHeight = 10, legendX = width - legendWidth - 20, legendY = m.top + 20
    const legendScale = d3.scaleLinear().domain([0, maxVal||1]).range([0, legendWidth])
    const legendAxis = d3.axisBottom(legendScale).ticks(5).tickFormat(d3.format('d'))
    const legendG = svg.append('g').attr('transform',`translate(${legendX},${legendY})`)
    const defs = svg.append('defs')
    const gradient = defs.append('linearGradient').attr('id','heatmapGradient').attr('x1','0%').attr('x2','100%')
    const stops = [0, 0.25, 0.5, 0.75, 1].map(t => ({offset: `${t*100}%`, color: color(t * (maxVal||1))}))
    stops.forEach(s => gradient.append('stop').attr('offset',s.offset).attr('stop-color',s.color))
    legendG.append('rect').attr('width',legendWidth).attr('height',legendHeight).attr('fill','url(#heatmapGradient)')
    legendG.append('g').attr('transform',`translate(0,${legendHeight})`).call(legendAxis).selectAll('text').style('fill','#cdd7ea').attr('font-size',9)
    legendG.append('text').attr('x',legendWidth/2).attr('y',-5).attr('fill','#9fb0c9').attr('font-size',10).attr('text-anchor','middle')
      .text('Nominations')
    
    // Cells
    const cells=[]; for(const r of grid){ for(const c of cats){ cells.push({decade:r.decade, cat:c, value:r[c]}) } }
    svg.append('g').selectAll('rect').data(cells).join('rect')
      .attr('class','hoverable')
      .attr('x',d=>x(d.decade)).attr('y',d=>y(d.cat)).attr('rx',4).attr('width',x.bandwidth()).attr('height',y.bandwidth()).attr('fill',d=>color(d.value))
      .append('title').text(d=>`${d.cat} in ${d.decade}s: ${d.value} nominations`)
  },[grid,cats])

  return (<div style={{maxHeight: 520, overflowY: 'auto'}}><svg ref={svgRef}></svg></div>)
}
