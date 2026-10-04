import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/editorial-journey.css'
import App from './App.jsx'
import { getLocale, loadLocale } from './i18n'

// O idioma salvo (en/es) é carregado antes do primeiro render; pt-BR já vem no bundle.
loadLocale(getLocale()).finally(() => {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <App />
    </StrictMode>
  )
})
