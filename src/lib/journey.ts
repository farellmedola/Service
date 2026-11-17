import { FRAGMENT, VERTEX } from './shader'
import { clamp, smooth } from './math'

export type JourneyParts = {
  journey: HTMLElement
  stage: HTMLElement
  canvas: HTMLCanvasElement
  intro: HTMLElement
  lines: HTMLElement[]
  hero: HTMLElement
  portalCopy: HTMLElement
  header: HTMLElement
  note: HTMLElement
}

export function startJourney(parts: JourneyParts, word: string, portalImageUrl: string): () => void {
  const { journey, stage, canvas, intro, lines, hero, portalCopy, header, note } = parts
  const reduced = matchMedia('(prefers-reduced-motion: reduce)')
  const gl = canvas.getContext('webgl', { alpha: false, antialias: false, powerPreference: 'low-power' })
  let disposed = false

  let program: WebGLProgram | null = null
  let ready = false
  const textures: WebGLTexture[] = []
  const shaders: WebGLShader[] = []
  let buffer: WebGLBuffer | null = null
  const u: Record<string, WebGLUniformLocation | null> = {}
  const texture = (unit: number) => {
    const t = gl!.createTexture()!
    textures.push(t)
    gl!.activeTexture(gl!.TEXTURE0 + unit)
    gl!.bindTexture(gl!.TEXTURE_2D, t)
    gl!.texImage2D(gl!.TEXTURE_2D, 0, gl!.RGBA, 1, 1, 0, gl!.RGBA, gl!.UNSIGNED_BYTE, new Uint8Array(unit === 0 ? [0, 0, 0, 255] : [0, 0, 0, 0]))
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MIN_FILTER, gl!.LINEAR)
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MAG_FILTER, gl!.LINEAR)
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_S, gl!.CLAMP_TO_EDGE)
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_T, gl!.CLAMP_TO_EDGE)
    return t
  }
  let portalTexture: WebGLTexture | null = null
  let wordTexture: WebGLTexture | null = null
  let blurredWordTexture: WebGLTexture | null = null
  if (gl) {
    try {
      const compile = (type: number, source: string) => {
        const shader = gl.createShader(type)!
        shaders.push(shader)
        gl.shaderSource(shader, source)
        gl.compileShader(shader)
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw Error(gl.getShaderInfoLog(shader) ?? 'shader')
        return shader
      }
      program = gl.createProgram()!
      gl.attachShader(program, compile(gl.VERTEX_SHADER, VERTEX))
      gl.attachShader(program, compile(gl.FRAGMENT_SHADER, FRAGMENT))
      gl.linkProgram(program)
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw Error(gl.getProgramInfoLog(program) ?? 'program')
      gl.useProgram(program)
      buffer = gl.createBuffer()
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW)
      const a = gl.getAttribLocation(program, 'a')
      gl.enableVertexAttribArray(a)
      gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0)
      for (const name of ['res', 'time', 'progress', 'pointer', 'pointerActive', 'portalImage', 'imageReady', 'wordImage', 'blurredWordImage', 'wordReady'])
        u[name] = gl.getUniformLocation(program, name)
      portalTexture = texture(0)
      const artwork = new Image()
      artwork.crossOrigin = 'anonymous'
      artwork.onload = () => {
        if (disposed) return
        gl.useProgram(program)
        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D, portalTexture)
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, artwork)
        gl.uniform1i(u.portalImage, 0)
        gl.uniform1f(u.imageReady, 1)
      }
      artwork.src = portalImageUrl
      ready = true
    } catch (e) {
      console.error('Melune rendering:', e)
      journey.dataset.webgl = 'off'
    }
  } else journey.dataset.webgl = 'off'

  const wordCanvas = document.createElement('canvas')
  const wordContext = wordCanvas.getContext('2d')!
  const blurredWordCanvas = document.createElement('canvas')
  if (ready && gl) {
    wordTexture = texture(1)
    gl.uniform1i(u.wordImage, 1)
    blurredWordTexture = texture(2)
    gl.uniform1i(u.blurredWordImage, 2)
    journey.dataset.shaderWord = ''
  }
  function measureWord() {
    if (!wordTexture || !gl || !canvas.width || !canvas.height) return
    wordCanvas.width = 2 ** Math.ceil(Math.log2(canvas.width))
    wordCanvas.height = 2 ** Math.ceil(Math.log2(canvas.height))
    const ctx = wordContext, w = innerWidth, h = innerHeight
    ctx.setTransform(wordCanvas.width / w, 0, 0, wordCanvas.height / h, 0, 0)
    let size = w * 0.25
    ctx.font = `600 ${size}px Involve`
    ctx.letterSpacing = `${-size * 0.04}px`
    size *= (w * 0.78) / ctx.measureText(word).width
    ctx.font = `600 ${size}px Involve`
    ctx.letterSpacing = `${-size * 0.04}px`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'alphabetic'
    ctx.fillStyle = 'white'
    const metrics = ctx.measureText(word)
    const baseline = h * 0.5 + (metrics.actualBoundingBoxAscent - metrics.actualBoundingBoxDescent) / 2
    ctx.fillText(word, w * 0.5, baseline)
    gl.activeTexture(gl.TEXTURE1)
    gl.bindTexture(gl.TEXTURE_2D, wordTexture)
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, wordCanvas)
    gl.generateMipmap(gl.TEXTURE_2D)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR)
    blurredWordCanvas.width = wordCanvas.width
    blurredWordCanvas.height = wordCanvas.height
    const blurContext = blurredWordCanvas.getContext('2d')!
    blurContext.setTransform(wordCanvas.width / w, 0, 0, wordCanvas.height / h, 0, 0)
    blurContext.filter = 'blur(14px)'
    blurContext.drawImage(wordCanvas, 0, 0, w, h)
    gl.activeTexture(gl.TEXTURE2)
    gl.bindTexture(gl.TEXTURE_2D, blurredWordTexture)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, blurredWordCanvas)
    gl.generateMipmap(gl.TEXTURE_2D)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR)
    gl.useProgram(program)
    gl.uniform1f(u.wordReady, 1)
    gl.activeTexture(gl.TEXTURE0)
  }
  document.fonts.load('600 1em "Involve"').then(() => !disposed && measureWord())

  const pointer = { x: 0.5, y: 0.5, aimX: 0.5, aimY: 0.5, active: 0, target: 0 }
  const onPointerMove = (event: PointerEvent) => {
    const rect = stage.getBoundingClientRect()
    pointer.aimX = (event.clientX - rect.left) / rect.width
    pointer.aimY = 1 - (event.clientY - rect.top) / rect.height
    pointer.target = event.pointerType === 'touch' ? 0 : 1
  }
  const onPointerLeave = () => { pointer.target = 0 }
  stage.addEventListener('pointermove', onPointerMove)
  stage.addEventListener('pointerleave', onPointerLeave)
  window.addEventListener('blur', onPointerLeave)

  const started = performance.now()
  let target = 0, current = 0, last = 0, active = true, raf = 0
  const progress = () => clamp(-journey.getBoundingClientRect().top / (journey.offsetHeight - innerHeight))
  function measure() {
    target = progress()
    if (ready && gl) {
      const dpr = Math.min(devicePixelRatio || 1, 1.6)
      canvas.width = Math.round(innerWidth * dpr)
      canvas.height = Math.round(innerHeight * dpr)
      gl.viewport(0, 0, canvas.width, canvas.height)
      measureWord()
    }
  }
  const updateScroll = () => { target = progress() }

  function frame(now: number) {
    const dt = Math.min(64, now - last || 16)
    last = now
    current += (target - current) * (reduced.matches ? 1 : 1 - Math.exp(-dt / 80))
    const s = current
    const follow = 1 - Math.exp(-dt / 95)
    pointer.x += (pointer.aimX - pointer.x) * follow
    pointer.y += (pointer.aimY - pointer.y) * follow
    pointer.active += (pointer.target - pointer.active) * (1 - Math.exp(-dt / 120))

    const reveal = reduced.matches ? 1 : smooth(0, 1500, now - started)
    intro.style.opacity = String((1 - smooth(0.36, 0.43, s)) * reveal)
    intro.style.filter = `blur(${(1 - reveal) * 22}px)`
    intro.style.transform = `scale(${1 + (1 - reveal) * 0.05})`
    const cover = smooth(0.19, 0.39, s)
    const curtainVisible = smooth(0.18, 0.22, s)
    const width = intro.clientWidth, height = intro.clientHeight
    const boxes = lines.map((line) => [line.offsetLeft, line.offsetTop, line.offsetWidth, line.offsetHeight])
    lines.forEach((line, i) => {
      const [left, top, lineWidth, lineHeight] = boxes[i]
      let contact = 0, gradientGreen = 0, gradientBlue = 0
      for (let y = 0; y < 5; y++)
        for (let x = 0; x < 9; x++) {
          const uu = (left + (lineWidth * (x + 0.5)) / 9) / width
          const v = (top + (lineHeight * (y + 0.5)) / 5) / height
          const bow = 0.13 * Math.pow(Math.abs(uu - 0.5) * 2, 1.6)
          const aperture = 0.78 + (-0.15 - 0.78) * cover - bow
          const density = smooth(aperture - 0.14, aperture + 0.14, Math.abs(v - 0.5)) * curtainVisible
          const overlap = smooth(0.12, 0.85, density)
          contact += overlap
          const tint = smooth(0.04, 0.5, Math.abs(v - 0.5))
          gradientGreen += overlap * (0.03 + (0.18 - 0.03) * tint)
          gradientBlue += overlap * (0.18 + (0.65 - 0.18) * tint)
        }
      const hit = contact / 45
      const tintGreen = contact > 0 ? gradientGreen / contact : 0.03
      const tintBlue = contact > 0 ? gradientBlue / contact : 0.18
      const colorMix = smooth(0, 0.55, hit)
      line.style.color = `rgb(255,${Math.round(255 * (1 - colorMix + colorMix * tintGreen))},${Math.round(255 * (1 - colorMix + colorMix * tintBlue))})`
      line.style.webkitTextStroke = `${hit * 4.5}px currentColor`
      line.style.filter = `blur(${hit * 22}px)`
      line.style.textShadow = `0 0 ${hit * 32}px currentColor`
      line.style.transform = `scale(${1 + hit * 0.035},${1 + hit * 0.06})`
      line.style.opacity = String(1 - hit * 0.32)
    })
    hero.style.opacity = String(smooth(0.42, 0.49, s) * (1 - smooth(0.59, 0.65, s)))
    hero.style.filter = `blur(${smooth(0.59, 0.65, s) * 10}px)`
    hero.style.transform = `scale(${1 + smooth(0.59, 0.65, s) * 0.025})`
    portalCopy.style.opacity = String(smooth(0.88, 0.96, s))
    portalCopy.style.transform = `translateY(${(1 - smooth(0.88, 0.96, s)) * 20}px)`

    const headerAlpha = smooth(0.43, 0.5, s)
    header.style.opacity = String(headerAlpha)
    header.style.pointerEvents = headerAlpha > 0.6 ? 'auto' : 'none'
    header.inert = headerAlpha < 0.6
    note.style.opacity = String((1 - smooth(0.015, 0.08, s)) * reveal)
    if (ready && active && gl) {
      gl.useProgram(program)
      gl.uniform2f(u.res, canvas.width, canvas.height)
      gl.uniform2f(u.pointer, pointer.x, pointer.y)
      gl.uniform1f(u.pointerActive, pointer.active)
      gl.uniform1f(u.time, reduced.matches ? 0 : now / 1000)
      gl.uniform1f(u.progress, s)
      gl.drawArrays(gl.TRIANGLES, 0, 6)
    }
    raf = requestAnimationFrame(frame)
  }

  addEventListener('scroll', updateScroll, { passive: true })
  addEventListener('resize', measure)
  const observer = new IntersectionObserver(([entry]) => { active = entry.isIntersecting })
  observer.observe(journey)
  measure()
  raf = requestAnimationFrame(frame)

  return () => {
    disposed = true
    cancelAnimationFrame(raf)
    observer.disconnect()
    removeEventListener('scroll', updateScroll)
    removeEventListener('resize', measure)
    stage.removeEventListener('pointermove', onPointerMove)
    stage.removeEventListener('pointerleave', onPointerLeave)
    window.removeEventListener('blur', onPointerLeave)
    if (gl) {
      textures.forEach((t) => gl.deleteTexture(t))
      shaders.forEach((sh) => gl.deleteShader(sh))
      if (buffer) gl.deleteBuffer(buffer)
      if (program) gl.deleteProgram(program)
    }
    delete journey.dataset.webgl
    delete journey.dataset.shaderWord
  }
}
