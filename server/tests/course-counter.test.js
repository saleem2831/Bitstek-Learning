import test from 'node:test';
import assert from 'node:assert/strict';
import { countLessons } from '../src/utils/course.js';

test('countLessons safely handles projected courses with missing modules', () => {
  assert.equal(countLessons(undefined), 0);
  assert.equal(countLessons(null), 0);
});
test('countLessons handles legacy/null/missing lesson lists', () => {
  assert.equal(countLessons([{lessons:null},{title:'No lessons'},null,{lessons:[]}]),0);
});
test('countLessons counts lessons without mutating source data', () => {
  const modules = [{lessons:[{title:'One'},{title:'Two'}]},{lessons:[{title:'Three'}]}];
  assert.equal(countLessons(modules),3);
  assert.equal(modules[0].lessons.length,2);
});
