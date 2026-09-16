import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import DevInspector from './components/DevInspector/devInspector'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <DevInspector enabled>
      <App />
    </DevInspector>
  </StrictMode>,
)
