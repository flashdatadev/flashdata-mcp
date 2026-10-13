const { SOURCE_CATALOG } = require('../catalog/sourceCatalog');
const { listTools } = require('./toolCatalog');

function assertTaskSource(source) {
  if (!SOURCE_CATALOG.some(item => item.id === source)) throw new Error('Unknown task source.');
}

function listTaskTools(source, scopes = [source]) {
  assertTaskSource(source);
  if (!scopes.includes(source)) return [];
  return listTools([source]).filter(tool => [source, 'get_pricing', 'get_job', 'get_result'].includes(tool.name))
    .map(tool => {
      if (tool.name === 'get_pricing') return { ...tool,
        description: `Read current pricing for ${source} only. Omitted source defaults to ${source}. Free; does not submit a query. ${source === 'youtube_download' ? 'Downloads are priced by delivered bytes; request_count does not estimate download cost.' : 'request_count estimates the cost of that many queries, not that many returned records.'}`,
        inputSchema: { ...tool.inputSchema, properties: { ...tool.inputSchema.properties,
          source: { type: 'string', enum: [source], default: source },
        } },
      };
      if (tool.name === 'get_job') return { ...tool,
        description: `Read status and results for a ${source} job only. Pending/processing is not complete. Completed jobs include JSON under output. Free; does not submit another query. The API Key must grant this source. JSON job results expire after 24 hours.${source === 'youtube_download' ? ' Read output.results[0] for the storage manifest, including file_url and file_size. Media access and retention follow your storage settings.' : ''}`,
      };
      if (tool.name === 'youtube_download') return { ...tool,
        description: tool.description.replace(' You can also use submit_batch with a storage destination on every download item.', ''),
      };
      return tool;
    });
}

module.exports = { assertTaskSource, listTaskTools };
