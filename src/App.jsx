
import React, { useEffect, useState } from 'react'
import * as d3 from 'd3'
import { parseYear } from './utils'
import KPIs from './components/KPIs.jsx'
import Stacked from './components/Stacked.jsx'
import Trend from './components/Trend.jsx'
import CategoryNetwork from './components/CategoryNetwork.jsx'
import Treemap from './components/Treemap.jsx'
import Sunburst from './components/Sunburst.jsx'
import TopWinners from './components/TopWinners.jsx'
import Pie from './components/Pie.jsx'
import FilmsPerDecade from './components/FilmsPerDecade.jsx'

export default function App(){
  const [rows,setRows] = useState(null)
  const [error,setError] = useState(null)
  useEffect(()=>{
    d3.csv('/data/oscars.csv', d=>{
      const rec = {...d}
      rec.YearParsed = parseYear(d.Year)
      rec.Decade = rec.YearParsed!=null ? Math.floor(rec.YearParsed/10)*10 : null
      const w=(d.Winner||'').toString().trim().toLowerCase()
      rec.WinnerFlag = (w==='1'||w==='true'||w==='winner'||w==='yes')?1:0
      rec.Cat = d.CanonicalCategory && d.CanonicalCategory.length ? d.CanonicalCategory : d.Category
      return rec
    })
    .then(data => {
      console.log('Data loaded:', data.length, 'rows')
      console.log('Sample row:', data[0])
      setRows(data)
      setError(null)
    })
    .catch(err => {
      console.error('Error loading CSV:', err)
      setError(err.message)
    })
  },[])

  if(error) return <div className="container">Error loading data: {error}</div>
  if(!rows) return <div className="container">Loading data...</div>
  if(rows.length === 0) return <div className="container">No data loaded. Check console for errors.</div>

  return (
    <>
      <div className="header">
        <div className="title">
          <h1>Oscars Dashboard</h1>
          <div className="sub"></div>
        </div>
        <a className="btn" href="https://d3js.org/" target="_blank">D3 Docs</a>
      </div>
      <div className="container">
        <div className="card dataset-info">
          <h2>Dataset Information</h2>
          <div className="dataset-details">
            <div className="dataset-item">
              <span className="dataset-label">Source:</span>
              <a href="https://www.kaggle.com/datasets/unanimad/the-oscar-award" target="_blank" rel="noopener noreferrer" className="dataset-link">
                The Oscar Award Dataset on Kaggle
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{marginLeft: '6px', display: 'inline-block', verticalAlign: 'middle'}}>
                  <path d="M11 3H9V1H13V5H11V3ZM10 4L3 11L2 10L9 3H10ZM4 12H1V9H2V11H4V12Z" fill="currentColor"/>
                </svg>
              </a>
            </div>
            <div className="dataset-item">
              <span className="dataset-label">Description:</span>
              <span className="dataset-text">Comprehensive dataset containing all Academy Awards nominations and winners from 1927 to 2024, including categories, films, nominees, and award details.</span>
            </div>
            <div className="dataset-item">
              <span className="dataset-label">Data Points:</span>
              <span className="dataset-text">{rows.length.toLocaleString()} nominations across {new Set(rows.map(d=>d.YearParsed).filter(Boolean)).size} years</span>
            </div>
          </div>
        </div>
        <div className="card"><h2>Key Stats</h2><KPIs data={rows} /></div>

        <div className="grid-2">
          <div className="card"><h2>Category Distribution by Decade</h2><Stacked data={rows} /></div>
          <div className="card"><h2>Award Trends Over Years</h2><Trend data={rows} /></div>
        </div>

        <div className="grid-2">
          <div className="card"><h2>Film-Category Network</h2><CategoryNetwork data={rows} /></div>
          <div className="card"><h2>Top Award Winners</h2><TopWinners data={rows} /></div>
        </div>

        <div className="grid-2">
          <div className="card"><h2>Category–Film Treemap</h2><Treemap data={rows} /></div>
          <div className="card"><h2>Class–Category–Film Hierarchy</h2><Sunburst data={rows} /></div>
        </div>

        <div className="grid-2">
          <div className="card"><h2>Category Share (Pie)</h2><Pie data={rows} /></div>
          <div className="card"><h2>Films Per Decade</h2><FilmsPerDecade data={rows} /></div>
        </div>
      </div>
    </>
  )
}
