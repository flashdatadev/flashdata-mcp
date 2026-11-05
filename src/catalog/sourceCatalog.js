const {
  AUDIO_LANGUAGES,
  AUDIO_OUTPUT_FORMATS,
  AUDIO_QUALITIES,
  DOWNLOAD_TYPES,
  FPS_CONSTRAINT_PATTERN,
  VIDEO_OUTPUT_FORMATS,
  VIDEO_QUALITIES,
} = require('../download/youtubeDownloadOptions');
const {
  MAX_SUBTITLE_LANGUAGES,
  SEARCH_FEATURE_FILTERS,
  SEARCH_FILTER_ENUMS,
} = require('../youtube/youtubeSearchOptions');

const QUERY_MODES = Object.freeze(['realtime', 'async', 'batch']);

function stringProperty(options = {}) {
  return Object.freeze({
    type: 'string',
    minLength: options.minLength ?? 1,
    maxLength: options.maxLength ?? 2_000,
    ...(options.default !== undefined ? { default: options.default } : {}),
    ...(options.enum ? { enum: Object.freeze([...options.enum]) } : {}),
    ...(options.pattern ? { pattern: options.pattern } : {}),
    ...(options.description ? { description: options.description } : {}),
  });
}

function integerProperty(minimum, maximum, options = {}) {
  return Object.freeze({
    type: 'integer',
    minimum,
    maximum,
    ...(options.default !== undefined ? { default: options.default } : {}),
    ...(options.description ? { description: options.description } : {}),
  });
}

const booleanProperty = Object.freeze({ type: 'boolean' });
const youtubeSearchFilterProperty = Object.freeze({
  type: 'object',
  additionalProperties: false,
  properties: Object.freeze({
    ...Object.fromEntries(Object.entries(SEARCH_FILTER_ENUMS).map(([name, values]) => [
      name,
      stringProperty({ enum: values }),
    ])),
    ...Object.fromEntries(SEARCH_FEATURE_FILTERS.map(name => [name, booleanProperty])),
  }),
});
const queryProperty = stringProperty();
const videoIdProperty = stringProperty({ minLength: 11, maxLength: 11, pattern: '^[A-Za-z0-9_-]{11}$' });
const languageProperty = stringProperty({ maxLength: 35, pattern: '^[A-Za-z0-9-]+$' });
const subtitleLanguageProperty = Object.freeze({
  oneOf: Object.freeze([
    languageProperty,
    Object.freeze({ type: 'array', items: languageProperty, minItems: 1, maxItems: MAX_SUBTITLE_LANGUAGES, uniqueItems: true }),
  ]),
  description: 'Omit to prefer en-orig and fall back to en, returning one track. A string selects that exact language. An array of 1–10 distinct codes returns tracks and per-language errors. The selected caption source applies to every language.',
});
const timestampProperty = stringProperty({ maxLength: 8, pattern: '^\\d{1,2}:[0-5]\\d:[0-5]\\d$' });
const googleProperties = Object.freeze({
  query: queryProperty,
  gl: stringProperty({ minLength: 2, maxLength: 2, pattern: '^[A-Za-z]{2}$', description: 'Country code. Set explicitly when needed; omitted values use the search provider’s behavior.' }),
  hl: stringProperty({ maxLength: 35, pattern: '^[A-Za-z0-9-]+$', description: 'Interface language. Set explicitly when needed; omitted values use the search provider’s behavior.' }),
  location: stringProperty({ maxLength: 200 }),
  num: integerProperty(1, 100, { description: 'Requested result count. Actual count varies by query and search type; no fixed value is added when omitted.' }),
  page: integerProperty(1, 100, { description: 'Requested page. Set explicitly for pagination; each page is a separate query.' }),
  tbs: stringProperty({ maxLength: 200 }),
  autocorrect: booleanProperty,
});

function source({
  category,
  estimatedCredits,
  id,
  modes,
  name,
  product,
  properties,
  required,
  requiresStorageDestination = false,
}) {
  if (!modes.every((mode) => QUERY_MODES.includes(mode))) {
    throw new TypeError(`Source ${id} declares an unsupported mode.`);
  }
  return Object.freeze({
    category,
    estimatedCredits,
    id,
    inputSchema: Object.freeze({
      type: 'object',
      additionalProperties: false,
      properties: Object.freeze({ ...properties }),
      required: Object.freeze([...required]),
    }),
    modes: Object.freeze([...modes]),
    name,
    product,
    requiresStorageDestination,
  });
}

