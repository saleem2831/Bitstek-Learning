import path from 'node:path';
import {promises as fs} from 'node:fs';
import {Resource} from '../models/Resource.js';
// Called only after the course module has been saved/removed successfully.
export async function removeModuleResources(courseId,moduleId){
  const items=await Resource.find({course:courseId,moduleId});
  if(!items.length)return;
  await Resource.deleteMany({course:courseId,moduleId});
  const root=path.resolve(process.env.PRIVATE_UPLOAD_DIR||path.join(process.cwd(),'private_uploads'));
  for(const item of items){if(item.storageName){
    const local=path.join(root,path.basename(item.storageName));
    await fs.unlink(local).catch(e=>console.warn('Resource file cleanup failed:',e.message));
  }}
}
