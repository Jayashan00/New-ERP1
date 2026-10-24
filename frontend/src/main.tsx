import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

if (localStorage.getItem('nexa-theme') === 'dark') document.documentElement.classList.add('dark');
document.documentElement.style.fontSize = (localStorage.getItem('ui-scale') || '17') + 'px';

ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);
