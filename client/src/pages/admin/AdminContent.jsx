import React,{useEffect,useState} from 'react';
import {Save,Globe,MessageCircle} from 'lucide-react';
import {PageTop,Panel,Notice,useMutation} from '../../components/PortalBits';
import {useResource} from '../../lib/hooks';

const initial={heroEyebrow:'SKILLS FOR TODAY. OPPORTUNITIES FOR TOMORROW.',heroTitle:'Learn skills that move you forward.',heroSubtitle:'Practical learning for technology, AI, finance and professional growth.',announcement:'',contactEmail:'hello@bitsteklearning.com',whatsappNumber:'',officeLocation:'Hyderabad, Telangana, India',ctaTitle:'Ready to start building your future?',ctaSubtitle:'Explore practical courses and connect with our learning team.'};
export default function AdminContent(){
  const {data,reload,error:loadError}=useResource('/admin/content',{});
  const [form,setForm]=useState(initial);
  useEffect(()=>{if(data&&data.heroTitle)setForm({...initial,...Object.fromEntries(Object.keys(initial).map(k=>[k,data[k]??initial[k]]))})},[data]);
  const {act,busy,error,success}=useMutation(reload);
  const field=(key,value)=>setForm(f=>({...f,[key]:value}));
  return <>
    <PageTop eyebrow="WEBSITE MANAGEMENT" title="Website content & contact" description="Control your public website's key messages and contact details without modifying code."/>
    <Notice error={error||loadError} success={success}/>
    <form className="cms-form" onSubmit={e=>{e.preventDefault();act('/admin/content','PUT',form)}}>
      <Panel title="Homepage hero" description="Visible at the top of the public homepage."><div className="form-stack">
        <label>Small heading<input value={form.heroEyebrow} maxLength={160} onChange={e=>field('heroEyebrow',e.target.value)}/></label>
        <label>Main headline<input required minLength={5} maxLength={180} value={form.heroTitle} onChange={e=>field('heroTitle',e.target.value)}/></label>
        <label>Headline description<textarea rows={4} maxLength={500} value={form.heroSubtitle} onChange={e=>field('heroSubtitle',e.target.value)}/></label>
        <label>Announcement banner (optional)<input value={form.announcement} maxLength={300} onChange={e=>field('announcement',e.target.value)} placeholder="e.g. New AI batch enrolling now"/></label>
      </div></Panel>
      <Panel title="Contact and enrollment" description="Used on the contact page and footer. WhatsApp should include country code, digits only."><div className="form-grid dashboard-form">
        <label>Public email<input required type="email" value={form.contactEmail} onChange={e=>field('contactEmail',e.target.value)}/></label>
        <label>WhatsApp business number<input value={form.whatsappNumber} pattern="[0-9]{8,15}" placeholder="919876543210" onChange={e=>field('whatsappNumber',e.target.value)}/></label>
        <label className="form-full">Office city / location<input value={form.officeLocation} onChange={e=>field('officeLocation',e.target.value)}/></label>
      </div></Panel>
      <Panel title="Final call-to-action" description="Displayed above the footer on the homepage."><div className="form-stack">
        <label>CTA headline<input value={form.ctaTitle} onChange={e=>field('ctaTitle',e.target.value)}/></label>
        <label>Supporting text<textarea rows={2} value={form.ctaSubtitle} onChange={e=>field('ctaSubtitle',e.target.value)}/></label>
      </div></Panel>
      <button className="btn btn-primary btn-large" disabled={busy}><Save size={17}/> Save Website Settings</button>
      <p className="helper-text">Course descriptions, instructor assignments, images, availability, and video modules are managed under Courses. Other editorial pages are kept in independent React components.</p>
    </form>
  </>;
}
