import React,{createContext,useContext,useEffect,useMemo,useState} from 'react';
import {api} from '../lib/api';
const Context=createContext(null);
function readCachedUser(){try{return JSON.parse(sessionStorage.getItem('bl_user')||'null')}catch{return null}}
export function AuthProvider({children}) {
  const [token,setToken]=useState(()=>sessionStorage.getItem('bl_token')||'');
  const [user,setUser]=useState(()=>sessionStorage.getItem('bl_token')?readCachedUser():null);
  const [loading,setLoading]=useState(Boolean(token)&&!readCachedUser());
  const [authError,setAuthError]=useState('');
  useEffect(()=>{
    let active=true;
    if(!token){setUser(null);setLoading(false);setAuthError('');return;}
    async function refresh(){
      if(!sessionStorage.getItem('bl_user'))setLoading(true);
      try{
        const result=await api('/auth/me',{token,retries:2});
        if(!active)return;
        setUser(result.user);sessionStorage.setItem('bl_user',JSON.stringify(result.user));setAuthError('');
      }catch(err){
        if(!active)return;
        if(err.status===401||err.status===403){sessionStorage.removeItem('bl_token');sessionStorage.removeItem('bl_user');setToken('');setUser(null);setAuthError('Session expired. Please sign in.');}
        else{setAuthError(err.message||'Unable to verify your session while the API is offline.');}
      }finally{if(active)setLoading(false)}
    }
    refresh();window.addEventListener('online',refresh);
    return()=>{active=false;window.removeEventListener('online',refresh)};
  },[token]);
  const login=async(email,password)=>{
    const result=await api('/auth/login',{method:'POST',body:JSON.stringify({email,password})});
    sessionStorage.setItem('bl_token',result.token);
    sessionStorage.setItem('bl_user',JSON.stringify(result.user));
    setUser(result.user);setToken(result.token);setAuthError('');return result.user;
  };
  const logout=()=>{sessionStorage.removeItem('bl_token');sessionStorage.removeItem('bl_user');setToken('');setUser(null);setAuthError('')};
  const value=useMemo(()=>({token,user,loading,authError,login,logout}),[token,user,loading,authError]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export const useAuth=()=>useContext(Context);
