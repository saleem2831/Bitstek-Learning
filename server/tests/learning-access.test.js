import test from 'node:test';
import assert from 'node:assert/strict';
import {canEditLearning,canReadLearning,isAssignedInstructor,validateMessage,safeFileName,safeResourceKind} from '../src/utils/learning-access.js';
const course={instructor:'100000000000000000000001'};
const instructor={_id:'100000000000000000000001',role:'instructor'};
const otherInstructor={_id:'100000000000000000000002',role:'instructor'};
test('only the assigned instructor or admin can edit course materials',()=>{
  assert.equal(isAssignedInstructor(instructor,course),true);
  assert.equal(canEditLearning(instructor,course),true);
  assert.equal(canEditLearning(otherInstructor,course),false);
  assert.equal(canEditLearning({role:'admin'},course),true);
  assert.equal(canEditLearning({role:'student'},course),false);
});
test('only enrolled students can read course resources',()=>{
  assert.equal(canReadLearning({role:'student'},course,true),true);
  assert.equal(canReadLearning({role:'student'},course,false),false);
  assert.equal(canReadLearning(otherInstructor,course,false),false);
  assert.equal(canReadLearning({role:'admin'},course,false),true);
});
test('message length validation and filename sanitation',()=>{
  assert.equal(validateMessage('Hello instructor'),null);
  assert.ok(validateMessage('  '));
  assert.ok(validateMessage('x'.repeat(4001)));
  assert.equal(safeFileName('../notes\\chapter\r\n.pdf'),'.._notes_chapter__.pdf');
  assert.equal(safeResourceKind('recording'),true);
  assert.equal(safeResourceKind('executable'),false);
});
