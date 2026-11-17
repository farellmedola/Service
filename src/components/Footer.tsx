import { BRAND, WORD, footer } from '../content'
import { asset } from '../lib/assets'
import styles from './Footer.module.css'

// The footer waits under the page (sticky to the bottom) and is uncovered as the white section scrolls away.
export function Footer() {
  return (
    <>
      <footer className={styles.footer}>
        <div className={styles.top}>
          <p>
            {footer.left[0]}
            <br />
            {footer.left[1]}
          </p>
          <img className={styles.mark} src={asset('mark.svg')} alt={BRAND} width="45" height="34" />
          <p className={styles.end}>
            {footer.right[0]}
            <br />
            {footer.right[1]}
          </p>
        </div>
        <img className={styles.wordmark} src={asset('melune-wordmark.svg')} alt={WORD} width="1481" height="366" />
      </footer>
      <div id="download" />
    </>
  )
}