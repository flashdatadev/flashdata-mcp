// Portable field rendering aligned with the FlashData HTTP response serializers.
function escapeMarkdown(value) {
  return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/[\\`*_{}[\]()#+!|.-]/g, '\\$&').replace(/\r\n?/g, '\n');
}

function label(key) {
  return key.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/^./, character => character.toUpperCase());
}

function scalar(value) {
  if (value === null) return 'null';
  if (typeof value === 'string' && /^https?:\/\/[^\s<>]+$/i.test(value)) {
    return `<${value.replace(/"/g, '%22')}>`;
  }
  return escapeMarkdown(value).replace(/\n/g, '  \n');
}

const heading = level => '#'.repeat(Math.min(level, 6));
const isObject = value => value !== null && typeof value === 'object';

function renderValue(value, level) {
  if (!isObject(value)) return scalar(value);
  if (Array.isArray(value)) {
    if (!value.length) return '[]';
    return value.map((item, index) => {
      if (!isObject(item)) return `- ${scalar(item)}`;
      const titleKey = ['title', 'question', 'name'].find(key => typeof item[key] === 'string' && item[key]);
      const title = titleKey ? escapeMarkdown(item[titleKey]) : `Item ${index + 1}`;
      const fields = titleKey ? Object.fromEntries(Object.entries(item).filter(([key]) => key !== titleKey)) : item;
      return `${heading(level)} ${index + 1}. ${title}\n\n${renderValue(fields, level + 1)}`;
    }).join('\n\n');
  }
  const entries = Object.entries(value);
  if (!entries.length) return '{}';
  return entries.map(([key, item]) => {
    if (key === 'segments' && Array.isArray(item) && item.length && item.every(segment => segment
      && typeof segment.text === 'string' && Number.isFinite(segment.start)
      && Object.keys(segment).every(field => ['start', 'end', 'text'].includes(field)))) {
      return `${heading(level)} Segments\n\n${item.map(segment =>
        `- **[${segment.start}${Number.isFinite(segment.end) ? `–${segment.end}` : ''}s]** ${scalar(segment.text)}`
      ).join('\n')}`;
    }
    const title = escapeMarkdown(label(key));
    if (isObject(item)) return `${heading(level)} ${title}\n\n${renderValue(item, level + 1)}`;
    const field = `**${title}:** ${scalar(item)}`;
    if (['videoId', 'video_id'].includes(key) && /^[A-Za-z0-9_-]{11}$/.test(item)) {
      return `${field}\n\n**Video URL:** <https://www.youtube.com/watch?v=${item}>`;
    }
    return field;
  }).join('\n\n');
}

function plainTextFields(value, depth = 0) {
  const entries = Array.isArray(value)
    ? value.map((item, index) => [String(index + 1), item])
    : Object.entries(value).filter(([, item]) => item !== undefined);
  return entries.map(([key, item]) => {
    const prefix = `${'  '.repeat(depth)}${label(key)}:`;
    if (item !== null && typeof item === 'object' && Object.keys(item).length) {
      return `${prefix}\n${plainTextFields(item, depth + 1)}`;
    }
    return `${prefix} ${JSON.stringify(item)}`;
  }).join('\n');
}

function present(body, format = 'markdown') {
  if (format === 'json') return JSON.stringify(body);
  if (format === 'text') return `${plainTextFields(body)}\n`;
  if (format !== 'markdown') throw new TypeError('Unsupported response format');
  return `# FlashData\n\n${renderValue(body, 2)}\n`;
}
module.exports = { present };
