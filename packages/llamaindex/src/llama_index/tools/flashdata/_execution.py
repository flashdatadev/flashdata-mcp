"""Application-owned credentials and bounded API execution."""

import os
from urllib.parse import urlsplit

from pydantic import SecretStr, ValidationError

from ._catalog import CONTRACTS
from ._client import Client, FlashDataError
from ._inputs import DownloadJobInput
from ._storage import storage_config


def validate(model, values):
    try:
        return model.model_validate(values).model_dump(exclude_none=True, by_alias=True)
    except ValidationError:
        raise FlashDataError("Invalid source inputs. Check the tool input schema.") from None


def resolve(secret, env):
    value = secret.get_secret_value() if secret is not None else os.environ.get(env, "")
    if not value.strip():
        raise FlashDataError(f"Set {env} in the application environment.")
    return value


class Execution:
    def __init__(self, api_key=None, *, storage=None, allow_download=False):
        if type(allow_download) is not bool:
            raise TypeError("allow_download must be a boolean.")
        self._api_key = SecretStr(api_key) if api_key is not None else None
        self._storage = SecretStr(storage) if storage is not None else None
        self._allow_download = allow_download

    def _client(self):
        key = resolve(self._api_key, "FLASHDATA_API_KEY").strip()
        if any(ord(c) < 32 or ord(c) == 127 for c in key):
            raise FlashDataError("The FlashData API key contains invalid characters.")
        return Client(key)

    def query(self, source, values):
        data = validate(CONTRACTS[source][0], values)
        primary = next(k for k in ("query", "video_id", "handle") if k in data)
        return self._client().query({"source": source, primary: data.pop(primary), "params": data})

    def submit(self, values):
        if not self._allow_download:
            raise FlashDataError(
                "Configure allow_download=True after authorizing a paid customer-storage write. "
                "Use status/result tools to read an existing job."
            )
        data = validate(CONTRACTS["youtube_download"][0], values)
        storage = storage_config(resolve(self._storage, "FLASHDATA_DOWNLOAD_STORAGE"))
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
                _ = url.port
            except ValueError:
                raise FlashDataError(
                    "Storage endpoint must be HTTPS without credentials, query or fragment."
                ) from None
        return self._client().submit(
            {
                "source": "youtube_download",
                "video_id": data.pop("video_id"),
                "params": {**data, "storage": storage},
            }
        )

    def read_job(self, values, *, result=False):
        data = validate(DownloadJobInput, values)
        client = self._client()
        return client.result(data["job_id"]) if result else client.status(data["job_id"])
