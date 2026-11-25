import {createRoot} from 'react-dom/client';
import App from './App';
import './style.css';
createRoot(document.getElementById('root')!).render(<App/>);
if(import.meta.env.PROD&&'serviceWorker'in navigator){
 window.addEventListener('load',()=>{void navigator.serviceWorker.register(new URL('sw.js',document.baseURI),{updateViaCache:'none'}).then(r=>r.update()).catch(e=>console.warn('Service worker update failed',e));});
}
window.addEventListener('vite:preloadError',event=>{console.warn('A deployed module could not load',event);});
