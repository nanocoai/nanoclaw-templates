// Unit tests for the minimal YAML parser in ../lib/yaml.mjs, which exists so
// the plugin ships without a YAML dependency. Covers the subset a thesis
// actually uses: scalar typing, nested maps and lists, numeric keys kept as
// strings (the scoring anchors), folded and literal blocks, comment
// stripping, flow mappings, and line numbers on errors. The differential
// test parses the example thesis with the reference `yaml` package and
// asserts both produce the same object.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { parse, YamlError } from '../lib/yaml.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const example = path.join(here, '..', '..', 'theses', 'example-fencing.yaml');

test('scalars type correctly', () => {
  assert.deepEqual(parse('a: 1\nb: 0.5\nc: true\nd: ~\ne:\nf: "x: y"\ng: hello world'),
    { a: 1, b: 0.5, c: true, d: null, e: null, f: 'x: y', g: 'hello world' });
});

test('nested maps, lists of scalars, lists of maps', () => {
  const doc = parse(`
top:
  list:
    - one
    - two
  items:
    - name: a
      weight: 1
    - name: b
      weight: 2
  inline: [x, y]
`);
  assert.deepEqual(doc, { top: { list: ['one', 'two'], items: [{ name: 'a', weight: 1 }, { name: 'b', weight: 2 }], inline: ['x', 'y'] } });
});

test('numeric keys survive as strings (scoring anchors)', () => {
  assert.deepEqual(parse('g:\n  100: best\n  50: mid\n  0: worst'), { g: { 100: 'best', 50: 'mid', 0: 'worst' } });
});

test('folded and literal blocks', () => {
  const doc = parse('a: >\n  one\n  two\n\n  three\nb: |\n  l1\n  l2\nc: x');
  assert.equal(doc.a, 'one two\nthree\n');
  assert.equal(doc.b, 'l1\nl2\n');
  assert.equal(doc.c, 'x');
});

test('comments are stripped, including trailing ones, but not inside quotes', () => {
  assert.deepEqual(parse('# head\na: 1 # trailing\nb: "keep # this"\n# tail'), { a: 1, b: 'keep # this' });
});

test('errors carry line numbers', () => {
  assert.throws(() => parse('a: 1\na: 2'), (e) => e instanceof YamlError && e.line === 2);
  assert.throws(() => parse('a: &anchor\n  b: 1\nc: *anchor'), YamlError);
});

test('differential: example thesis parses identically to the reference yaml package', (t) => {
  // Differential test: our subset parser must agree with a real YAML parser on
  // the shipped theses. The reference package is not a dependency -- this test
  // skips wherever it is not resolvable, which includes the agent container.
  let ref;
  try {
    ref = createRequire(import.meta.url)('yaml');
  } catch {
    try {
      ref = createRequire(path.join(process.env.NODE_YAML_REF ?? '/nonexistent', 'package.json'))('yaml');
    } catch { t.skip('no reference yaml package resolvable; set NODE_YAML_REF to enable'); return; }
  }
  const text = readFileSync(example, 'utf8');
  assert.deepEqual(parse(text), ref.parse(text));
});

test('single-line flow mappings, as the schema doc writes them', () => {
  assert.deepEqual(parse('a: { min: 0, max: 100 }'), { a: { min: 0, max: 100 } });
  assert.deepEqual(parse('a: { include: [], exclude: [] }'), { a: { include: [], exclude: [] } });
  assert.deepEqual(parse('a: { formats: [csv, json] }'), { a: { formats: ['csv', 'json'] } });
  assert.deepEqual(parse('a: {}'), { a: {} });
});

test('flow splitting respects nesting and quotes', () => {
  assert.deepEqual(parse('a: { x: [1, 2], y: 3 }'), { a: { x: [1, 2], y: 3 } });
  assert.deepEqual(parse('a: ["x, y", z]'), { a: ['x, y', 'z'] });
});

test('malformed flow collections fail with a line number', () => {
  assert.throws(() => parse('a: { b: 1'), (e) => e instanceof YamlError && e.line === 1);
  assert.throws(() => parse('a: { b }'), YamlError);
});
