FROM node:22-alpine@sha256:fe4f6d74e20370acb04ad889077d14d0f64a9c8ea6a42bc60cddf1e844699914 AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts --no-audit --no-fund && npm cache clean --force
COPY src ./src
COPY docker/task-server.cjs ./docker/task-server.cjs
COPY LICENSE SECURITY.md THIRD_PARTY_NOTICES.md ./
USER node

FROM runtime AS google-search
ENTRYPOINT ["node", "docker/task-server.cjs", "google_search"]

FROM runtime AS google-news
ENTRYPOINT ["node", "docker/task-server.cjs", "google_news"]

FROM runtime AS google-images
ENTRYPOINT ["node", "docker/task-server.cjs", "google_images"]

FROM runtime AS google-shopping
ENTRYPOINT ["node", "docker/task-server.cjs", "google_shopping"]

FROM runtime AS google-videos
ENTRYPOINT ["node", "docker/task-server.cjs", "google_videos"]

FROM runtime AS google-places
ENTRYPOINT ["node", "docker/task-server.cjs", "google_places"]

FROM runtime AS youtube-search
ENTRYPOINT ["node", "docker/task-server.cjs", "youtube_search"]

FROM runtime AS youtube-search-extended
ENTRYPOINT ["node", "docker/task-server.cjs", "youtube_search_extended"]

FROM runtime AS youtube-metadata
ENTRYPOINT ["node", "docker/task-server.cjs", "youtube_metadata"]

FROM runtime AS youtube-transcript
ENTRYPOINT ["node", "docker/task-server.cjs", "youtube_transcript"]

FROM runtime AS youtube-captions
ENTRYPOINT ["node", "docker/task-server.cjs", "youtube_captions"]

FROM runtime AS youtube-trainability
ENTRYPOINT ["node", "docker/task-server.cjs", "youtube_trainability"]

FROM runtime AS youtube-channel
ENTRYPOINT ["node", "docker/task-server.cjs", "youtube_channel"]

FROM runtime AS youtube-suggestions
ENTRYPOINT ["node", "docker/task-server.cjs", "youtube_suggestions"]

FROM runtime AS youtube-download
ENTRYPOINT ["node", "docker/task-server.cjs", "youtube_download"]

FROM google-search AS default
