"""Per-source contracts, independent of authentication and agent configuration."""

from ._inputs import (
    GoogleInput,
    YouTubeCaptionsInput,
    YouTubeChannelInput,
    YouTubeDownloadInput,
    YouTubeExtendedSearchInput,
    YouTubeMetadataInput,
    YouTubeSearchInput,
    YouTubeSuggestionsInput,
    YouTubeTrainabilityInput,
    YouTubeTranscriptInput,
)

CONTRACTS = {
    "google_search": (
        GoogleInput,
        "Search Google for titles, links and snippets. No page full text.",
    ),
    "google_news": (GoogleInput, "Search news titles, links and snippets. No article full text."),
    "google_images": (GoogleInput, "Find image URLs and available dimensions. No image download."),
    "google_shopping": (GoogleInput, "Compare shopping snapshots. No stock or price guarantee."),
    "google_videos": (GoogleInput, "Discover video links across websites. No media or transcript."),
    "google_places": (GoogleInput, "Find local businesses. Contact details may be missing."),
    "youtube_search": (YouTubeSearchInput, "Find YouTube videos; request up to 20 results."),
    "youtube_search_extended": (
        YouTubeExtendedSearchInput,
        "Find up to 700 YouTube results. Separate higher rate; count is not guaranteed.",
    ),
    "youtube_metadata": (
        YouTubeMetadataInput,
        "Inspect video metadata and available chapters/formats. No media download.",
    ),
    "youtube_transcript": (
        YouTubeTranscriptInput,
        "Read an existing caption track, automatic by default. No ASR, translation or fallback.",
    ),
    "youtube_captions": (
        YouTubeCaptionsInput,
        "Read an existing caption track, uploader-authored by default. No ASR or fallback.",
    ),
    "youtube_trainability": (
        YouTubeTrainabilityInput,
        "Inspect license labels only. This does not establish legal training permission.",
    ),
    "youtube_channel": (YouTubeChannelInput, "Read channel metadata and a recent-video snapshot."),
    "youtube_suggestions": (
        YouTubeSuggestionsInput,
        "Find autocomplete suggestions, not keyword search volume.",
    ),
    "youtube_download": (
        YouTubeDownloadInput,
        (
            "Submit one paid media delivery to configured customer storage. Save its job ID; do not "
            "resubmit to poll. Requires application authorization. Result JSON expires after 24 hours."
        ),
    ),
}
