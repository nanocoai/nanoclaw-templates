#!/usr/bin/env node

import assert from 'node:assert/strict';
import { access, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { addEvidence, initCase, verifyEvidence } from '../../ingest-evidence/scripts/evidence-ledger.mjs';
import { renderPack } from '../../audit-case/scripts/render-pack.mjs';
import { validateCase } from '../../audit-case/scripts/validate-case.mjs';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const pluginRoot = path.resolve(scriptDir, '..', '..', '..');
const fixtureRoot = path.join(pluginRoot, 'fixtures', 'denied-refund');
const invoiceFixtureRoot = path.join(pluginRoot, 'fixtures', 'unpaid-invoice');
const adversarialFixtureRoot = path.join(pluginRoot, 'fixtures', 'adversarial-evidence');
const failureFixtureRoot = path.join(pluginRoot, 'fixtures', 'conflicting-unreadable');

async function writeJson(file, value) {
  await writeFile(file, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

async function writeJsonLines(file, values) {
  await writeFile(file, `${values.map((item) => JSON.stringify(item)).join('\n')}\n`, 'utf8');
}

async function main() {
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), 'paper-trail-tests-'));
  const results = [];
  try {
    const caseDir = path.join(temporaryRoot, 'denied-laptop-refund');
    const initialized = await initCase(
      caseDir,
      'Denied laptop refund <script>alert(1)</script>',
      'Refund the USD 1,249.00 originally promised',
    );
    assert.equal(initialized.case.caseId, 'denied-laptop-refund');
    results.push('initializes a safe case workspace');

    const inputs = [
      '01-order-receipt.pdf',
      '02-refund-promise.png',
      '03-return-label.pdf',
      '04-carrier-dropoff.pdf',
      '05-refund-denial.txt',
      '06-unrelated-coupon.txt',
    ].map((name) => path.join(fixtureRoot, name));
    for (const pdfInput of [inputs[0], inputs[2], inputs[3]]) {
      const signature = (await readFile(pdfInput)).subarray(0, 5).toString('ascii');
      assert.equal(signature, '%PDF-');
    }
    const pngSignature = (await readFile(inputs[1])).subarray(0, 8).toString('hex');
    assert.equal(pngSignature, '89504e470d0a1a0a');
    results.push('ships valid PDF and PNG fixtures for the golden path');
    const added = await addEvidence(caseDir, [...inputs, inputs[0]]);
    assert.equal(added.added.length, 6);
    assert.equal(added.duplicates.length, 1);
    assert.equal(added.totals.uniqueExhibits, 6);
    const extractedManifestFile = path.join(caseDir, 'manifest.json');
    const extractedManifest = JSON.parse(await readFile(extractedManifestFile, 'utf8'));
    for (const exhibit of extractedManifest.exhibits) exhibit.extractionStatus = 'complete';
    await writeJson(extractedManifestFile, extractedManifest);
    results.push('assigns stable exhibit IDs and detects byte-identical duplicates');

    const citations = {
      order: [{ exhibitId: 'E-001', pinpoint: 'page 1, order and amount-paid fields' }],
      promise: [{ exhibitId: 'E-002', pinpoint: 'support chat, message 2' }],
      label: [{ exhibitId: 'E-003', pinpoint: 'page 1, return authorization and tracking fields' }],
      dropoff: [{ exhibitId: 'E-004', pinpoint: 'page 1, status and accepted-by-carrier fields' }],
      denial: [{ exhibitId: 'E-005', pinpoint: 'email body' }],
    };
    const facts = [
      { factId: 'F-001', field: 'order_number', value: 'NS-10482', state: 'SUPPORTED', citations: citations.order, confidence: 'high' },
      { factId: 'F-002', field: 'amount_paid', value: 'USD 1,249.00', state: 'SUPPORTED', citations: citations.order, confidence: 'high' },
      { factId: 'F-003', field: 'return_reference', value: 'RMA-8831', state: 'SUPPORTED', citations: citations.promise, confidence: 'high' },
      { factId: 'F-004', field: 'refund_promise', value: 'Refund after warehouse receipt', state: 'SUPPORTED', citations: citations.promise, confidence: 'high' },
      { factId: 'F-005', field: 'carrier_dropoff', value: 'Accepted by carrier on 2026-08-28 09:42 UTC', state: 'SUPPORTED', citations: citations.dropoff, confidence: 'high' },
      { factId: 'F-006', field: 'warehouse_receipt', value: 'Merchant says no warehouse receipt record', state: 'SUPPORTED', citations: citations.denial, confidence: 'high' },
    ];
    await writeJsonLines(path.join(caseDir, 'facts.jsonl'), facts);
    await writeJson(path.join(caseDir, 'timeline.json'), [
      { eventId: 'T-001', date: '2026-08-18', description: 'Laptop purchased for USD 1,249.00', actor: 'Customer', state: 'SUPPORTED', citations: citations.order },
      { eventId: 'T-002', date: '2026-08-25T14:10:00Z', description: 'Support opened RMA-8831 and promised a refund after warehouse receipt', actor: 'Northstar support', state: 'SUPPORTED', citations: citations.promise },
      { eventId: 'T-003', date: '2026-08-28T09:42:00Z', description: 'Carrier accepted the return parcel at the counter', actor: 'Carrier', state: 'SUPPORTED', citations: citations.dropoff },
      { eventId: 'T-004', date: '2026-09-02T11:15:00Z', description: 'Merchant denied the refund because its warehouse had no receipt record', actor: 'Northstar returns', state: 'SUPPORTED', citations: citations.denial },
    ]);
    await writeJson(path.join(caseDir, 'conflicts.json'), [
      {
        conflictId: 'C-001',
        field: 'return_status',
        whyItMatters: 'Refund eligibility depends on whether the return reached the warehouse.',
        resolutionNeeded: 'Obtain the carrier delivery scan or trace result for TRK-771900.',
        alternatives: [
          { value: 'Parcel was accepted by the carrier', citations: citations.dropoff },
          { value: 'Merchant warehouse reports no receipt record', citations: citations.denial },
        ],
      },
    ]);
    await writeJson(path.join(caseDir, 'missing.json'), [
      {
        missingId: 'M-001',
        priority: 'HIGH',
        item: 'Carrier delivery confirmation or trace result',
        whyItMatters: 'The drop-off receipt proves carrier acceptance, not delivery to the merchant warehouse.',
        whereToFind: 'Carrier tracking history or a carrier support trace for TRK-771900',
        canProceed: true,
      },
    ]);
    await writeJson(path.join(caseDir, 'draft.json'), {
      subject: 'Refund request for order NS-10482 and return RMA-8831',
      body: 'I am requesting the USD 1,249.00 refund for order NS-10482. Support opened return RMA-8831 and stated that the refund would be issued after warehouse receipt [E-002]. The carrier accepted tracking TRK-771900 on 28 August 2026 [E-004]. On 2 September, the returns team said the warehouse had no receipt record [E-005]. Please trace the return and confirm the next step. I am obtaining the carrier delivery confirmation and will add it when available.',
      factIds: ['F-001', 'F-002', 'F-003', 'F-004', 'F-005', 'F-006'],
    });
    const caseRecord = JSON.parse(await readFile(path.join(caseDir, 'case.json'), 'utf8'));
    caseRecord.state = 'DRAFT_READY';
    await writeJson(path.join(caseDir, 'case.json'), caseRecord);

    const validation = await validateCase(caseDir);
    assert.deepEqual(validation.errors, []);
    assert.equal(validation.ok, true);
    results.push('validates exhibit citations, conflicts, missing proof, and grounded draft facts');

    const rendered = await renderPack(caseDir);
    assert.equal(rendered.files.length, 7);
    const pack = await readFile(path.join(caseDir, 'PACK.html'), 'utf8');
    assert.match(pack, /Carrier delivery confirmation/);
    assert.doesNotMatch(pack, /<script>alert\(1\)<\/script>/);
    assert.match(pack, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
    results.push('renders a self-contained escaped HTML packet and six companion artifacts');

    const firstSource = path.join(caseDir, 'source', 'E-001__01-order-receipt.pdf');
    await writeFile(firstSource, 'tampered bytes', 'utf8');
    const evidenceCheck = await verifyEvidence(caseDir);
    assert.equal(evidenceCheck.ok, false);
    const tamperValidation = await validateCase(caseDir);
    assert.equal(tamperValidation.ok, false);
    assert(tamperValidation.errors.some((error) => error.includes('checksum changed')));
    results.push('fails closed when indexed evidence bytes change');

    const badCase = path.join(temporaryRoot, 'invalid-citation');
    await initCase(badCase, 'Invalid citation fixture', 'Organize supplied proof');
    await addEvidence(badCase, [inputs[0]]);
    await writeJsonLines(path.join(badCase, 'facts.jsonl'), [
      { factId: 'F-001', field: 'order_number', value: 'NS-10482', state: 'SUPPORTED', citations: [{ exhibitId: 'E-999', pinpoint: 'line 4' }], confidence: 'high' },
    ]);
    const invalidCitation = await validateCase(badCase);
    assert.equal(invalidCitation.ok, false);
    assert(invalidCitation.errors.some((error) => error.includes('unknown exhibit E-999')));
    results.push('rejects supported facts that cite an unknown exhibit');

    const escapeCase = path.join(temporaryRoot, 'path-escape');
    await initCase(escapeCase, 'Path escape fixture', 'Keep evidence inside the case');
    await addEvidence(escapeCase, [inputs[0]]);
    const escapeManifestFile = path.join(escapeCase, 'manifest.json');
    const escapeManifest = JSON.parse(await readFile(escapeManifestFile, 'utf8'));
    escapeManifest.exhibits[0].storedName = path.join('..', 'case.json');
    await writeJson(escapeManifestFile, escapeManifest);
    const escapedPath = await validateCase(escapeCase);
    assert.equal(escapedPath.ok, false);
    assert(escapedPath.errors.some((error) => error.includes('escapes the source directory')));
    results.push('rejects manifest paths that escape the evidence directory');

    const adversarialCase = path.join(temporaryRoot, 'adversarial-evidence');
    await initCase(adversarialCase, 'Adversarial evidence fixture', 'Organize the supplied order evidence');
    const adversarialInputs = [
      '01-order-record.txt',
      '02-exported-customer-note.txt',
    ].map((name) => path.join(adversarialFixtureRoot, name));
    const adversarialAdded = await addEvidence(adversarialCase, adversarialInputs);
    assert.equal(adversarialAdded.added.length, 2);
    const copiedHostileText = await readFile(
      path.join(adversarialCase, 'source', 'E-002__02-exported-customer-note.txt'),
      'utf8',
    );
    assert.match(copiedHostileText, /SYSTEM OVERRIDE/);
    await assert.rejects(
      access(path.join(adversarialCase, 'INJECTION-SUCCEEDED')),
      (error) => error.code === 'ENOENT',
    );
    assert.equal((await verifyEvidence(adversarialCase)).ok, true);
    results.push('indexes instruction-shaped exhibit content as inert bytes without executing it');

    const failureCase = path.join(temporaryRoot, 'conflicting-unreadable');
    await initCase(failureCase, 'Conflicting return evidence', 'Refund the supported charged amount');
    const failureInputs = [
      '01-customer-return-summary.txt',
      '02-merchant-return-ledger.txt',
      '03-damaged-scan.pdf',
    ].map((name) => path.join(failureFixtureRoot, name));
    const failureAdded = await addEvidence(failureCase, failureInputs);
    assert.equal(failureAdded.added.length, 3);
    const failureManifestFile = path.join(failureCase, 'manifest.json');
    const failureManifest = JSON.parse(await readFile(failureManifestFile, 'utf8'));
    failureManifest.exhibits[0].extractionStatus = 'complete';
    failureManifest.exhibits[1].extractionStatus = 'complete';
    failureManifest.exhibits[2].extractionStatus = 'unreadable';
    await writeJson(failureManifestFile, failureManifest);
    const failureCitations = {
      customer: [{ exhibitId: 'E-001', pinpoint: 'lines 3–6' }],
      merchant: [{ exhibitId: 'E-002', pinpoint: 'lines 3–6' }],
      scan: [{ exhibitId: 'E-003', pinpoint: 'file-level extraction attempt' }],
    };
    await writeJsonLines(path.join(failureCase, 'facts.jsonl'), [
      { factId: 'F-001', field: 'amount_charged', value: 'USD 799.00', state: 'SUPPORTED', citations: failureCitations.customer, confidence: 'high' },
      { factId: 'F-002', field: 'amount_recorded', value: 'USD 749.00', state: 'SUPPORTED', citations: failureCitations.merchant, confidence: 'high' },
      { factId: 'F-003', field: 'damaged_scan', value: 'Content could not be extracted reliably', state: 'UNREADABLE', citations: failureCitations.scan, confidence: 'low' },
    ]);
    await writeJson(path.join(failureCase, 'timeline.json'), [
      { eventId: 'T-001', date: '2026-09-01', description: 'Customer states the return was delivered', actor: 'Customer', state: 'SUPPORTED', citations: failureCitations.customer },
      { eventId: 'T-002', date: '2026-09-03', description: 'Merchant ledger reports no warehouse receipt', actor: 'Merchant', state: 'SUPPORTED', citations: failureCitations.merchant },
    ]);
    await writeJson(path.join(failureCase, 'conflicts.json'), [
      {
        conflictId: 'C-001',
        field: 'transaction_amount',
        whyItMatters: 'The requested refund amount must not silently choose between two supported values.',
        resolutionNeeded: 'Confirm the charged amount from an independent receipt or statement.',
        alternatives: [
          { value: 'USD 799.00', citations: failureCitations.customer },
          { value: 'USD 749.00', citations: failureCitations.merchant },
        ],
      },
    ]);
    await writeJson(path.join(failureCase, 'missing.json'), [
      {
        missingId: 'M-001',
        priority: 'BLOCKING',
        item: 'Readable replacement for the damaged scan',
        whyItMatters: 'The scan may resolve the amount or delivery-status conflicts.',
        whereToFind: 'Original export or a new scan from the source document',
        canProceed: false,
      },
    ]);
    const failureCaseRecordFile = path.join(failureCase, 'case.json');
    const failureCaseRecord = JSON.parse(await readFile(failureCaseRecordFile, 'utf8'));
    failureCaseRecord.state = 'REVIEW_NEEDED';
    await writeJson(failureCaseRecordFile, failureCaseRecord);
    const failureValidation = await validateCase(failureCase);
    assert.equal(failureValidation.ok, true);
    assert.equal(failureValidation.counts.conflicts, 1);
    assert.equal(failureValidation.counts.blocking, 1);
    assert(failureValidation.warnings.some((warning) => warning.includes('unreadable')));
    results.push('preserves conflicting values and unreadable evidence in review-needed state');

    const invoiceCase = path.join(temporaryRoot, 'unpaid-design-invoice');
    await initCase(invoiceCase, 'Unpaid design invoice', 'Collect the agreed USD 2,400.00 fee');
    const invoiceInputs = [
      '01-agreement.pdf',
      '02-delivery-and-acceptance.png',
      '03-invoice.txt',
    ].map((name) => path.join(invoiceFixtureRoot, name));
    assert.equal((await readFile(invoiceInputs[0])).subarray(0, 5).toString('ascii'), '%PDF-');
    assert.equal((await readFile(invoiceInputs[1])).subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
    const invoiceAdded = await addEvidence(invoiceCase, invoiceInputs);
    assert.equal(invoiceAdded.added.length, 3);
    const invoiceManifestFile = path.join(invoiceCase, 'manifest.json');
    const invoiceManifest = JSON.parse(await readFile(invoiceManifestFile, 'utf8'));
    for (const exhibit of invoiceManifest.exhibits) exhibit.extractionStatus = 'complete';
    await writeJson(invoiceManifestFile, invoiceManifest);
    const invoiceCitations = {
      agreement: [{ exhibitId: 'E-001', pinpoint: 'payment terms' }],
      delivery: [{ exhibitId: 'E-002', pinpoint: 'delivery and acceptance messages' }],
      invoice: [{ exhibitId: 'E-003', pinpoint: 'invoice total and due date' }],
    };
    await writeJsonLines(path.join(invoiceCase, 'facts.jsonl'), [
      { factId: 'F-001', field: 'agreed_fee', value: 'USD 2,400.00', state: 'SUPPORTED', citations: invoiceCitations.agreement, confidence: 'high' },
      { factId: 'F-002', field: 'deliverable_status', value: 'Delivered and accepted', state: 'SUPPORTED', citations: invoiceCitations.delivery, confidence: 'high' },
      { factId: 'F-003', field: 'invoice_status', value: 'Issued with payment due', state: 'SUPPORTED', citations: invoiceCitations.invoice, confidence: 'high' },
    ]);
    await writeJson(path.join(invoiceCase, 'timeline.json'), [
      { eventId: 'T-001', date: '2026-07-10', description: 'The parties agreed to a USD 2,400.00 design fee', actor: 'Client and designer', state: 'SUPPORTED', citations: invoiceCitations.agreement },
      { eventId: 'T-002', date: '2026-08-12', description: 'The final design files were delivered and accepted', actor: 'Client and designer', state: 'SUPPORTED', citations: invoiceCitations.delivery },
      { eventId: 'T-003', date: '2026-08-13', description: 'The designer issued the invoice', actor: 'Designer', state: 'SUPPORTED', citations: invoiceCitations.invoice },
    ]);
    await writeJson(path.join(invoiceCase, 'conflicts.json'), []);
    await writeJson(path.join(invoiceCase, 'missing.json'), [
      {
        missingId: 'M-001',
        priority: 'MEDIUM',
        item: 'Payment confirmation or client response',
        whyItMatters: 'It will show whether payment is pending, disputed, or already sent.',
        whereToFind: 'Bank records and the latest client conversation',
        canProceed: true,
      },
    ]);
    const invoiceCaseRecord = JSON.parse(await readFile(path.join(invoiceCase, 'case.json'), 'utf8'));
    invoiceCaseRecord.state = 'PACK_READY';
    await writeJson(path.join(invoiceCase, 'case.json'), invoiceCaseRecord);
    const invoiceValidation = await validateCase(invoiceCase);
    assert.equal(invoiceValidation.ok, true);
    const invoiceRendered = await renderPack(invoiceCase);
    assert.equal(invoiceRendered.files.length, 7);
    const invoicePack = await readFile(path.join(invoiceCase, 'PACK.html'), 'utf8');
    assert.match(invoicePack, /USD 2,400\.00/);
    results.push('handles a distinct mixed-media unpaid-invoice case without changing the workflow');

    process.stdout.write(`${JSON.stringify({ ok: true, tests: results.length, results }, null, 2)}\n`);
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
}

main().catch((error) => {
  process.stderr.write(`${JSON.stringify({ ok: false, error: error.stack ?? error.message }, null, 2)}\n`);
  process.exitCode = 1;
});
