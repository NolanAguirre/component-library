import { createImageRegistration, toGray } from './imageRegistration'

const workerSource = `(${createImageRegistration.toString()})()`

const spawnWorker = () => {
  const url = URL.createObjectURL(new Blob([workerSource], { type: 'text/javascript' }))
  const worker = new Worker(url)
  const terminate = () => {
    worker.terminate()
    URL.revokeObjectURL(url)
  }
  return { worker, terminate }
}

/**
 * registerImages — browser adapter around the registration worker.
 *
 * Loads both sources, draws them into grayscale working copies capped at
 * `workingSize` (the candidate is drawn to the reference's fit dimensions so
 * registration happens in reference pixel space), then runs the search in a
 * Blob Worker. The returned translation is rescaled from working-copy pixels to
 * reference natural pixels; scale is resolution-independent.
 *
 * Resolves `{ scale, translateX, translateY, score, overlap, ok,
 * referenceWidth, referenceHeight }`. Rejects on load errors or a tainted
 * canvas (cross-origin without CORS).
 */

const WORKING_SIZE = 512

const loadImage = (src) => new Promise((resolve, reject) => {
  const img = new Image()
  img.crossOrigin = 'anonymous'
  img.onload = () => resolve(img)
  img.onerror = () => reject(new Error(`registerImages: failed to load ${src}`))
  img.src = src
})

const fitDims = (w, h, max) => {
  const longest = Math.max(w, h)
  if (longest <= max) return { width: w, height: h }
  const k = max / longest
  return { width: Math.max(1, Math.round(w * k)), height: Math.max(1, Math.round(h * k)) }
}

const drawGray = (img, width, height) => {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  ctx.drawImage(img, 0, 0, width, height)
  // getImageData throws a SecurityError on a tainted (cross-origin) canvas.
  return toGray(ctx.getImageData(0, 0, width, height))
}

const registerImages = (referenceSrc, candidateSrc, { workingSize = WORKING_SIZE } = {}) =>
  Promise.all([loadImage(referenceSrc), loadImage(candidateSrc)]).then(([refImg, candImg]) => {
    const referenceWidth = refImg.naturalWidth
    const referenceHeight = refImg.naturalHeight
    const { width, height } = fitDims(referenceWidth, referenceHeight, workingSize)
    const ref = drawGray(refImg, width, height)
    const cand = drawGray(candImg, width, height)

    return new Promise((resolve, reject) => {
      const { worker, terminate } = spawnWorker()
      worker.onmessage = (event) => {
        const result = event.data
        terminate()
        const k = referenceWidth / width
        resolve({
          scale: result.scale,
          translateX: result.translateX * k,
          translateY: result.translateY * k,
          score: result.score,
          overlap: result.overlap,
          ok: result.ok,
          referenceWidth,
          referenceHeight,
        })
      }
      worker.onerror = (error) => {
        terminate()
        reject(error)
      }
      worker.postMessage(
        {
          ref: { width: ref.width, height: ref.height, data: ref.data },
          cand: { width: cand.width, height: cand.height, data: cand.data },
        },
        [ref.data.buffer, cand.data.buffer],
      )
    })
  })

export default registerImages
