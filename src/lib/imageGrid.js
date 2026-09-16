// Rounded shared boundaries preserve every pixel when dimensions do not divide evenly.
const imageGridCells = (width, height, rows, columns, { top = 0, right = 0, bottom = 0, left = 0 } = {}) => {
  if (![width, height, rows, columns].every(Number.isInteger) ||
      rows < 1 || columns < 1 || width < columns || height < rows) return []
  if (![top, right, bottom, left].every(value => Number.isInteger(value) && value >= 0)) return []
  const innerWidth = width - left - right
  const innerHeight = height - top - bottom
  if (innerWidth < columns || innerHeight < rows) return []
  return Array.from({ length: rows * columns }, (_, index) => {
    const row = Math.floor(index / columns)
    const column = index % columns
    const x = left + Math.round(column * innerWidth / columns)
    const y = top + Math.round(row * innerHeight / rows)
    return {
      row, column, x, y,
      width: left + Math.round((column + 1) * innerWidth / columns) - x,
      height: top + Math.round((row + 1) * innerHeight / rows) - y,
    }
  })
}

const splitCanvasGrid = (canvas, rows, columns, offsets) => imageGridCells(canvas.width, canvas.height, rows, columns, offsets).map(cell => {
  const output = document.createElement('canvas')
  output.width = cell.width
  output.height = cell.height
  output.getContext('2d').drawImage(canvas, cell.x, cell.y, cell.width, cell.height, 0, 0, cell.width, cell.height)
  return { ...cell, image: output.toDataURL('image/png') }
})

export { imageGridCells, splitCanvasGrid }
