import React,{useEffect,useRef,useState} from 'react';
import {BookOpen,CloudUpload,FileText,Film,Link2,Download,Trash2,Plus,RefreshCw} from 'lucide-react';
import {useResource} from '../lib/hooks';
import {useAuth} from '../context/AuthContext';
import {api,downloadCourseFile,authenticatedFileBlob,videoEmbed} from '../lib/api';

const empty={title:'',description:'',moduleId:'',kind:'document',source:'upload',url:'',session:''};
const asList=items=>Array.isArray(items)?items:[];
export default function CourseResources({courseId,modules=[],role='student'}){
  const {token}=useAuth();const editable=role==='admin'||role==='instructor';
  const {data,loading,error,reload}=useResource(courseId?`/resources/courses/${courseId}`:null,[]);
  const [form,setForm]=useState(empty);const [file,setFile]=useState(null);const [busy,setBusy]=useState(false);
  const [notice,setNotice]=useState('');const [actionError,setActionError]=useState('');const [watch,setWatch]=useState(null);const [opening,setOpening]=useState('');
  const {data:scheduled}=useResource(editable?`/${role}/schedule`:null,[]);
  const courseSessions=asList(scheduled).filter(s=>String(s.course?._id||s.course)===String(courseId));
  const fileRef=useRef();const activeBlob=useRef(null);
  function closeWatch(){setWatch(null);if(activeBlob.current){URL.revokeObjectURL(activeBlob.current);activeBlob.current=null;}}
  useEffect(()=>()=>{if(activeBlob.current)URL.revokeObjectURL(activeBlob.current)},[]);
  async function playUpload(item){setOpening(item._id);setActionError('');try{if(activeBlob.current){URL.revokeObjectURL(activeBlob.current);activeBlob.current=null;}const src=await authenticatedFileBlob(item,token);activeBlob.current=src;setWatch({...item,localSrc:src})}catch(e){setActionError(e.message)}finally{setOpening('')}}
  useEffect(()=>{if(modules.length&&!modules.some(m=>m._id===form.moduleId))setForm(x=>({...x,moduleId:modules[0]._id}))},[modules,form.moduleId]);
  async function save(e){e.preventDefault();if(busy)return;setBusy(true);setActionError('');setNotice('');try{
    if(form.source==='upload'){
      if(!file)throw new Error('Choose a document or recording file.');
      const fd=new FormData();for(const key of ['title','description','moduleId','kind','session'])if(form[key])fd.append(key,form[key]);fd.append('file',file);
      await api(`/resources/courses/${courseId}/uploads`,{method:'POST',token,body:fd,timeoutMs:180_000});
    }else{
      await api(`/resources/courses/${courseId}/links`,{method:'POST',token,body:JSON.stringify({...form})});
    }
    setNotice('Learning resource added.');setForm(x=>({...empty,moduleId:x.moduleId}));setFile(null);if(fileRef.current)fileRef.current.value='';await reload();
  }catch(err){setActionError(err.message)}finally{setBusy(false)}}
  async function remove(item){if(!window.confirm(`Remove ${item.title}?`))return;try{await api(`/resources/${item._id}`,{method:'DELETE',token});await reload()}catch(e){setActionError(e.message)}}
  async function download(item){setActionError('');try{await downloadCourseFile(item,token)}catch(e){setActionError(e.message)}}
  const items=asList(data);
  return <section className="resources-section">
    <div className="resources-heading"><div><h3><BookOpen size={20}/> Course materials & recordings</h3><p>Notes, PDFs, handouts, module documents and recordings of live classes.</p></div><button className="table-button" onClick={reload}><RefreshCw size={15}/> Refresh</button></div>
    {(error||actionError)&&<div className="error-notice" role="alert">{error||actionError}</div>}{notice&&<p className="notice" role="status">{notice}</p>}
    {loading?<p>Loading course materials…</p>:items.length===0?<div className="resource-empty"><FileText size={25}/><strong>No learning materials yet</strong><span>Course documents and class recordings will appear here.</span></div>:<div className="resource-group-list">{modules.map(m=>{
      const resources=items.filter(r=>String(r.moduleId)===String(m._id));if(!resources.length)return null;
      return <div key={m._id} className="resource-group"><h4>{m.title} <span>{resources.length}</span></h4><div className="resource-grid">{resources.map(r=><div className="resource-card" key={r._id}>
        <span className="resource-icon">{r.kind==='recording'?<Film size={21}/>:<FileText size={21}/>}</span><div className="resource-details"><strong>{r.title}</strong><small>{r.kind==='recording'?'Class recording':'Notes / document'} · {r.source==='link'?'Online link':`${Math.round(r.sizeBytes/1024)} KB`}</small>{r.description&&<p>{r.description}</p>}</div>
        <div className="resource-actions">{r.source==='link'?(r.kind==='recording'&&(videoEmbed(r.externalUrl,'youtube')||videoEmbed(r.externalUrl,'drive'))?<button className="table-button" onClick={()=>setWatch(r)}><Film size={14}/> Watch</button>:<a href={r.externalUrl} rel="noopener noreferrer" target="_blank" className="table-button"><Link2 size={14}/> Open</a>):<button className="table-button" onClick={()=>download(r)}><Download size={14}/> Download</button>}{r.source==='upload'&&r.kind==='recording'&&<button className="table-button" disabled={opening===r._id} onClick={()=>playUpload(r)}><Film size={14}/>{opening===r._id?'Loading…':'Watch'}</button>}{editable&&<button className="icon-button" title="Remove material" onClick={()=>remove(r)}><Trash2 size={15}/></button>}</div>
      </div>)}</div></div>})}</div>}
    {watch&&<div className="resource-watch-backdrop" role="presentation" onClick={closeWatch}><div className="resource-watch-panel" role="dialog" aria-modal="true" aria-label={watch.title} onClick={e=>e.stopPropagation()}><div className="resource-watch-head"><h4>{watch.title}</h4><button onClick={closeWatch} aria-label="Close recording">✕</button></div>{watch.localSrc?<video controls autoPlay src={watch.localSrc} playsInline/>:<iframe src={videoEmbed(watch.externalUrl,'youtube')||videoEmbed(watch.externalUrl,'drive')} title={watch.title} allow="accelerometer; autoplay; encrypted-media; picture-in-picture" allowFullScreen referrerPolicy="strict-origin-when-cross-origin"/>}</div></div>}
    {editable&&<div className="resource-upload-panel"><div className="resource-upload-intro"><CloudUpload size={22}/><div><h4>Add learning material</h4><p>Only students enrolled in this course and its assigned instructor can access these materials.</p></div></div><form onSubmit={save} className="form-grid dashboard-form">
      <label>Module<select value={form.moduleId} onChange={e=>setForm({...form,moduleId:e.target.value})} required>{modules.map(m=><option value={m._id} key={m._id}>{m.title}</option>)}</select></label>
      <label>Material type<select value={form.kind} onChange={e=>{setForm({...form,kind:e.target.value});setFile(null);if(fileRef.current)fileRef.current.value=''}}><option value="document">Notes / Document</option><option value="recording">Recorded class</option></select></label>
      <label>Resource title<input required maxLength={160} value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="e.g. Week 1 study notes"/></label>
      <label>Source<select value={form.source} onChange={e=>setForm({...form,source:e.target.value})}><option value="upload">Upload from device</option><option value="link">YouTube / Google Drive link</option></select></label>
      {form.kind==='recording'&&courseSessions.length>0&&<label className="form-full">Linked live class (optional)<select value={form.session} onChange={e=>setForm({...form,session:e.target.value})}><option value="">Not linked to a specific session</option>{courseSessions.map(c=><option value={c._id} key={c._id}>{c.title} · {new Date(c.startAt).toLocaleDateString()}</option>)}</select></label>}
      <label className="form-full">Description (optional)<textarea rows={2} maxLength={800} value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></label>
      {form.source==='upload'?<label className="form-full">Choose {form.kind==='recording'?'MP4 or WEBM recording (max 120 MB)':'PDF, TXT, MD, DOCX, PPTX or XLSX (max 20 MB)'}<input ref={fileRef} type="file" required accept={form.kind==='recording'?'.mp4,.webm':'.pdf,.txt,.md,.docx,.pptx,.xlsx'} onChange={e=>setFile(e.target.files?.[0]||null)}/></label>:
      <label className="form-full">{form.kind==='recording'?'YouTube / Google Drive recording URL':'Document URL (HTTPS)'}<input type="url" required value={form.url} onChange={e=>setForm({...form,url:e.target.value})} placeholder="https://drive.google.com/…"/></label>}
      <div className="form-full"><button className="btn btn-primary" disabled={busy||!form.moduleId}><Plus size={17}/>{busy?'Saving…':'Add resource'}</button></div>
    </form><p className="helper-text">Uploaded files are stored privately on your API server. Use persistent storage or cloud object storage before production. Google Drive and YouTube link permissions are controlled by those providers.</p></div>}
  </section>;
}
