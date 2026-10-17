import { z } from 'zod';
import { VIDEO_QUALITIES } from './vendor/youtubeDownloadOptions.cjs';

const query = z.string().trim().min(1).max(2000);
const video_id = z.string().regex(/^[A-Za-z0-9_-]{11}$/);
const language = z.string().min(1).max(35).regex(/^[A-Za-z0-9-]+$/);
export const googleSchema = z.strictObject({
  query,
  gl: z.string().regex(/^[A-Za-z]{2}$/).optional(),
  hl: language.optional(), location: z.string().min(1).max(200).optional(),
  num: z.number().int().min(1).max(100).optional().describe('Requested count; actual count varies. No default is added.'),
  page: z.number().int().min(1).max(100).optional().describe('Each page is a separate paid query.'),
  tbs: z.string().min(1).max(200).optional(), autocorrect: z.boolean().optional(),
});
const filters = z.strictObject({
  duration: z.enum(['<4', '4-20', '>20']).optional(),
  sort_by: z.enum(['rating', 'relevance', 'view_count', 'upload_date']).optional(),
  type: z.enum(['video', 'channel', 'playlist', 'movie']).optional(),
  upload_date: z.enum(['today', 'last_hour', 'this_week', 'this_month', 'this_year']).optional(),
  '360': z.boolean().optional(), '3d': z.boolean().optional(), '4k': z.boolean().optional(),
  creative_commons: z.boolean().optional(), hd: z.boolean().optional(), hdr: z.boolean().optional(),
  live: z.boolean().optional(), location: z.boolean().optional(), purchased: z.boolean().optional(),
  subtitles: z.boolean().optional(), vr180: z.boolean().optional(),
});
export const youtubeSearchSchema = z.strictObject({ query, max_results: z.number().int().min(1).max(20).default(20), filters: filters.optional() });
export const youtubeExtendedSearchSchema = z.strictObject({ query, max_results: z.number().int().min(1).max(700).default(20), filters: filters.optional() });
export const youtubeMetadataSchema = z.strictObject({ video_id, include_formats: z.boolean().default(true), include_chapters: z.boolean().default(true) });
export const youtubeTranscriptSchema = z.strictObject({ video_id, language: language.default('en'), auto: z.boolean().default(true).describe('Select automatic captions. No fallback, ASR, or translation.') });
export const youtubeCaptionsSchema = z.strictObject({ video_id, language: language.default('en'), auto: z.boolean().default(false).describe('False selects uploader captions. No fallback, ASR, or translation.') });
export const youtubeLicenseSchema = z.strictObject({ video_id });
export const youtubeChannelSchema = z.strictObject({ handle: z.string().trim().min(1).max(100), video_limit: z.number().int().min(1).max(100).default(20) });
export const youtubeSuggestionsSchema = z.strictObject({ query, language: language.default('en'), region: z.string().regex(/^[A-Za-z]{2}$/).default('US') });
const timestamp = z.string().regex(/^\d{1,2}:[0-5]\d:[0-5]\d$/);
export const downloadSchema = z.strictObject({
  video_id,
  download_type: z.enum(['audio_video', 'video', 'audio']).optional(),
  video_quality: z.enum(VIDEO_QUALITIES as [string, ...string[]]).optional(),
  fps: z.string().regex(/^(?:>=|<=|==)(?:[1-9]\d?|1\d\d|2[0-3]\d|240)$/).optional(),
  audio_language: z.enum(['default', 'original']).optional(),
  audio_quality: z.enum(['best', '320', '256', '192', '128']).optional(),
  yt_dlp_format: z.string().trim().min(1).max(1024).regex(/^[^\x00-\x1f\x7f]+$/).optional()
    .describe('Advanced format selector; overrides video quality, fps, and audio language selection.'),
  upload_metadata: z.boolean().optional(),
  output_format: z.enum(['mp4', 'webm', 'mkv', 'm4a', 'mp3', 'opus']).optional(),
  start_at: timestamp.optional(), end_at: timestamp.optional(),
});
export const jobSchema = z.strictObject({ job_id: z.string().max(120).regex(/^job_[A-Za-z0-9_-]+$/) });
