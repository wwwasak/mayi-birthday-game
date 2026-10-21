import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/global.css';
import './styles/minigames.css';
import './styles/park.css';
import './styles/v11.css';
import './styles/v12.css';
import './styles/scene-themes.css';

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('找不到 #root 挂载点');

ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
