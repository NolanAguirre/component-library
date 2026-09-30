const makeCanvas = (width, height) => {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  return canvas
}

const toHex = channels => `#${channels.map(value => Math.round(value).toString(16).padStart(2, '0')).join('')}`

// Use the most common edge color, rather than averaging foreground and background.
const edgeColor = ({ data, width, height }) => {
  const buckets = new Map()
  const sample = (x, y) => {
    const offset = (y * width + x) * 4
    if (data[offset + 3] < 128) return
    const rgb = [data[offset], data[offset + 1], data[offset + 2]]
    const key = rgb.map(channel => Math.floor(channel / 16)).join(',')
    const bucket = buckets.get(key) || { count: 0, sum: [0, 0, 0] }
    bucket.count += 1
    rgb.forEach((channel, index) => { bucket.sum[index] += channel })
    buckets.set(key, bucket)
  }
  for (let x = 0; x < width; x += 1) { sample(x, 0); sample(x, height - 1) }
  for (let y = 1; y < height - 1; y += 1) { sample(0, y); sample(width - 1, y) }
  const winner = [...buckets.values()].sort((a, b) => b.count - a.count)[0]
  return winner ? toHex(winner.sum.map(value => value / winner.count)) : '#ffffff'
}

// Find a minimum-cost curved path in a band around a user-adjustable boundary hint.
// Disjoint bands keep neighboring paths ordered and prevent empty/crossing regions.
const findSeam = (distances, breadth, length, start, end, hint, tolerance) => {
  const span = end - start + 1
  const parents = new Int8Array(span * length)
  let previous = new Float64Array(span)
  let current = new Float64Array(span)
  const pixelCost = (x, y) => {
    // Look at both sides of a boundary so the seam prefers the middle of a gap.
    const distance = Math.max(distances[y * breadth + x], distances[y * breadth + x - 1])
    const foreground = distance > tolerance ? 20 + 100 * (distance - tolerance) : 0
    return foreground + distance * distance + 0.08 * ((x - hint) / span) ** 2
  }
  for (let i = 0; i < span; i += 1) previous[i] = pixelCost(start + i, 0)
  for (let y = 1; y < length; y += 1) {
    for (let i = 0; i < span; i += 1) {
      let best = previous[i]
      let step = 0
      for (let delta = -2; delta <= 2; delta += 1) {
        const neighbor = i + delta
        if (neighbor < 0 || neighbor >= span) continue
        const cost = previous[neighbor] + Math.abs(delta) * 0.015
        if (cost < best) { best = cost; step = delta }
      }
      current[i] = best + pixelCost(start + i, y)
      parents[y * span + i] = step
    }
    ;[previous, current] = [current, previous]
  }
  let index = 0
  for (let i = 1; i < span; i += 1) if (previous[i] < previous[index]) index = i
  const path = new Float32Array(length)
  let crossings = 0
  for (let y = length - 1; y >= 0; y -= 1) {
    const x = start + index
    path[y] = x / breadth
    if (Math.max(distances[y * breadth + x], distances[y * breadth + x - 1]) > tolerance) crossings += 1
    index += parents[y * span + index]
  }
  return { path, crossingFraction: crossings / length }
}

