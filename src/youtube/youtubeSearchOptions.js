const MAX_SUBTITLE_LANGUAGES = 10;
const SEARCH_FILTER_ENUMS = Object.freeze({
  duration: Object.freeze(['<4', '4-20', '>20']),
  sort_by: Object.freeze(['rating', 'relevance', 'view_count', 'upload_date']),
  type: Object.freeze(['video', 'channel', 'playlist', 'movie']),
  upload_date: Object.freeze(['today', 'last_hour', 'this_week', 'this_month', 'this_year']),
});
const SEARCH_FEATURE_FILTERS = Object.freeze([
  '360',
  '3d',
  '4k',
  'creative_commons',
  'hd',
  'hdr',
  'live',
  'location',
  'purchased',
  'subtitles',
  'vr180',
]);
const SEARCH_FILTER_FIELDS = new Set([
  ...Object.keys(SEARCH_FILTER_ENUMS),
  ...SEARCH_FEATURE_FILTERS,
]);

class YouTubeOptionsError extends Error {
  constructor(field, message, code = 'invalid') {
    super(message);
    this.name = 'YouTubeOptionsError';
    this.code = code;
    this.field = field;
  }
}

function isRecord(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function normalizeYouTubeSearchOptions(raw, { extended = false } = {}) {
  const params = { ...raw };
  const maximum = extended ? 700 : 20;
  if (params.max_results !== undefined && (
    !Number.isSafeInteger(params.max_results)
    || params.max_results < 1
    || params.max_results > maximum
  )) {
    throw new YouTubeOptionsError(
      'max_results',
      `max_results must be an integer between 1 and ${maximum}.`
    );
  }

  if (params.filters === undefined || params.filters === null) {
    delete params.filters;
    return params;
  }
  if (!isRecord(params.filters)) {
    throw new YouTubeOptionsError('filters', 'filters must be an object.', 'invalid_object');
  }

  const filters = {};
  for (const [field, value] of Object.entries(params.filters)) {
    if (!SEARCH_FILTER_FIELDS.has(field)) {
      throw new YouTubeOptionsError(
        `filters.${field}`,
        `Unsupported YouTube search filter: ${field}.`,
        'unsupported'
      );
    }
    const allowed = SEARCH_FILTER_ENUMS[field];
    if (allowed) {
      if (typeof value !== 'string' || !allowed.includes(value)) {
        throw new YouTubeOptionsError(
          `filters.${field}`,
          `${field} must be one of: ${allowed.join(', ')}.`
        );
      }
      filters[field] = value;
      continue;
    }
    if (typeof value !== 'boolean') {
      throw new YouTubeOptionsError(`filters.${field}`, `${field} must be a boolean.`);
    }
    if (value) filters[field] = true;
  }
  params.filters = filters;
  return params;
}

function normalizeYouTubeSubtitleOptions(raw) {
  const params = { ...raw };
  if (params.language !== undefined) {
    const languages = Array.isArray(params.language) ? params.language : [params.language];
    if (!languages.length || languages.length > MAX_SUBTITLE_LANGUAGES
      || new Set(languages).size !== languages.length
      || languages.some(language => typeof language !== 'string' || !/^[A-Za-z0-9-]{1,35}$/.test(language))) {
      throw new YouTubeOptionsError('language', `language must be a valid language code or an array of 1 to ${MAX_SUBTITLE_LANGUAGES} distinct language codes.`);
    }
  }
  if (params.auto !== undefined && typeof params.auto !== 'boolean') {
    throw new YouTubeOptionsError('auto', 'auto must be a boolean.');
  }
  return params;
}

module.exports = {
  MAX_SUBTITLE_LANGUAGES,
  SEARCH_FEATURE_FILTERS,
  SEARCH_FILTER_ENUMS,
  YouTubeOptionsError,
  normalizeYouTubeSearchOptions,
  normalizeYouTubeSubtitleOptions,
};
