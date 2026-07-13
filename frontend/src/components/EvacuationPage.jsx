import React, { useState, useEffect } from 'react'
import MapView from './MapView'
import { getNodesForFloor, getEdgesForFloor, getRoute } from '../services/api'
import { floorPlansService } from '../services/floorPlansService'

const BUILDING_NAMES = {
  'building-1': 'Strathmore University — Main Building',
}

const SELECTABLE_TYPES = ['entrance', 'stairs', 'elevator', 'emergency_exit', 'room', 'corridor']
const EXIT_TYPES = ['emergency_exit', 'entrance']

function getBuildingFromUrl() {
  const params = new URLSearchParams(window.location.search)
  return params.get('building') || 'building-1'
}

function getLocationIcon(item) {
  const type = item.nodeType || item.node_type
  if (type === 'emergency_exit') return '🚪 '
  if (type === 'stairs') return '↑ '
  if (type === 'elevator') return '⇕ '
  if (type === 'entrance') return '🏛️ '
  return '📍 '
}

function getLocationName(item) {
  return item.nodeName || item.node_name || item.roomName || item.room_name || item.id
}

export default function EvacuationPage() {
  const buildingId = getBuildingFromUrl()
  const buildingName = BUILDING_NAMES[buildingId] || 'Strathmore University'

  const [floors, setFloors] = useState([])
  const [selectedFloor, setSelectedFloor] = useState(null)
  const [mapUrl, setMapUrl] = useState('')
  const [floorNodes, setFloorNodes] = useState([])
  const [floorEdges, setFloorEdges] = useState([])
  const [floorRooms, setFloorRooms] = useState([])

  const [fromNodeId, setFromNodeId] = useState('')
  const [toNodeId, setToNodeId] = useState('')
  const [routePath, setRoutePath] = useState([])
  const [navLoading, setNavLoading] = useState(false)
  const [navError, setNavError] = useState('')
  const [routeFound, setRouteFound] = useState(false)

  useEffect(() => {
    async function loadFloors() {
      try {
        const floorsData = await floorPlansService.getFloorsByBuilding(buildingId)
        const list = Array.isArray(floorsData) ? floorsData : (floorsData?.data || [])
        setFloors(list)
        if (list.length > 0) setSelectedFloor(list[0])
      } catch (e) {
        console.error('Failed to load floors:', e)
      }
    }
    loadFloors()
  }, [buildingId])

  useEffect(() => {
    if (!selectedFloor) return

    const floorId = selectedFloor.floor_id || selectedFloor.id || selectedFloor.floorId
    const imageUrl = floorPlansService.getImageUrl
      ? floorPlansService.getImageUrl(selectedFloor.map_image_url)
      : (selectedFloor.map_image_url || '/floor-plans/placeholder.png')
    setMapUrl(imageUrl || '/floor-plans/placeholder.png')

    setFromNodeId('')
    setToNodeId('')
    setRoutePath([])
    setNavError('')
    setRouteFound(false)

    async function loadNodesAndEdges() {
      try {
        const [nodesRaw, edgesRaw, roomsRaw] = await Promise.all([
          getNodesForFloor(floorId),
          getEdgesForFloor(floorId),
          floorPlansService.getRoomsForFloor(floorId),
        ])
        const nodes = Array.isArray(nodesRaw) ? nodesRaw : (nodesRaw?.data || [])
        const edges = Array.isArray(edgesRaw) ? edgesRaw : (edgesRaw?.data || [])
        const rooms = Array.isArray(roomsRaw) ? roomsRaw : (roomsRaw?.data || [])

        const normalizedNodes = nodes.map(n => ({
          ...n,
          id: n.node_id || n.id,
          xCoordinate: n.x_coordinate ?? n.xCoordinate,
          yCoordinate: n.y_coordinate ?? n.yCoordinate,
          nodeName: n.node_name ?? n.nodeName ?? n.id,
          nodeType: n.node_type ?? n.nodeType ?? 'corridor',
        }))
        setFloorNodes(normalizedNodes)
        setFloorEdges(edges)
        setFloorRooms(rooms)
      } catch (e) {
        console.error('Failed to load nodes/edges:', e)
        setFloorNodes([])
        setFloorEdges([])
        setFloorRooms([])
      }
    }

    loadNodesAndEdges()
  }, [selectedFloor])

  const locationOptions = floorNodes.filter(
    n => n.nodeName && n.nodeName.trim() && SELECTABLE_TYPES.includes(n.nodeType)
  )

  const exitOptions = floorNodes.filter(
    n => n.nodeName && n.nodeName.trim() && EXIT_TYPES.includes(n.nodeType)
  )

  const fromNode = locationOptions.find(n => n.id === fromNodeId)
  const toNode = exitOptions.find(n => n.id === toNodeId)

  const handleFindSafeExit = async () => {
    if (!fromNodeId || !toNodeId) {
      setNavError('Please select your current location and a safe exit.')
      return
    }
    if (fromNodeId === toNodeId) {
      setNavError('Current location and safe exit cannot be the same.')
      return
    }

    const floorId = selectedFloor?.floor_id || selectedFloor?.id || selectedFloor?.floorId
    if (!floorId) {
      setNavError('No floor selected.')
      return
    }

    setNavLoading(true)
    setNavError('')
    setRoutePath([])
    setRouteFound(false)

    try {
      const result = await getRoute(null, fromNodeId, toNodeId, floorId)
      if (result?.error) {
        setNavError(result.error)
      } else if (result?.pathNodes && result.pathNodes.length > 0) {
        const normalized = result.pathNodes.map(n => ({
          ...n,
          id: n.node_id || n.id,
          xCoordinate: n.x_coordinate ?? n.xCoordinate,
          yCoordinate: n.y_coordinate ?? n.yCoordinate,
        }))
        setRoutePath(normalized)
        setRouteFound(true)
      } else {
        setNavError('No safe exit route found. Follow building staff instructions.')
      }
    } catch (e) {
      setNavError('Unable to calculate route. Follow building staff instructions.')
      console.error('Evacuation routing error:', e)
    } finally {
      setNavLoading(false)
    }
  }

  const handleClear = () => {
    setRoutePath([])
    setFromNodeId('')
    setToNodeId('')
    setNavError('')
    setRouteFound(false)
  }

  return (
    <div className="evacuation-app">
      <header className="evacuation-header">
        <img
          src="/strathmore-logo.png"
          alt="Strathmore University"
          className="evacuation-logo"
        />
        <h1 className="evacuation-title">Emergency Evacuation Guidance System</h1>
        <p className="evacuation-building">{buildingName}</p>
      </header>

      <main className="evacuation-main">
        {floors.length > 1 && (
          <div className="evacuation-floor-bar">
            <span className="evacuation-floor-label">Floor</span>
            <div className="evacuation-floor-buttons">
              {floors.map(f => {
                const fId = f.floor_id || f.id || f.floorId
                const selId = selectedFloor?.floor_id || selectedFloor?.id || selectedFloor?.floorId
                return (
                  <button
                    key={fId}
                    type="button"
                    className={`evacuation-floor-btn${fId === selId ? ' active' : ''}`}
                    onClick={() => setSelectedFloor(f)}
                  >
                    {f.floor_name || f.floorName || `Floor ${f.floor_number ?? fId}`}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        <section className="evacuation-controls">
          <div className="evacuation-field">
            <label htmlFor="current-location">Current Location</label>
            <select
              id="current-location"
              value={fromNodeId}
              onChange={e => {
                setFromNodeId(e.target.value)
                setRoutePath([])
                setNavError('')
                setRouteFound(false)
              }}
            >
              <option value="">— Select where you are —</option>
              {locationOptions.map(item => (
                <option key={item.id} value={item.id}>
                  {getLocationIcon(item)}{getLocationName(item)}
                </option>
              ))}
            </select>
          </div>

          <div className="evacuation-field">
            <label htmlFor="safe-exit">Safe Exit / Assembly Point</label>
            <select
              id="safe-exit"
              value={toNodeId}
              onChange={e => {
                setToNodeId(e.target.value)
                setRoutePath([])
                setNavError('')
                setRouteFound(false)
              }}
            >
              <option value="">— Select safe exit —</option>
              {exitOptions.filter(item => item.id !== fromNodeId).map(item => (
                <option key={item.id} value={item.id}>
                  {getLocationIcon(item)}{getLocationName(item)}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            className="evacuation-find-btn"
            onClick={handleFindSafeExit}
            disabled={navLoading || !fromNodeId || !toNodeId}
          >
            {navLoading ? 'Finding safe exit…' : 'Find Safe Exit'}
          </button>

          {routeFound && (
            <button type="button" className="evacuation-clear-btn" onClick={handleClear}>
              Clear Route
            </button>
          )}
        </section>

        {navError && (
          <div className="evacuation-alert evacuation-alert--error" role="alert">
            {navError}
          </div>
        )}

        {routeFound && fromNode && toNode && (
          <div className="evacuation-alert evacuation-alert--success" role="status">
            Safe exit route: <strong>{getLocationName(fromNode)}</strong> → <strong>{getLocationName(toNode)}</strong>
            {' '}({routePath.length} waypoints) — Follow the highlighted path on the map.
          </div>
        )}

        <section className="evacuation-map-section">
          {floorNodes.length === 0 && !navLoading ? (
            <div className="evacuation-map-empty">
              <div className="evacuation-map-empty-icon">🗺️</div>
              <p>Evacuation map is not yet configured for this floor.</p>
              <p className="evacuation-map-empty-sub">Follow building staff and posted exit signs.</p>
            </div>
          ) : (
            <MapView
              mapUrl={mapUrl}
              rooms={floorRooms}
              nodes={floorNodes}
              edges={floorEdges}
              path={routePath.map(n => n.id)}
              evacuationMode
            />
          )}
        </section>

        <footer className="evacuation-footer">
          <p>In an emergency, stay calm and follow staff instructions. Do not use elevators.</p>
        </footer>
      </main>
    </div>
  )
}
