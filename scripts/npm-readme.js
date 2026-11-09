function npmReadme(markdown) {
  return markdown.replace(/https:\/\/[^\s)\]`<>]+/g, value => {
    const url = new URL(value);
    if (url.origin !== 'https://flashdata.dev' || url.searchParams.get('utm_source') !== 'github') return value;
    url.searchParams.set('utm_source', 'npm');
    return url.href;
  });
}

module.exports = { npmReadme };
