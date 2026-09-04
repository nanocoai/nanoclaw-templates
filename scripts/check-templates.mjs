#!/usr/bin/env node
/**
 * Registry checks for every template (CI + local pre-PR).
 *
 * A template is a <category>/<template>/ directory containing plugin.json.
 * Enforced here:
 *   - plugin.json: exact 1.0.0 $schema, valid name
 *   - persona (ai.nanoco.nanoclaw/context/instructions.md) optional — plain
 *     Agent Plugins are accepted; if the file exists it must be non-empty
 *   - no legacy layout (context/instructions.md without plugin.json), no .mcp.json
 *   - mcp.json: exact $schema, exactly two top-level fields, declared type on
 *     every server, no credential-shaped env/header values ("placeholder" ok)
 *   - skills/<name>/SKILL.md frontmatter has name + description, and no
 *     unquoted value carrying a ": " (invalid YAML — the skill is skipped)
 *   - no symlinks anywhere in a template
 *
 * Zero dependencies by design — plain node. Run: node scripts/check-templates.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const PLUGIN_SCHEMA = 'https://agent-plugins.org/schemas/1.0.0/plugin.schema.json';
const MCP_SCHEMA = 'https://agent-plugins.org/schemas/1.0.0/mcp.schema.json';
const NAME_RE = /^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/;
// Mirrors NanoClaw's stamp-time secret lint (src/modules/self-mod/request.ts).
const SECRET_VALUE_RE = /^(sk-|ghp_|github_pat_|xox[a-z]-|AKIA|-----BEGIN )/;
const SECRET_KEY_RE = /(TOKEN|SECRET|PASSW(OR)?D|API_?KEY|APIKEY|CREDENTIAL|PRIVATE_?KEY|AUTH)/i;

const errors = [];
const fail = (tpl, msg) => errors.push(`${tpl}: ${msg}`);

const isDir = (p) => fs.existsSync(p) && fs.lstatSync(p).isDirectory();

function readJson(tpl, file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (err) {
    fail(tpl, `${path.basename(file)} is not valid JSON: ${err.message}`);
    return undefined;
  }
}

function checkNoSymlinks(tpl, dir, rel = '') {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const entryRel = rel ? `${rel}/${entry.name}` : entry.name;
    if (entry.isSymbolicLink()) fail(tpl, `symlink not allowed: ${entryRel}`);
    else if (entry.isDirectory()) checkNoSymlinks(tpl, path.join(dir, entry.name), entryRel);
  }
}

function checkManifest(tpl, dir) {
  const manifest = readJson(tpl, path.join(dir, 'plugin.json'));
  if (manifest === undefined) return;
  if (manifest.$schema !== PLUGIN_SCHEMA) fail(tpl, `plugin.json $schema must be "${PLUGIN_SCHEMA}"`);
  const name = manifest.name;
  if (typeof name !== 'string' || name.length > 64 || !NAME_RE.test(name) || name.includes('--') || name.includes('..')) {
    fail(tpl, 'plugin.json name must be 1-64 lowercase alphanumerics/hyphens/periods, no -- or .. runs');
  }
}

function checkSecretValues(tpl, server, kind, values) {
  for (const [key, value] of Object.entries(values ?? {})) {
    if (typeof value !== 'string') {
      fail(tpl, `mcp.json server "${server}" ${kind} "${key}" must be a string`);
      continue;
    }
    if (value === 'placeholder') continue;
    if (SECRET_VALUE_RE.test(value)) fail(tpl, `mcp.json server "${server}" ${kind} "${key}" looks like a real credential`);
    else if (SECRET_KEY_RE.test(key)) {
      fail(tpl, `mcp.json server "${server}" ${kind} "${key}" must use the literal "placeholder"`);
    }
  }
}

function checkMcp(tpl, dir) {
  const file = path.join(dir, 'mcp.json');
  if (!fs.existsSync(file)) return;
  const mcp = readJson(tpl, file);
  if (mcp === undefined) return;
  const keys = Object.keys(mcp);
  if (mcp.$schema !== MCP_SCHEMA) fail(tpl, `mcp.json $schema must be "${MCP_SCHEMA}"`);
  if (keys.some((k) => k !== '$schema' && k !== 'mcpServers')) fail(tpl, 'mcp.json allows exactly $schema and mcpServers');
  for (const [server, entry] of Object.entries(mcp.mcpServers ?? {})) {
    if (typeof entry !== 'object' || entry === null) {
      fail(tpl, `mcp.json server "${server}" must be an object`);
      continue;
    }
    if (entry.type !== 'stdio' && entry.type !== 'streamable-http') {
      fail(tpl, `mcp.json server "${server}" must declare type "stdio" or "streamable-http"`);
    }
    checkSecretValues(tpl, server, 'env', entry.env);
    checkSecretValues(tpl, server, 'headers', entry.headers);
  }
}

// Mirrors the loader's strict task frontmatter: schedule required, script
// optional, no other fields, nonempty prompt body.
function checkTasks(tpl, dir) {
  const tasksDir = path.join(dir, 'ai.nanoco.nanoclaw', 'tasks');
  if (!isDir(tasksDir)) return;
  for (const entry of fs.readdirSync(tasksDir, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith('.md')) continue;
    const rel = `ai.nanoco.nanoclaw/tasks/${entry.name}`;
    const lines = fs.readFileSync(path.join(tasksDir, entry.name), 'utf8').split(/\r?\n/);
    const closing = lines[0] === '---' ? lines.indexOf('---', 1) : -1;
    if (closing === -1) {
      fail(tpl, `${rel} must start with --- frontmatter (schedule, optional script)`);
      continue;
    }
    const frontmatter = lines.slice(1, closing);
    // Top-level keys only: continuation lines of a block scalar are indented.
    const keys = frontmatter.filter((l) => /^[A-Za-z_-]+\s*:/.test(l)).map((l) => l.split(':')[0].trim());
    if (!keys.includes('schedule')) fail(tpl, `${rel} frontmatter is missing "schedule"`);
    for (const key of keys) {
      if (key !== 'schedule' && key !== 'script') fail(tpl, `${rel} frontmatter accepts only schedule and script (found "${key}")`);
    }
    if (!lines.slice(closing + 1).join('\n').trim()) fail(tpl, `${rel} prompt body is empty`);
  }
}

function checkSkills(tpl, dir) {
  const skillsDir = path.join(dir, 'skills');
  if (!isDir(skillsDir)) return;
  for (const entry of fs.readdirSync(skillsDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const skillMd = path.join(skillsDir, entry.name, 'SKILL.md');
    if (!fs.existsSync(skillMd)) {
      fail(tpl, `skills/${entry.name} has no SKILL.md`);
      continue;
    }
    const head = fs.readFileSync(skillMd, 'utf8').split(/\r?\n/);
    const closing = head[0] === '---' ? head.indexOf('---', 1) : -1;
    const frontmatter = closing === -1 ? '' : head.slice(1, closing).join('\n');
    for (const field of ['name', 'description']) {
      if (!new RegExp(`^${field}\\s*:`, 'm').test(frontmatter)) {
        fail(tpl, `skills/${entry.name}/SKILL.md frontmatter is missing "${field}"`);
      }
    }
    // A ": " inside an unquoted value parses as a nested mapping, so the whole
    // skill is silently skipped at stamp time ("SKILL.md frontmatter is not
    // valid YAML") and the template stamps without it.
    for (const line of frontmatter.split('\n')) {
      const match = /^([A-Za-z_-]+)\s*:\s*(\S.*)$/.exec(line);
      if (!match || /^["'|>]/.test(match[2])) continue;
      if (match[2].includes(': ')) {
        fail(tpl, `skills/${entry.name}/SKILL.md frontmatter "${match[1]}" is not valid YAML: ": " inside an unquoted value — quote the value or use a dash`);
      }
    }
  }
}

const templates = [];
for (const category of fs.readdirSync(ROOT, { withFileTypes: true })) {
  if (!category.isDirectory() || category.name.startsWith('.') || category.name === 'scripts') continue;
  const categoryDir = path.join(ROOT, category.name);
  for (const entry of fs.readdirSync(categoryDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const tpl = `${category.name}/${entry.name}`;
    const dir = path.join(categoryDir, entry.name);
    if (!fs.existsSync(path.join(dir, 'plugin.json'))) {
      if (fs.existsSync(path.join(dir, 'context', 'instructions.md'))) {
        fail(tpl, 'legacy pre-plugin layout: add plugin.json and move context/ + tasks/ under ai.nanoco.nanoclaw/');
      } else {
        fail(tpl, 'not a template: plugin.json missing');
      }
      continue;
    }
    templates.push(tpl);
    checkNoSymlinks(tpl, dir);
    checkManifest(tpl, dir);
    checkMcp(tpl, dir);
    checkSkills(tpl, dir);
    checkTasks(tpl, dir);
    if (fs.existsSync(path.join(dir, '.mcp.json'))) fail(tpl, '.mcp.json is the legacy name; use mcp.json');
    // Persona is optional (plain Agent Plugins are accepted); if shipped it must not be empty.
    const persona = path.join(dir, 'ai.nanoco.nanoclaw', 'context', 'instructions.md');
    if (fs.existsSync(persona) && !fs.readFileSync(persona, 'utf8').trim()) {
      fail(tpl, 'ai.nanoco.nanoclaw/context/instructions.md exists but is empty');
    }
  }
}

if (templates.length === 0) errors.push('no templates found (no <category>/<template>/plugin.json anywhere)');

if (errors.length > 0) {
  console.error(`check-templates: ${errors.length} problem(s)\n`);
  for (const err of errors) console.error(`  - ${err}`);
  process.exit(1);
}
console.log(`check-templates: ${templates.length} template(s) OK: ${templates.join(', ')}`);
