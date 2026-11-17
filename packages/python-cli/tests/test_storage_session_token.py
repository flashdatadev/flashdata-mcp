import json

import pytest

from flashdata_cli._client import FlashDataError
from flashdata_cli._storage import storage_config


@pytest.mark.parametrize("provider", ["s3", "s3_compatible", "oss", "cos", "bos", "tos"])
def test_temporary_credentials_are_preserved(provider):
    storage = {
        "storage_type": provider,
        "storage_url": "test-bucket",
        "access_key": "temporary-access",
        "secret_key": "temporary-secret",
        "session_token": "temporary-session-token",
    }
    storage.update(
        {
            "s3": {"region": "us-east-1"},
            "s3_compatible": {"endpoint_url": "https://storage.example.com"},
            "oss": {"endpoint_url": "https://oss-cn-hangzhou.aliyuncs.com"},
            "cos": {"storage_url": "test-bucket-1250000000", "region": "ap-guangzhou"},
            "bos": {"region": "bj"},
            "tos": {"region": "cn-beijing"},
        }[provider]
    )
    assert storage_config(json.dumps(storage)) == storage
    del storage["session_token"]
    assert storage_config(json.dumps(storage)) == storage


@pytest.mark.parametrize(
    "token",
    [
        "",
        None,
        1,
        {},
        "private token",
        "private\ntoken",
        "private\0token",
        "private\x7ftoken",
        "x" * 16385,
    ],
)
def test_invalid_token_is_rejected_without_disclosure(token):
    storage = {
        "storage_type": "s3",
        "storage_url": "test-bucket",
        "access_key": "temp-key",
        "secret_key": "temp-secret",
        "session_token": token,
    }
    with pytest.raises(FlashDataError) as error:
        storage_config(json.dumps(storage))
    assert "temp-secret" not in str(error.value)
    if isinstance(token, str) and len(token) > 6:
        assert token not in str(error.value)


@pytest.mark.parametrize("provider", ["gcs", "azure"])
def test_other_authentication_types_reject_session_token(provider):
    with pytest.raises(FlashDataError):
        storage_config(
            json.dumps(
                {
                    "storage_type": provider,
                    "storage_url": "test-bucket",
                    "session_token": "private-token",
                }
            )
        )


@pytest.mark.parametrize("missing", ["access_key", "secret_key"])
def test_token_requires_matching_key_pair(missing):
    storage = {
        "storage_type": "s3",
        "storage_url": "test-bucket",
        "access_key": "temp-key",
        "secret_key": "temp-secret",
        "session_token": "private-token",
    }
    del storage[missing]
    with pytest.raises(FlashDataError, match="matching temporary"):
        storage_config(json.dumps(storage))
