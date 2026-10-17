import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'   // 공용 토큰·컴포넌트를 먼저 — 페이지 CSS가 뒤에서 덮어쓸 수 있게
import App from './App.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
