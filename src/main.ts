import "./style.css"

import { CROWN, SCREEN } from "./config"
import { createCrown } from "./input"

const canvas = document.getElementById("cv") as HTMLCanvasElement
const screen_el = document.getElementById("screen") as HTMLDivElement
const knob = document.getElementById("crown") as HTMLDivElement
const cm = document.getElementById("crown-meter") as HTMLDivElement
const cm_marker = cm.querySelector(".cm-marker") as HTMLDivElement
const cm_val = cm.querySelector(".cm-val") as HTMLDivElement

const TRACK = 102
cm.classList.add("on")

const fmt = (v: number) => (Math.round(v * 100) / 100).toFixed(2)

const syncCrownMeter = () => {
  const rps = Math.min(Math.abs(crown.rps), CROWN.max_rps)

  cm_marker.style.bottom = `${(rps / CROWN.max_rps) * TRACK}px`
  cm_val.textContent = fmt(rps)
}

const ctx = canvas.getContext("2d")!

const resize = () => {
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  canvas.width = SCREEN.w * dpr
  canvas.height = SCREEN.h * dpr
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
}
resize()
window.addEventListener("resize", resize)

const crown = createCrown(screen_el, knob)

const tap = () => {}

screen_el.addEventListener("pointerdown", () => tap())

window.addEventListener("keydown", (e) => {
  if (e.code === "Space" || e.code === "Enter") {
    e.preventDefault()
    tap()
  }
})

let paused = false
document.addEventListener("visibilitychange", () => {
  paused = document.hidden
})

const update = (_dt: number) => {}

const render = () => {
  ctx.fillStyle = "rgba(255,255,255,0.35)"
  ctx.font = "13px ui-monospace, monospace"
  ctx.textAlign = "center"
  ctx.fillText("экран пуст — ждём игру", SCREEN.w / 2, SCREEN.h / 2)
  ctx.fillText(`обороты: ${fmt(crown.rotations)}`, SCREEN.w / 2, SCREEN.h / 2 + 22)
}

let last = performance.now()

const frame = (now: number) => {
  const dt = Math.min((now - last) / 1000, 1 / 20)
  last = now

  crown.update(dt)
  if (!paused) update(dt)

  ctx.clearRect(0, 0, SCREEN.w, SCREEN.h)
  render()
  syncCrownMeter()

  requestAnimationFrame(frame)
}

requestAnimationFrame(frame)
