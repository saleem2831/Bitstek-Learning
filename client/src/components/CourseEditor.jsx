import React,{useEffect,useState} from 'react';
import {Link,useParams} from 'react-router-dom';
import {Plus,Video,Trash2,ArrowLeft,Pencil,Save,Settings2} from 'lucide-react';
import {useResource} from '../lib/hooks';
import {useMutation,PageTop,Panel,Notice,SelectInput} from './PortalBits';
import {Loading} from './Feedback';
import {getId} from '../lib/api';
import CourseResources from './CourseResources';
import CourseChat from './CourseChat';
const categories=['Development','AI & Data','Finance','Cloud & Security','Professional Skills'];
export default function CourseEditor({role='admin'}){
  const {id}=useParams();
  const url=`/${role}/courses`;
  const {data,loading,reload,error:loadError}=useResource(url);
  const course=data.find(c=>getId(c)===id);
  const [moduleTitle,setModuleTitle]=useState('');
  const [moduleRename,setModuleRename]=useState(null);
  const [lessonEdit,setLessonEdit]=useState(null);
  const [meta,setMeta]=useState(null);
  const [lesson,setLesson]=useState({moduleId:'',title:'',url:'',provider:'youtube',durationMinutes:0,isPreview:false});
  const {act,busy,error,success}=useMutation(reload);
  useEffect(()=>{if(course&&role==='admin'&&!meta)setMeta({title:course.title,summary:course.summary,description:course.description||'',category:course.category,level:course.level,duration:course.duration,image:course.image||'',outcomes:(course.outcomes||[]).join('\n'),published:course.published,featured:course.featured})},[course,role]);
  const addModule=async e=>{e.preventDefault();const d=await act(`/courses/${id}/modules`,'POST',{title:moduleTitle});if(d)setModuleTitle('')};
  const addLesson=async e=>{e.preventDefault();const d=await act(`/courses/${id}/modules/${lesson.moduleId}/lessons`,'POST',lesson);if(d)setLesson({moduleId:'',title:'',url:'',provider:'youtube',durationMinutes:0,isPreview:false})};
  const saveMeta=async e=>{e.preventDefault();const body={...meta,outcomes:meta.outcomes.split('\n').map(x=>x.trim()).filter(Boolean)};const d=await act(`/admin/courses/${id}`,'PATCH',body);if(d)setMeta({...meta})};
  return <>
    <Link to={`/${role}/courses`} className="back-link"><ArrowLeft size={16}/> Back to courses</Link>
    <PageTop eyebrow="COURSE STUDIO" title={course?.title||'Course builder'} description="Organize modules and embed YouTube or Google Drive lessons. Assigned instructors can manage this curriculum."/>
    <Notice error={error||loadError} success={success}/>
    {loading?<Loading/>:course?<>
      {role==='admin'&&meta&&<Panel title="Course information and publishing" description="Changes to this panel are reflected on the public course catalog."><form onSubmit={saveMeta} className="form-grid dashboard-form">
        <label>Course title<input required minLength={3} value={meta.title} onChange={e=>setMeta({...meta,title:e.target.value})}/></label>
        <label>Category<select value={meta.category} onChange={e=>setMeta({...meta,category:e.target.value})}>{categories.map(x=><option key={x}>{x}</option>)}</select></label>
        <label>Level<input value={meta.level} onChange={e=>setMeta({...meta,level:e.target.value})}/></label>
        <label>Duration<input value={meta.duration} onChange={e=>setMeta({...meta,duration:e.target.value})}/></label>
        <label className="form-full">Short summary<input required value={meta.summary} onChange={e=>setMeta({...meta,summary:e.target.value})}/></label>
        <label className="form-full">Description<textarea rows={4} value={meta.description} onChange={e=>setMeta({...meta,description:e.target.value})}/></label>
        <label className="form-full">Cover image URL<input type="url" value={meta.image} onChange={e=>setMeta({...meta,image:e.target.value})}/></label>
        <label className="form-full">Learning outcomes (one per line)<textarea rows={4} value={meta.outcomes} onChange={e=>setMeta({...meta,outcomes:e.target.value})}/></label>
        <label className="checkbox-label"><input type="checkbox" checked={meta.published} onChange={e=>setMeta({...meta,published:e.target.checked})}/> Publicly published</label>
        <label className="checkbox-label"><input type="checkbox" checked={meta.featured} onChange={e=>setMeta({...meta,featured:e.target.checked})}/> Featured on homepage</label>
        <div className="form-full"><button className="btn btn-primary" disabled={busy}><Save size={16}/> Save Course Details</button></div>
      </form></Panel>}
      <Panel title={`Curriculum · ${course.modules?.length||0} modules`} description="Learners access lessons only after administrator-approved enrollment.">
        {course.modules?.length?<div className="module-list">{course.modules.map((m,index)=><div className="module-item" key={m._id}>
          <div className="module-title"><span>{String(index+1).padStart(2,'0')}</span><strong>{m.title}</strong><small>{m.lessons.length} lessons</small><button className="table-button" onClick={()=>setModuleRename({id:m._id,title:m.title})}><Pencil size={13}/> Rename</button><button className="icon-button" title="Delete module" onClick={()=>{if(window.confirm('Delete this module and all its lessons?'))act(`/courses/${id}/modules/${m._id}`,'DELETE')}}><Trash2 size={15}/></button></div>
          {m.lessons.map(l=><div className="module-lesson" key={l._id}><Video size={17}/><div><strong>{l.title}</strong><small>{l.provider} · {l.durationMinutes||0} minutes {l.isPreview?'· Public preview':''}</small></div><button className="table-button" onClick={()=>setLessonEdit({moduleId:m._id,lessonId:l._id,title:l.title,url:l.url,provider:l.provider,isPreview:l.isPreview,durationMinutes:l.durationMinutes||0})}>Edit</button><button title="Delete lesson" className="icon-button" onClick={()=>{if(window.confirm('Delete this lesson?'))act(`/courses/${id}/modules/${m._id}/lessons/${l._id}`,'DELETE')}}><Trash2 size={15}/> Delete lesson</button></div>)}
        </div>)}</div>:<p>No modules yet. Add a module below to get started.</p>}
      </Panel>
      {moduleRename&&<Panel title="Rename module"><form className="form-stack" onSubmit={async e=>{e.preventDefault();const d=await act(`/courses/${id}/modules/${moduleRename.id}`,'PATCH',{title:moduleRename.title});if(d)setModuleRename(null)}}><label>Module name<input value={moduleRename.title} minLength={3} required onChange={e=>setModuleRename({...moduleRename,title:e.target.value})}/></label><div className="table-actions"><button className="btn btn-primary" disabled={busy}>Save Name</button><button type="button" className="btn btn-outline" onClick={()=>setModuleRename(null)}>Cancel</button></div></form></Panel>}
      {lessonEdit&&<Panel title="Edit video lesson"><form className="form-grid dashboard-form" onSubmit={async e=>{e.preventDefault();const d=await act(`/courses/${id}/modules/${lessonEdit.moduleId}/lessons/${lessonEdit.lessonId}`,'PATCH',{title:lessonEdit.title,url:lessonEdit.url,provider:lessonEdit.provider,isPreview:lessonEdit.isPreview,durationMinutes:Number(lessonEdit.durationMinutes)||0});if(d)setLessonEdit(null)}}>
        <label>Lesson title<input required value={lessonEdit.title} onChange={e=>setLessonEdit({...lessonEdit,title:e.target.value})}/></label>
        <label>Provider<select value={lessonEdit.provider} onChange={e=>setLessonEdit({...lessonEdit,provider:e.target.value})}><option value="youtube">YouTube</option><option value="drive">Google Drive</option></select></label>
        <label className="form-full">Video URL<input type="url" required value={lessonEdit.url} onChange={e=>setLessonEdit({...lessonEdit,url:e.target.value})}/></label>
        <label>Duration (minutes)<input type="number" min={0} value={lessonEdit.durationMinutes} onChange={e=>setLessonEdit({...lessonEdit,durationMinutes:e.target.value})}/></label>
        <label className="checkbox-label"><input type="checkbox" checked={lessonEdit.isPreview} onChange={e=>setLessonEdit({...lessonEdit,isPreview:e.target.checked})}/> Public preview</label>
        <div className="form-full table-actions"><button className="btn btn-primary" disabled={busy}>Save Lesson</button><button type="button" className="btn btn-outline" onClick={()=>setLessonEdit(null)}>Cancel</button></div>
      </form></Panel>}
      <div className="editor-actions"><Panel title="Add a module"><form className="form-stack" onSubmit={addModule}><label>Module name<input required value={moduleTitle} onChange={e=>setModuleTitle(e.target.value)} placeholder="e.g. React fundamentals"/></label><button disabled={busy} className="btn btn-primary"><Plus size={16}/> Add Module</button></form></Panel>
        <Panel title="Add a video lesson"><form className="form-stack" onSubmit={addLesson}>
          <SelectInput label="Module" value={lesson.moduleId} onChange={v=>setLesson({...lesson,moduleId:v})} options={(course.modules||[]).map(m=>({value:m._id,label:m.title}))}/>
          <label>Lesson title<input required value={lesson.title} onChange={e=>setLesson({...lesson,title:e.target.value})}/></label>
          <label>Video provider<select value={lesson.provider} onChange={e=>setLesson({...lesson,provider:e.target.value})}><option value="youtube">YouTube</option><option value="drive">Google Drive</option></select></label>
          <label>Video URL<input type="url" required value={lesson.url} onChange={e=>setLesson({...lesson,url:e.target.value})} placeholder="https://www.youtube.com/watch?v=..."/></label>
          <label>Duration (minutes)<input type="number" min={0} value={lesson.durationMinutes} onChange={e=>setLesson({...lesson,durationMinutes:e.target.value})}/></label>
          <label className="checkbox-label"><input type="checkbox" checked={lesson.isPreview} onChange={e=>setLesson({...lesson,isPreview:e.target.checked})}/> Allow public preview</label>
          <button className="btn btn-primary" disabled={busy||!course.modules?.length}><Plus size={16}/> Add Lesson</button>
        </form><p className="helper-text">The video must be shared appropriately with learners. YouTube unlisted and Drive shared links can still be copied.</p></Panel>
      </div>
      <CourseResources courseId={id} modules={course.modules||[]} role={role}/>
      <CourseChat courseId={id} role={role}/>
    </>:<div className="empty-state">Course not available in your workspace.</div>}
  </>;
}
