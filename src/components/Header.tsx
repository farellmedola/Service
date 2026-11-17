import type { Ref } from 'react'
import { BRAND, getApp, nav } from '../content'
import { asset } from '../lib/assets'
import styles from './Header.module.css'

export function Header({ ref }: { ref: Ref<HTMLElement> }) {
  return (
    <header ref={ref} className={styles.header} inert>
      <nav className={styles.nav} aria-label="Main navigation">
        {nav.map((link) => (
          <a key={link.href} href={link.href}>{link.label}</a>
        ))}
      </nav>
      <a className={styles.brand} href="#top" aria-label={`${BRAND} home`}>
        <img src={asset('mark.svg')} alt="" width="45" height="34" />
      </a>
      <a href={getApp.href}>{getApp.label}</a>
    </header>
  )
}