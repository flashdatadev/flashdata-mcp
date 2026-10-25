const parameterDescriptions = {
  query: 'Search text to send to this data source.',
  location: 'Location used to localize Google search results.',
  tbs: 'Google search filter expression, such as a time-range filter.',
  autocorrect: 'Whether Google may automatically correct the search query.',
  max_results: 'Maximum number of YouTube search results requested; the source-specific limit applies.',
  video_id: 'The 11-character YouTube video ID, not the full video URL.',
  include_formats: 'Include available media format metadata in the response; does not download media.',
  include_chapters: 'Include chapter metadata when available for the video.',
  language: 'Requested language code. Captions must exist in this language.',
  handle: 'YouTube channel handle used to identify the channel.',
  video_limit: 'Maximum number of recent videos to return for the channel.',
  region: 'Two-letter region code for YouTube suggestions.',
  download_type: 'Download combined audio/video, video only, or audio only.',
  video_quality: 'Requested video height selection in pixels; availability depends on the video.',
  fps: 'Frame-rate selection, for example <=30 or ==60.',
  audio_language: 'Select the default audio track or the original-language track.',
  audio_quality: 'Best available audio or the requested audio bitrate in kbps.',
  yt_dlp_format: 'Advanced yt-dlp format selector for the download.',
  upload_metadata: 'Also upload video metadata to the supplied customer storage.',
  start_at: 'Start of the requested clip in HH:MM:SS.',
  end_at: 'End of the requested clip in HH:MM:SS; must be after start_at.',
};

const filterDescriptions = {
  duration: 'Filter by video length in minutes.',
  sort_by: 'YouTube result ordering.',
  type: 'YouTube content type to include.',
  upload_date: 'Relative upload-time window.',
  '3d': 'Apply the YouTube 3D filter.',
  '4k': 'Apply the YouTube 4K filter.',
  '360': 'Apply the YouTube 360-degree video filter.',
  creative_commons: 'Apply the Creative Commons label filter; this does not grant usage rights.',
  hd: 'Apply the YouTube HD filter.',
  hdr: 'Apply the YouTube HDR filter.',
  live: 'Apply the YouTube live filter.',
  location: 'Apply the YouTube location-tagged content filter.',
  purchased: 'Apply the YouTube purchased-content filter.',
  subtitles: 'Apply the YouTube subtitles filter.',
  vr180: 'Apply the YouTube VR180 filter.',
};

function describeQueryProperties(properties, sourceId) {
  return Object.fromEntries(Object.entries(properties).map(([name, schema]) => {
    if (name === 'filters') return [name, { ...schema,
      description: 'YouTube search filters. Omit or use null for no filters.',
      properties: Object.fromEntries(Object.entries(schema.properties).map(([key, value]) =>
        [key, { ...value, description: value.description || filterDescriptions[key] }])),
    }];
    const description = name === 'language' && sourceId === 'youtube_suggestions'
      ? 'Language code for YouTube autocomplete suggestions.' : parameterDescriptions[name];
    return [name, schema.description || !description ? schema : { ...schema, description }];
  }));
}

module.exports = { describeQueryProperties };
