import { CROWN } from "./config"

export type Crown = {
  rotations: number
  rps: number
  update: (dt: number) => void
  scroll_el: HTMLElement | null
}

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))

export const createCrown = (screen: HTMLElement, knob: HTMLElement): Crown => {
  const crown: Crown = { rotations: 0, rps: 0, update: () => {}, scroll_el: null }

  let pending = 0
  let dragging = false
  let last_y = 0

  const push = (rot: number) => {
    if (crown.scroll_el) {
      crown.scroll_el.scrollTop -= rot * 900
      return
    }

    pending += rot
    crown.rotations += rot
  }

  const onWheel = (e: WheelEvent) => {
    e.preventDefault()
    push(-e.deltaY * CROWN.wheel_to_rot)
  }

  screen.addEventListener("wheel", onWheel, { passive: false })
  knob.addEventListener("wheel", onWheel, { passive: false })

  knob.addEventListener("pointerdown", (e) => {
    dragging = true
    last_y = e.clientY
    knob.setPointerCapture(e.pointerId)
    knob.classList.add("grab")
  })

  knob.addEventListener("pointermove", (e) => {
    if (!dragging) return
    push((last_y - e.clientY) * CROWN.drag_to_rot)
    last_y = e.clientY
  })

  const release = () => {
    dragging = false
    knob.classList.remove("grab")
  }

  window.addEventListener("pointerup", release)
  window.addEventListener("pointercancel", release)
  knob.addEventListener("lostpointercapture", release)
  window.addEventListener("blur", release)

  const keys = new Set<string>()
  window.addEventListener("keydown", (e) => {
    if (e.key === "ArrowUp" || e.key === "ArrowDown") e.preventDefault()
    keys.add(e.key)
  })
  window.addEventListener("keyup", (e) => keys.delete(e.key))

  crown.update = (dt: number) => {
    if (keys.has("ArrowUp")) push(dt * 1.4)
    if (keys.has("ArrowDown")) push(-dt * 1.4)

    const instant = pending / Math.max(dt, 1 / 240)
    pending = 0

    const target = clamp(instant, -CROWN.max_rps, CROWN.max_rps)
    const k = 1 - Math.exp(-CROWN.decay * dt)
    crown.rps = clamp(crown.rps + (target - crown.rps) * k, -CROWN.max_rps, CROWN.max_rps)
    if (Math.abs(crown.rps) < 0.004) crown.rps = 0
  }

  return crown
}
