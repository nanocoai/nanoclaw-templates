import test from 'node:test';
import assert from 'node:assert/strict';
import {renderReport} from './renderer.mjs';
const dangerous = '<script>alert("x")</script><img src="https://bad.invalid/pixel" onerror="x">';
const base = () => ({job:{jobId:'job',title:'Label review',workOrder:'Serial A12'},reviewId:'review-test',version:3,generatedAt:'2026-09-06T15:00:00Z',status:'needs_review',unresolvedCount:1,requirements:[{id:'serial',label:'Serial',role:'existing',expectedValue:'A12',sourceQuote:'Serial A12',status:'mismatch',observation:{evidenceId:'image-1',observedValue:'A21',region:[.1,.2,.3,.4],note:''},previousStatus:null,changed:false}],evidence:[],history:[],followUpDraft:'Please send a close-up.'});

test('escapes content from work orders, observations, image labels and history',()=>{
 const v=base();v.job.title=dangerous;v.job.workOrder=dangerous;v.followUpDraft=dangerous;v.requirements[0].label=dangerous;v.requirements[0].observation.note=dangerous;v.history=[{reviewId:dangerous,unresolvedCount:1,recorded:false}];
 const html=renderReport(v);assert.ok(!html.includes('<script>'));assert.ok(!html.includes('<img src="https://'));assert.ok(html.includes('&lt;script&gt;'));assert.ok(html.includes("default-src 'none'"));
});
test('allows PNG bytes only as embedded image assets and refuses SVG URLs',()=>{
 const v=base();v.evidence=[{evidenceId:'image-1',label:dangerous,dataUrl:'data:image/svg+xml;base64,PHN2Zz4=',sha256:'a'.repeat(64)}];
 assert.ok(!renderReport(v).includes('<img src='));
 v.evidence[0].dataUrl='data:image/png;base64,aGVsbG8=';const html=renderReport(v);assert.ok(html.includes('<img src="data:image/png;base64,aGVsbG8="'));assert.ok(html.includes('left:10%;top:20%;width:30%;height:40%'));assert.ok(!html.includes('<script'));
});
test('changing a supported observation is updated, not resolved again',()=>{
 const v=base();v.unresolvedCount=0;v.requirements[0].status='supported';v.requirements[0].previousStatus='supported';v.requirements[0].changed=true;
 const html=renderReport(v);assert.ok(html.includes('Updated this round'));assert.ok(!html.includes('Resolved this round'));assert.ok(!html.includes('resolved this round</span>'));
 v.requirements[0].previousStatus='mismatch';const next=renderReport(v);assert.ok(next.includes('Resolved this round'));assert.ok(next.includes('<b>1</b> resolved this round'));
});
test('no approval controls, remote assets or print letterboxing',()=>{
 const html=renderReport(base());assert.ok(!/<(?:script|iframe|form|button)\b/.test(html));assert.ok(!/<link\b/.test(html));assert.ok(!/url\(https?:/.test(html));assert.ok(!html.includes('object-fit:contain'));assert.ok(html.includes('Status when generated'));assert.ok(html.includes('@media(max-width:720px)'));
});
