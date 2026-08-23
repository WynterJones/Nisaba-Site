// Nisaba ships for macOS today. Everyone else gets pointed at building from source.
if (!/Mac/i.test(navigator.userAgent)) {
  const note = document.querySelector('[data-other-platform]')
  if (note) {
    note.insertAdjacentHTML(
      'afterbegin',
      '<strong>Nisaba ships for macOS today.</strong> On Windows or Linux you can still run it — '
    )
  }
}

/* ── Intro ──────────────────────────────────────────────────────────────── */

const intro = document.getElementById('intro')
if (intro) {
  const dismiss = () => {
    intro.classList.add('intro--out')
    setTimeout(() => intro.remove(), 500)
  }
  // Long enough for the mark to land, short enough not to be in the way.
  setTimeout(dismiss, 2300)
  intro.addEventListener('click', dismiss)
}

/* ── The haul lands when you finally reach the bottom ───────────────────── */

const haul = document.getElementById('haul')
if (haul) {
  const land = () => haul.classList.add('haul--in')

  // Fires once — a reward for getting to the end, not a loop.
  const watcher = new IntersectionObserver(
    (entries) => {
      if (!entries[0].isIntersecting) return
      land()
      watcher.disconnect()
    },
    { threshold: 0.15 }
  )
  watcher.observe(haul)

  // Never let an entrance animation be the reason content stays invisible.
  setTimeout(land, 4000)
}

/* ── Cursor-reactive dot field, same idea as the app ────────────────────── */

const canvases = [...document.querySelectorAll('.stage__dots, .intro__dots')]
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

for (const canvas of canvases) {
  if (reduced) break
  const ctx = canvas.getContext('2d')
  const SPACING = 30
  const RADIUS = 170
  const DRIFT = 3

  let width = 0
  let height = 0
  let raf = 0
  let started = 0

  const target = { x: 0, y: 0, active: false }
  const pointer = { x: 0, y: 0, strength: 0 }

  const resize = () => {
    const rect = canvas.getBoundingClientRect()
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    width = rect.width
    height = rect.height
    canvas.width = Math.round(width * dpr)
    canvas.height = Math.round(height * dpr)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    if (!pointer.x && !pointer.y) {
      pointer.x = width / 2
      pointer.y = height / 2
    }
  }

  const draw = (time) => {
    ctx.clearRect(0, 0, width, height)
    const cols = Math.ceil(width / SPACING) + 1
    const rows = Math.ceil(height / SPACING) + 1
    const reach = RADIUS * RADIUS

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const wave = Math.sin(time * 0.35 + col * 0.32) + Math.cos(time * 0.27 + row * 0.28)
        let x = col * SPACING + wave * DRIFT
        let y = row * SPACING + Math.sin(time * 0.31 + (col + row) * 0.22) * DRIFT

        const dx = pointer.x - x
        const dy = pointer.y - y
        const distance = dx * dx + dy * dy

        let alpha = 0.05
        let size = 1

        if (distance < reach) {
          const near = (1 - Math.sqrt(distance) / RADIUS) * pointer.strength
          const pull = near * near * 9
          const length = Math.sqrt(distance) || 1
          x += (dx / length) * pull
          y += (dy / length) * pull
          alpha = 0.05 + near * 0.5
          size = 1 + near * 1.4
          ctx.fillStyle = `rgba(${160 + near * 20}, ${107 + near * 40}, 240, ${alpha})`
        } else {
          ctx.fillStyle = `rgba(190, 185, 205, ${alpha})`
        }

        ctx.beginPath()
        ctx.arc(x, y, size, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    if (pointer.strength > 0.01) {
      const glow = ctx.createRadialGradient(
        pointer.x, pointer.y, 0,
        pointer.x, pointer.y, RADIUS * 1.6
      )
      glow.addColorStop(0, `rgba(121, 40, 219, ${0.13 * pointer.strength})`)
      glow.addColorStop(1, 'rgba(121, 40, 219, 0)')
      ctx.fillStyle = glow
      ctx.fillRect(0, 0, width, height)
    }
  }

  const loop = (now) => {
    if (!started) started = now
    // Chase the pointer rather than snapping to it; the lag is what reads as soft.
    if (target.active) {
      pointer.x += (target.x - pointer.x) * 0.09
      pointer.y += (target.y - pointer.y) * 0.09
    }
    pointer.strength += ((target.active ? 1 : 0) - pointer.strength) * 0.06
    draw((now - started) / 1000)
    raf = requestAnimationFrame(loop)
  }

  const start = () => {
    if (!raf) raf = requestAnimationFrame(loop)
  }
  const stop = () => {
    cancelAnimationFrame(raf)
    raf = 0
  }

  window.addEventListener(
    'pointermove',
    (e) => {
      const rect = canvas.getBoundingClientRect()
      target.x = e.clientX - rect.left
      target.y = e.clientY - rect.top
      target.active =
        target.x >= 0 && target.y >= 0 && target.x <= rect.width && target.y <= rect.height
    },
    { passive: true }
  )
  window.addEventListener('pointerleave', () => (target.active = false))
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()))
  new ResizeObserver(resize).observe(canvas)

  // Only animate while the surface is actually on screen.
  new IntersectionObserver((entries) => {
    entries[0].isIntersecting ? start() : stop()
  }).observe(canvas)

  resize()
  start()
}
