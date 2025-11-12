import React, { useEffect, useMemo, useRef, useState } from 'react'
import * as d3 from 'd3'

export default function CategoryBubble({ data }){
  const svgRef = useRef(null), tipRef = useRef(null)
  const [topN, setTopN] = useState(20)

  const summary = useMemo(()=>{
    const grouped = d3.rollups(
      data.filter(d=>d.Cat),
      v => {
        const wins = d3.sum(v, d=>d.WinnerFlag||0)
        return { nominations: v.length, wins, total: v.length }
      },
      d=>d.Cat
    ).map(([cat, counts])=>({ cat, ...counts }))
    return grouped
  },[data])

  const items = useMemo(()=>{
    const sorted = summary.slice().sort((a,b)=>d3.descending(a.total, b.total))
    return sorted.slice(0, topN)
  },[summary, topN])

  useEffect(()=>{
    const width = 680, height = 500, m = {top:50,right:30,bottom:60,left:70}
    const svg = d3.select(svgRef.current)
      .attr('viewBox',`0 0 ${width} ${height}`)
      .attr('width',width)
      .attr('height',height)
    svg.selectAll('*').remove()

    const maxNominations = d3.max(items, d=>d.nominations) || 1
    const maxWins = d3.max(items, d=>d.wins) || 1
    const maxTotal = d3.max(items, d=>d.total) || 1

    const x = d3.scaleLinear()
      .domain([0, maxNominations * 1.1])
      .nice()
      .range([m.left, width - m.right])

    const y = d3.scaleLinear()
      .domain([0, maxWins * 1.1])
      .nice()
      .range([height - m.bottom, m.top])

    const radius = d3.scaleSqrt()
      .domain([0, maxTotal])
      .range([8, 50])

    const color = d3.scaleOrdinal(d3.schemeTableau10)

    // Axes
    const xAxis = svg.append('g')
      .attr('transform',`translate(0,${height-m.bottom})`)
      .call(d3.axisBottom(x).ticks(8).tickFormat(d3.format('~s')))
    xAxis.selectAll('text').style('fill','#cdd7ea').attr('font-size',10)
    xAxis.selectAll('line,path').style('stroke','#1b2750')

    const yAxis = svg.append('g')
      .attr('transform',`translate(${m.left},0)`)
      .call(d3.axisLeft(y).ticks(8).tickFormat(d3.format('d')))
    yAxis.selectAll('text').style('fill','#cdd7ea').attr('font-size',10)
    yAxis.selectAll('line,path').style('stroke','#1b2750')

    // Axis labels
    svg.append('text')
      .attr('x', width/2)
      .attr('y', height - 10)
      .attr('fill','#9fb0c9')
      .attr('font-size',12)
      .attr('text-anchor','middle')
      .text('Number of Nominations')

    svg.append('text')
      .attr('x', 20)
      .attr('y', height/2)
      .attr('fill','#9fb0c9')
      .attr('font-size',12)
      .attr('text-anchor','middle')
      .attr('transform',`rotate(-90, 20, ${height/2})`)
      .text('Number of Wins')

    // Title
    svg.append('text')
      .attr('x', m.left)
      .attr('y', 25)
      .attr('fill','#e6eefc')
      .attr('font-size',14)
      .attr('font-weight','bold')
      .text('Category Performance: Nominations vs Wins')
    svg.append('text')
      .attr('x', m.left)
      .attr('y', 40)
      .attr('fill','#9fb0c9')
      .attr('font-size',11)
      .text('Bubble size = total nominations')

    const tooltip = d3.select(tipRef.current)

    // Bubbles
    const bubbles = svg.append('g')
      .selectAll('g')
      .data(items)
      .join('g')
        .attr('transform', d=>`translate(${x(d.nominations)},${y(d.wins)})`)

    bubbles.append('circle')
      .attr('class','hoverable')
      .attr('r', d=>radius(d.total))
      .attr('fill', (d,i)=>color(i))
      .attr('opacity', 0.7)
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .on('mousemove',(event,d)=>{
        tooltip
          .style('display','block')
          .style('left', event.clientX + 'px')
          .style('top', (event.clientY - 12) + 'px')
          .html(`<b>${d.cat}</b><br>Nominations: ${d3.format(',')(d.nominations)}<br>Wins: ${d3.format(',')(d.wins)}<br>Win Rate: ${d3.format('.1%')(d.wins/d.nominations)}`)
      })
      .on('mouseleave',()=>tooltip.style('display','none'))

    // Labels for larger bubbles
    bubbles.filter(d=>radius(d.total) > 20)
      .append('text')
      .attr('text-anchor','middle')
      .attr('dy','0.35em')
      .attr('fill','#fff')
      .attr('font-size', d=>Math.min(radius(d.total)/3, 12))
      .attr('font-weight','bold')
      .text(d=>d.cat.length > 15 ? d.cat.slice(0,15)+'…' : d.cat)

  },[items])

  return (
    <div>
      <div className="toolbar">
        <label className="sub">Top Categories</label>
        <input
          className="range"
          type="range"
          min="10"
          max="30"
          step="5"
          value={topN}
          onChange={e=>setTopN(+e.target.value)}
          style={{maxWidth:200}}
        />
        <span className="sub">{topN}</span>
      </div>
      <svg ref={svgRef}></svg>
      <div ref={tipRef} className="tooltip" style={{display:'none'}} />
    </div>
  )
}

