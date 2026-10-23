import React from 'react';import {RefreshCw,AlertTriangle} from 'lucide-react';
export function Loading(){return <div className="loading-state" role="status">Loading your information…</div>}
export function Empty({title='Nothing here yet',description='Items will appear here once they have been added.'}){return <div className="empty-state"><h3>{title}</h3><p>{description}</p></div>}
export function ErrorNotice({message,onRetry}){return message?<div className="error-notice error-with-retry" role="alert"><span><AlertTriangle size={17}/>{message}</span>{onRetry&&<button type="button" className="btn btn-outline" onClick={onRetry}><RefreshCw size={15}/> Retry loading</button>}</div>:null}
export function SuccessNotice({message}){return message?<div className="success-notice" role="status">{message}</div>:null}
