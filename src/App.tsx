import { useEffect } from 'react'
import { Journey } from './components/Journey'
import { AppSection } from './components/AppSection'
import { Footer } from './components/Footer'
import { startWheelGlide } from './lib/wheelGlide'

export function App() {
  useEffect(() => startWheelGlide(), [])
  return (
    <>
      <a className="skip" href="#app">
        Skip introduction
      </a>
      <Journey />
      <AppSection />
      <Footer />
    </>
  )
}