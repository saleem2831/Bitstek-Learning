import test from 'node:test';
import assert from 'node:assert/strict';
import {validateVideo,isTimezone,validEmail,safeCourseInput,isHttpUrl} from '../src/utils/validation.js';

test('YouTube watch, short, and embed URLs are accepted',()=>{
  assert.equal(validateVideo('youtube','https://youtu.be/dQw4w9WgXcQ'),true);
  assert.equal(validateVideo('youtube','https://www.youtube.com/watch?v=dQw4w9WgXcQ'),true);
  assert.equal(validateVideo('youtube','https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ'),true);
});
test('Only approved video domains are accepted',()=>{
  assert.equal(validateVideo('youtube','https://youtube.com.attacker.net/watch?v=x'),false);
  assert.equal(validateVideo('drive','javascript:alert(1)'),false);
  assert.equal(validateVideo('drive','https://drive.google.com/file/d/abcdef/view'),true);
  assert.equal(validateVideo('drive','https://example.com/file/d/abcdef/view'),false);
  assert.equal(isHttpUrl('file:///etc/passwd'),false);
});
test('Timezones and email validation work',()=>{
  assert.equal(isTimezone('Asia/Kolkata'),true);
  assert.equal(isTimezone('Not/AZone'),false);
  assert.equal(validEmail('test@example.com'),true);
  assert.equal(validEmail('invalid'),false);
});
test('Course payload allowlists editable keys',()=>{
  const data=safeCourseInput({title:'Sample Course',summary:'Course description',isAdmin:true,slug:'unsafe-change'});
  assert.equal(data.isAdmin,undefined);
  assert.equal(data.slug,undefined);
  assert.equal(data.title,'Sample Course');
});
