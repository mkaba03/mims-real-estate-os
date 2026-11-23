import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './roadmap.css'
import './REOSComplete.css'
import REOSComplete from './REOSComplete.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <REOSComplete />
  </StrictMode>,
)
