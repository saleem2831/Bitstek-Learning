import React,{useCallback,useEffect,useRef,useState} from 'react';
import {MessageCircle,Send,RefreshCw,Trash2,Users,UserRound,ShieldCheck} from 'lucide-react';
import {api} from '../lib/api';
import {useAuth} from '../context/AuthContext';

export default function CourseChat({courseId,role,compact=false}) {
  const {token,user}=useAuth();
  const [scope,setScope]=useState('course');const [participants,setParticipants]=useState([]);
  const [selectedStudent,setSelectedStudent]=useState('');
  const [messages,setMessages]=useState([]);const [draft,setDraft]=useState('');
  const [loading,setLoading]=useState(false);const [busy,setBusy]=useState(false);const [error,setError]=useState('');
  const endRef=useRef(null);const lastKey=useRef('');
  const allowedDirect=role==='student'||role==='instructor';
  const threadKey=`${courseId}:${scope}:${role==='student'?'me':selectedStudent}`;
  const ready=Boolean(courseId&&(scope==='course'||(allowedDirect&&(role==='student'||selectedStudent))));
  const requestPath=scope==='course'?`/messages/courses/${courseId}?scope=course`:
    `/messages/courses/${courseId}?scope=direct${role==='instructor'?`&student=${encodeURIComponent(selectedStudent)}`:''}`;
  const reload=useCallback(async({quiet=false}={})=>{
    if(!token||!ready)return;
    if(!quiet)setLoading(true);
    try{const response=await api(requestPath,{token,retries:0});setMessages(response.items||[]);setError('')}
    catch(err){if(!quiet)setError(err.message)}finally{if(!quiet)setLoading(false)}
  },[requestPath,ready,token]);
  useEffect(()=>{setMessages([]);setError('');lastKey.current='';reload();},[threadKey,reload]);
  useEffect(()=>{if(!ready)return;const timer=setInterval(()=>reload({quiet:true}),15_000);return()=>clearInterval(timer)},[ready,reload]);
  useEffect(()=>{if(!courseId||role!=='instructor')return;api(`/messages/courses/${courseId}/participants`,{token}).then(r=>{
    const students=r.items||[];setParticipants(students);setSelectedStudent(old=>students.some(s=>s._id===old)?old:(students[0]?._id||''));
  }).catch(e=>setError(e.message))},[courseId,role,token]);
  useEffect(()=>{if(lastKey.current===threadKey)endRef.current?.scrollIntoView({block:'nearest',behavior:'smooth'});else lastKey.current=threadKey},[messages.length,threadKey]);
  async function send(e){e.preventDefault();if(!draft.trim()||busy||!ready)return;setBusy(true);setError('');try{
    await api(`/messages/courses/${courseId}`,{method:'POST',token,body:JSON.stringify({scope,student:scope==='direct'&&role==='instructor'?selectedStudent:undefined,body:draft.trim()})});
    setDraft('');await reload();
  }catch(e){setError(e.message)}finally{setBusy(false)}}
  async function remove(id){if(!window.confirm('Remove this message?'))return;try{await api(`/messages/${id}`,{method:'DELETE',token});await reload()}catch(e){setError(e.message)}}
  return <section className={`course-chat ${compact?'course-chat-compact':''}`}>
    <div className="course-chat-heading"><div className="course-chat-title"><MessageCircle size={22}/><div><h3>Course conversations</h3><p>Ask questions, discuss topics and get instructor guidance.</p></div></div><button type="button" className="table-button" onClick={()=>reload()} disabled={!ready||loading}><RefreshCw size={15}/> Refresh</button></div>
    <div className="course-chat-tabs"><button className={scope==='course'?'active':''} onClick={()=>setScope('course')}><Users size={16}/> Course discussion</button>{allowedDirect&&<button className={scope==='direct'?'active':''} onClick={()=>setScope('direct')}><UserRound size={16}/> Private messages</button>}</div>
    {scope==='direct'&&role==='instructor'&&<div className="course-chat-recipient"><label htmlFor="chat-student">Choose an enrolled student</label><select id="chat-student" value={selectedStudent} onChange={e=>setSelectedStudent(e.target.value)}><option value="">Select a student</option>{participants.map(p=><option key={p._id} value={p._id}>{p.name} ({p.email})</option>)}</select></div>}
    {scope==='direct'&&role==='student'&&<p className="chat-context"><ShieldCheck size={15}/> Private conversation with your assigned course instructor.</p>}
    {scope==='course'&&<p className="chat-context"><Users size={15}/> Visible to active learners, the assigned instructor, and administrators.</p>}
    <div className="course-chat-scroll" role="log" aria-label="Course messages" aria-live="polite">
      {!ready?<div className="course-chat-empty">Select a student to start a private conversation.</div>:
        loading?<div className="course-chat-empty">Loading messages…</div>:
        messages.length===0?<div className="course-chat-empty"><MessageCircle size={24}/><strong>Start the conversation</strong><span>Messages for this course appear here.</span></div>:
        messages.map(m=><div key={m._id} className={`chat-message ${String(m.sender?._id)===String(user?.id)?'mine':''}`}><div className="chat-bubble"><div className="chat-message-head"><strong>{m.sender?.name||'Participant'}</strong><small>{new Date(m.createdAt).toLocaleString()}</small></div><p>{m.body}</p></div>{(String(m.sender?._id)===String(user?.id)||(scope==='course'&&(role==='admin'||role==='instructor')))&&<button title="Remove message" className="chat-remove" onClick={()=>remove(m._id)}><Trash2 size={14}/></button>}</div>)}
      <div ref={endRef}/>
    </div>
    {error&&<p className="error-notice" role="alert">{error}</p>}
    <form className="course-chat-compose" onSubmit={send}><label htmlFor={`message-${courseId}`} className="sr-only">Write a message</label><textarea id={`message-${courseId}`} placeholder={scope==='course'?'Ask the class a question…':'Write a private message…'} maxLength={4000} rows={2} value={draft} onChange={e=>setDraft(e.target.value)} disabled={!ready||busy}/><button className="btn btn-primary" type="submit" disabled={!ready||busy||!draft.trim()}><Send size={17}/> Send</button></form>
    <p className="chat-note">Updates refresh every 15 seconds. Do not share passwords or payment information in messages.</p>
  </section>;
}
