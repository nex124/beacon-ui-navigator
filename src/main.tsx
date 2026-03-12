import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { WmsDashboard } from './WmsDashboard';
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WmsDashboard />
  </StrictMode>,
)
