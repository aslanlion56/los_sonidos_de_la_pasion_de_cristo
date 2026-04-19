import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import AudiosInventory from './components/AudiosInventory.jsx'
import './styles/App.css'

function inventoryRoute() {
  const p = window.location.pathname.replace(/\/$/, '') || '/'
  if (p.endsWith('/audios')) return 'audios'
  return null
}

function Root() {
  const [route, setRoute] = useState(inventoryRoute)

  useEffect(() => {
    const sync = () => setRoute(inventoryRoute())
    window.addEventListener('popstate', sync)
    return () => window.removeEventListener('popstate', sync)
  }, [])

  useEffect(() => {
    if (route === 'audios') document.title = 'Audios · inventario'
    else document.title = 'Los sonidos de la pasión de Cristo'
  }, [route])

  if (route === 'audios') {
    return (
      <React.StrictMode>
        <AudiosInventory />
      </React.StrictMode>
    )
  }

  return (
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(<Root />)
