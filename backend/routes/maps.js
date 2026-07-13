const express = require('express')
const path = require('path')
const fs = require('fs')

const router = express.Router()

function getMapsData() {
  const dataPath = path.join(__dirname, '..', 'data', 'maps.json')
  const raw = fs.readFileSync(dataPath, 'utf8')
  return JSON.parse(raw)
}

router.get('/', (req, res) => {
  const data = getMapsData()
  res.json({ floors: data.floors || [] })
})

router.get('/:floorId', (req, res) => {
  const floorId = Number(req.params.floorId)
  const data = getMapsData()
  const floor = (data.floors || []).find((item) => Number(item.id) === floorId)
  if (!floor) {
    return res.status(404).json({ error: 'Floor map not found' })
  }
  return res.json(floor)
})

module.exports = router
