"""FlashData components for Haystack 3.4 pipelines and agents."""

from ._client import FlashDataError
from .components import (
    FlashDataGoogleImages,
    FlashDataGoogleNews,
    FlashDataGooglePlaces,
    FlashDataGoogleSearch,
    FlashDataGoogleShopping,
    FlashDataGoogleVideos,
    FlashDataYouTubeCaptions,
    FlashDataYouTubeChannel,
    FlashDataYouTubeDownloadResult,
    FlashDataYouTubeDownloadStatus,
    FlashDataYouTubeDownloadSubmit,
    FlashDataYouTubeMetadata,
    FlashDataYouTubeSearch,
    FlashDataYouTubeSearchExtended,
    FlashDataYouTubeSuggestions,
    FlashDataYouTubeTrainability,
    FlashDataYouTubeTranscript,
)
from .tools import as_tool

__version__ = "0.1.0"

__all__ = [
    "FlashDataError",
    "FlashDataGoogleImages",
    "FlashDataGoogleNews",
    "FlashDataGooglePlaces",
    "FlashDataGoogleSearch",
    "FlashDataGoogleShopping",
    "FlashDataGoogleVideos",
    "FlashDataYouTubeCaptions",
    "FlashDataYouTubeChannel",
    "FlashDataYouTubeDownloadResult",
    "FlashDataYouTubeDownloadStatus",
    "FlashDataYouTubeDownloadSubmit",
    "FlashDataYouTubeMetadata",
    "FlashDataYouTubeSearch",
    "FlashDataYouTubeSearchExtended",
    "FlashDataYouTubeSuggestions",
    "FlashDataYouTubeTrainability",
    "FlashDataYouTubeTranscript",
    "as_tool",
]
