import { MAZE, SCREEN } from "./config"
import { HOLE, TEX_PAD, buildTexture, outlinePath } from "./level"
import type { Sim } from "./sim"

const CX = SCREEN.w / 2
const CY = SCREEN.h / 2

const drawBall = (ctx: CanvasRenderingContext2D, s: Sim, tex: HTMLCanvasElement) => {
  const scale = s.phase === "fall" ? Math.max(0, 1 - s.fall_t / 0.45) : s.phase === "won" ? 0 : 1
  if (scale <= 0) return

  const r = MAZE.ball_r * scale

  ctx.save()
  ctx.translate(CX, CY)
  ctx.rotate(s.theta)
  ctx.translate(-s.x, -s.y)
  ctx.clip(outlinePath())

  const drop = ctx.createRadialGradient(s.x, s.y, r * 0.7, s.x, s.y, r * 1.45)
  drop.addColorStop(0, "rgba(0, 0, 0, 0.4)")
  drop.addColorStop(0.3, "rgba(0, 0, 0, 0.13)")
  drop.addColorStop(0.6, "rgba(0, 0, 0, 0.04)")
  drop.addColorStop(1, "rgba(0, 0, 0, 0)")
  ctx.fillStyle = drop
  ctx.beginPath()
  ctx.arc(s.x, s.y, r * 1.45, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()

  ctx.save()
  ctx.translate(CX, CY)

  ctx.save()
  ctx.beginPath()
  ctx.arc(0, 0, r, 0, Math.PI * 2)
  ctx.clip()

  const base = ctx.createRadialGradient(-r * 0.2, -r * 0.5, r * 0.15, 0, 0, r * 1.35)
  base.addColorStop(0, "#ffffff")
  base.addColorStop(0.3, "#d6dde2")
  base.addColorStop(0.58, "#8d97a1")
  base.addColorStop(0.85, "#4e5761")
  base.addColorStop(1, "#343c45")
  ctx.fillStyle = base
  ctx.fillRect(-r, -r, r * 2, r * 2)

  ctx.save()
  ctx.globalAlpha = 0.32
  ctx.scale(0.35, 0.35)
  ctx.rotate(s.theta)
  ctx.translate(-s.x, -s.y)
  ctx.drawImage(tex, -TEX_PAD, -TEX_PAD)
  ctx.restore()

  const band = ctx.createLinearGradient(0, -r * 0.15, 0, r * 0.6)
  band.addColorStop(0, "rgba(58, 67, 78, 0)")
  band.addColorStop(0.5, "rgba(58, 67, 78, 0.55)")
  band.addColorStop(1, "rgba(58, 67, 78, 0)")
  ctx.fillStyle = band
  ctx.fillRect(-r, -r * 0.15, r * 2, r * 0.75)

  const streak = ctx.createLinearGradient(-r, 0, r, 0)
  streak.addColorStop(0, "rgba(46, 54, 63, 0.35)")
  streak.addColorStop(0.3, "rgba(46, 54, 63, 0)")
  streak.addColorStop(0.7, "rgba(46, 54, 63, 0)")
  streak.addColorStop(1, "rgba(46, 54, 63, 0.4)")
  ctx.fillStyle = streak
  ctx.fillRect(-r, -r, r * 2, r * 2)

  const floor_refl = ctx.createRadialGradient(0, r * 0.85, r * 0.1, 0, r * 0.7, r)
  floor_refl.addColorStop(0, "rgba(226, 196, 156, 0.75)")
  floor_refl.addColorStop(0.6, "rgba(214, 180, 138, 0.35)")
  floor_refl.addColorStop(1, "rgba(214, 180, 138, 0)")
  ctx.fillStyle = floor_refl
  ctx.fillRect(-r, -r * 0.1, r * 2, r * 1.1)

  const rim = ctx.createRadialGradient(0, 0, r * 0.62, 0, 0, r)
  rim.addColorStop(0, "rgba(70, 80, 92, 0)")
  rim.addColorStop(0.8, "rgba(70, 80, 92, 0.16)")
  rim.addColorStop(1, "rgba(50, 58, 68, 0.42)")
  ctx.fillStyle = rim
  ctx.beginPath()
  ctx.arc(0, 0, r, 0, Math.PI * 2)
  ctx.fill()

  ctx.restore()

  const halo = ctx.createRadialGradient(-r * 0.3, -r * 0.44, 0, -r * 0.3, -r * 0.44, r * 0.52)
  halo.addColorStop(0, "rgba(255, 255, 255, 0.95)")
  halo.addColorStop(0.45, "rgba(255, 255, 255, 0.3)")
  halo.addColorStop(1, "rgba(255, 255, 255, 0)")
  ctx.fillStyle = halo
  ctx.beginPath()
  ctx.arc(-r * 0.3, -r * 0.44, r * 0.52, 0, Math.PI * 2)
  ctx.fill()


  ctx.restore()
}

const drawPointer = (ctx: CanvasRenderingContext2D, s: Sim) => {
  if (s.phase !== "play") return

  const dx = HOLE.x - s.x
  const dy = HOLE.y - s.y
  const dist = Math.hypot(dx, dy)

  const alpha = Math.max(0, Math.min(1, (dist - 90) / 90)) * 0.75
  if (alpha <= 0) return

  const cos = Math.cos(s.theta)
  const sin = Math.sin(s.theta)
  const ang = Math.atan2(dx * sin + dy * cos, dx * cos - dy * sin)

  ctx.save()
  ctx.translate(CX, CY)
  ctx.rotate(ang)
  ctx.translate(52, 0)
  ctx.globalAlpha = alpha
  ctx.fillStyle = "#ffd166"
  ctx.beginPath()
  ctx.moveTo(9, 0)
  ctx.lineTo(-4, -6.5)
  ctx.lineTo(-1, 0)
  ctx.lineTo(-4, 6.5)
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}

const drawMinimap = (ctx: CanvasRenderingContext2D, s: Sim) => {
  const scale = 44 / MAZE.w
  const mx = SCREEN.w / 2
  const my = 52

  const glow = ctx.createRadialGradient(mx, my, 4, mx, my, 46)
  glow.addColorStop(0, "rgba(0, 0, 0, 0.38)")
  glow.addColorStop(0.7, "rgba(0, 0, 0, 0.18)")
  glow.addColorStop(1, "rgba(0, 0, 0, 0)")
  ctx.fillStyle = glow
  ctx.beginPath()
  ctx.arc(mx, my, 46, 0, Math.PI * 2)
  ctx.fill()

  ctx.save()
  ctx.translate(mx, my)
  ctx.scale(scale, scale)
  ctx.translate(-MAZE.w / 2, -MAZE.h / 2)

  ctx.globalAlpha = 0.85
  ctx.strokeStyle = "rgba(232, 237, 243, 0.55)"
  ctx.lineWidth = 1.6 / scale
  ctx.stroke(outlinePath())

  ctx.fillStyle = "#ffd166"
  ctx.beginPath()
  ctx.arc(HOLE.x, HOLE.y, 42, 0, Math.PI * 2)
  ctx.fill()

  if (s.phase === "play") {
    ctx.fillStyle = "#ffffff"
    ctx.beginPath()
    ctx.arc(s.x, s.y, 48, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.restore()
}

const drawWin = (ctx: CanvasRenderingContext2D, s: Sim) => {
  if (s.phase !== "won") return

  ctx.save()
  ctx.textAlign = "center"
  ctx.shadowColor = "rgba(0, 0, 0, 0.7)"
  ctx.shadowBlur = 32
  ctx.fillStyle = "#e8edf3"
  ctx.font = "800 30px system-ui, sans-serif"
  ctx.fillText("ФИНИШ", CX, CY - 8)
  ctx.font = "13px system-ui, sans-serif"
  ctx.globalAlpha = 0.6
  ctx.fillText("тап — заново", CX, CY + 20)
  ctx.restore()
}

export const createRenderer = () => {
  const tex = buildTexture()

  return (ctx: CanvasRenderingContext2D, s: Sim) => {
    ctx.save()
    ctx.translate(CX, CY)
    ctx.rotate(s.theta)
    ctx.translate(-s.x, -s.y)
    ctx.shadowColor = "rgba(0, 0, 0, 0.55)"
    ctx.shadowBlur = 34
    ctx.shadowOffsetY = 14
    ctx.drawImage(tex, -TEX_PAD, -TEX_PAD)
    ctx.restore()

    drawBall(ctx, s, tex)
    drawPointer(ctx, s)
    drawMinimap(ctx, s)
    drawWin(ctx, s)
  }
}
