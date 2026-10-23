import test from 'node:test';
import assert from 'node:assert/strict';
import {Course} from '../src/models/Course.js';

test('course virtual survives projection without modules', () => {
  const course = Course.hydrate({ _id: '507f1f77bcf86cd799439011', title: 'Sample course', slug: 'sample', summary: 'Sample' }, { title: true });
  // Populate('course','title') can omit modules, which previously caused 500s
  assert.equal(course.lessonsCount, 0);
  assert.doesNotThrow(() => JSON.stringify(course));
});

test('course virtual survives old documents containing null modules', () => {
  const course = new Course({title:'Legacy',slug:'legacy',summary:'Description',modules:null});
  assert.equal(course.lessonsCount,0);
  assert.doesNotThrow(()=>JSON.stringify(course));
});

test('course virtual counts lessons and handles missing nested lessons', () => {
  const course = new Course({title:'Modern',slug:'modern',summary:'Description',modules:[{title:'First',lessons:[{title:'Intro',provider:'youtube',url:'https://www.youtube.com/watch?v=aqz-KE-bpKQ'}]},{title:'Second',lessons:null}]});
  assert.equal(course.lessonsCount,1);
  assert.doesNotThrow(()=>JSON.stringify(course));
});
