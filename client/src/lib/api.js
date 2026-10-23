const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
export class ApiError extends Error { constructor(message,status,requestId){super(message);this.name='ApiError';this.status=status;this.requestId=requestId;} }
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
export async function api(path,options={}) {
  const {token,timeoutMs=15000,retries=1,...rest}=options;
  const method=(rest.method||'GET').toUpperCase();
  const maxAttempts=method==='GET'?Math.max(1,retries+1):1;
  for(let attempt=0;attempt<maxAttempts;attempt++){
    const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),timeoutMs);
    try{
      const response=await fetch(`${API_URL}/api${path}`,{...rest,signal:controller.signal,headers:{ ...(rest.body&&!(rest.body instanceof FormData)?{'Content-Type':'application/json'}:{}),...(token?{Authorization:`Bearer ${token}`} : {}),...rest.headers }});
      const body=await response.json().catch(()=>({}));
      if(!response.ok){
        const requestId=body.requestId||response.headers.get('X-Request-Id');
        if(method==='GET'&&[502,503,504].includes(response.status)&&attempt+1<maxAttempts){await delay(450*(attempt+1));continue;}
        throw new ApiError(body.message || `Request failed (${response.status})`,response.status,requestId);
      }
      return body;
    }catch(err){
      if(err instanceof ApiError)throw err;
      if(attempt+1<maxAttempts){await delay(450*(attempt+1));continue;}
      if(err.name==='AbortError')throw new ApiError('The server took too long to respond. Check API and MongoDB connectivity, then retry.',0);
      throw new ApiError('Cannot reach the API server. Check that the backend is running on port 4000 and MongoDB is online.',0);
    }finally{clearTimeout(timer);}
  }
}
export function youtubeId(url='') {try {const u=new URL(url);const host=u.hostname.replace('www.','').replace('m.','');if(host==='youtu.be')return u.pathname.slice(1).split('/')[0];if(host==='youtube.com'||host==='youtube-nocookie.com'){if(u.pathname.startsWith('/shorts/')||u.pathname.startsWith('/embed/'))return u.pathname.split('/')[2];return u.searchParams.get('v');}}catch{}return null;}
export function driveId(url=''){try{const u=new URL(url);if(!['drive.google.com','docs.google.com'].includes(u.hostname))return null;return u.pathname.match(/\/file\/d\/([^/]+)/)?.[1]||u.searchParams.get('id');}catch{return null;}}
export function videoEmbed(url,provider){if(provider==='youtube'){const id=youtubeId(url);return id?`https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}`:null;}if(provider==='drive'){const id=driveId(url);return id?`https://drive.google.com/file/d/${encodeURIComponent(id)}/preview`:null;}return null;}
export const formatDate=(v)=>v?new Date(v).toLocaleString(undefined,{dateStyle:'medium',timeStyle:'short'}):'—';
export const getId=(obj)=>obj?._id||obj?.id;

// File downloads use the same Bearer authentication as ordinary API requests.
export async function downloadCourseFile(resource,token){
  const response=await fetch(`${API_URL}/api/resources/${encodeURIComponent(resource._id)}/file`,{headers:{Authorization:`Bearer ${token}`}});
  if(!response.ok){const body=await response.json().catch(()=>({}));throw new ApiError(body.message||'File download failed.',response.status,body.requestId)}
  const blob=await response.blob();
  const objectUrl=URL.createObjectURL(blob);const anchor=document.createElement('a');
  anchor.href=objectUrl;anchor.download=resource.originalName||resource.title||'resource';
  document.body.appendChild(anchor);anchor.click();anchor.remove();
  setTimeout(()=>URL.revokeObjectURL(objectUrl),60_000);
}

export async function authenticatedFileBlob(resource,token){
  const response=await fetch(`${API_URL}/api/resources/${encodeURIComponent(resource._id)}/file`,{headers:{Authorization:`Bearer ${token}`}});
  if(!response.ok){const body=await response.json().catch(()=>({}));throw new ApiError(body.message||'Could not open the recording.',response.status,body.requestId)}
  return URL.createObjectURL(await response.blob());
}
