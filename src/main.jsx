import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './assets/styles/variables.css';
import './assets/styles/global.css';
import './assets/styles/common/Pagination.css';
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)