const analyzeBackgroundSplit = (canvas, { positions, direction = 'columns', color, tolerance = 18 } = {}) => {
  if (!canvas?.width || !canvas?.height) throw new Error('Wait for the image to load.')
  if (!['columns', 'rows'].includes(direction) || !Array.isArray(positions) || positions.length < 1 || positions.length > 49 ||
      positions.some((value, i) => !Number.isFinite(value) || value <= 0 || value >= 1 || (i > 0 && value <= positions[i - 1]))) {
    throw new Error('Choose ordered split positions inside the image.')
  }
  if (!Number.isFinite(tolerance) || tolerance < 1 || tolerance > 100 || (color && !/^#[0-9a-f]{6}$/i.test(color))) {
    throw new Error('Choose a valid background color and tolerance.')
  }
  // Bound analysis work; output still uses the original full-resolution pixels.
  const scale = Math.min(1, 1000 / Math.max(canvas.width, canvas.height))
  const sample = makeCanvas(Math.max(1, Math.round(canvas.width * scale)), Math.max(1, Math.round(canvas.height * scale)))
  const context = sample.getContext('2d', { willReadFrequently: true })
  context.drawImage(canvas, 0, 0, sample.width, sample.height)
  const pixels = context.getImageData(0, 0, sample.width, sample.height)
  const background = color || edgeColor(pixels)
  const rgb = [1, 3, 5].map(index => parseInt(background.slice(index, index + 2), 16))
  const vertical = direction === 'columns'
  const breadth = vertical ? sample.width : sample.height
  const length = vertical ? sample.height : sample.width
  if (breadth < positions.length * 3 + 2) throw new Error('There are too many parts for this image size.')
  const distances = new Float32Array(breadth * length)
  for (let y = 0; y < length; y += 1) {
    for (let x = 0; x < breadth; x += 1) {
      const offset = (vertical ? y * sample.width + x : x * sample.width + y) * 4
      const alpha = pixels.data[offset + 3] / 255
      distances[y * breadth + x] = alpha * Math.hypot(...rgb.map((channel, i) => pixels.data[offset + i] - channel)) / Math.sqrt(3 * 255 ** 2)
    }
  }
  const seams = positions.map((position, i) => {
    const low = i === 0 ? position / 2 : (positions[i - 1] + position) / 2
    const high = i === positions.length - 1 ? (position + 1) / 2 : (position + positions[i + 1]) / 2
    const start = Math.max(1, Math.ceil(low * breadth))
    const end = Math.min(breadth - 1, Math.ceil(high * breadth) - 1)
    if (end < start) throw new Error('Move the split positions farther apart.')
    return findSeam(distances, breadth, length, start, end, position * breadth, tolerance / 100)
  })
  return { direction, seams, color: background, preview: sample.toDataURL('image/png'), width: canvas.width, height: canvas.height }
}

const seamPosition = (path, position) => {
  const coordinate = Math.max(0, Math.min(path.length - 1, position * path.length - 0.5))
  const index = Math.floor(coordinate)
  return path[index] + (path[Math.min(index + 1, path.length - 1)] - path[index]) * (coordinate - index)
}

// Copy each scanline between its two seams. Shared integer boundaries assign every
// source pixel once, while transparent corners allow curved cuts in rectangular PNGs.
const splitCanvasBackground = (canvas, analysis) => {
  if (canvas.width !== analysis.width || canvas.height !== analysis.height) throw new Error('The image changed. Preview the split again.')
  const vertical = analysis.direction === 'columns'
  const breadth = vertical ? canvas.width : canvas.height
  const length = vertical ? canvas.height : canvas.width
  return Array.from({ length: analysis.seams.length + 1 }, (_, index) => {
    const starts = new Int32Array(length)
    const ends = new Int32Array(length)
    let low = breadth
    let high = 0
    for (let line = 0; line < length; line += 1) {
      const position = (line + 0.5) / length
      starts[line] = index === 0 ? 0 : Math.round(seamPosition(analysis.seams[index - 1].path, position) * breadth)
      ends[line] = index === analysis.seams.length ? breadth : Math.round(seamPosition(analysis.seams[index].path, position) * breadth)
      low = Math.min(low, starts[line])
      high = Math.max(high, ends[line])
    }
    const output = makeCanvas(vertical ? high - low : length, vertical ? length : high - low)
    const context = output.getContext('2d')
    for (let line = 0; line < length; line += 1) {
      const size = ends[line] - starts[line]
      if (size < 1) continue
      if (vertical) context.drawImage(canvas, starts[line], line, size, 1, starts[line] - low, line, size, 1)
      else context.drawImage(canvas, line, starts[line], 1, size, line, starts[line] - low, 1, size)
    }
    return { image: output.toDataURL('image/png'), width: output.width, height: output.height }
  })
}

export { analyzeBackgroundSplit, splitCanvasBackground }
