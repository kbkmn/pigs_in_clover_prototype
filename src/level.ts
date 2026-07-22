import { MAZE } from "./config"

export type Seg = { ax: number; ay: number; bx: number; by: number }

const { w, h, leg, bar } = MAZE

export const SEGS: Seg[] = [
  { ax: 0, ay: h, bx: 0, by: 0 },
  { ax: 0, ay: 0, bx: w, by: 0 },
  { ax: w, ay: 0, bx: w, by: h },
  { ax: w, ay: h, bx: w - leg, by: h },
  { ax: w - leg, ay: h, bx: w - leg, by: bar },
  { ax: w - leg, ay: bar, bx: leg, by: bar },
  { ax: leg, ay: bar, bx: leg, by: h },
  { ax: leg, ay: h, bx: 0, by: h },
]

export const START = { x: leg / 2, y: h - MAZE.ball_r - 2 }
export const HOLE = { x: w - leg / 2, y: h - MAZE.hole_r - 24 }

export const TEX_PAD = 28

export const outlinePath = () => {
  const p = new Path2D()

  p.moveTo(0, h)
  p.lineTo(0, 0)
  p.lineTo(w, 0)
  p.lineTo(w, h)
  p.lineTo(w - leg, h)
  p.lineTo(w - leg, bar)
  p.lineTo(leg, bar)
  p.lineTo(leg, h)
  p.closePath()

  return p
}

const rng = (seed: number) => () => {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff
  return seed / 0x7fffffff
}

const makeNoise = (seed: number) => {
  const rnd = rng(seed)
  const perm = new Uint8Array(512)
  for (let i = 0; i < 256; i++) perm[i] = i
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1))
    const t = perm[i]
    perm[i] = perm[j]
    perm[j] = t
  }
  for (let i = 0; i < 256; i++) perm[i + 256] = perm[i]

  const val = (xi: number, yi: number) => perm[(xi & 255) + perm[yi & 255]] / 255

  const smooth = (t: number) => t * t * (3 - 2 * t)

  const noise = (x: number, y: number) => {
    const xi = Math.floor(x)
    const yi = Math.floor(y)
    const fx = smooth(x - xi)
    const fy = smooth(y - yi)
    const a = val(xi, yi)
    const b = val(xi + 1, yi)
    const c = val(xi, yi + 1)
    const d = val(xi + 1, yi + 1)
    return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy
  }

  return (x: number, y: number) => {
    let sum = 0
    let amp = 0.5
    let f = 1
    for (let o = 0; o < 4; o++) {
      sum += noise(x * f, y * f) * amp
      amp *= 0.5
      f *= 2
    }
    return sum
  }
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const clamp01 = (v: number) => Math.max(0, Math.min(1, v))

const paintWood = (
  g: CanvasRenderingContext2D,
  width: number,
  height: number,
  o: { light: [number, number, number]; dark: [number, number, number]; seed: number },
) => {
  const fbm = makeNoise(o.seed)

  const img = g.createImageData(width, height)
  const px = img.data

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const wob = fbm(x * 0.005, y * 0.016)
      const t = y * 0.3 + wob * 46 + fbm(x * 0.015, y * 0.06) * 8
      const stripe = Math.pow(0.5 + 0.5 * Math.sin(t * 0.5), 1.5)

      const fiber = (fbm(x * 0.1, y * 0.7) - 0.5) * 0.2
      const mix = clamp01(stripe * 0.42 + 0.22 + fiber)

      const i = (y * width + x) * 4
      px[i] = lerp(o.light[0], o.dark[0], mix)
      px[i + 1] = lerp(o.light[1], o.dark[1], mix)
      px[i + 2] = lerp(o.light[2], o.dark[2], mix)
      px[i + 3] = 255
    }
  }

  g.putImageData(img, 0, 0)
}

const paintEdges = (g: CanvasRenderingContext2D) => {
  const e = 11

  const grad = (x0: number, y0: number, x1: number, y1: number, from: string, to: string) => {
    const gr = g.createLinearGradient(x0, y0, x1, y1)
    gr.addColorStop(0, from)
    gr.addColorStop(1, to)
    return gr
  }

  const dark = "rgba(42, 26, 10, 0.5)"
  const dark_soft = "rgba(42, 26, 10, 0.3)"
  const light = "rgba(255, 238, 198, 0.55)"
  const none_dark = "rgba(42, 26, 10, 0)"
  const none_light = "rgba(255, 238, 198, 0)"

  g.fillStyle = grad(0, 0, 0, e, dark, none_dark)
  g.fillRect(0, 0, w, e)

  g.fillStyle = grad(0, h, 0, h - e, light, none_light)
  g.fillRect(0, h - e, leg, e)
  g.fillStyle = grad(0, h, 0, h - e, light, none_light)
  g.fillRect(w - leg, h - e, leg, e)
  g.fillStyle = grad(0, bar, 0, bar - e, light, none_light)
  g.fillRect(leg, bar - e, w - leg * 2, e)

  g.fillStyle = grad(0, 0, e, 0, dark_soft, none_dark)
  g.fillRect(0, 0, e, h)
  g.fillStyle = grad(w, 0, w - e, 0, dark_soft, none_dark)
  g.fillRect(w - e, 0, e, h)
  g.fillStyle = grad(w - leg, 0, w - leg + e, 0, dark_soft, none_dark)
  g.fillRect(w - leg, bar, e, h - bar)
  g.fillStyle = grad(leg, 0, leg - e, 0, dark_soft, none_dark)
  g.fillRect(leg - e, bar, e, h - bar)
}

