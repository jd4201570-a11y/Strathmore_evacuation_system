import React, { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

export default function MapView({
  mapUrl,
  floorMapUrl = '/floor-plans/placeholder.png',
  nodes = [],
  rooms = [],
  edges = [],
  path = [],
  evacuationMode = false,
  width = 2000,
  height = 1500,
  onMapClick,
  onRoomMove,
  onNodeMove,
  onNodeRename,
  edgeDrawMode = false,
  selectedNodesForEdge = [],
  onNodeClickForEdge,
}) {
  const BASE_ZOOM = 0
  const containerRef = useRef(null)
  const mapRef = useRef(null)

  // ── Effect 1: initialize map once (only re-runs when image/dimensions change) ──
  useEffect(() => {
    if (!containerRef.current) return

    // Clean up existing map instance
    if (mapRef.current) {
      try { mapRef.current.remove() } catch (e) { /* already removed */ }
      mapRef.current = null
    }
    if (containerRef.current._leaflet_id) {
      try { delete containerRef.current._leaflet_id } catch (e) { /* ignore */ }
    }

    try {
      const map = L.map(containerRef.current, {
        crs: L.CRS.Simple,
        minZoom: -5,
        maxZoom: 5,
        dragging: true,
        scrollWheelZoom: true,
        doubleClickZoom: true,
        boxZoom: true,
        keyboard: true,
        touchZoom: true,
        zoomControl: true,
      })
      mapRef.current = map

      const src = mapUrl || floorMapUrl
      const southWest = map.unproject([0, height], BASE_ZOOM)
      const northEast = map.unproject([width, 0], BASE_ZOOM)
      const bounds = new L.LatLngBounds(southWest, northEast)
      L.imageOverlay(src, bounds).addTo(map)
      map.setMaxBounds(bounds)
      map.options.maxBoundsViscosity = 1.0
      map.fitBounds(bounds)

      // helpers (defined once on map object)
      const ROOM_TYPE_COLORS = {
        classroom: '#2563eb', office: '#7c3aed', restroom: '#0891b2',
        cafeteria: '#d97706', lab: '#059669', library: '#6B1A1A',
        corridor: '#6b7280', other: '#374151',
      }

      map.renderRooms = (roomsList) => {
        if (map._roomsLayer) map.removeLayer(map._roomsLayer)
        const layer = L.layerGroup()
        roomsList.forEach(room => {
          const x = room.xCoordinate ?? room.x_coordinate
          const y = room.yCoordinate ?? room.y_coordinate
          const name = room.roomName ?? room.room_name ?? room.locationName ?? room.location_name ?? 'Room'
          const roomId = room.roomId ?? room.room_id ?? room.id
          const roomType = (room.roomType ?? room.room_type ?? 'other').toLowerCase()
          const color = ROOM_TYPE_COLORS[roomType] || ROOM_TYPE_COLORS.other
          if (x == null || y == null) return
          const point = map.unproject([x, y], BASE_ZOOM)
          const marker = L.marker(point, {
            draggable: Boolean(onRoomMove && roomId),
            icon: L.divIcon({
              className: 'room-dot-marker',
              html: `<div style="width:14px;height:14px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.4);"></div>`,
              iconSize: [14, 14], iconAnchor: [7, 7],
            }),
          })
          if (onRoomMove && roomId) {
            marker.on('dragend', () => {
              const p = map.project(marker.getLatLng(), BASE_ZOOM)
              onRoomMove(roomId, { x: Math.round(p.x), y: Math.round(p.y) })
            })
          }
          marker.bindTooltip(`<span style="font-weight:600;">${name}</span><br/><span style="font-size:10px;color:#6b7280;text-transform:capitalize;">${roomType}</span>`, {
            permanent: true, direction: 'top', offset: [0, -10], className: 'room-label', opacity: 1,
          })
          marker.addTo(layer)
        })
        layer.addTo(map)
        map._roomsLayer = layer
      }

      const NODE_TYPE_CONFIG = {
        entrance: { html: '<div style="width:14px;height:14px;border-radius:50%;background:#6B1A1A;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.5);"></div>', size: [14,14], anchor:[7,7], permanent:true },
        stairs: { html: '<div style="width:22px;height:22px;border-radius:4px;background:#7c3aed;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;font-size:13px;line-height:1;">&#x2191;</div>', size:[22,22], anchor:[11,11], permanent:true },
        elevator: { html: '<div style="width:22px;height:22px;border-radius:4px;background:#0891b2;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;font-size:13px;line-height:1;">&#x21d5;</div>', size:[22,22], anchor:[11,11], permanent:true },
        emergency_exit: { html: '<div style="width:20px;height:20px;border-radius:4px;background:#6B1A1A;border:2px solid #C9A62F;box-shadow:0 1px 6px rgba(107,26,26,0.5);display:flex;align-items:center;justify-content:center;font-size:12px;color:#C9A62F;font-weight:bold;line-height:1;">!</div>', size:[20,20], anchor:[10,10], permanent:true },
        regular: { html: '<div style="width:7px;height:7px;border-radius:50%;background:#94a3b8;border:1px solid #64748b;opacity:0.7;"></div>', size:[7,7], anchor:[3,3], permanent:false },
        room: { html: '<div style="width:14px;height:14px;border-radius:50%;background:#6B1A1A;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.5);"></div>', size:[14,14], anchor:[7,7], permanent:true },
        stairway: { html: '<div style="width:22px;height:22px;border-radius:4px;background:#7c3aed;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;font-size:13px;line-height:1;">&#x2191;</div>', size:[22,22], anchor:[11,11], permanent:true },
        corridor: { html: '<div style="width:7px;height:7px;border-radius:50%;background:#94a3b8;border:1px solid #64748b;opacity:0.7;"></div>', size:[7,7], anchor:[3,3], permanent:false },
      }

      map.renderNodes = (nodesList) => {
        if (map._nodesLayer) map.removeLayer(map._nodesLayer)
        const layer = L.layerGroup()
        const isAdminView = Boolean(onNodeMove || onNodeRename)
        nodesList.forEach(node => {
          const x = node.xCoordinate ?? node.x_coordinate
          const y = node.yCoordinate ?? node.y_coordinate
          const name = node.nodeName ?? node.node_name ?? 'Node'
          const nodeId = node.id ?? node.node_id
          const nodeType = (node.nodeType ?? node.node_type ?? 'regular').toLowerCase()
          if (x == null || y == null) return
          const point = map.unproject([x, y], BASE_ZOOM)
          const cfg = isAdminView ? null : NODE_TYPE_CONFIG[nodeType] || NODE_TYPE_CONFIG.regular
          const iconHtml = isAdminView
            ? '<div style="width:10px;height:10px;border-radius:2px;background:#6B1A1A;border:2px solid #C9A62F;transform:rotate(45deg);box-shadow:0 1px 3px rgba(0,0,0,0.4);"></div>'
            : cfg.html
          const iconSize = isAdminView ? [10,10] : cfg.size
          const iconAnchor = isAdminView ? [5,5] : cfg.anchor
          const marker = L.marker(point, {
            draggable: Boolean(onNodeMove && nodeId),
            icon: L.divIcon({ className: 'node-dot-marker', html: iconHtml, iconSize, iconAnchor }),
          })
          if (onNodeMove && nodeId) {
            marker.on('dragend', () => {
              const p = map.project(marker.getLatLng(), BASE_ZOOM)
              onNodeMove(nodeId, { x: Math.round(p.x), y: Math.round(p.y) })
            })
          }
          if (onNodeRename && nodeId) {
            const renameNode = () => {
              const nextName = window.prompt('Rename node', String(name || '').trim())
              if (nextName == null) return
              const trimmed = nextName.trim()
              if (!trimmed || trimmed === String(name).trim()) return
              onNodeRename(nodeId, trimmed)
            }
            marker.on('dblclick', renameNode)
            marker.on('contextmenu', renameNode)
          }
          if (edgeDrawMode && onNodeClickForEdge) {
            marker.on('click', () => onNodeClickForEdge(nodeId))
            const isSelected = selectedNodesForEdge.includes(nodeId)
            if (isSelected) {
              marker.setIcon(L.divIcon({
                className: 'node-dot-marker-selected',
                html: '<div style="width:18px;height:18px;border-radius:50%;background:#6B1A1A;border:3px solid #C9A62F;box-shadow:0 0 0 3px rgba(201,166,47,0.3);"></div>',
                iconSize: [18,18], iconAnchor: [9,9],
              }))
            }
          }
          const labelIcon = nodeType === 'stairs' ? '↑ ' : nodeType === 'emergency_exit' ? '🚪 ' : nodeType === 'elevator' ? '⇕ ' : ''
          if (name && name !== 'Node') {
            marker.bindTooltip(`<span style="font-size:11px;font-weight:600;">${labelIcon}${name}</span>`, {
              permanent: false, direction: 'top', offset: [0, -iconAnchor[1]-4], className: 'room-label', opacity: 1,
            })
          }
          marker.addTo(layer)
        })
        layer.addTo(map)
        map._nodesLayer = layer
      }

      map.renderEdges = (nodesList, edgesList) => {
        if (map._edgesLayer) map.removeLayer(map._edgesLayer)
        const layer = L.layerGroup()
        const idToNode = {}
        nodesList.forEach(n => { const id = n.id ?? n.node_id; if (id) idToNode[id] = n })
        edgesList.forEach(edge => {
          const fromId = edge.startNodeId ?? edge.start_node_id
          const toId = edge.endNodeId ?? edge.end_node_id
          const from = idToNode[fromId]; const to = idToNode[toId]
          if (!from || !to) return
          const fx = from.xCoordinate ?? from.x_coordinate; const fy = from.yCoordinate ?? from.y_coordinate
          const tx = to.xCoordinate ?? to.x_coordinate; const ty = to.yCoordinate ?? to.y_coordinate
          if (fx == null || fy == null || tx == null || ty == null) return
          L.polyline([map.unproject([fx, fy], BASE_ZOOM), map.unproject([tx, ty], BASE_ZOOM)], { color: '#C9A62F', weight: 2, opacity: 0.6, dashArray: '4,4' }).addTo(layer)
        })
        layer.addTo(map)
        map._edgesLayer = layer
      }

      map.renderEdgePreview = (nodesList, selectedIds) => {
        if (map._previewLayer) map.removeLayer(map._previewLayer)
        if (selectedIds.length !== 2) return
        const layer = L.layerGroup()
        const idToNode = {}
        nodesList.forEach(n => { const id = n.id ?? n.node_id; if (id) idToNode[id] = n })
        const node1 = idToNode[selectedIds[0]]; const node2 = idToNode[selectedIds[1]]
        if (!node1 || !node2) return
        const x1=node1.xCoordinate??node1.x_coordinate,y1=node1.yCoordinate??node1.y_coordinate
        const x2=node2.xCoordinate??node2.x_coordinate,y2=node2.yCoordinate??node2.y_coordinate
        if (x1==null||y1==null||x2==null||y2==null) return
        L.polyline([map.unproject([x1,y1],BASE_ZOOM),map.unproject([x2,y2],BASE_ZOOM)], { color: '#C9A62F', weight: 3, opacity: 0.7, dashArray: '5,5' }).addTo(layer)
        layer.addTo(map)
        map._previewLayer = layer
      }

      map.renderRouteCoords = (coords) => {
        if (map._routeLayer) map.removeLayer(map._routeLayer)
        const latlngs = coords.map(c => map.unproject([c.x, c.y], BASE_ZOOM))
        map._routeLayer = L.polyline(latlngs, { color: '#6B1A1A', weight: 5 }).addTo(map)
        try { map.fitBounds(map._routeLayer.getBounds(), { padding: [40, 40] }) } catch(e){}
      }

      map.renderRouteNodes = (nodesList, pathIds) => {
        if (map._routeLayer) map.removeLayer(map._routeLayer)
        const layer = L.layerGroup()
        const idToNode = {}
        nodesList.forEach(n => { const id = n.id ?? n.node_id; if (id) idToNode[id] = n })
        const coords = []
        pathIds.forEach((pid, idx) => {
          const n = idToNode[pid]
          const x = n?.xCoordinate ?? n?.x_coordinate
          const y = n?.yCoordinate ?? n?.y_coordinate
          if (n && x != null && y != null) {
            const p = map.unproject([x, y], BASE_ZOOM)
            const isEndpoint = idx === 0 || idx === pathIds.length - 1
            const nodeType = (n.nodeType ?? n.node_type ?? 'corridor').toLowerCase()
            const isStair = nodeType === 'stairway' || nodeType === 'elevator'
            if (isEndpoint) {
              const color = idx === 0 ? '#C9A62F' : '#6B1A1A'
              L.circleMarker(p, { radius: 14, color, weight: 3, fillColor: color, fillOpacity: 0.15 }).addTo(layer)
              L.circleMarker(p, { radius: 6, color, weight: 2, fillColor: color, fillOpacity: 1 }).addTo(layer)
            } else if (isStair) {
              L.marker(p, { icon: L.divIcon({ className: '', html: '<div style="width:18px;height:18px;background:#7c3aed;border:2px solid white;border-radius:3px;display:flex;align-items:center;justify-content:center;font-size:12px;color:white;box-shadow:0 0 0 2px #7c3aed;">&#x2191;</div>', iconSize:[18,18], iconAnchor:[9,9] }) }).addTo(layer)
            } else {
              L.circleMarker(p, { radius: 4, color: '#C9A62F', weight: 2, fillColor: '#C9A62F', fillOpacity: 0.9 }).addTo(layer)
            }
            coords.push({ x, y })
          }
        })
        if (coords.length > 1) {
          const latlngs = coords.map(c => map.unproject([c.x, c.y], BASE_ZOOM))
          // white halo then maroon+gold dashed route
          L.polyline(latlngs, { color: '#ffffff', weight: 8, opacity: 0.6 }).addTo(layer)
          L.polyline(latlngs, { color: '#6B1A1A', weight: 5, opacity: 0.95, dashArray: '10,6' }).addTo(layer)
          L.polyline(latlngs, { color: '#C9A62F', weight: 2, opacity: 0.8, dashArray: '10,6', dashOffset: '8' }).addTo(layer)
        }
        layer.addTo(map)
        map._routeLayer = layer
        if (coords.length > 1) {
          try {
            const latlngs = coords.map(c => map.unproject([c.x, c.y], BASE_ZOOM))
            map.fitBounds(L.polyline(latlngs).getBounds(), { padding: [60, 60] })
          } catch(e){}
        }
      }

      if (onMapClick) {
        map.on('click', (e) => {
          const p = map.project(e.latlng, BASE_ZOOM)
          onMapClick({ x: Math.round(p.x), y: Math.round(p.y) })
        })
      }

      // Initial render
      map.renderRooms(rooms)
      map.renderNodes(nodes)
      if (onNodeMove || onNodeRename || onMapClick) map.renderEdges(nodes, edges)
      if (edgeDrawMode) map.renderEdgePreview(nodes, selectedNodesForEdge)

      window.map = map
    } catch (err) {
      console.error('MapView initialization error:', err)
    }

    return () => {
      if (mapRef.current) {
        try { mapRef.current.off(); mapRef.current.remove() } catch (e) { /* ignore */ }
        mapRef.current = null
      }
    }
  // Only re-init when the image source or canvas dimensions change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapUrl, floorMapUrl, width, height])

  // ── Effect 2: re-render rooms/nodes/edges when data changes (no map re-init) ──
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    map.renderRooms(rooms)
    map.renderNodes(nodes)
    if (onNodeMove || onNodeRename || onMapClick) map.renderEdges(nodes, edges)
    if (edgeDrawMode) map.renderEdgePreview(nodes, selectedNodesForEdge)
  }, [rooms, nodes, edges, edgeDrawMode, selectedNodesForEdge, onNodeMove, onNodeRename, onMapClick])

  // ── Effect 3: update route overlay only when path changes ──
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    if (path && path.length) {
      if (path[0] && typeof path[0] === 'object' && path[0].xCoordinate != null) {
        map.renderRouteCoords(path.map(p => ({ x: p.xCoordinate, y: p.yCoordinate })))
      } else {
        map.renderRouteNodes(nodes, path)
      }
    } else {
      if (map._routeLayer) { map.removeLayer(map._routeLayer); map._routeLayer = null }
    }
  }, [path])

  return (
    <div
      ref={containerRef}
      style={{
        height: '580px',
        width: '100%',
        borderRadius: '0 0 20px 20px',
        background: '#F5EDE3',
      }}
    />
  )
}
