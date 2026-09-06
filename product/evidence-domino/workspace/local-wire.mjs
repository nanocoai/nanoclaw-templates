import { WorkspaceError } from './errors.mjs';

function pick(items, index) {
  if (!Number.isInteger(index) || index < 0 || index >= items.length) throw new WorkspaceError('MODEL_INVALID_REFERENCE', 'The local model selected evidence outside the supplied context. Nothing was approved.');
  return items[index];
}
const identity = value => value;

// The model chooses evidence; code copies its exact bytes. Full source content and
// every semantic comparison remain in the request. This only shortens generated JSON.
export function compactRequest(system, data, schema, task) {
  if (task === 'answer') {
    const excerpts = data.excerpts;
    if (!Array.isArray(excerpts) || !excerpts.length) throw new WorkspaceError('MODEL_INVALID_REFERENCE', 'No excerpts were supplied.');
    const prompt = system.replace(/Return JSON[^\n]+/, 'Return JSON {"answer":string,"refs":number[]}. refs contains the zero-based indices of supporting excerpts. Code attaches the exact excerpt as the citation; do not repeat it in the answer.')
      .replace('Quote exact contiguous passages in citations.', 'Select the relevant excerpt indices in refs.');
    return {
      system: prompt, data: { ...data, excerpts: excerpts.map((source, index) => ({ index, name: source.name, kind: source.kind, content: source.content })) },
      schema: { type: 'object', additionalProperties: false, required: ['answer', 'refs'], properties: { answer: { type: 'string' }, refs: { type: 'array', maxItems: 4, uniqueItems: true, items: { type: 'integer', enum: excerpts.map((_, index) => index) } } } },
      decode(value) {
        if (!Array.isArray(value.refs) || value.refs.length > 4 || new Set(value.refs).size !== value.refs.length) throw new WorkspaceError('MODEL_INVALID_REFERENCE', 'The local model returned invalid evidence references.');
        return { answer: value.answer, citations: value.refs.map(index => { const source = pick(excerpts, index); return { sourceId: source.sourceId, quote: source.content }; }) };
      },
    };
  }
  if (task === 'interpret') {
    const prices = schema?.properties?.priceLiteral?.enum?.filter(value => typeof value === 'string');
    const passages = schema?.properties?.supportingPassage?.enum?.filter(value => typeof value === 'string');
    // Unusual source shapes retain the original full-text protocol; no evidence is discarded.
    if (!prices?.length || !passages?.length) return { system, data, schema, decode: identity };
    const comparison = { enum: ['same', 'ambiguous', 'different'] };
    const prompt = system.replace(/Return JSON[^\n]+/, 'Return JSON {"count":number,"price":number|null,"passage":number|null,"item":"same|ambiguous|different","unit":"same|ambiguous|different","currency":"same|ambiguous|different","terms":"same|ambiguous|different","issues":string[]}. price and passage are zero-based table indices. count includes all plausible current offers, including offers outside the tables. List competing offers and uncertainties in issues.')
      .replace('Extract priceLiteral exactly as text; code will convert it to cents. Do not calculate.', 'Choose the matching price and complete passage by index. Code restores their exact text and parses money. Do not calculate.')
      .replace('Use the approved item/unitBasis strings only if evidence truly matches them.', 'Assess item and unit independently against the approved item and unitBasis.');
    return {
      system: prompt, data: { ...data, prices, passages },
      schema: { type: 'object', additionalProperties: false, required: ['count', 'price', 'passage', 'item', 'unit', 'currency', 'terms', 'issues'], properties: {
        count: { type: 'integer', minimum: 0 }, price: { enum: [...prices.keys(), null] }, passage: { enum: [...passages.keys(), null] },
        item: comparison, unit: comparison, currency: comparison, terms: comparison, issues: { type: 'array', items: { type: 'string' } },
      } },
      decode(value) {
        if (!Number.isInteger(value.count) || value.count < 0 || !Array.isArray(value.issues) || !value.issues.every(issue => typeof issue === 'string')) throw new WorkspaceError('MODEL_INVALID_REFERENCE', 'The local model returned an invalid offer assessment.');
        for (const field of ['item', 'unit', 'currency', 'terms']) if (!comparison.enum.includes(value[field])) throw new WorkspaceError('MODEL_INVALID_REFERENCE', 'The local model omitted an applicability assessment.');
        return { candidateCount: value.count, priceLiteral: value.price === null ? null : pick(prices, value.price), supportingPassage: value.passage === null ? null : pick(passages, value.passage),
          item: data.approved.item, unitBasis: data.approved.unitBasis, currency: 'USD',
          comparability: { item: value.item, unitBasis: value.unit, currency: value.currency, terms: value.terms }, alternatives: [], uncertainties: value.issues };
      },
    };
  }
  return { system, data, schema, decode: identity };
}
