export const SCREEN = { w: 396, h: 484, radius: 74 }

export const CROWN = {
  max_rps: 2.5,
  wheel_to_rot: 1 / 1600,
  drag_to_rot: 1 / 220,
  decay: 7.5,
}

export const MAZE = {
  w: 512,
  h: 620,
  leg: 112,
  bar: 68,
  wall: 24,
  ball_r: 15,
  hole_r: 24,
  rot_per_crown: 2.4,
}

export const PHYS = {
  gravity: 1500,
  restitution: 0.3,
  wall_friction: 1.1,
  air_drag: 0.04,
  max_speed: 1600,
  substeps: 4,
}
