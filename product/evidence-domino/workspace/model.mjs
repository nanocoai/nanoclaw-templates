import http from 'node:http';
import { compactRequest } from './local-wire.mjs';

import { WorkspaceError } from './errors.mjs';
export { WorkspaceError } from './errors.mjs';

// Direct loopback HTTP deliberately avoids environment proxy dispatchers, redirects,
// remote endpoints, arbitrary tools, and automatic cloud fallback.
export function localJson(endpoint, route, body, { timeout = 180_000, limit = 1_048_576 } = {}) {
  if (!/^http:\/\/127\.0\.0\.1:\d{1,5}$/.test(endpoint)) {
    throw new WorkspaceError('LOCAL_ENDPOINT_REQUIRED', 'Use an Ollama endpoint on http://127.0.0.1:<port>.');
  }
  return new Promise((resolve, reject) => {
    const payload = body === undefined ? null : JSON.stringify(body);
    const request = http.request(`${endpoint}${route}`, {
      method: payload === null ? 'GET' : 'POST',
      headers: payload === null ? {} : { 'content-type': 'application/json', 'content-length': Buffer.byteLength(payload) },
    }, response => {
      const chunks = []; let bytes = 0;
      response.on('data', chunk => {
        bytes += chunk.length;
        if (bytes > limit) request.destroy(new WorkspaceError('MODEL_RESPONSE_TOO_LARGE', 'The local model response exceeded its limit.'));
        else chunks.push(chunk);
      });
      response.on('error', reject);
      response.on('end', () => {
        try {
          if (response.statusCode !== 200) throw new WorkspaceError('LOCAL_MODEL_ERROR', `Local model returned HTTP ${response.statusCode}. Check Ollama and the installed model.`);
          const value = JSON.parse(Buffer.concat(chunks).toString('utf8'));
          resolve(value);
        } catch (error) { reject(error); }
      });
    });
    const timer = setTimeout(() => request.destroy(new WorkspaceError('MODEL_TIMEOUT', 'The local model took too long. Your draft is unchanged; try a shorter document.')), timeout);
    request.on('close', () => clearTimeout(timer));
    request.on('error', error => reject(error.code === 'ECONNREFUSED'
      ? new WorkspaceError('MODEL_UNAVAILABLE', 'Start Ollama with cloud features disabled and install the selected local model. No cloud fallback was used.') : error));
    request.end(payload);
  });
}

export function createLocalModel({ endpoint = 'http://127.0.0.1:11434', model = 'qwen3:4b', gpuLayers, contextSize = 8192 } = {}) {
  if (!/^[a-zA-Z0-9_.:-]{1,100}$/.test(model) || /cloud/i.test(model)) {
    throw new WorkspaceError('LOCAL_MODEL_REQUIRED', 'Choose a locally installed model name, not a cloud model.');
  }
  if (!/^http:\/\/127\.0\.0\.1:\d{1,5}$/.test(endpoint)) throw new WorkspaceError('LOCAL_ENDPOINT_REQUIRED', 'Inference must use a literal loopback address.');
  if (gpuLayers !== undefined && (!Number.isInteger(gpuLayers) || gpuLayers < 0 || gpuLayers > 999)) throw new WorkspaceError('INVALID_GPU_LAYERS', 'GPU layer count must be an integer from 0 to 999.');
  if (![4096, 8192, 16384, 32768].includes(contextSize)) throw new WorkspaceError('INVALID_CONTEXT_SIZE', 'Choose context size 4096, 8192, 16384 or 32768. Larger contexts require more memory.');
  const outputTokens = 1200;
  // Conservative byte-fallback bound: at most one raw-text token per UTF-8 byte.
  // Reserve output and 512 template/control tokens, and count schema too.
  const inputByteLimit = contextSize - outputTokens - 512;
  async function ready() {
    const tags = await localJson(endpoint, '/api/tags', undefined, { timeout: 5000 });
    const entry = tags.models?.find(entry => entry.name === model || entry.model === model);
    if (!entry || !Number.isSafeInteger(entry.size) || entry.size < 10_000_000 || entry.remote_host || entry.remote_model) {
      throw new WorkspaceError('LOCAL_MODEL_REQUIRED', `Install local weights for ${model} in Ollama. Cloud models are disabled in this workspace.`);
    }
    const info = await localJson(endpoint, '/api/show', { model }, { timeout: 10_000 });
    if (info.remote_host || info.remote_model || !info.model_info?.['general.architecture']) {
      throw new WorkspaceError('LOCAL_MODEL_REQUIRED', 'Ollama did not report a local model architecture. Refusing to send document context.');
    }
    return { available: true, model };
  }
  let lastTiming = null;
  return {
    name: model, ready, inputByteLimit,
    get lastTiming() { return lastTiming && { ...lastTiming }; },
    async ask(system, data, { schema, task } = {}) {
      const started = performance.now();
      const wire = compactRequest(system, data, schema, task);
      system = wire.system; data = wire.data; schema = wire.schema;
      if (Buffer.byteLength(system) + Buffer.byteLength(JSON.stringify(data)) + Buffer.byteLength(JSON.stringify(schema ?? {})) > inputByteLimit) throw new WorkspaceError('MODEL_CONTEXT_LIMIT', 'This input cannot safely fit the selected local model context. Shorten it or restart with a larger --context-size if your computer has enough memory. No input was silently truncated.');
      await ready();
      const result = await localJson(endpoint, '/api/chat', {
        model, stream: false, think: false, format: schema ?? 'json', keep_alive: '10m',
        options: { temperature: 0, num_ctx: contextSize, num_predict: outputTokens, ...(gpuLayers === undefined ? {} : { num_gpu: gpuLayers }) },
        messages: [{ role: 'system', content: system }, { role: 'user', content: JSON.stringify(data) }],
      });
      lastTiming = { elapsedMs: Math.round(performance.now() - started), promptTokens: result.prompt_eval_count ?? null, outputTokens: result.eval_count ?? null, loadMs: typeof result.load_duration === 'number' ? Math.round(result.load_duration / 1e6) : null };
      if (result.done_reason === 'length') throw new WorkspaceError('MODEL_TRUNCATED', 'The model response was incomplete. Use a shorter input.');
      try {
        const value = JSON.parse(result.message?.content);
        if (!value || Array.isArray(value) || typeof value !== 'object') throw new Error();
        return wire.decode(value);
      } catch (error) { if (error instanceof WorkspaceError) throw error; throw new WorkspaceError('MODEL_INVALID_RESPONSE', 'The local model did not return a valid structured answer. Nothing was approved or changed.'); }
    },
  };
}
