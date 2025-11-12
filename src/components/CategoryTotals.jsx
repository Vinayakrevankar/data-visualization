import React, { useEffect, useMemo, useRef, useState } from 'react'
import * as d3 from 'd3'

export default function CategoryTotals({ data }){
  const svgRef = useRef(null), tipRef = useRef(null)
  const [metric,setMetric] = useState('nominations')
  const [topN,setTopN] = useState(15)

  const summary = useMemo(()=>{
    const grouped = d3.rollups(
      data.filter(d=>d.Cat),
      v => {
        const wins = d3.sum(v, d=>d.WinnerFlag||0)
        return { nominations: v.length, wins }
      },
      d=>d.Cat
    ).map(([cat, counts])=>({ cat, ...counts }))
    return grouped
  },[data])

  const items = useMemo(()=>{
    const sorted = summary.slice().sort((a,b)=>d3.descending(a[metric], b[metric]))
    return sorted.slice(0, topN)
  },[summary, metric, topN])

  useEffect(()=>{
    const width = 620, height = 40 + items.length * 22
    const m = {top:20,right:30,bottom:40,left:260}
    const svg = d3.select(svgRef.current)
      .attr('viewBox',`0 0 ${width} ${height}`)
      .attr('width',width)
      .attr('height',height)
    svg.selectAll('*').remove()

    const x = d3.scaleLinear()
      .domain([0, d3.max(items, d=>d[metric]) || 1])
      .nice()
      .range([m.left, width - m.right])
    const y = d3.scaleBand()
      .domain(items.map(d=>d.cat))
      .range([m.top, height - m.bottom])
      .padding(0.12)

    const axis = svg.append('g')
      .attr('transform',`translate(0,${height-m.bottom})`)
      .call(d3.axisBottom(x).ticks(6).tickFormat(metric==='wins'?d3.format('d'):d3.format('~s')))
    axis.selectAll('text').style('fill','#cdd7ea').attr('font-size',10)
    axis.selectAll('line,path').style('stroke','#1b2750')

    const yAxis = svg.append('g')
      .attr('transform',`translate(${m.left},0)`)
      .call(d3.axisLeft(y).tickSize(0))
    yAxis.selectAll('text').style('fill','#cdd7ea').attr('font-size',10).attr('dy','0.35em')
    yAxis.selectAll('path').remove()

    svg.append('text')
      .attr('x', width/2)
      .attr('y', height-10)
      .attr('fill','#9fb0c9')
      .attr('font-size',12)
      .attr('text-anchor','middle')
      .text(metric==='wins'?'Number of Wins':'Number of Nominations')

    const tooltip = d3.select(tipRef.current)

    svg.append('g').selectAll('rect')
      .data(items)
      .join('rect')
        .attr('class','hoverable')
        .attr('x', m.left)
        .attr('y', d=>y(d.cat))
        .attr('rx',6)
        .attr('height', y.bandwidth())
        .attr('width', d=>x(d[metric]) - m.left)
        .attr('fill','#4da3ff')
        .attr('opacity',0.9)
        .on('mousemove',(event,d)=>{
          tooltip
            .style('display','block')
            .style('left', event.clientX + 'px')
            .style('top', (event.clientY - 12) + 'px')
            .html(`<b>${d.cat}</b><br>${metric==='wins'?'Wins':'Nominations'}: ${d3.format(',')(d[metric])}<br>Wins: ${d3.format(',')(d.wins)}<br>Nominations: ${d3.format(',')(d.nominations)}`)
        })
        .on('mouseleave',()=>tooltip.style('display','none'))

    svg.append('g').selectAll('text.count-label')
      .data(items)
      .join('text')
      .attr('class','count-label')
      .attr('x', d=>x(d[metric]) + 6)
      .attr('y', d=>y(d.cat) + y.bandwidth()/2)
      .attr('fill','#cdd7ea')
      .attr('font-size',10)
      .attr('alignment-baseline','middle')
      .text(d=>d3.format(',')(d[metric]))

  },[items, metric])

  return (
    <div>
      <div className="toolbar">
        <label className="sub">Metric</label>
        <select className="select" value={metric} onChange={e=>setMetric(e.target.value)}>
          <option value="nominations">Nominations</option>
          <option value="wins">Wins</option>
        </select>
        <label className="sub">Top</label>
        <input
          className="range"
          type="range"
          min="5"
          max="25"
          step="1"
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

