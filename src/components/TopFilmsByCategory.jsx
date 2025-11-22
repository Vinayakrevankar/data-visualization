import React, { useEffect, useMemo, useRef, useState } from 'react'
import * as d3 from 'd3'

export default function TopFilmsByCategory({ data }){
  const svgRef = useRef(null), tipRef = useRef(null)
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [topN, setTopN] = useState(10)
  const [containerWidth, setContainerWidth] = useState(680)

  const categories = useMemo(()=>Array.from(new Set(data.map(d=>d.Cat))).filter(Boolean).sort(),[data])

  const categoryData = useMemo(()=>{
    const cat = selectedCategory || categories[0]
    const films = d3.rollups(
      data.filter(d=>d.Cat===cat && d.Film),
      v=>v.length,
      d=>d.Film
    )
    .map(([film, count])=>({film, count}))
    .sort((a,b)=>b.count-a.count)
    .slice(0, topN)
    return { category: cat, films }
  },[data, selectedCategory, categories, topN])

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
    const height = containerWidth < 768 ? 400 : 450
    const m = {top:50,right:20,bottom:50,left:containerWidth < 600 ? 120 : 150}

    const svg = d3.select(svgRef.current)
      .attr('viewBox',`0 0 ${width} ${height}`)
      .attr('width','100%')
      .attr('height',height)
      .style('max-width','100%')
    svg.selectAll('*').remove()

    // Title
    svg.append('text')
      .attr('x',width/2)
      .attr('y',20)
      .attr('fill','#e6eefc')
      .attr('font-size',14)
      .attr('font-weight','bold')
      .attr('text-anchor','middle')
      .text('Top Films by Category')
    svg.append('text')
      .attr('x',width/2)
      .attr('y',35)
      .attr('fill','#9fb0c9')
      .attr('font-size',11)
      .attr('text-anchor','middle')
      .text('Bar length = number of nominations')

    const { films } = categoryData
    if (!films.length) return

    const x = d3.scaleLinear()
      .domain([0, d3.max(films, d=>d.count) || 1])
      .nice()
      .range([m.left, width - m.right])

    const y = d3.scaleBand()
      .domain(films.map(d=>d.film))
      .range([m.top, height - m.bottom])
      .padding(0.2)

    // Axes
    const xAxis = svg.append('g')
      .attr('transform',`translate(0,${height-m.bottom})`)
      .call(d3.axisBottom(x).ticks(containerWidth < 600 ? 5 : 8))
    xAxis.selectAll('text').style('fill','#cdd7ea').style('font-size',containerWidth < 600 ? 9 : 10)
    xAxis.selectAll('line,path').style('stroke','#1b2750')
    
    // X-axis label
    const fontSize = containerWidth < 600 ? 10 : 12
    svg.append('text')
      .attr('x', width/2)
      .attr('y', height - 10)
      .attr('fill','#9fb0c9')
      .attr('font-size', fontSize)
      .attr('text-anchor','middle')
      .text('Number of Nominations')

    const yAxis = svg.append('g')
      .attr('transform',`translate(${m.left},0)`)
      .call(d3.axisLeft(y).tickSize(0))
    yAxis.selectAll('text')
      .style('fill','#cdd7ea')
      .style('font-size',containerWidth < 600 ? 9 : 10)
      .attr('dy','0.35em')
      .text(d=>d.length > (containerWidth < 600 ? 15 : 25) ? d.slice(0, containerWidth < 600 ? 15 : 25) + '…' : d)
    yAxis.selectAll('path').remove()

    // Bars
    const color = d3.scaleSequential(d3.interpolateBlues)
      .domain([0, d3.max(films, d=>d.count)])

    const bars = svg.append('g')
      .selectAll('rect')
      .data(films)
      .join('rect')
        .attr('x', m.left)
        .attr('y', d=>y(d.film))
        .attr('width', d=>x(d.count) - m.left)
        .attr('height', y.bandwidth())
        .attr('fill', d=>color(d.count))
        .attr('opacity', 0.8)
        .attr('rx', 4)
        .attr('class','hoverable')
        .on('mouseenter', function(event, d) {
          d3.select(this).attr('opacity', 1)
          const tooltip = d3.select(tipRef.current)
          tooltip
            .style('display','block')
            .style('left', event.clientX + 'px')
            .style('top', (event.clientY - 12) + 'px')
            .html(`<b>${d.film}</b><br>Category: ${categoryData.category}<br>Nominations: ${d.count}`)
        })
        .on('mouseleave', function() {
          d3.select(this).attr('opacity', 0.8)
          d3.select(tipRef.current).style('display','none')
        })

    // Value labels on bars
    svg.append('g')
      .selectAll('text')
      .data(films.filter(d=>x(d.count) - m.left > 40))
      .join('text')
        .attr('x', d=>x(d.count) - 5)
        .attr('y', d=>y(d.film) + y.bandwidth()/2)
        .attr('dy','0.35em')
        .attr('fill','#e6eefc')
        .attr('font-size',containerWidth < 600 ? 9 : 10)
        .attr('font-weight','600')
        .attr('text-anchor','end')
        .text(d=>d.count)

    // Category selector
    if (containerWidth >= 600) {
      const legendY = m.top + 10
      const legendX = width - 180
      const legendG = svg.append('g').attr('transform',`translate(${legendX},${legendY})`)
      legendG.append('text').attr('x',0).attr('y',0).attr('fill','#9fb0c9').attr('font-size',11).attr('font-weight','bold').text('Category:')
    }
  },[categoryData, containerWidth, topN])

  return (
    <div>
      <div className="toolbar" style={{marginBottom: '10px'}}>
        <label className="sub">Category:</label>
        <select 
          className="select" 
          value={selectedCategory || categories[0] || ''} 
          onChange={e=>setSelectedCategory(e.target.value)}
          style={{minWidth: containerWidth < 600 ? 120 : 180}}
        >
          {categories.map(cat=><option key={cat} value={cat}>{cat}</option>)}
        </select>
        <label className="sub" style={{marginLeft: '10px'}}>Top:</label>
        <input
          className="range"
          type="range"
          min="5"
          max="20"
          step="5"
          value={topN}
          onChange={e=>setTopN(+e.target.value)}
          style={{maxWidth:100}}
        />
        <span className="sub">{topN}</span>
      </div>
      <svg ref={svgRef}></svg>
      <div ref={tipRef} className="tooltip" style={{display:'none'}} />
    </div>
  )
}

