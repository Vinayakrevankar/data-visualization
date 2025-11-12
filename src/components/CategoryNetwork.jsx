import React, { useEffect, useMemo, useRef, useState } from 'react'
import * as d3 from 'd3'

export default function CategoryNetwork({ data }){
  const svgRef = useRef(null), tipRef = useRef(null)
  const [topN, setTopN] = useState(15)

  const network = useMemo(()=>{
    const winners = data.filter(d=>d.WinnerFlag===1 && d.Film && d.Cat)
    
    // Get top winning films
    const filmWins = d3.rollups(winners, v=>v.length, d=>d.Film)
      .map(([film, count])=>({film, count}))
      .sort((a,b)=>b.count-a.count)
      .slice(0, topN)
    
    const topFilms = new Set(filmWins.map(f=>f.film))
    
    // Get categories for these films
    const filmCategories = d3.rollups(
      winners.filter(d=>topFilms.has(d.Film)),
      v=>v.length,
      d=>d.Film,
      d=>d.Cat
    )
    
    const nodes = []
    const links = []
    const nodeMap = new Map()
    
    // Add film nodes
    filmWins.forEach(({film, count}, i)=>{
      const id = `film-${i}`
      nodes.push({id, name: film, type: 'film', value: count})
      nodeMap.set(film, id)
    })
    
    // Add category nodes and links
    const catMap = new Map()
    filmCategories.forEach(([film, cats])=>{
      const filmId = nodeMap.get(film)
      cats.forEach(([cat, count])=>{
        if (!catMap.has(cat)) {
          const catId = `cat-${catMap.size}`
          nodes.push({id: catId, name: cat, type: 'category', value: count})
          catMap.set(cat, catId)
        }
        const catId = catMap.get(cat)
        links.push({source: filmId, target: catId, value: count})
      })
    })
    
    return { nodes, links }
  },[data, topN])

  useEffect(()=>{
    const width = 680, height = 500, m = {top:20,right:20,bottom:20,left:20}
    const svg = d3.select(svgRef.current)
      .attr('viewBox',`0 0 ${width} ${height}`)
      .attr('width',width)
      .attr('height',height)
    svg.selectAll('*').remove()

    const { nodes, links } = network
    if (!nodes.length) return

    // Force simulation
    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(d=>d.id).distance(80))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width/2, height/2 + 20))
      .force('collision', d3.forceCollide().radius(d=>d.type==='film'? 25 : 15))

    const color = d3.scaleOrdinal()
      .domain(['film', 'category'])
      .range(['#4da3ff', '#6fcf97'])

    // Links
    const link = svg.append('g')
      .selectAll('line')
      .data(links)
      .join('line')
        .attr('stroke', '#3a4a6b')
        .attr('stroke-opacity', 0.4)
        .attr('stroke-width', d=>Math.sqrt(d.value) * 0.5)

    // Nodes
    const node = svg.append('g')
      .selectAll('g')
      .data(nodes)
      .join('g')
        .attr('class','hoverable')
        .call(drag(simulation))

    node.append('circle')
      .attr('r', d=>d.type==='film'? 20 : 12)
      .attr('fill', d=>color(d.type))
      .attr('opacity', 0.9)
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)

    node.append('text')
      .attr('dx', d=>d.type==='film'? 25 : 15)
      .attr('dy', 4)
      .attr('fill','#cdd7ea')
      .attr('font-size', d=>d.type==='film'? 10 : 9)
      .text(d=>d.name.length > (d.type==='film'? 20 : 15) ? d.name.slice(0, d.type==='film'? 20 : 15)+'…' : d.name)

    const tooltip = d3.select(tipRef.current)

    node.on('mousemove', function(event, d) {
      tooltip
        .style('display','block')
        .style('left', event.clientX + 'px')
        .style('top', (event.clientY - 12) + 'px')
        .html(`<b>${d.name}</b><br>Type: ${d.type}<br>Wins: ${d.value}`)
    })
    .on('mouseleave',()=>tooltip.style('display','none'))

    simulation.on('tick', () => {
      link
        .attr('x1', d=>d.source.x)
        .attr('y1', d=>d.source.y)
        .attr('x2', d=>d.target.x)
        .attr('y2', d=>d.target.y)

      node.attr('transform', d=>`translate(${d.x},${d.y})`)
    })

    // Legend
    const legendX = 20, legendY = height - 50
    const legendG = svg.append('g').attr('transform',`translate(${legendX},${legendY})`)
    legendG.append('circle').attr('r',8).attr('fill','#4da3ff').attr('cx',0).attr('cy',0)
    legendG.append('text').attr('x',15).attr('y',4).attr('fill','#cdd7ea').attr('font-size',10).text('Films')
    legendG.append('circle').attr('r',6).attr('fill','#6fcf97').attr('cx',0).attr('cy',20)
    legendG.append('text').attr('x',15).attr('y',24).attr('fill','#cdd7ea').attr('font-size',10).text('Categories')

    function drag(simulation) {
      function dragstarted(event, d) {
        if (!event.active) simulation.alphaTarget(0.3).restart()
        d.fx = d.x
        d.fy = d.y
      }
      function dragged(event, d) {
        d.fx = event.x
        d.fy = event.y
      }
      function dragended(event, d) {
        if (!event.active) simulation.alphaTarget(0)
        d.fx = null
        d.fy = null
      }
      return d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended)
    }

  },[network])

  return (
    <div>
      <div style={{marginBottom: '10px'}}>
        <h3 style={{color: '#e6eefc', fontSize: '14px', fontWeight: 'bold', margin: '0 0 5px 0', textAlign: 'center'}}>
          Network: Top Winning Films & Their Categories
        </h3>
        <p style={{color: '#9fb0c9', fontSize: '11px', margin: '0', textAlign: 'center'}}>
          Blue = Films, Green = Categories. Drag nodes to explore.
        </p>
      </div>
      <div className="toolbar">
        <label className="sub">Top Films</label>
        <input
          className="range"
          type="range"
          min="10"
          max="25"
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

