export const isAssignedInstructor=(actor,course)=>actor?.role==='instructor' && String(course?.instructor||'')===String(actor?._id||'');
export const canEditLearning=(actor,course)=>actor?.role==='admin'||isAssignedInstructor(actor,course);
export const canReadLearning=(actor,course,enrolled)=>canEditLearning(actor,course)||(actor?.role==='student'&&Boolean(enrolled));
export function validateMessage(body){
  if(typeof body!=='string'||body.trim().length<1||body.trim().length>4000) return 'Message must contain 1–4,000 characters.';
  return null;
}
export function safeFileName(value='download') {
  return String(value).replace(/[\r\n\\/<>:"|?*\u0000-\u001f]/g,'_').slice(0,140)||'download';
}
export function safeResourceKind(value){return value==='document'||value==='recording';}
