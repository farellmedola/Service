import { Fragment, useEffect, useRef } from 'react'
import { WORD, heroLine, intro, journeyLabel, portal, scrollNote } from '../content'
import { asset } from '../lib/assets'
import { startJourney } from '../lib/journey'
import { Header } from './Header'
import styles from './Journey.module.css'

export function Journey() {
  const journey = useRef<HTMLElement>(null)
  const stage = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const header = useRef<HTMLElement>(null)
  const introRef = useRef<HTMLDivElement>(null)
  const hero = useRef<HTMLDivElement>(null)
  const portalCopy = useRef<HTMLDivElement>(null)
  const note = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const parts = {
      journey: journey.current!, stage: stage.current!, canvas: canvas.current!, header: header.current!,
      intro: introRef.current!, hero: hero.current!, portalCopy: portalCopy.current!, note: note.current!,
      lines: [...introRef.current!.children] as HTMLElement[],
    }
    return startJourney(parts, WORD, asset('portal-river.webp'))
  }, [])

  return (
    <section ref={journey} id="top" className={styles.journey} aria-label={journeyLabel}>
      <div ref={stage} className={styles.stage}>
        <canvas ref={canvas} className={styles.light} aria-hidden="true" />
        <Header ref={header} />
        <div ref={introRef} className={styles.intro}>
          {intro.map((line) => <span key={line}>{line}</span>)}
        </div>
        <div ref={hero} className={styles.hero}>
          <h1 className={styles.heroTitle}>{WORD}</h1>
          <p className={styles.heroLine}>{heroLine}</p>
        </div>
        <div ref={portalCopy} className={styles.portalCopy}>
          <p className={`${styles.aside} ${styles.left}`}>{lines(portal.left)}</p>
          <h2 className={styles.portalTitle}>{lines(portal.title)}</h2>
          <p className={`${styles.aside} ${styles.right}`}>{lines(portal.right)}</p>
        </div>
        <div ref={note} className={styles.note}>
          {scrollNote} <span>↓</span>
        </div>
      </div>
    </section>
  )
}

const lines = (parts: string[]) => parts.map((part, i) => (
  <Fragment key={part}>
    {i > 0 && <br />}
    {part}
  </Fragment>
))