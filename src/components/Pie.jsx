
import React, { useEffect, useMemo, useRef } from 'react'
import * as d3 from 'd3'

export default function Pie({ data }){
  const svgRef = useRef(null), tipRef = useRef(null)
  const parts = useMemo(()=>{
    const winners = data.filter(d=>d.WinnerFlag===1)
    const arr = d3.rollups(winners.length?winners:data, v=>v.length, d=>d.Cat).map(([cat,cnt])=>({cat, cnt}))
    const total = d3.sum(arr, d=>d.cnt) || 1
    return arr.map(d=>({...d, pct:d.cnt/total})).sort((a,b)=>d3.descending(a.cnt,b.cnt)).slice(0,10)
  },[data])
  
  const isWinners = useMemo(()=>data.some(d=>d.WinnerFlag===1),[data])

  useEffect(()=>{
    const width=800, height=400, r=Math.min(width-350,height-80)/2
    const svg=d3.select(svgRef.current).attr('viewBox',`0 0 ${width} ${height}`).attr('width',width).attr('height',height)
    svg.selectAll('*').remove()
    
    // Title
    svg.append('text').attr('x',width/2).attr('y',20).attr('fill','#e6eefc').attr('font-size',14).attr('font-weight','bold').attr('text-anchor','middle')
      .text(`Top 10 Categories by ${isWinners ? 'Wins' : 'Nominations'}`)
    svg.append('text').attr('x',width/2).attr('y',35).attr('fill','#9fb0c9').attr('font-size',11).attr('text-anchor','middle')
      .text('Donut chart showing proportional share')
    
    const centerX = width/2 - 120, centerY = height/2 + 20
    const g=svg.append('g').attr('transform',`translate(${centerX},${centerY})`)
    const tooltip=d3.select(tipRef.current)
    const color=d3.scaleOrdinal(d3.schemeTableau10)
    const pie=d3.pie().value(d=>d.cnt).sort(null)
    const arc=d3.arc().innerRadius(r*0.5).outerRadius(r*0.95).padAngle(0.01)
    const labelArc=d3.arc().innerRadius(r*1.05).outerRadius(r*1.05)
    const pieData = pie(parts)
    
    const paths = g.selectAll('path').data(pieData).join('path')
      .attr('class','hoverable').attr('d',arc).attr('fill',d=>color(d.data.cat))
      .on('mousemove',(ev,d)=>{
        tooltip.style('display','block').style('left',ev.clientX+'px').style('top',(ev.clientY-12)+'px')
          .html(`<b>${d.data.cat}</b><br>${isWinners ? 'Wins' : 'Nominations'}: ${d.data.cnt}<br>Share: ${d3.format('.1%')(d.data.pct)}`)
      }).on('mouseleave',()=>tooltip.style('display','none'))
    
    // Labels for larger segments
    g.selectAll('text.label').data(pieData.filter(d=>(d.endAngle - d.startAngle) > 0.1))
      .join('text')
      .attr('class','label')
      .attr('transform',d=>`translate(${labelArc.centroid(d)})`)
      .attr('text-anchor','middle')
      .attr('fill','#e6eefc')
      .attr('font-size',10)
      .text(d=>d3.format('.0%')(d.data.pct))
    
    // Legend - show full category names with multi-line support
    const legendX = width - 320, legendY = 50
    const legendG = svg.append('g').attr('transform',`translate(${legendX},${legendY})`)
    legendG.append('text').attr('x',0).attr('y',0).attr('fill','#9fb0c9').attr('font-size',11).attr('font-weight','bold').text('Categories:')
    
    // Helper function to wrap text into multiple lines
    const wrapText = (text, maxWidth) => {
      const words = text.split(/\s+/)
      const lines = []
      let currentLine = words[0]
      
      for (let i = 1; i < words.length; i++) {
        const testLine = currentLine + ' ' + words[i]
        // Approximate width: ~6px per character for font-size 10
        const testWidth = testLine.length * 6
        if (testWidth > maxWidth && currentLine.length > 0) {
          lines.push(currentLine)
          currentLine = words[i]
        } else {
          currentLine = testLine
        }
      }
      lines.push(currentLine)
      return lines
    }
    
    let currentY = 15
    const lineHeight = 12
    const maxWidth = 280 // max width for text before wrapping
    
    parts.forEach((part, i) => {
      const textContent = `${part.cat} (${part.cnt})`
      const lines = wrapText(textContent, maxWidth)
      const textHeight = lines.length * lineHeight
      
      // Color swatch
      legendG.append('rect')
        .attr('x',0)
        .attr('y',currentY - 8)
        .attr('width',12)
        .attr('height',12)
        .attr('fill',color(part.cat))
      
      // Multi-line text
      const textEl = legendG.append('text')
        .attr('x',15)
        .attr('y',currentY)
        .attr('fill','#cdd7ea')
        .attr('font-size',10)
      
      lines.forEach((line, lineIdx) => {
        textEl.append('tspan')
          .attr('x',15)
          .attr('dy',lineIdx === 0 ? 0 : lineHeight)
          .text(line)
      })
      
      currentY += textHeight + 3 // Add spacing between legend items
    })
  },[parts, isWinners])

  return (<div>
    <svg ref={svgRef}></svg>
    <div ref={tipRef} className="tooltip" style={{display:'none'}} />
  </div>)
}
