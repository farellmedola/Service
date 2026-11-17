import { clamp } from './math'

export function startWheelGlide(): () => void {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)')
  let scrollGoal = scrollY, scrollFrame = 0, scrollTime = 0
  function stopInertia() {
    cancelAnimationFrame(scrollFrame)
    scrollFrame = 0
    scrollTime = 0
    scrollGoal = scrollY
  }
  function glideScroll(now: number) {
    if (reduced.matches) {
      stopInertia()
      return
    }
    const dt = Math.min(50, now - scrollTime || 16)
    scrollTime = now
    const remaining = scrollGoal - scrollY
    if (Math.abs(remaining) < 0.75) {
      window.scrollTo({ top: scrollGoal, behavior: 'instant' })
      scrollFrame = 0
      scrollTime = 0
      return
    }
    window.scrollTo({ top: scrollY + remaining * (1 - Math.exp(-dt / 105)), behavior: 'instant' })
    scrollFrame = requestAnimationFrame(glideScroll)
  }
  const onWheel = (event: WheelEvent) => {
    if (reduced.matches || event.ctrlKey || event.metaKey || event.shiftKey || Math.abs(event.deltaX) > Math.abs(event.deltaY))
      return
    const start = event.target instanceof Element ? event.target : null
    if (start?.closest('input,textarea,select,[contenteditable="true"],dialog')) return
    for (let el = start; el && el !== document.body; el = el.parentElement) {
      const style = getComputedStyle(el)
      if (/auto|scroll/.test(style.overflowY) && el.scrollHeight > el.clientHeight + 1) return
    }
    event.preventDefault()
    const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1)
    if (!scrollFrame) scrollGoal = scrollY
    scrollGoal = clamp(scrollGoal + delta, 0, document.documentElement.scrollHeight - innerHeight)
    if (!scrollFrame) scrollFrame = requestAnimationFrame(glideScroll)
  }
  const onScroll = () => { if (!scrollFrame) scrollGoal = scrollY }
  const onKey = (event: KeyboardEvent) => {
    if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(event.key)) stopInertia()
  }
  addEventListener('wheel', onWheel, { passive: false })
  addEventListener('scroll', onScroll, { passive: true })
  addEventListener('pointerdown', stopInertia, { passive: true })
  addEventListener('touchstart', stopInertia, { passive: true })
  addEventListener('keydown', onKey)
  addEventListener('resize', stopInertia)
  reduced.addEventListener('change', stopInertia)
  return () => {
    stopInertia()
    removeEventListener('wheel', onWheel)
    removeEventListener('scroll', onScroll)
    removeEventListener('pointerdown', stopInertia)
    removeEventListener('touchstart', stopInertia)
    removeEventListener('keydown', onKey)
    removeEventListener('resize', stopInertia)
    reduced.removeEventListener('change', stopInertia)
  }
}