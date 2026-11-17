import { aboutTitle, features, sectionLabel } from '../content'
import { Rhythm } from './Rhythm'
import styles from './AppSection.module.css'

export function AppSection() {
  return (
    <main id="app" className={styles.main}>
      <div className={styles.label}>{sectionLabel}</div>
      <Rhythm className={styles.rhythm} />
      <div className={styles.grid}>
        <h2 className={styles.title}>
          {aboutTitle[0]}
          <br />
          {aboutTitle[1]}
        </h2>
        <div className={styles.features} id="features">
          {features.map((feature) => (
            <article key={feature.title}>
              <h3 className={styles.featureTitle}>{feature.title}</h3>
              <p className={styles.featureText}>{feature.body}</p>
            </article>
          ))}
        </div>
      </div>
    </main>
  )
}