import React, {useState} from 'react';
import {Bell, Plus, Trash2, Megaphone} from 'lucide-react';
import {useResource} from '../lib/hooks';
import {formatDate} from '../lib/api';
import {PageTop, Panel, Notice, useMutation} from './PortalBits';
import {Loading, Empty} from './Feedback';

export default function AnnouncementBoard({role='student'}) {
  const {data, loading, error:loadError, reload} = useResource(`/${role}/announcements`);
  const courseData = useResource(role==='admin'?'/admin/courses':role==='instructor'?'/instructor/courses':null);
  const {act,busy,error,success} = useMutation(reload);
  const [form,setForm] = useState({title:'',body:'',course:''});
  const [show,setShow] = useState(false);
  const [editing,setEditing] = useState(null);
  const canWrite=role==='admin'||role==='instructor';
  const courses = courseData.data || [];
  const submit=async e=>{
    e.preventDefault();
    const result=await act(`/${role}/announcements`,'POST',form);
    if(result){setForm({title:'',body:'',course:''});setShow(false)}
  };
  return <>
    <PageTop eyebrow="LEARNING UPDATES" title={canWrite?'Announcements & notices':'My announcements'} description={canWrite?'Share updates with all learners or the students in your courses.':'Important updates from your instructors and the Bitstek Learning team.'} actions={canWrite?<button className="btn btn-primary" onClick={()=>setShow(!show)}><Plus size={16}/> New announcement</button>:null}/>
    <Notice error={error||loadError} success={success}/>
    {show&&canWrite&&<Panel title="Publish an announcement"><form className="form-stack" onSubmit={submit}>
      <label>Title<input required minLength={3} maxLength={160} value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/></label>
      <label>Audience<select value={form.course} required={role==='instructor'} onChange={e=>setForm({...form,course:e.target.value})}><option value="">{role==='admin'?'All students — platform-wide':'Choose your course'}</option>{courses.map(c=><option value={c._id} key={c._id}>{c.title}</option>)}</select></label>
      <label>Message<textarea required minLength={3} maxLength={4000} rows={5} value={form.body} onChange={e=>setForm({...form,body:e.target.value})}/></label>
      <div className="table-actions"><button className="btn btn-primary" disabled={busy}>Publish announcement</button><button className="btn btn-outline" type="button" onClick={()=>setShow(false)}>Cancel</button></div>
    </form></Panel>}
    {editing&&canWrite&&<Panel title="Edit announcement"><form className="form-stack" onSubmit={async e=>{e.preventDefault();const d=await act(`/${role}/announcements/${editing._id}`,'PATCH',{title:editing.title,body:editing.body});if(d)setEditing(null)}}><label>Title<input required maxLength={160} minLength={3} value={editing.title} onChange={e=>setEditing({...editing,title:e.target.value})}/></label><label>Message<textarea required rows={5} maxLength={4000} minLength={3} value={editing.body} onChange={e=>setEditing({...editing,body:e.target.value})}/></label><div className="table-actions"><button className="btn btn-primary" disabled={busy}>Save changes</button><button type="button" className="btn btn-outline" onClick={()=>setEditing(null)}>Cancel</button></div></form></Panel>}
    <Panel title="Latest updates" description="Messages are ordered from newest to oldest.">
      {loading?<Loading/>:loadError?<div className="empty-state">Announcements could not be loaded. Use Retry loading above.</div>:data.length?<div className="announcement-list">{data.map(a=><article className="announcement-item" key={a._id}><div className="announcement-icon"><Megaphone size={20}/></div><div className="announcement-content"><div className="announcement-meta"><span>{a.course?.title||'All learners'}</span><span>• {formatDate(a.createdAt)}</span></div><h3>{a.title}</h3><p>{a.body}</p><small>Posted by {a.author?.name||'Bitstek Learning'}</small></div>{canWrite&&<div className="announcement-actions"><button className="table-button" onClick={()=>setEditing({_id:a._id,title:a.title,body:a.body})}>Edit</button><button className="table-button" onClick={()=>act(`/${role}/announcements/${a._id}`,'PATCH',{published:!a.published})}>{a.published?'Unpublish':'Publish'}</button><button title="Delete" className="icon-button" onClick={()=>{if(window.confirm('Delete this announcement?'))act(`/${role}/announcements/${a._id}`,'DELETE')}}><Trash2 size={17}/></button></div>}</article>)}</div>:<Empty title="No announcements yet" description="Updates will appear here when they are posted."/>}
    </Panel>
  </>;
}
