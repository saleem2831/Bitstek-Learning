import {useCallback,useEffect,useState} from 'react';
import {api} from './api';import {useAuth} from '../context/AuthContext';
export function useResource(path,initial=[]){
 const {token}=useAuth();const [data,setData]=useState(initial);
 const [loading,setLoading]=useState(Boolean(path));const [error,setError]=useState('');const [status,setStatus]=useState(null);
 const reload=useCallback(async()=>{if(!token||!path){setLoading(false);return false;}
   setLoading(true);try{const res=await api(path,{token,retries:2});setData(res.items??res.data??res);setError('');setStatus(null);return true}
   catch(err){setError(err.message);setStatus(err.status);return false}finally{setLoading(false)}
 },[path,token]);
 useEffect(()=>{if(!path){setLoading(false);return;}reload()},[reload,path]);
 useEffect(()=>{if(!path)return;window.addEventListener('bitstek:retry-resources',reload);window.addEventListener('online',reload);return()=>{window.removeEventListener('bitstek:retry-resources',reload);window.removeEventListener('online',reload)}},[path,reload]);
 return {data,loading,error,status,reload,setData};
}
export const toInputDate=(v)=>v?new Date(v).toISOString().slice(0,16):'';
