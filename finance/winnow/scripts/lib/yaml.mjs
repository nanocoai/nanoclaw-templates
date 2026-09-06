// Minimal YAML subset parser — zero dependencies, because the agent container
// ships node but no YAML library. Supports exactly what a thesis file uses:
//
//   key: value                 maps, 2-space indentation
//   - item / - key: value      lists of scalars and lists of maps
//   key: >  / key: |           folded and literal block scalars
//   # comment                  full-line and trailing comments
//   100: text                  numeric keys (scoring anchors)
//   "quoted" 'quoted'          quoted scalars
//   true false null ~ 12 0.5   scalar typing
//   {a: 1, b: [x, y]}         single-line flow mappings and lists
//   key:                       empty value -> null
//
// Not supported, by design: anchors/aliases, flow collections spanning more
// than one line, multi-document files, tags, complex keys. The validator rejects anything the
// parser cannot represent, so a thesis outside this subset fails loudly.

export class YamlError extends Error {
  constructor(msg, line) { super(`YAML line ${line}: ${msg}`); this.line = line; }
}

function stripComment(s) {
  // A '#' starts a comment only at line start or after whitespace, and never
  // inside quotes.
  let q = null;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (q) { if (c === q) q = null; continue; }
    if (c === '"' || c === "'") { q = c; continue; }
    if (c === '#' && (i === 0 || /\s/.test(s[i - 1]))) return s.slice(0, i);
  }
  return s;
}

// Split a flow-collection body on top-level commas, respecting nesting and
// quotes so `{a: [1, 2], b: 3}` yields two entries rather than three.
function splitTop(body, line) {
  const out = [];
  let depth = 0, q = null, cur = '';
  for (const c of body) {
    if (q) { cur += c; if (c === q) q = null; continue; }
    if (c === '"' || c === "'") { q = c; cur += c; continue; }
    if (c === '[' || c === '{') depth++;
    else if (c === ']' || c === '}') depth--;
    if (depth < 0) throw new YamlError('unbalanced brackets in flow collection', line);
    if (c === ',' && depth === 0) { out.push(cur); cur = ''; continue; }
    cur += c;
  }
  if (depth !== 0) throw new YamlError('unbalanced brackets in flow collection', line);
  if (cur.trim() !== '') out.push(cur);
  return out;
}

function scalar(raw, line) {
  const s = raw.trim();
  if (s === '' || s === '~' || s === 'null') return null;
  if (s === 'true') return true;
  if (s === 'false') return false;
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    const inner = s.slice(1, -1);
    return s[0] === '"' ? inner.replace(/\\"/g, '"').replace(/\\n/g, '\n') : inner.replace(/''/g, "'");
  }
  if (s.startsWith('[') && s.endsWith(']')) {
    const body = s.slice(1, -1).trim();
    return body === '' ? [] : splitTop(body, line).map((x) => scalar(x, line));
  }
  if (s.startsWith('{')) {
    if (!s.endsWith('}')) throw new YamlError('unterminated flow mapping', line);
    const body = s.slice(1, -1).trim();
    const obj = {};
    if (body === '') return obj;
    for (const part of splitTop(body, line)) {
      const kv = splitKey(part.trim(), line);
      if (!kv) throw new YamlError(`flow mapping entry "${part.trim()}" is not "key: value"`, line);
      obj[keyOf(kv[0], line)] = scalar(kv[1], line);
    }
    return obj;
  }
  if (/^-?\d+$/.test(s)) return Number(s);
  if (/^-?\d*\.\d+$/.test(s)) return Number(s);
  return s;
}

// Split "key: value" at the first ': ' or trailing ':' outside quotes.
function splitKey(s, line) {
  let q = null;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (q) { if (c === q) q = null; continue; }
    if (c === '"' || c === "'") { q = c; continue; }
    if (c === ':' && (i === s.length - 1 || s[i + 1] === ' ')) {
      return [s.slice(0, i).trim(), s.slice(i + 1).trim()];
    }
  }
  return null;
}

function keyOf(raw, line) {
  const k = scalar(raw, line);
  if (k === null || typeof k === 'boolean' || Array.isArray(k)) throw new YamlError(`unsupported key "${raw}"`, line);
  return String(k);
}

