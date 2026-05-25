function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

class MinHeap {
  private heap: { dist: number; node: number }[] = [];

  push(item: { dist: number; node: number }) {
    this.heap.push(item);
    this.bubbleUp(this.heap.length - 1);
  }

  pop(): { dist: number; node: number } | undefined {
    if (this.heap.length === 0) return undefined;
    const top = this.heap[0];
    const last = this.heap.pop()!;
    if (this.heap.length > 0) {
      this.heap[0] = last;
      this.sinkDown(0);
    }
    return top;
  }

  get size() {
    return this.heap.length;
  }

  private bubbleUp(i: number) {
    while (i > 0) {
      const parent = Math.floor((i - 1) / 2);
      if (this.heap[parent].dist <= this.heap[i].dist) break;
      [this.heap[parent], this.heap[i]] = [this.heap[i], this.heap[parent]];
      i = parent;
    }
  }

  private sinkDown(i: number) {
    while (true) {
      let smallest = i;
      const l = 2 * i + 1;
      const r = 2 * i + 2;
      if (l < this.heap.length && this.heap[l].dist < this.heap[smallest].dist) smallest = l;
      if (r < this.heap.length && this.heap[r].dist < this.heap[smallest].dist) smallest = r;
      if (smallest === i) break;
      [this.heap[i], this.heap[smallest]] = [this.heap[smallest], this.heap[i]];
      i = smallest;
    }
  }
}

// Single-source shortest paths from `source` using Dijkstra on a complete graph.
function dijkstraSingle(distMatrix: number[][], source: number): number[] {
  const n = distMatrix.length;
  const dist = new Array<number>(n).fill(Infinity);
  dist[source] = 0;
  const pq = new MinHeap();
  pq.push({ dist: 0, node: source });

  while (pq.size > 0) {
    const { dist: d, node: u } = pq.pop()!;
    if (d > dist[u]) continue;
    for (let v = 0; v < n; v++) {
      if (v === u) continue;
      const nd = dist[u] + distMatrix[u][v];
      if (nd < dist[v]) {
        dist[v] = nd;
        pq.push({ dist: nd, node: v });
      }
    }
  }

  return dist;
}

export type RouteNode = {
  id: string;
  latitude: number;
  longitude: number;
  [key: string]: unknown;
};

export type DijkstraRouteResult = {
  orderedStops: RouteNode[];
  totalDistKm: number;
};

/**
 * Computes an optimized visit order using Dijkstra + greedy nearest-neighbor.
 *
 * Node 0 is the start position; nodes 1..n correspond to `stops`.
 * Dijkstra is run from every node to build an all-pairs distance table,
 * then a nearest-neighbor greedy walk determines the visit order.
 */
export function computeOptimalRoute(
  startLat: number,
  startLon: number,
  stops: RouteNode[]
): DijkstraRouteResult {
  if (stops.length === 0) return { orderedStops: [], totalDistKm: 0 };

  // Build node list: index 0 = start, 1..n = stops
  const nodes = [
    { id: '__start__', latitude: startLat, longitude: startLon } as RouteNode,
    ...stops,
  ];
  const n = nodes.length;

  // Complete Haversine distance matrix
  const distMatrix: number[][] = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) =>
      i === j
        ? 0
        : haversineKm(nodes[i].latitude, nodes[i].longitude, nodes[j].latitude, nodes[j].longitude)
    )
  );

  // All-pairs shortest paths (Dijkstra from each node)
  const allDists = nodes.map((_, i) => dijkstraSingle(distMatrix, i));

  // Greedy nearest-neighbor from start using Dijkstra distances
  const visited = new Set<number>([0]);
  const orderedIndices: number[] = [];
  let current = 0;
  let totalDistKm = 0;

  while (orderedIndices.length < stops.length) {
    let nearestDist = Infinity;
    let nearestNode = -1;

    for (let i = 1; i < n; i++) {
      if (!visited.has(i) && allDists[current][i] < nearestDist) {
        nearestDist = allDists[current][i];
        nearestNode = i;
      }
    }

    if (nearestNode === -1) break;
    visited.add(nearestNode);
    orderedIndices.push(nearestNode);
    totalDistKm += nearestDist;
    current = nearestNode;
  }

  // Map back to original stops (shift by -1 since index 0 is start)
  return {
    orderedStops: orderedIndices.map((i) => stops[i - 1]),
    totalDistKm,
  };
}

/**
 * Builds a Google Maps directions URL for the given ordered stops.
 * Max 8 intermediate waypoints are included (Google Maps free limit).
 */
export function buildGoogleMapsUrl(
  origin: { lat: number; lng: number } | null,
  orderedStops: { latitude: number; longitude: number }[]
): string | null {
  if (orderedStops.length === 0) return null;

  const MAX_WAYPOINTS = 8;
  const destination = orderedStops[orderedStops.length - 1];
  const middlewaypoints = orderedStops.slice(0, -1);

  let url = 'https://www.google.com/maps/dir/?api=1';

  if (origin) {
    url += `&origin=${origin.lat},${origin.lng}`;
  } else {
    // Use first stop as origin
    const first = orderedStops[0];
    url += `&origin=${first.latitude},${first.longitude}`;
    middlewaypoints.shift();
  }

  url += `&destination=${destination.latitude},${destination.longitude}`;

  if (middlewaypoints.length > 0) {
    const capped = middlewaypoints.slice(0, MAX_WAYPOINTS);
    const waypointStr = capped.map((w) => `${w.latitude},${w.longitude}`).join('|');
    url += `&waypoints=${encodeURIComponent(waypointStr)}`;
  }

  url += '&travelmode=driving';
  return url;
}
