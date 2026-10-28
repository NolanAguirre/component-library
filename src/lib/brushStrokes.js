export const applyStrokeStyle = (ctx, stroke) => {
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.lineWidth = stroke.size

  if (stroke.erase || stroke.tool === 'erase') {
    ctx.globalCompositeOperation = 'destination-out'
    ctx.globalAlpha = 1
    ctx.strokeStyle = 'rgba(0, 0, 0, 1)'
    return
  }

  ctx.globalCompositeOperation = 'source-over'
  ctx.globalAlpha = stroke.opacity ?? 1
  ctx.strokeStyle = stroke.color
}

export const strokePath = (ctx, points) => {
  if (!points.length) return

  ctx.beginPath()

  if (points.length === 1) {
    const { x, y } = points[0]
    ctx.moveTo(x, y)
    ctx.lineTo(x + 0.01, y + 0.01)
    ctx.stroke()
    return
  }

  ctx.moveTo(points[0].x, points[0].y)
  for (let i = 1; i < points.length; i += 1) {
    ctx.lineTo(points[i].x, points[i].y)
  }
  ctx.stroke()
}

export const drawStroke = (ctx, stroke, points = stroke.points) => {
  ctx.save()
  applyStrokeStyle(ctx, stroke)
  strokePath(ctx, points)
  ctx.restore()
}
