import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './i18n'

const savedTheme = localStorage.getItem('theme');

if (savedTheme === 'dark' || !savedTheme) {
  document.documentElement.classList.add('dark')
} else {
  document.documentElement.classList.remove('dark')
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

window.ipcRenderer.on('main-process-message', (_event, message) => {
  console.log(message)
})
