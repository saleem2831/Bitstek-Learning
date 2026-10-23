import React,{useMemo,useState} from 'react';
import {UserPlus,KeyRound,Mail,Search,Users,ShieldCheck,GraduationCap,BookOpen,Building2,RefreshCw} from 'lucide-react';
import {useResource} from '../../lib/hooks';import {PageTop,Panel,Table,Status,Notice,useMutation} from '../../components/PortalBits';
import {Loading,ErrorNotice} from '../../components/Feedback';
const initial={name:'',email:'',password:'',role:'student',phone:'',organization:''};
const tabs=[{id:'all',label:'All users',Icon:Users},{id:'admin',label:'Admins',Icon:ShieldCheck},{id:'student',label:'Students',Icon:GraduationCap},{id:'instructor',label:'Instructors',Icon:BookOpen},{id:'corporate',label:'Corporate',Icon:Building2}];
export default function AdminUsers(){
 const {data,loading,reload,error:loadError}=useResource('/admin/users');
 const {act,busy,error,success}=useMutation(reload);
 const [form,setForm]=useState(initial),[open,setOpen]=useState(false),[reset,setReset]=useState(null),[temporaryPassword,setTemporaryPassword]=useState('');
 const [role,setRole]=useState('all'),[search,setSearch]=useState(''),[newAccount,setNewAccount]=useState(null);
 const people=Array.isArray(data)?data:[];
 const filtered=useMemo(()=>people.filter(p=>(role==='all'||p.role===role)&&(`${p.name} ${p.email} ${p.phone||''}`.toLowerCase().includes(search.toLowerCase().trim()))),[people,role,search]);
 const counts=useMemo(()=>Object.fromEntries(tabs.map(t=>[t.id,t.id==='all'?people.length:people.filter(p=>p.role===t.id).length])),[people]);
 const submit=async e=>{e.preventDefault();const result=await act('/admin/users','POST',form);if(result){setNewAccount(result.user);setForm(initial);setOpen(false);setRole('all')}};
 const resetPassword=async e=>{e.preventDefault();const result=await act(`/admin/users/${reset.id}/reset-password`,'POST',{newPassword:temporaryPassword});if(result){setReset(null);setTemporaryPassword('')}};
 const invite=async person=>{const result=await act(`/admin/users/${person.id}/send-invite`,'POST');if(result)setNewAccount(null)};
 return <>
  <PageTop eyebrow="ACCESS MANAGEMENT" title="People & accounts" description="Create accounts, filter by access level, and send secure password-setup email invitations." actions={<button className="btn btn-primary" onClick={()=>setOpen(x=>!x)}><UserPlus size={17}/> Add person</button>}/>
  <Notice error={error} success={success}/>
  {newAccount&&<div className="success-notice onboarding-notice"><div><strong>{newAccount.name} created.</strong><p>Send a one-time setup link to {newAccount.email}. The link expires in 24 hours; no password is emailed.</p></div><button disabled={busy} className="btn btn-primary" onClick={()=>invite(newAccount)}><Mail size={16}/> Send setup email</button><button className="btn btn-outline" onClick={()=>setNewAccount(null)}>Dismiss</button></div>}
  {open&&<Panel title="Create a new account" description="Use a temporary password for immediate local login. For safer delivery, select Send setup email after creation (SMTP required)."><form className="form-grid dashboard-form" onSubmit={submit}>
   <label>Full Name<input required maxLength={120} value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label>
   <label>Email Address<input required type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></label>
   <label>Account Type<select value={form.role} onChange={e=>setForm({...form,role:e.target.value})}><option value="student">Student</option><option value="instructor">Instructor</option><option value="corporate">Corporate</option><option value="admin">Administrator</option></select></label>
   <label>Temporary Password<input required minLength={12} type="password" autoComplete="new-password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} placeholder="12+ characters"/></label>
   <label>Phone<input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></label>
   <label>Organization<input value={form.organization} onChange={e=>setForm({...form,organization:e.target.value})}/></label>
   <div className="form-full table-actions"><button disabled={busy} className="btn btn-primary">Create account</button><button className="btn btn-outline" type="button" onClick={()=>setOpen(false)}>Cancel</button></div>
  </form></Panel>}
  {reset&&<Panel title={`Reset access — ${reset.name}`} description="Invalidates existing sessions. User must change the temporary password after login."><form className="form-stack" onSubmit={resetPassword}><label>New temporary password<input required minLength={12} maxLength={256} type="password" autoComplete="new-password" value={temporaryPassword} onChange={e=>setTemporaryPassword(e.target.value)}/></label><div className="table-actions"><button className="btn btn-primary" disabled={busy}><KeyRound size={16}/> Reset password</button><button type="button" className="btn btn-outline" onClick={()=>setReset(null)}>Cancel</button></div></form></Panel>}
  <Panel title="Directory" description={`${people.length} accounts; use role filters and search to find a person quickly.`} actions={<button className="table-button" type="button" onClick={reload}><RefreshCw size={14}/> Reload</button>}>
    <div className="people-tabs" role="tablist" aria-label="Filter by user role">{tabs.map(t=><button key={t.id} role="tab" aria-selected={role===t.id} className={`people-tab ${role===t.id?'active':''}`} onClick={()=>setRole(t.id)}><t.Icon size={16}/>{t.label}<span>{counts[t.id]}</span></button>)}</div>
    <div className="people-search"><Search size={18}/><input aria-label="Search people" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name, email or phone..." /></div>
    <ErrorNotice message={loadError} onRetry={reload}/>
    {loading?<Loading/>:loadError&&!people.length?<p className="helper-text">Unable to load accounts. Retry after confirming the backend and database are online.</p>:<Table empty="No accounts match these filters." rows={filtered} columns={[
      {label:'Person',render:r=><div><strong>{r.name}</strong><small style={{display:'block'}}>{r.email}</small></div>},{label:'Role',render:r=><span className="tag-outline">{r.role}</span>},
      {label:'Status',render:r=><Status value={r.active?'active':'inactive'}/>},
      {label:'Actions',render:r=><div className="table-actions"><button disabled={busy} className="table-button" onClick={()=>invite(r)} title="Send one-time password setup link"><Mail size={14}/> Send email</button><button className="table-button" onClick={()=>setReset(r)}><KeyRound size={14}/> Reset</button><button disabled={busy} className="table-button" onClick={()=>act(`/admin/users/${r.id}`,'PATCH',{active:!r.active})}>{r.active?'Disable':'Activate'}</button></div>}
    ]}/>}
  </Panel>
 </>;
}
