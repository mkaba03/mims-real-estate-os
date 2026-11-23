import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './roadmap.css'
import REOSApp from './REOSApp.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <REOSApp />
  </StrictMode>,
)
