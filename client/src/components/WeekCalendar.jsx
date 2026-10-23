import React,{useMemo,useState} from 'react';
import {ChevronLeft,ChevronRight,CalendarDays,Clock3,List,CalendarRange,Video,MapPin} from 'lucide-react';
import {formatDate} from '../lib/api';
const monday=date=>{const d=new Date(date);d.setHours(0,0,0,0);d.setDate(d.getDate()-(d.getDay()+6)%7);return d};
const sameDay=(a,b)=>a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth()&&a.getDate()===b.getDate();
const labelDate=(date,opts)=>date.toLocaleDateString(undefined,opts);
const time=v=>new Date(v).toLocaleTimeString(undefined,{hour:'numeric',minute:'2-digit'});
const addDays=(base,count)=>{const d=new Date(base);d.setDate(d.getDate()+count);return d};
export default function WeekCalendar({sessions=[],onSelect}){
 const [view,setView]=useState('month'),[anchor,setAnchor]=useState(()=>new Date()),[selected,setSelected]=useState(()=>new Date());
 const active=useMemo(()=>(Array.isArray(sessions)?sessions:[]).filter(s=>s?.status==='scheduled'&&Number.isFinite(new Date(s.startAt).getTime())).sort((a,b)=>new Date(a.startAt)-new Date(b.startAt)),[sessions]);
 const days=useMemo(()=>{
  if(view==='week'){const first=monday(anchor);return Array.from({length:7},(_,i)=>addDays(first,i));}
  const first=monday(new Date(anchor.getFullYear(),anchor.getMonth(),1));
  const last=new Date(anchor.getFullYear(),anchor.getMonth()+1,0);
  const count=Math.ceil(((last-first)/86400000+1)/7)*7;
  return Array.from({length:count},(_,i)=>addDays(first,i));
 },[view,anchor]);
 const title=view==='week'?`${labelDate(days[0],{month:'short',day:'numeric'})} – ${labelDate(days[6],{month:'short',day:'numeric',year:'numeric'})}`:labelDate(anchor,{month:'long',year:'numeric'});
 const selectedSessions=active.filter(s=>sameDay(new Date(s.startAt),selected));
 function changePeriod(dir){const d=new Date(anchor);if(view==='week')d.setDate(d.getDate()+7*dir);else d.setMonth(d.getMonth()+dir,1);setAnchor(d);setSelected(d)}
 function goToday(){const d=new Date();setAnchor(d);setSelected(d)}
 return <div className="bl-calendar">
  <div className="bl-calendar-toolbar"><div className="bl-calendar-title"><CalendarDays size={20}/><div><strong>{title}</strong><small>Times are displayed in your local timezone</small></div></div><div className="bl-calendar-actions"><div className="calendar-switch" role="group" aria-label="Calendar view"><button className={view==='month'?'active':''} onClick={()=>setView('month')} type="button"><CalendarRange size={15}/> Month</button><button className={view==='week'?'active':''} onClick={()=>setView('week')} type="button"><List size={15}/> Week</button></div><button className="calendar-today" onClick={goToday} type="button">Today</button><button className="calendar-arrow" onClick={()=>changePeriod(-1)} type="button" aria-label="Previous period"><ChevronLeft size={19}/></button><button className="calendar-arrow" onClick={()=>changePeriod(1)} type="button" aria-label="Next period"><ChevronRight size={19}/></button></div></div>
  <div className="bl-calendar-scroller"><div className={`bl-calendar-grid ${view==='week'?'calendar-week':'calendar-month'}`}>
   {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(x=><div className="bl-calendar-weekday" key={x}>{x}</div>)}
   {days.map(day=>{const events=active.filter(s=>sameDay(new Date(s.startAt),day));const today=sameDay(day,new Date());const chosen=sameDay(day,selected);return <div key={`${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`} className={`bl-calendar-cell ${today?'today':''} ${chosen?'selected':''} ${view==='month'&&day.getMonth()!==anchor.getMonth()?'outside':''}`}>
    <button type="button" className="bl-day-number" onClick={()=>setSelected(day)} aria-label={`Show classes on ${labelDate(day,{dateStyle:'medium'})}`}><span>{day.getDate()}</span>{events.length>0&&<small>{events.length} {events.length===1?'class':'classes'}</small>}</button>
    <div className="bl-cell-events">{events.slice(0,view==='week'?5:3).map(s=><button key={s._id} type="button" className="bl-event-chip" onClick={()=>{setSelected(day);onSelect?.(s)}} title={`${s.title} · ${formatDate(s.startAt)}`}><time>{time(s.startAt)}</time><span>{s.title}</span></button>)}{events.length>(view==='week'?5:3)&&<button type="button" className="bl-more" onClick={()=>setSelected(day)}>+{events.length-(view==='week'?5:3)} more</button>}</div>
   </div>})}
  </div></div>
  <div className="bl-calendar-agenda"><div className="bl-agenda-title"><strong>{labelDate(selected,{weekday:'long',month:'long',day:'numeric',year:'numeric'})}</strong><span>{selectedSessions.length} {selectedSessions.length===1?'class':'classes'}</span></div>
   {selectedSessions.length?<div className="bl-agenda-list">{selectedSessions.map(s=><div className="bl-agenda-item" key={s._id}><span className="bl-agenda-time"><Clock3 size={15}/>{time(s.startAt)}–{time(s.endAt)}</span><div className="bl-agenda-main"><strong>{s.title}</strong><small>{s.course?.title||'Live class'}{s.instructor?.name?` · ${s.instructor.name}`:''}</small></div>{onSelect?<button type="button" className="btn btn-outline" onClick={()=>onSelect(s)}>Manage</button>:s.meetingUrl?<a className="btn btn-primary" href={s.meetingUrl} target="_blank" rel="noreferrer"><Video size={15}/> Join class</a>:<span className="text-muted">Link pending</span>}</div>)}</div>:<div className="bl-agenda-empty">No classes scheduled for this date.</div>}
  </div>
 </div>;
}
