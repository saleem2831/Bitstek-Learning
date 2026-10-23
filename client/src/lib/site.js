import {useEffect,useState} from 'react';
import {api} from './api';
const defaults={contactEmail:'hello@bitsteklearning.com',whatsappNumber:import.meta.env.VITE_WHATSAPP_NUMBER||'',officeLocation:'Hyderabad, Telangana, India'};
export function useSiteSettings(){
  const [settings,setSettings]=useState(defaults);
  useEffect(()=>{let alive=true;api('/public/content').then(d=>{if(alive&&d.content)setSettings({...defaults,...d.content})}).catch(()=>{});return()=>{alive=false}},[]);
  return settings;
}
