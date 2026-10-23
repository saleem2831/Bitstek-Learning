import React,{useState} from 'react';
import {PageTop,Panel} from '../../components/PortalBits';
import {useResource} from '../../lib/hooks';
import {Loading,ErrorNotice} from '../../components/Feedback';
import CourseChat from '../../components/CourseChat';
export default function InstructorDiscussions({role='instructor'}){
  const {data,loading,error}=useResource(role==='admin'?'/admin/courses':role==='student'?'/student/courses':'/instructor/courses');
  const [choice,setChoice]=useState('');const items=Array.isArray(data)?(role==='student'?data.map(x=>x.course).filter(Boolean):data):[];
  const selected=items.find(c=>c._id===choice)||items[0];
  return <><PageTop eyebrow="LEARNER COMMUNICATION" title="Course discussions & messages" description={role==='student'?'Ask your classmates a question or message your instructor privately.':'Talk to all students in a course or privately with one enrolled learner.'}/>
  <ErrorNotice message={error}/><Panel title="Choose a course">{loading?<Loading/>:<label className="chat-course-selector">Course<select value={selected?._id||''} onChange={e=>setChoice(e.target.value)}>{items.map(c=><option key={c._id} value={c._id}>{c.title}</option>)}</select></label>}</Panel>
  {selected?<CourseChat key={selected._id} courseId={selected._id} role={role}/>:!loading&&<div className="resource-empty">No accessible courses found.</div>}</>;
}
