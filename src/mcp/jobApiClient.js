const axios = require('axios');
const { createDataApiClient, MAX_RESPONSE_BYTES } = require('./dataApiClient');

function createJobApiClient({ baseUrl, resultOrigin, timeoutMs = 65000, http = axios } = {}) {
  const management = createDataApiClient({ baseUrl, timeoutMs, http });
  const trustedResultOrigin = resultOrigin ? new URL(resultOrigin).origin : null;
  return {
    async read({ jobId, secret, requestId, allowedSource }) {
      const path = `/v2/jobs/${encodeURIComponent(jobId)}`;
      const status = await management.request({ method: 'GET', path, secret, requestId });
      // Check provenance before returning job details or following its signed result link.
      if (allowedSource && status.status === 200 && status.body.job?.source !== allowedSource) {
        return { status: 403, body: { code: 'source_forbidden', message: 'This job does not belong to this task server.' } };
      }
      if (status.status !== 200 || status.body.job?.status !== 'completed') return status;
      try {
        const link = await http.request({
          url: new URL(`${path}/results`, baseUrl).href, method: 'GET',
          headers: { 'X-API-Key': secret, 'X-Request-Id': requestId },
          timeout: timeoutMs, maxRedirects: 0, maxContentLength: MAX_RESPONSE_BYTES,
          responseType: 'json', validateStatus: () => true, proxy: false,
        });
        if (link.status !== 302) {
          return { status: link.status >= 400 ? link.status : 502, body: {
            job: status.body.job, code: link.data?.code || 'result_unavailable',
            message: link.data?.detail || link.data?.message || 'The job result is unavailable. Retry get_job; do not submit a new query.',
          } };
        }
        const url = new URL(link.headers.location);
        if (!trustedResultOrigin || url.origin !== trustedResultOrigin || url.username || url.password
          || url.hash || !['https:', 'http:'].includes(url.protocol)) throw new Error('Invalid result origin');
        // R2 uses its signed URL only. Never forward the user's API key to object storage.
        const content = await http.request({
          url: url.href, method: 'GET', timeout: timeoutMs,
          maxRedirects: 0, maxContentLength: MAX_RESPONSE_BYTES,
          responseType: 'json', transitional: { silentJSONParsing: false },
          validateStatus: statusCode => statusCode === 200, proxy: false,
        });
        if (!content.data || typeof content.data !== 'object' || Array.isArray(content.data)) {
          throw new Error('Invalid result content');
        }
        return { status: 200, body: { ...status.body, output: content.data } };
      } catch {
        return { status: 502, body: { job: status.body.job, code: 'result_unavailable',
          message: 'The completed job result could not be read. Check result storage configuration or retry get_job. Do not repeat the paid query.' } };
      }
    },
  };
}

module.exports = { createJobApiClient };
