import { MAZE, PHYS } from "./config"
import { HOLE, SEGS, START, type Seg } from "./level"

export type Sim = {
  x: number
  y: number
  vx: number
  vy: number
  theta: number
  spin: number
  phase: "play" | "fall" | "won"
  fall_t: number
}

export const createSim = (): Sim => ({
  x: START.x,
  y: START.y,
  vx: 0,
  vy: 0,
  theta: 0,
  spin: 0,
  phase: "play",
  fall_t: 0,
})

export const resetSim = (s: Sim) => Object.assign(s, createSim())

export const simTap = (s: Sim) => {
  if (s.phase === "won") resetSim(s)
}

const collide = (s: Sim, seg: Seg, h: number) => {
  const abx = seg.bx - seg.ax
  const aby = seg.by - seg.ay
  const len2 = abx * abx + aby * aby
  const t = Math.max(0, Math.min(1, ((s.x - seg.ax) * abx + (s.y - seg.ay) * aby) / len2))
  const px = seg.ax + abx * t
  const py = seg.ay + aby * t
  const dx = s.x - px
  const dy = s.y - py
  const d2 = dx * dx + dy * dy
  const r = MAZE.ball_r

  if (d2 >= r * r || d2 === 0) return

  const d = Math.sqrt(d2)
  const nx = dx / d
  const ny = dy / d
  s.x = px + nx * r
  s.y = py + ny * r

  const vn = s.vx * nx + s.vy * ny
  if (vn >= 0) return

  const keep = Math.max(0, 1 - PHYS.wall_friction * h)
  const tx = (s.vx - vn * nx) * keep
  const ty = (s.vy - vn * ny) * keep
  s.vx = tx - vn * PHYS.restitution * nx
  s.vy = ty - vn * PHYS.restitution * ny
}

export const simUpdate = (s: Sim, rps: number, dt: number) => {
  const dth = rps * MAZE.rot_per_crown * dt
  s.theta += dth

  const rc = Math.cos(dth)
  const rs = Math.sin(dth)
  const rvx = s.vx * rc + s.vy * rs
  const rvy = -s.vx * rs + s.vy * rc
  s.vx = rvx
  s.vy = rvy

  if (s.phase === "fall") {
    s.fall_t += dt
    const k = Math.min(1, dt * 14)
    s.x += (HOLE.x - s.x) * k
    s.y += (HOLE.y - s.y) * k
    if (s.fall_t >= 0.45) s.phase = "won"
    return
  }

  if (s.phase !== "play") return

  const gx = Math.sin(s.theta) * PHYS.gravity
  const gy = Math.cos(s.theta) * PHYS.gravity
  const h = dt / PHYS.substeps

  for (let i = 0; i < PHYS.substeps; i++) {
    s.vx += gx * h
    s.vy += gy * h

    const drag = 1 / (1 + PHYS.air_drag * h)
    s.vx *= drag
    s.vy *= drag

    s.x += s.vx * h
    s.y += s.vy * h

    for (const seg of SEGS) collide(s, seg, h)
  }

  const speed = Math.hypot(s.vx, s.vy)
  if (speed > PHYS.max_speed) {
    const k = PHYS.max_speed / speed
    s.vx *= k
    s.vy *= k
  }

  s.spin += (s.vx / MAZE.ball_r) * dt

  const hx = HOLE.x - s.x
  const hy = HOLE.y - s.y
  if (Math.hypot(hx, hy) < MAZE.hole_r * 0.62) {
    s.phase = "fall"
    s.fall_t = 0
  }
}
