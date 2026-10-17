"""Shared execution and serialization for source-specific Haystack components."""

import copy
import json
from typing import Any
from urllib.parse import urlsplit

from haystack import Document, default_from_dict, default_to_dict
from haystack.utils import Secret
from pydantic import ValidationError

from ._client import Client, FlashDataError
from ._inputs import DownloadJobInput, YouTubeDownloadInput
from ._storage import storage_config


def validate(model, values):
    try:
        return model.model_validate(values).model_dump(exclude_none=True, by_alias=True)
    except ValidationError:
        raise FlashDataError("Invalid source inputs. Check the component input schema.") from None


def resolve(secret, label):
    try:
        value = secret.resolve_value()
    except (ValueError, KeyError):
        raise FlashDataError(f"Set the configured {label} environment variable.") from None
    if not isinstance(value, str) or not value.strip():
        raise FlashDataError(f"Set the configured {label} environment variable.")
    return value


class AuthenticatedComponent:
    def __init__(self, api_key: Secret | None = None):
        if api_key is not None and not isinstance(api_key, Secret):
            raise TypeError(
                "api_key must be a Haystack Secret, preferably from an environment variable."
            )
        self.api_key = api_key if api_key is not None else Secret.from_env_var("FLASHDATA_API_KEY")

    def to_dict(self) -> dict[str, Any]:
        return default_to_dict(self, api_key=self.api_key.to_dict())

    @classmethod
    def from_dict(cls, data: dict[str, Any]):
        data = copy.deepcopy(data)
        for name in ("api_key", "storage"):
            value = data.get("init_parameters", {}).get(name)
            if value is not None:
                data["init_parameters"][name] = Secret.from_dict(value)
        return default_from_dict(cls, data)

    def _client(self):
        value = resolve(self.api_key, "FlashData API key").strip()
        if any(ord(char) < 32 or ord(char) == 127 for char in value):
            raise FlashDataError("The FlashData API key contains invalid characters.")
        return Client(value)

    def _query(self, source, model, values):
        data = validate(model, values)
        primary = next(key for key in ("query", "video_id", "handle") if key in data)
        result = self._client().query(
            {"source": source, primary: data.pop(primary), "params": data}
        )
        # Preserve each complete top-level API result, including nested provider fields.
        # These are structured JSON documents, never a claim of fetched full-page text.
        documents = [
            Document(
                content=json.dumps(item, ensure_ascii=False, allow_nan=False),
                meta={"source": source, "result_index": index},
            )
            for index, item in enumerate(result["results"])
        ]
        return {"result": result, "documents": documents}

    def _read_download(self, job_id, *, result=False):
        data = validate(DownloadJobInput, {"job_id": job_id})
        client = self._client()
        return {
            "result": client.result(data["job_id"]) if result else client.status(data["job_id"])
        }


class DownloadSubmitComponent(AuthenticatedComponent):
    def __init__(
        self,
        api_key: Secret | None = None,
        storage: Secret | None = None,
        allow_submit: bool = False,
    ):
        super().__init__(api_key)
        if storage is not None and not isinstance(storage, Secret):
            raise TypeError("storage must be a Haystack Secret containing the storage JSON.")
        if type(allow_submit) is not bool:
            raise TypeError("allow_submit must be a boolean.")
        self.storage = (
            storage if storage is not None else Secret.from_env_var("FLASHDATA_DOWNLOAD_STORAGE")
        )
        self.allow_submit = allow_submit

    def to_dict(self) -> dict[str, Any]:
        return default_to_dict(
            self,
            api_key=self.api_key.to_dict(),
            storage=self.storage.to_dict(),
            allow_submit=self.allow_submit,
        )

    def _submit(self, values):
        if not self.allow_submit:
            raise FlashDataError(
                "Configure allow_submit=True only after authorizing a paid customer-storage write. "
                "To inspect an existing job, use the status or result component."
            )
        data = validate(YouTubeDownloadInput, values)
        storage = storage_config(resolve(self.storage, "download storage"))
        if storage.get("endpoint_url"):
            try:
                url = urlsplit(storage["endpoint_url"])
                if (
                    url.scheme != "https"
                    or not url.hostname
                    or url.username
                    or url.password
                    or url.query
                    or url.fragment
                ):
                    raise ValueError()
                _ = url.port  # Access validates malformed or out-of-range ports.
            except ValueError:
                raise FlashDataError(
                    "Storage endpoint must be an HTTPS URL without credentials."
                ) from None
        return {
            "result": self._client().submit(
                {
                    "source": "youtube_download",
                    "video_id": data.pop("video_id"),
                    "params": {**data, "storage": storage},
                }
            )
        }
