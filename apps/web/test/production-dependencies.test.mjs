import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mergeAttributes } from '@tiptap/core';

test('Tiptap preserves ordinary attributes and class merging', () => {
  const result = mergeAttributes({ class: 'editor', title: 'News' }, { class: 'article' });
  assert.equal(result.title, 'News');
  assert.equal(result.class, 'editor article');
});

test('Tiptap does not turn an own __proto__ key into inherited executable attributes', () => {
  const input = JSON.parse('{"__proto__":{"onclick":"untrusted-marker"},"title":"News"}');
  const result = mergeAttributes(input);
  assert.equal(result.onclick, undefined);
  assert.equal(Object.getPrototypeOf(result), Object.prototype);
  assert.equal({}.onclick, undefined);
  assert.equal(result.title, 'News');
});
