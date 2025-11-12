import React, { useEffect, useMemo, useRef, useState } from 'react'
import * as d3 from 'd3'

export default function CategoryStream({ data }){
  const svgRef = useRef(null), tipRef = useRef(null)
  const [topN, setTopN] = useState(8)

  const summary = useMemo(()=>{
    const byDecade = d3.rollups(
      data.filter(d=>d.Decade!=null && d.Cat),
      v => d3.rollups(v, vv=>vv.length, d=>d.Cat),
      d=>d.Decade
    )
    
    const allCats = Array.from(new Set(data.map(d=>d.Cat).filter(Boolean))).sort()
    const topCats = allCats
      .map(cat => ({
        cat,
        total: data.filter(d=>d.Cat===cat).length
      }))
      .sort((a,b)=>b.total-a.total)
      .slice(0, topN)
      .map(d=>d.cat)

    const decades = Array.from(new Set(data.map(d=>d.Decade).filter(Boolean))).sort((a,b)=>a-b)
    
    const series = topCats.map(cat => ({
      name: cat,
      values: decades.map(dec => {
        const decData = byDecade.find(([d])=>d===dec)
        if (!decData) return { decade: dec, value: 0 }
        const catData = decData[1].find(([c])=>c===cat)
        return { decade: dec, value: catData ? catData[1] : 0 }
      })
    }))

    return { series, decades }
  },[data, topN])

  useEffect(()=>{
    const width = 680, height = 400, m = {top:50,right:30,bottom:50,left:50}
    const svg = d3.select(svgRef.current)
      .attr('viewBox',`0 0 ${width} ${height}`)
      .attr('width',width)
      .attr('height',height)
    svg.selectAll('*').remove()

    const { series, decades } = summary
    if (!series.length) return

    const x = d3.scaleBand()
      .domain(decades)
      .range([m.left, width - m.right])
      .padding(0.1)

    const stack = d3.stack()
      .keys(series.map(s=>s.name))
      .value((d, key) => {
        const s = series.find(ss=>ss.name===key)
        const v = s.values.find(vv=>vv.decade===d.decade)
        return v ? v.value : 0
      })

    const stacked = stack(decades.map(d=>({decade:d})))

    const yMax = d3.max(stacked, d=>d3.max(d, dd=>dd[1])) || 1
    const y = d3.scaleLinear()
      .domain([0, yMax])
      .nice()
      .range([height - m.bottom, m.top])

    const color = d3.scaleOrdinal(d3.schemeTableau10)

    // Area generator
    const area = d3.area()
      .x(d => x(d.data.decade))
      .y0(d => y(d[0]))
      .y1(d => y(d[1]))
      .curve(d3.curveBasis)

    // Axes
    const xAxis = svg.append('g')
      .attr('transform',`translate(0,${height-m.bottom})`)
      .call(d3.axisBottom(x).tickFormat(d=>`${d}s`))
    xAxis.selectAll('text').style('fill','#cdd7ea').attr('font-size',10)
    xAxis.selectAll('line,path').style('stroke','#1b2750')

    const yAxis = svg.append('g')
      .attr('transform',`translate(${m.left},0)`)
      .call(d3.axisLeft(y).ticks(6))
    yAxis.selectAll('text').style('fill','#cdd7ea').attr('font-size',10)
    yAxis.selectAll('line,path').style('stroke','#1b2750')

    // Axis labels
    svg.append('text')
      .attr('x', width/2)
      .attr('y', height - 10)
      .attr('fill','#9fb0c9')
      .attr('font-size',12)
      .attr('text-anchor','middle')
      .text('Decade')

    svg.append('text')
      .attr('x', 20)
      .attr('y', height/2)
      .attr('fill','#9fb0c9')
      .attr('font-size',12)
      .attr('text-anchor','middle')
      .attr('transform',`rotate(-90, 20, ${height/2})`)
      .text('Number of Nominations')

    // Title
    svg.append('text')
      .attr('x', m.left)
      .attr('y', 25)
      .attr('fill','#e6eefc')
      .attr('font-size',14)
      .attr('font-weight','bold')
      .text('Top Categories Over Time (Stream Graph)')
    svg.append('text')
      .attr('x', m.left)
      .attr('y', 40)
      .attr('fill','#9fb0c9')
      .attr('font-size',11)
      .text('Stacked area showing nomination trends by decade')

    const tooltip = d3.select(tipRef.current)

    // Areas
    const areas = svg.append('g')
      .selectAll('path')
      .data(stacked)
      .join('path')
        .attr('fill', (d,i) => color(i))
        .attr('opacity', 0.8)
        .attr('d', area)
        .attr('class','hoverable')
        .on('mousemove', function(event, d) {
          const [xPos, yPos] = d3.pointer(event)
          const decade = x.invert(xPos)
          const closest = d.find(v => Math.abs(x(v.data.decade) - xPos) < x.bandwidth()/2)
          if (closest) {
            tooltip
              .style('display','block')
              .style('left', event.clientX + 'px')
              .style('top', (event.clientY - 12) + 'px')
              .html(`<b>${d.key}</b><br>Decade: ${closest.data.decade}s<br>Nominations: ${d3.format(',')(Math.round(closest[1] - closest[0]))}`)
          }
        })
        .on('mouseleave',()=>tooltip.style('display','none'))

    // Legend
    const legendX = width - 200, legendY = m.top + 10
    const legendG = svg.append('g').attr('transform',`translate(${legendX},${legendY})`)
    legendG.append('text').attr('x',0).attr('y',0).attr('fill','#9fb0c9').attr('font-size',11).attr('font-weight','bold').text('Categories:')
    series.forEach((s, i) => {
      const y = 15 + i * 15
      legendG.append('rect').attr('x',0).attr('y',y-8).attr('width',12).attr('height',12).attr('fill',color(i))
      legendG.append('text').attr('x',15).attr('y',y).attr('fill','#cdd7ea').attr('font-size',9)
        .text(s.name.length > 20 ? s.name.slice(0,20)+'…' : s.name)
    })

  },[summary])

  return (
    <div>
      <div className="toolbar">
        <label className="sub">Top Categories</label>
        <input
          className="range"
          type="range"
          min="5"
          max="12"
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