const paintHole = (g: CanvasRenderingContext2D) => {
  const r = MAZE.hole_r
  const rim = 7

  const soft = g.createRadialGradient(HOLE.x, HOLE.y, r, HOLE.x, HOLE.y, r + rim * 2.2)
  soft.addColorStop(0, "rgba(74, 50, 24, 0.3)")
  soft.addColorStop(1, "rgba(74, 50, 24, 0)")
  g.fillStyle = soft
  g.beginPath()
  g.arc(HOLE.x, HOLE.y, r + rim * 2.2, 0, Math.PI * 2)
  g.fill()

  const pit = g.createRadialGradient(HOLE.x, HOLE.y - r * 0.25, 1, HOLE.x, HOLE.y, r)
  pit.addColorStop(0, "#000")
  pit.addColorStop(0.6, "#0c0602")
  pit.addColorStop(0.92, "#1c1006")
  pit.addColorStop(1, "#38220e")
  g.fillStyle = pit
  g.beginPath()
  g.arc(HOLE.x, HOLE.y, r, 0, Math.PI * 2)
  g.fill()

  const rr = r + rim / 2
  const shade = g.createLinearGradient(0, HOLE.y - rr, 0, HOLE.y + rr)
  shade.addColorStop(0, "rgba(42, 26, 10, 0.6)")
  shade.addColorStop(0.45, "rgba(120, 88, 50, 0.3)")
  shade.addColorStop(1, "rgba(255, 238, 198, 0.6)")
  g.strokeStyle = shade
  g.lineWidth = rim
  g.beginPath()
  g.arc(HOLE.x, HOLE.y, rr, 0, Math.PI * 2)
  g.stroke()
}

export const buildTexture = () => {
  const W = w + TEX_PAD * 2
  const H = h + TEX_PAD * 2

  const wall_cv = document.createElement("canvas")
  wall_cv.width = W
  wall_cv.height = H
  const wg = wall_cv.getContext("2d")!
  paintWood(wg, W, H, { light: [202, 172, 128], dark: [158, 122, 78], seed: 41 })
  wg.globalCompositeOperation = "destination-in"
  wg.translate(TEX_PAD, TEX_PAD)
  wg.strokeStyle = "#000"
  wg.lineJoin = "miter"
  wg.lineWidth = MAZE.wall * 2
  wg.stroke(outlinePath())

  const floor_cv = document.createElement("canvas")
  floor_cv.width = w
  floor_cv.height = h
  paintWood(floor_cv.getContext("2d")!, w, h, { light: [235, 214, 178], dark: [202, 172, 130], seed: 7 })

  const cv = document.createElement("canvas")
  cv.width = W
  cv.height = H
  const g = cv.getContext("2d")!
  g.drawImage(wall_cv, 0, 0)
  g.translate(TEX_PAD, TEX_PAD)

  const path = outlinePath()

  g.save()
  g.clip(path)
  g.drawImage(floor_cv, 0, 0)
  paintEdges(g)
  paintHole(g)
  g.restore()

  g.strokeStyle = "rgba(88, 60, 30, 0.45)"
  g.lineWidth = 4
  g.stroke(path)

  g.strokeStyle = "rgba(255, 244, 220, 0.35)"
  g.lineWidth = 1.5
  g.stroke(path)

  g.globalCompositeOperation = "source-atop"

  const light = g.createRadialGradient(w / 2, h / 2, 60, w / 2, h / 2, Math.max(w, h) * 0.78)
  light.addColorStop(0, "rgba(255, 246, 224, 0.22)")
  light.addColorStop(0.5, "rgba(255, 246, 224, 0)")
  light.addColorStop(1, "rgba(92, 62, 30, 0.4)")
  g.fillStyle = light
  g.fillRect(-TEX_PAD, -TEX_PAD, W, H)

  g.globalCompositeOperation = "source-over"

  return cv
}
