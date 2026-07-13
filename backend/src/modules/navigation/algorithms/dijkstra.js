// Dijkstra implementation
function buildGraph(nodes, edges) {
  const graph = new Map();
  nodes.forEach(n => graph.set(n.id, []));
  edges.forEach(e => {
    const from = e.from || e.startNodeId;
    const to = e.to || e.endNodeId;
    const weight = (e.weight != null) ? e.weight : (e.distance != null ? e.distance : 1);
    if (!graph.has(from)) graph.set(from, []);
    if (!graph.has(to)) graph.set(to, []);
    graph.get(from).push({ to, weight });
    graph.get(to).push({ to: from, weight });
  });
  return graph;
}

function dijkstra(nodes, edges, startId, endId) {
  const graph = buildGraph(nodes, edges);
  const dist = {};
  const prev = {};
  const pq = new Set();

  nodes.forEach(n => {
    dist[n.id] = Infinity;
    prev[n.id] = null;
    pq.add(n.id);
  });

  if (!Object.prototype.hasOwnProperty.call(dist, startId) || !Object.prototype.hasOwnProperty.call(dist, endId)) return { path: [], distance: Infinity };

  dist[startId] = 0;

  while (pq.size) {
    let u = null;
    let min = Infinity;
    for (const id of pq) {
      if (dist[id] < min) { min = dist[id]; u = id; }
    }
    if (u === null) break;
    pq.delete(u);
    if (u === endId) break;

    const neighbors = graph.get(u) || [];
    for (const { to, weight } of neighbors) {
      if (!pq.has(to)) continue;
      const alt = dist[u] + weight;
      if (alt < dist[to]) {
        dist[to] = alt;
        prev[to] = u;
      }
    }
  }

  const path = [];
  let u = endId;
  if (prev[u] !== null || u === startId) {
    while (u) {
      path.unshift(u);
      if (u === startId) break;
      u = prev[u];
    }
  }
  return { path, distance: dist[endId] };
}

module.exports = { dijkstra, shortestPath: dijkstra };