const dataModes = Object.freeze(['realtime', 'async', 'batch']);
const SOURCE_CATALOG = Object.freeze([
  ...[
    ['google_search', 'Google Search'],
    ['google_images', 'Google Images'],
    ['google_news', 'Google News'],
    ['google_shopping', 'Google Shopping'],
    ['google_videos', 'Google Videos'],
    ['google_places', 'Google Places'],
  ].map(([id, name]) => source({
    id,
    name,
    category: 'google',
    product: 'google_search',
    modes: dataModes,
    estimatedCredits: 0.02,
    required: ['query'],
    properties: googleProperties,
  })),
  source({
    id: 'youtube_search', name: 'YouTube Search', category: 'youtube', modes: dataModes,
    product: 'youtube_data',
    estimatedCredits: 0.01, required: ['query'],
    properties: {
      query: queryProperty,
      max_results: integerProperty(1, 20, { default: 20 }),
      filters: youtubeSearchFilterProperty,
    },
  }),
  source({
    id: 'youtube_search_extended', name: 'YouTube Extended Search', category: 'youtube', modes: dataModes,
    product: 'youtube_data',
    estimatedCredits: 0.05, required: ['query'],
    properties: {
      query: queryProperty,
      max_results: integerProperty(1, 700, { default: 20 }),
      filters: youtubeSearchFilterProperty,
    },
  }),
  source({
    id: 'youtube_metadata', name: 'YouTube Metadata', category: 'youtube', modes: dataModes,
    product: 'youtube_data',
    estimatedCredits: 0.01, required: ['video_id'],
    properties: { video_id: videoIdProperty,
      include_formats: Object.freeze({ ...booleanProperty, default: true }),
      include_chapters: Object.freeze({ ...booleanProperty, default: true }) },
  }),
  source({
    id: 'youtube_transcript', name: 'YouTube Transcript', category: 'youtube', modes: dataModes,
    product: 'youtube_data',
    estimatedCredits: 0.01, required: ['video_id'],
    properties: { video_id: videoIdProperty, language: subtitleLanguageProperty,
      auto: Object.freeze({ ...booleanProperty, default: true, description: 'true selects automatically generated captions; false selects manually provided captions. Does not fall back between the two.' }) },
  }),
  source({
    id: 'youtube_captions', name: 'YouTube Captions', category: 'youtube', modes: dataModes,
    product: 'youtube_data',
    estimatedCredits: 0.01, required: ['video_id'],
    properties: { video_id: videoIdProperty, language: subtitleLanguageProperty,
      auto: Object.freeze({ ...booleanProperty, default: false, description: 'true selects automatically generated captions; false selects manually provided captions. Does not fall back between the two.' }) },
  }),
  source({
    id: 'youtube_trainability', name: 'YouTube Trainability', category: 'youtube', modes: dataModes,
    product: 'youtube_data',
    estimatedCredits: 0.01, required: ['video_id'], properties: { video_id: videoIdProperty },
  }),
  source({
    id: 'youtube_channel', name: 'YouTube Channel', category: 'youtube', modes: dataModes,
    product: 'youtube_data',
    estimatedCredits: 0.01, required: ['handle'],
    properties: { handle: stringProperty({ maxLength: 100 }), video_limit: integerProperty(1, 100, { default: 20 }) },
  }),
  source({
    id: 'youtube_suggestions', name: 'YouTube Suggestions', category: 'youtube', modes: dataModes,
    product: 'youtube_data',
    estimatedCredits: 0.01, required: ['query'],
    properties: {
      query: queryProperty,
      language: Object.freeze({ ...languageProperty, default: 'en' }),
      region: stringProperty({ default: 'US', minLength: 2, maxLength: 2, pattern: '^[A-Za-z]{2}$' }),
    },
  }),
  source({
    id: 'youtube_download', name: 'YouTube Download', category: 'youtube', modes: ['async', 'batch'],
    product: 'youtube_download',
    estimatedCredits: 0, required: ['video_id'],
    requiresStorageDestination: true,
    properties: {
      video_id: videoIdProperty,
      download_type: stringProperty({ default: 'audio_video', enum: DOWNLOAD_TYPES, maxLength: 11 }),
      video_quality: stringProperty({
        default: '<=720',
        enum: VIDEO_QUALITIES,
        maxLength: 40,
      }),
      fps: stringProperty({ maxLength: 6, pattern: FPS_CONSTRAINT_PATTERN.source }),
      audio_language: stringProperty({ default: 'default', enum: AUDIO_LANGUAGES, maxLength: 8 }),
      audio_quality: stringProperty({ default: 'best', enum: AUDIO_QUALITIES, maxLength: 10 }),
      yt_dlp_format: stringProperty({ maxLength: 1_024 }),
      upload_metadata: Object.freeze({ type: 'boolean', default: false }),
      output_format: stringProperty({
        default: 'mp4',
        enum: [...VIDEO_OUTPUT_FORMATS, ...AUDIO_OUTPUT_FORMATS],
        maxLength: 10,
      }),
      start_at: timestampProperty,
      end_at: timestampProperty,
    },
  }),
]);

function listSources() {
  return SOURCE_CATALOG;
}

module.exports = {
  QUERY_MODES,
  SOURCE_CATALOG,
  listSources,
};
