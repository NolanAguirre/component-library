/**
 * imageRegistration — pure, DOM-free constrained image registration.
 *
 * Recovers a uniform scale + translation that maps a candidate image onto a
 * reference image. Transform convention (candidate -> reference pixel space):
 *
 *     x' = s * x + tx
 *     y' = s * y + ty
 *
 * This is exactly the CSS transform a consumer applies to the candidate layer:
 * `translate(tx, ty) scale(s)` with the origin at the reference's top-left.
 *
 * A grayscale image is `{ width, height, data: Float32Array }` (row-major,
 * luminance 0..255). Everything here is deterministic and runs in Node, so the
 * search can be unit-tested without a browser or worker.
 *
 * `createImageRegistration` is a closed factory so its source can be
 * stringified into a Blob Worker without bundler-specific worker imports.
 */

export const createImageRegistration = () => {
// ── Confidence constants ────────────────────────────────────

const SCALE_MIN = 0.7
const SCALE_MAX = 1.4
const MIN_OVERLAP = 0.7
const MIN_SCORE = 0.6

// ── Grayscale helpers ───────────────────────────────────────

const luminance = (r, g, b) => 0.299 * r + 0.587 * g + 0.114 * b

/** Convert an ImageData-like `{ width, height, data }` (RGBA) to grayscale. */
const toGray = ({ width, height, data }) => {
  const out = new Float32Array(width * height)
  for (let i = 0, p = 0; i < out.length; i += 1, p += 4) {
    out[i] = luminance(data[p], data[p + 1], data[p + 2])
  }
  return { width, height, data: out }
}

/** Box downsample by 2x (integer halving of each dimension). */
const downsample2x = (img) => {
  const sw = img.width
  const w = sw >> 1
  const h = img.height >> 1
  const src = img.data
  const out = new Float32Array(w * h)
  for (let y = 0; y < h; y += 1) {
    const sy = y << 1
    for (let x = 0; x < w; x += 1) {
      const sx = x << 1
      const a = src[sy * sw + sx]
      const b = src[sy * sw + sx + 1]
      const c = src[(sy + 1) * sw + sx]
      const d = src[(sy + 1) * sw + sx + 1]
      out[y * w + x] = (a + b + c + d) * 0.25
    }
  }
  return { width: w, height: h, data: out }
}

/** Small separable Gaussian blur (kernel [1 2 1] / 4), clamped at edges. */
const blur3 = (img) => {
  const { width: w, height: h, data } = img
  const tmp = new Float32Array(w * h)
  const out = new Float32Array(w * h)
  for (let y = 0; y < h; y += 1) {
    const row = y * w
    for (let x = 0; x < w; x += 1) {
      const l = data[row + (x > 0 ? x - 1 : 0)]
      const c = data[row + x]
      const r = data[row + (x < w - 1 ? x + 1 : w - 1)]
      tmp[row + x] = (l + 2 * c + r) * 0.25
    }
  }
  for (let y = 0; y < h; y += 1) {
    const row = y * w
    const up = (y > 0 ? y - 1 : 0) * w
    const dn = (y < h - 1 ? y + 1 : h - 1) * w
    for (let x = 0; x < w; x += 1) {
      out[row + x] = (tmp[up + x] + 2 * tmp[row + x] + tmp[dn + x]) * 0.25
    }
  }
  return { width: w, height: h, data: out }
}

/**
 * Build a coarse-to-fine pyramid. Index 0 is the finest (the input); each
 * subsequent level is a blurred half-resolution copy, stopping once the next
 * level would fall below `minSize` on its shortest side.
 */
const buildPyramid = (img, minSize = 48) => {
  const levels = [img]
  let cur = img
  while (Math.min(cur.width, cur.height) >> 1 >= minSize) {
    cur = downsample2x(blur3(cur))
    levels.push(cur)
  }
  return levels
}

/** Bilinear sample with edge clamping. */
const sampleBilinear = (data, w, h, fx, fy) => {
  const x0 = Math.floor(fx)
  const y0 = Math.floor(fy)
  const wx = fx - x0
  const wy = fy - y0
  const x0c = x0 < 0 ? 0 : x0 >= w ? w - 1 : x0
  const y0c = y0 < 0 ? 0 : y0 >= h ? h - 1 : y0
  const x1c = x0 + 1 < 0 ? 0 : x0 + 1 >= w ? w - 1 : x0 + 1
  const y1c = y0 + 1 < 0 ? 0 : y0 + 1 >= h ? h - 1 : y0 + 1
  const a = data[y0c * w + x0c]
  const b = data[y0c * w + x1c]
  const c = data[y1c * w + x0c]
  const d = data[y1c * w + x1c]
  const top = a + (b - a) * wx
  const bot = c + (d - c) * wx
  return top + (bot - top) * wy
}

/** Resample an image by a uniform scale about the origin (bilinear). */
const resampleScaled = (img, s) => {
  const { width: sw, height: sh, data } = img
  const w = Math.max(1, Math.round(sw * s))
  const h = Math.max(1, Math.round(sh * s))
  const out = new Float32Array(w * h)
  const inv = 1 / s
  for (let y = 0; y < h; y += 1) {
    const fy = y * inv
    for (let x = 0; x < w; x += 1) {
      out[y * w + x] = sampleBilinear(data, sw, sh, x * inv, fy)
    }
  }
  return { width: w, height: h, data: out }
}

/**
 * Warp an image by the forward transform `x' = s*x + tx`, sampling the source
 * at `(s*x + tx, s*y + ty)`. Used by tests to synthesize known cases; passing
 * the same `(s, tx, ty)` that `registerGray` is expected to recover produces a
 * candidate that maps back onto the reference under that transform.
 */
const bilinearWarp = (img, s, tx, ty, outW = img.width, outH = img.height) => {
  const { width: sw, height: sh, data } = img
  const out = new Float32Array(outW * outH)
  for (let y = 0; y < outH; y += 1) {
    const fy = s * y + ty
    for (let x = 0; x < outW; x += 1) {
      out[y * outW + x] = sampleBilinear(data, sw, sh, s * x + tx, fy)
    }
  }
  return { width: outW, height: outH, data: out }
}

/**
 * Masked normalized cross-correlation for an integer shift `(tx, ty)` placing
 * the candidate into reference pixel space. Only the overlapping rectangle is
 * scored, and `overlap` reports the overlapping fraction of the smaller image
 * so callers can reject shifts that barely touch.
 */
const maskedNcc = (ref, cand, tx, ty) => {
  const rw = ref.width
  const rh = ref.height
  const cw = cand.width
  const ch = cand.height
  const x0 = Math.max(0, tx)
  const y0 = Math.max(0, ty)
  const x1 = Math.min(rw, cw + tx)
  const y1 = Math.min(rh, ch + ty)
  const ow = x1 - x0
  const oh = y1 - y0
  if (ow <= 0 || oh <= 0) return { score: -1, overlap: 0 }
  const rd = ref.data
  const cd = cand.data
  let sa = 0
  let sb = 0
  let saa = 0
  let sbb = 0
  let sab = 0
  for (let y = y0; y < y1; y += 1) {
    const rr = y * rw
    const cr = (y - ty) * cw - tx
    for (let x = x0; x < x1; x += 1) {
      const a = rd[rr + x]
      const b = cd[cr + x]
      sa += a
      sb += b
      saa += a * a
      sbb += b * b
      sab += a * b
    }
  }
  const n = ow * oh
  const ma = sa / n
  const mb = sb / n
  const cov = sab / n - ma * mb
  const va = saa / n - ma * ma
  const vb = sbb / n - mb * mb
  const denom = Math.sqrt(va * vb)
  const score = denom > 1e-9 ? cov / denom : 0
  const overlap = n / Math.min(rw * rh, cw * ch)
  return { score, overlap }
}

// ── Search ──────────────────────────────────────────────────

/** Inclusive scale ramp that avoids floating-point drift at the endpoints. */
const makeScales = (min, max, step) => {
  const count = Math.max(0, Math.round((max - min) / step))
  const out = []
  for (let i = 0; i <= count; i += 1) out.push(Number((min + i * step).toFixed(6)))
  return out
}

/**
 * Brute-force the best valid `(scale, tx, ty)` at one pyramid level. The
 * candidate is resampled once per scale, then integer translations within the
 * given ranges are scored. Shifts below `MIN_OVERLAP` are ignored.
 */
const searchLevel = (ref, cand, { scales, txMin, txMax, tyMin, tyMax, step = 1 }) => {
  let best = { score: -Infinity, scale: 1, translateX: 0, translateY: 0, overlap: 0 }
  for (let i = 0; i < scales.length; i += 1) {
    const s = scales[i]
    const scaled = resampleScaled(cand, s)
    for (let ty = tyMin; ty <= tyMax; ty += step) {
      for (let tx = txMin; tx <= txMax; tx += step) {
        const { score, overlap } = maskedNcc(ref, scaled, tx, ty)
        if (overlap < MIN_OVERLAP) continue
        if (score > best.score) {
          best = { score, scale: s, translateX: tx, translateY: ty, overlap }
        }
      }
    }
  }
  return best
}

/** Index of the pyramid level whose longest side is closest to `target`. */
const levelForSize = (pyr, target) => {
  let bestIdx = 0
  let bestDiff = Infinity
  for (let i = 0; i < pyr.length; i += 1) {
    const longest = Math.max(pyr[i].width, pyr[i].height)
    const diff = Math.abs(longest - target)
    if (diff < bestDiff) {
      bestDiff = diff
      bestIdx = i
    }
  }
  return bestIdx
}

/** 1-D parabolic peak offset from three samples straddling the maximum. */
const parabolicOffset = (sm, s0, sp) => {
  const denom = sm - 2 * s0 + sp
  if (Math.abs(denom) < 1e-9) return 0
  const delta = (0.5 * (sm - sp)) / denom
  return delta > 1 ? 1 : delta < -1 ? -1 : delta
}

/**
 * Coarse-to-fine constrained registration.
 *
 * Returns `{ scale, translateX, translateY, score, overlap, ok }` where the
 * translation is in working-copy (finest-level) pixels; a caller that worked
 * on a downscaled copy rescales the translation to full resolution while the
 * scale stays resolution-independent. `ok` gates on score, overlap, and range.
 */
const registerGray = (ref, cand, options = {}) => {
  const { minScore = MIN_SCORE } = options
  const refPyr = buildPyramid(ref)
  const candPyr = buildPyramid(cand)

  // Coarse sweep at ~64 px: full scale range, translation within +/-25% of size.
  const coarse = levelForSize(refPyr, 64)
  const coarseRange = Math.round(0.25 * Math.max(refPyr[coarse].width, refPyr[coarse].height))
  let best = searchLevel(refPyr[coarse], candPyr[coarse], {
    scales: makeScales(SCALE_MIN, SCALE_MAX, 0.01),
    txMin: -coarseRange,
    txMax: coarseRange,
    tyMin: -coarseRange,
    tyMax: coarseRange,
    step: 1,
  })
  let level = coarse

  const refine = (target, scaleHalf, scaleStep, transWindow) => {
    const idx = levelForSize(refPyr, target)
    if (idx === level) return
    const factor = refPyr[idx].width / refPyr[level].width
    const tx = Math.round(best.translateX * factor)
    const ty = Math.round(best.translateY * factor)
    const res = searchLevel(refPyr[idx], candPyr[idx], {
      scales: makeScales(
        Math.max(SCALE_MIN, best.scale - scaleHalf),
        Math.min(SCALE_MAX, best.scale + scaleHalf),
        scaleStep,
      ),
      txMin: tx - transWindow,
      txMax: tx + transWindow,
      tyMin: ty - transWindow,
      tyMax: ty + transWindow,
      step: 1,
    })
    if (res.score > -Infinity) best = res
    level = idx
  }

  refine(128, 0.02, 0.005, 3)
  refine(256, 0.005, 0.001, 2)

  // Finest working copy: integer +/-1 refine, then parabolic subpixel fit on
  // the 3x3 score neighbourhood around the integer winner.
  const finest = 0
  const factor = refPyr[finest].width / refPyr[level].width
  const cx = Math.round(best.translateX * factor)
  const cy = Math.round(best.translateY * factor)
  const scaled = resampleScaled(candPyr[finest], best.scale)

  let bx = cx
  let by = cy
  let bScore = -Infinity
  let bOverlap = 0
  for (let dy = -1; dy <= 1; dy += 1) {
    for (let dx = -1; dx <= 1; dx += 1) {
      const { score, overlap } = maskedNcc(refPyr[finest], scaled, cx + dx, cy + dy)
      if (overlap < MIN_OVERLAP) continue
      if (score > bScore) {
        bScore = score
        bOverlap = overlap
        bx = cx + dx
        by = cy + dy
      }
    }
  }

  const scoreAt = (tx, ty) => maskedNcc(refPyr[finest], scaled, tx, ty).score
  const s0 = bScore
  const subX = parabolicOffset(scoreAt(bx - 1, by), s0, scoreAt(bx + 1, by))
  const subY = parabolicOffset(scoreAt(bx, by - 1), s0, scoreAt(bx, by + 1))

  const scale = best.scale
  const ok = bScore >= minScore
    && bOverlap >= MIN_OVERLAP
    && scale >= SCALE_MIN
    && scale <= SCALE_MAX

  return {
    scale,
    translateX: bx + subX,
    translateY: by + subY,
    score: bScore,
    overlap: bOverlap,
    ok,
  }
}

  if (typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope) {
    self.onmessage = (event) => {
      const { ref, cand, options } = event.data
      self.postMessage(registerGray(
        { width: ref.width, height: ref.height, data: ref.data },
        { width: cand.width, height: cand.height, data: cand.data },
        options || {},
      ))
    }
  }

  return {
    SCALE_MIN,
    SCALE_MAX,
    MIN_OVERLAP,
    MIN_SCORE,
    toGray,
    downsample2x,
    blur3,
    buildPyramid,
    resampleScaled,
    bilinearWarp,
    maskedNcc,
    searchLevel,
    registerGray,
  }
}

const imageRegistration = createImageRegistration()

export const SCALE_MIN = imageRegistration.SCALE_MIN
export const SCALE_MAX = imageRegistration.SCALE_MAX
export const MIN_OVERLAP = imageRegistration.MIN_OVERLAP
export const MIN_SCORE = imageRegistration.MIN_SCORE
export const toGray = imageRegistration.toGray
export const downsample2x = imageRegistration.downsample2x
export const blur3 = imageRegistration.blur3
export const buildPyramid = imageRegistration.buildPyramid
export const resampleScaled = imageRegistration.resampleScaled
export const bilinearWarp = imageRegistration.bilinearWarp
export const maskedNcc = imageRegistration.maskedNcc
export const searchLevel = imageRegistration.searchLevel
export const registerGray = imageRegistration.registerGray