export function parse(text) {
  const src = text.split(/\r?\n/);
  // Pre-tokenise: [lineNo, indent, content] with comments and blanks removed,
  // except inside block scalars, which are consumed by readBlock.
  const lines = src.map((l, i) => ({ n: i + 1, raw: l }));
  let pos = 0;

  const peek = () => {
    while (pos < lines.length) {
      const { raw } = lines[pos];
      const content = stripComment(raw);
      if (content.trim() === '') { pos++; continue; }
      return { n: lines[pos].n, indent: raw.length - raw.trimStart().length, content: content.trimEnd() };
    }
    return null;
  };

  function readBlock(style, parentIndent, chomp) {
    // Collect lines more indented than the parent; the block ends at the
    // first non-blank line at or below parentIndent.
    const out = [];
    let blockIndent = null;
    while (pos < lines.length) {
      const raw = lines[pos].raw;
      if (raw.trim() === '') { out.push(''); pos++; continue; }
      const ind = raw.length - raw.trimStart().length;
      if (ind <= parentIndent) break;
      if (blockIndent === null) blockIndent = ind;
      out.push(raw.slice(Math.min(ind, blockIndent)));
      pos++;
    }
    while (out.length && out[out.length - 1] === '') out.pop();
    let s;
    if (style === '|') s = out.join('\n');
    else {
      // Folded: single newlines become spaces, blank lines become newlines,
      // more-indented lines are kept verbatim.
      s = '';
      for (let i = 0; i < out.length; i++) {
        const l = out[i];
        if (l === '') { s += '\n'; continue; }
        if (i > 0 && out[i - 1] !== '' && !/^\s/.test(l) && !/^\s/.test(out[i - 1])) s += ' ';
        else if (i > 0 && out[i - 1] !== '') s += '\n';
        s += l;
      }
    }
    return chomp === '-' ? s : s + '\n';
  }

  function value(afterColon, indent, line) {
    const m = /^([>|])([+-]?)\s*$/.exec(afterColon);
    if (m) return readBlock(m[1], indent, m[2]);
    if (afterColon !== '') return scalar(afterColon, line);
    // Empty: the value is a nested node on following lines, or null.
    const nx = peek();
    if (!nx || nx.indent <= indent) return null;
    return node(nx.indent);
  }

  function node(indent) {
    const first = peek();
    if (!first) return null;
    if (first.content.trimStart().startsWith('- ') || first.content.trim() === '-') return list(indent);
    return map(indent);
  }

  function map(indent) {
    const obj = {};
    for (;;) {
      const cur = peek();
      if (!cur || cur.indent < indent) break;
      if (cur.indent > indent) throw new YamlError('unexpected indentation', cur.n);
      const body = cur.content.trimStart();
      if (body.startsWith('- ')) break;
      const kv = splitKey(body, cur.n);
      if (!kv) throw new YamlError(`expected "key: value", got "${body}"`, cur.n);
      pos++;
      const k = keyOf(kv[0], cur.n);
      if (k in obj) throw new YamlError(`duplicate key "${k}"`, cur.n);
      obj[k] = value(kv[1], indent, cur.n);
    }
    return obj;
  }

  function list(indent) {
    const arr = [];
    for (;;) {
      const cur = peek();
      if (!cur || cur.indent < indent) break;
      if (cur.indent > indent) throw new YamlError('unexpected indentation', cur.n);
      const body = cur.content.trimStart();
      if (!(body.startsWith('- ') || body === '-')) break;
      pos++;
      const rest = body === '-' ? '' : body.slice(2);
      if (rest === '') { arr.push(node(indent + 2)); continue; }
      const kv = splitKey(rest, cur.n);
      if (kv && !/^["']/.test(rest)) {
        // "- key: value" opens an inline map whose further keys sit at indent+2.
        const itemIndent = indent + 2;
        const obj = {};
        obj[keyOf(kv[0], cur.n)] = value(kv[1], itemIndent, cur.n);
        const nx = peek();
        if (nx && nx.indent === itemIndent && !nx.content.trimStart().startsWith('- ')) {
          Object.assign(obj, map(itemIndent));
        }
        arr.push(obj);
      } else {
        const m = /^([>|])([+-]?)\s*$/.exec(rest);
        arr.push(m ? readBlock(m[1], indent, m[2]) : scalar(rest, cur.n));
      }
    }
    return arr;
  }

  const first = peek();
  if (!first) return null;
  const doc = node(first.indent);
  const trailing = peek();
  if (trailing) throw new YamlError(`unexpected content "${trailing.content.trim()}"`, trailing.n);
  return doc;
}
