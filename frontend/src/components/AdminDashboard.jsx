import React, { useEffect, useMemo, useState } from 'react'
import MapView from './MapView'
import { floorPlansService } from '../services/floorPlansService'

const ROOM_TYPES = ['classroom', 'office', 'restroom', 'cafeteria', 'lab', 'library', 'corridor', 'other']

export default function AdminDashboard({ user, onLogout }) {
  const [buildings] = useState(['building-1'])
  const [selectedBuildingId] = useState('building-1')
  const [floors, setFloors] = useState([])
  const [selectedFloorId, setSelectedFloorId] = useState('')
  const [rooms, setRooms] = useState([])
  const [nodes, setNodes] = useState([])
  const [edges, setEdges] = useState([])
  const [mapUrl, setMapUrl] = useState('')
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState('')

  const [roomForm, setRoomForm] = useState({ roomName: '', roomType: 'office', description: '', xCoordinate: '', yCoordinate: '' })
  const [nodeForm, setNodeForm] = useState({ nodeName: '', nodeType: 'regular', xCoordinate: '', yCoordinate: '' })
  const [edgeForm, setEdgeForm] = useState({ startNodeId: '', endNodeId: '', distance: '' })
  const [pickerTarget, setPickerTarget] = useState('room')
  const [edgeDrawMode, setEdgeDrawMode] = useState(false)
  const [selectedNodesForEdge, setSelectedNodesForEdge] = useState([])

  useEffect(() => {
    const loadFloors = async () => {
      const data = await floorPlansService.getFloorsByBuilding(selectedBuildingId)
      setFloors(data || [])
      if (data && data.length > 0) {
        setSelectedFloorId(data[0].floor_id)
        setMapUrl(floorPlansService.getImageUrl(data[0].map_image_url))
      }
    }

    loadFloors().catch(console.error)
  }, [selectedBuildingId])

  useEffect(() => {
    const loadFloorData = async () => {
      if (!selectedFloorId) return
      const floor = floors.find(item => item.floor_id === selectedFloorId)
      setMapUrl(floorPlansService.getImageUrl(floor?.map_image_url))
      const [roomsData, nodesData, edgesData] = await Promise.all([
        floorPlansService.getRoomsForFloor(selectedFloorId),
        floorPlansService.getNodesForFloor(selectedFloorId),
        floorPlansService.getEdgesForFloor(selectedFloorId),
      ])
      setRooms(roomsData || [])
      setNodes(nodesData || [])
      setEdges(edgesData || [])
      setEdgeForm(prev => ({ ...prev, startNodeId: nodesData?.[0]?.node_id || '', endNodeId: nodesData?.[1]?.node_id || '' }))
    }

    loadFloorData().catch(console.error)
  }, [selectedFloorId, floors])

  const selectedFloor = useMemo(() => floors.find(item => item.floor_id === selectedFloorId), [floors, selectedFloorId])

  const handleMapPick = ({ x, y }) => {
    if (pickerTarget === 'room') {
      setRoomForm(prev => ({ ...prev, xCoordinate: String(x), yCoordinate: String(y) }))
      return
    }
    setNodeForm(prev => ({ ...prev, xCoordinate: String(x), yCoordinate: String(y) }))
  }

  const handleRoomMove = async (roomId, { x, y }) => {
    setActionError('')
    setRooms(prev => prev.map(room => {
      const id = room.roomId ?? room.room_id ?? room.id
      if (id !== roomId) return room
      return { ...room, x_coordinate: x, y_coordinate: y }
    }))

    try {
      await floorPlansService.updateRoom(selectedFloorId, roomId, { xCoordinate: x, yCoordinate: y })
      await refresh()
    } catch (error) {
      setActionError(error?.message || 'Failed to move room')
      await refresh()
    }
  }

  const handleNodeMove = async (nodeId, { x, y }) => {
    setActionError('')
    setNodes(prev => prev.map(node => {
      const id = node.id ?? node.node_id
      if (id !== nodeId) return node
      return { ...node, x_coordinate: x, y_coordinate: y }
    }))

    try {
      await floorPlansService.updateNode(selectedFloorId, nodeId, { xCoordinate: x, yCoordinate: y })
      await refresh()
    } catch (error) {
      setActionError(error?.message || 'Failed to move node')
      await refresh()
    }
  }

  const handleNodeRename = async (nodeId, nodeName) => {
    setActionError('')
    setNodes(prev => prev.map(node => {
      const id = node.id ?? node.node_id
      if (id !== nodeId) return node
      return { ...node, node_name: nodeName }
    }))

    try {
      await floorPlansService.updateNode(selectedFloorId, nodeId, { nodeName })
      await refresh()
    } catch (error) {
      setActionError(error?.message || 'Failed to rename node')
      await refresh()
    }
  }

  const refresh = async () => {
    if (!selectedFloorId) return
    const [roomsData, nodesData, edgesData] = await Promise.all([
      floorPlansService.getRoomsForFloor(selectedFloorId),
      floorPlansService.getNodesForFloor(selectedFloorId),
      floorPlansService.getEdgesForFloor(selectedFloorId),
    ])
    setRooms(roomsData || [])
    setNodes(nodesData || [])
    setEdges(edgesData || [])
  }

  const handleRoomSubmit = async (e) => {
    e.preventDefault()
    setActionError('')
    setBusy(true)
    try {
      await floorPlansService.createRoom(selectedFloorId, {
        roomName: roomForm.roomName,
        roomType: roomForm.roomType,
        description: roomForm.description,
        xCoordinate: Number(roomForm.xCoordinate),
        yCoordinate: Number(roomForm.yCoordinate),
        buildingId: selectedBuildingId,
      })
      setRoomForm({ roomName: '', roomType: 'office', description: '', xCoordinate: '', yCoordinate: '' })
      await refresh()
    } catch (error) {
      setActionError(error?.message || 'Failed to add room')
    } finally {
      setBusy(false)
    }
  }

  const handleNodeSubmit = async (e) => {
    e.preventDefault()
    setActionError('')
    setBusy(true)
    try {
      await floorPlansService.createNode(selectedFloorId, {
        nodeName: nodeForm.nodeName,
        nodeType: nodeForm.nodeType,
        xCoordinate: Number(nodeForm.xCoordinate),
        yCoordinate: Number(nodeForm.yCoordinate),
        buildingId: selectedBuildingId,
      })
      setNodeForm({ nodeName: '', nodeType: 'regular', xCoordinate: '', yCoordinate: '' })
      await refresh()
    } catch (error) {
      setActionError(error?.message || 'Failed to add node')
    } finally {
      setBusy(false)
    }
  }

  const handleEdgeSubmit = async (e) => {
    e.preventDefault()
    setActionError('')
    setBusy(true)
    try {
      await floorPlansService.createEdge(selectedFloorId, {
        startNodeId: edgeForm.startNodeId,
        endNodeId: edgeForm.endNodeId,
        distance: Number(edgeForm.distance),
        buildingId: selectedBuildingId,
      })
      setEdgeForm(prev => ({ ...prev, distance: '' }))
      await refresh()
    } catch (error) {
      setActionError(error?.message || 'Failed to add route')
    } finally {
      setBusy(false)
    }
  }

  const deleteRoom = async (roomId) => {
    await floorPlansService.deleteRoom(selectedFloorId, roomId)
    await refresh()
  }

  const deleteNode = async (nodeId) => {
    await floorPlansService.deleteNode(selectedFloorId, nodeId)
    await refresh()
  }

  const deleteEdge = async (edgeId) => {
    await floorPlansService.deleteEdge(selectedFloorId, edgeId)
    await refresh()
  }

  const handleNodeClickForEdge = async (nodeId) => {
    if (!edgeDrawMode) return
    
    const newSelected = [...selectedNodesForEdge, nodeId]
    setSelectedNodesForEdge(newSelected)

    // When 2 nodes are selected, create edge
    if (newSelected.length === 2) {
      const [startNodeId, endNodeId] = newSelected
      setBusy(true)
      try {
        await floorPlansService.createEdge(selectedFloorId, {
          startNodeId,
          endNodeId,
          distance: 1,
          buildingId: selectedBuildingId,
        })
        setSelectedNodesForEdge([])
        await refresh()
        setActionError('')
      } catch (error) {
        setActionError(error?.message || 'Failed to create corridor connection')
      } finally {
        setBusy(false)
      }
    }
  }

  const clearEdgeDrawMode = () => {
    setEdgeDrawMode(false)
    setSelectedNodesForEdge([])
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #f4f7f9 0%, #e9eef3 100%)' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 24px', background: '#0f5132', color: 'white' }}>
        <div>
          <div style={{ fontSize: 12, opacity: 0.8 }}>Admin</div>
          <h1 style={{ margin: 0, fontSize: 22 }}>Indoor Navigation Control Center</h1>
        </div>
        <button onClick={onLogout} style={{ padding: '10px 14px', border: 'none', borderRadius: 8, cursor: 'pointer' }}>Logout</button>
      </header>

      <main style={{ padding: 24, display: 'grid', gap: 24 }}>
        {actionError && (
          <div style={{ background: '#fef3f2', color: '#b42318', border: '1px solid #fecdca', padding: 12, borderRadius: 12 }}>
            {actionError}
          </div>
        )}
        <section style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
          <div style={{ background: 'white', borderRadius: 16, padding: 16, boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
              <div>
                <h2 style={{ margin: 0 }}>Floor Preview</h2>
                <p style={{ margin: '4px 0 0', color: '#667085' }}>Choose a floor and place rooms or navigation nodes directly on the map.</p>
              </div>
              <select value={selectedFloorId} onChange={(e) => setSelectedFloorId(e.target.value)} style={{ padding: 10, borderRadius: 10 }}>
                {floors.map(floor => <option key={floor.floor_id} value={floor.floor_id}>{floor.floor_name} (Floor {floor.floor_number})</option>)}
              </select>
            </div>
            <MapView
              mapUrl={mapUrl}
              rooms={rooms}
              nodes={nodes}
              edges={edges}
              path={[]}
              onMapClick={handleMapPick}
              onRoomMove={handleRoomMove}
              onNodeMove={handleNodeMove}
              onNodeRename={handleNodeRename}
              edgeDrawMode={edgeDrawMode}
              selectedNodesForEdge={selectedNodesForEdge}
              onNodeClickForEdge={handleNodeClickForEdge}
            />
            <div style={{ marginTop: 10, fontSize: 13, color: '#475467' }}>
              Map click target:
              <button type='button' onClick={() => setPickerTarget('room')} style={{ marginLeft: 8, padding: '4px 8px', borderRadius: 8, border: pickerTarget === 'room' ? '2px solid #0f5132' : '1px solid #d0d5dd', background: 'white' }}>Room coordinates</button>
              <button type='button' onClick={() => setPickerTarget('node')} style={{ marginLeft: 8, padding: '4px 8px', borderRadius: 8, border: pickerTarget === 'node' ? '2px solid #0f5132' : '1px solid #d0d5dd', background: 'white' }}>Node coordinates</button>
            </div>
            <div style={{ marginTop: 10, fontSize: 13, color: '#475467', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <button 
                type='button' 
                onClick={() => setEdgeDrawMode(!edgeDrawMode)} 
                style={{ 
                  padding: '6px 12px', 
                  borderRadius: 8, 
                  border: edgeDrawMode ? '2px solid #0f5132' : '1px solid #d0d5dd', 
                  background: edgeDrawMode ? '#d1e7dd' : 'white',
                  cursor: 'pointer',
                  fontWeight: edgeDrawMode ? 600 : 400
                }}
              >
                {edgeDrawMode ? '✓ Draw Corridors' : '✎ Draw Corridors'}
              </button>
              {edgeDrawMode && (
                <>
                  <span style={{ color: '#475467', fontSize: 12 }}>
                    Click nodes to connect: {selectedNodesForEdge.length}/2 selected
                  </span>
                  <button 
                    type='button' 
                    onClick={clearEdgeDrawMode} 
                    style={{ 
                      padding: '4px 10px', 
                      borderRadius: 6, 
                      border: '1px solid #d0d5dd', 
                      background: '#fef3f2',
                      cursor: 'pointer',
                      fontSize: 12
                    }}
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
            <div style={{ marginTop: 6, fontSize: 12, color: '#667085' }}>
              You can drag room and node markers directly on the map to reposition them. Double-click or right-click a node marker to rename it.
            </div>
            <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 8, fontSize: 11 }}>
              {[['classroom','#2563eb'],['office','#7c3aed'],['restroom','#0891b2'],['cafeteria','#d97706'],['lab','#059669'],['library','#dc2626'],['corridor','#6b7280'],['other','#374151']].map(([type, color]) => (
                <span key={type} style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, padding: '2px 6px' }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: color, display: 'inline-block', border: '1.5px solid white', boxShadow: '0 0 0 1px rgba(0,0,0,0.15)' }}></span>
                  {type}
                </span>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gap: 16 }}>
            <div style={{ background: 'white', borderRadius: 16, padding: 16, boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}>
              <h3 style={{ marginTop: 0 }}>System Summary</h3>
              <div>Floors: {floors.length}</div>
              <div>Rooms: {rooms.length}</div>
              <div>Nodes: {nodes.length}</div>
              <div>Edges: {edges.length}</div>
              <div>Admin: {user?.email}</div>
            </div>
            <div style={{ background: 'white', borderRadius: 16, padding: 16, boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}>
              <h3 style={{ marginTop: 0 }}>Floors</h3>
              <div style={{ display: 'grid', gap: 8 }}>
                {floors.map(floor => (
                  <button key={floor.floor_id} onClick={() => setSelectedFloorId(floor.floor_id)} style={{ textAlign: 'left', padding: 12, borderRadius: 10, border: selectedFloorId === floor.floor_id ? '2px solid #0f5132' : '1px solid #d0d5dd', background: 'white', cursor: 'pointer' }}>
                    {floor.floor_name} - {floor.map_image_url || 'No image'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          <form onSubmit={handleRoomSubmit} style={{ background: 'white', borderRadius: 16, padding: 16, boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}>
            <h3>Rooms</h3>
            <input placeholder='Room name' value={roomForm.roomName} onChange={(e) => setRoomForm({ ...roomForm, roomName: e.target.value })} style={{ width: '100%', marginBottom: 8, padding: 10 }} />
            <select value={roomForm.roomType} onChange={(e) => setRoomForm({ ...roomForm, roomType: e.target.value })} style={{ width: '100%', marginBottom: 8, padding: 10 }}>
              {ROOM_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
            </select>
            <input placeholder='Description' value={roomForm.description} onChange={(e) => setRoomForm({ ...roomForm, description: e.target.value })} style={{ width: '100%', marginBottom: 8, padding: 10 }} />
            <div style={{ display: 'flex', gap: 8 }}>
              <input placeholder='X' value={roomForm.xCoordinate} onChange={(e) => setRoomForm({ ...roomForm, xCoordinate: e.target.value })} style={{ width: '50%', padding: 10 }} />
              <input placeholder='Y' value={roomForm.yCoordinate} onChange={(e) => setRoomForm({ ...roomForm, yCoordinate: e.target.value })} style={{ width: '50%', padding: 10 }} />
            </div>
            <div style={{ fontSize: 12, color: '#667085', marginTop: 6 }}>Tip: set Map click target to Room coordinates, then click on the map to auto-fill X/Y.</div>
            <button disabled={busy} type='submit' style={{ marginTop: 10, width: '100%', padding: 12 }}>Add Room</button>
            <div style={{ marginTop: 12, maxHeight: 220, overflow: 'auto' }}>
              {rooms.map(room => (
                <div key={room.room_id} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, borderBottom: '1px solid #eee', padding: '8px 0' }}>
                  <span>{room.room_name} ({room.x_coordinate}, {room.y_coordinate})</span>
                  <button type='button' onClick={() => deleteRoom(room.room_id)}>Delete</button>
                </div>
              ))}
            </div>
          </form>

          <form onSubmit={handleNodeSubmit} style={{ background: 'white', borderRadius: 16, padding: 16, boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}>
            <h3>Navigation Nodes</h3>
            <input placeholder='Node name (e.g. Room 101, Main Stairway)' value={nodeForm.nodeName} onChange={(e) => setNodeForm({ ...nodeForm, nodeName: e.target.value })} style={{ width: '100%', marginBottom: 8, padding: 10 }} />
            <select value={nodeForm.nodeType} onChange={(e) => setNodeForm({ ...nodeForm, nodeType: e.target.value })} style={{ width: '100%', marginBottom: 8, padding: 10 }}>
              <option value='regular'>Corridor / Hallway (waypoint)</option>
              <option value='entrance'>Entrance / Exit (selectable destination)</option>
              <option value='stairs'>Stairs (floor transition)</option>
              <option value='elevator'>Elevator (floor transition)</option>
              <option value='emergency_exit'>Emergency Exit (evacuation)</option>
            </select>
            <div style={{ display: 'flex', gap: 8 }}>
              <input placeholder='X' value={nodeForm.xCoordinate} onChange={(e) => setNodeForm({ ...nodeForm, xCoordinate: e.target.value })} style={{ width: '50%', padding: 10 }} />
              <input placeholder='Y' value={nodeForm.yCoordinate} onChange={(e) => setNodeForm({ ...nodeForm, yCoordinate: e.target.value })} style={{ width: '50%', padding: 10 }} />
            </div>
            <div style={{ fontSize: 12, color: '#667085', marginTop: 6 }}>Tip: set Map click target to Node coordinates, then click on the map to auto-fill X/Y.</div>
            <button disabled={busy} type='submit' style={{ marginTop: 10, width: '100%', padding: 12 }}>Add Node</button>
            <div style={{ marginTop: 12, maxHeight: 220, overflow: 'auto' }}>
              {nodes.map(node => (
                <div key={node.node_id} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, borderBottom: '1px solid #eee', padding: '8px 0' }}>
                  <span>
                    {node.node_type === 'stairway' ? '↑ ' : node.node_type === 'elevator' ? '⇑ ' : node.node_type === 'room' ? '📍 ' : '• '}
                    {node.node_name || 'Unnamed'}
                    <span style={{ fontSize: 11, color: '#888', marginLeft: 4 }}>({node.node_type || 'corridor'})</span>
                  </span>
                  <button type='button' onClick={() => deleteNode(node.node_id)}>Delete</button>
                </div>
              ))}
            </div>
          </form>

          <form onSubmit={handleEdgeSubmit} style={{ background: 'white', borderRadius: 16, padding: 16, boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}>
            <h3>Routes / Corridors</h3>
            <p style={{ fontSize: 12, color: '#666', marginBottom: 12 }}>Connect navigation nodes with corridors. Routes will only flow through these connections.</p>
            <select value={edgeForm.startNodeId} onChange={(e) => setEdgeForm({ ...edgeForm, startNodeId: e.target.value })} style={{ width: '100%', marginBottom: 8, padding: 10 }}>
              <option value=''>— From Node —</option>
              {nodes.map(node => <option key={node.node_id} value={node.node_id}>{node.node_name || node.node_id}</option>)}
            </select>
            <select value={edgeForm.endNodeId} onChange={(e) => setEdgeForm({ ...edgeForm, endNodeId: e.target.value })} style={{ width: '100%', marginBottom: 8, padding: 10 }}>
              <option value=''>— To Node —</option>
              {nodes.map(node => <option key={node.node_id} value={node.node_id}>{node.node_name || node.node_id}</option>)}
            </select>
            <input placeholder='Corridor Length (optional weight, default: 1)' value={edgeForm.distance} onChange={(e) => setEdgeForm({ ...edgeForm, distance: e.target.value })} style={{ width: '100%', marginBottom: 8, padding: 10 }} />
            <div style={{ fontSize: 12, color: '#667085', marginBottom: 10 }}>Tip: Leave blank or use 1 for equal-length corridors. Higher values = longer paths (less preferred by routing).</div>
            <button disabled={busy} type='submit' style={{ marginTop: 10, width: '100%', padding: 12 }}>Add Corridor Connection</button>
            <div style={{ marginTop: 12, maxHeight: 220, overflow: 'auto' }}>
              {edges.map(edge => {
                const startNode = nodes.find(n => n.node_id === edge.start_node_id)
                const endNode = nodes.find(n => n.node_id === edge.end_node_id)
                return (
                  <div key={edge.edge_id} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, borderBottom: '1px solid #eee', padding: '8px 0' }}>
                    <span>{startNode?.node_name || edge.start_node_id} ↔ {endNode?.node_name || edge.end_node_id} (weight: {edge.weight})</span>
                    <button type='button' onClick={() => deleteEdge(edge.edge_id)}>Delete</button>
                  </div>
                )
              })}
            </div>
          </form>
        </section>
      </main>
    </div>
  )
}