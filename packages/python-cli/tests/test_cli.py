import gzip
import io
import json
import os
from pathlib import Path

import httpx
import pytest

from flashdata_cli import _client
from flashdata_cli._client import Client
from flashdata_cli.cli import run

CAPABILITIES = json.loads((Path(__file__).resolve().parents[1] / "capabilities.json").read_text())
ORDINARY = [c for c in CAPABILITIES if c["source"] != "youtube_download"]
KEY = "test-key-not-a-production-credential"
STORAGE = {
    "storage_type": "s3",
    "storage_url": "fixture-bucket",
    "region": "us-east-1",
    "access_key": "fixture-access-key",
    "secret_key": "fixture-storage-secret",
}


def invoke(source, args, handler, *, env=None):
    stdout, stderr = io.StringIO(), io.StringIO()
    calls = []

    def wrapped(request):
        calls.append(request)
        return handler(request)

    code = run(
        source,
        "test-cli",
        args,
        environ=env or {"FLASHDATA_API_KEY": KEY},
        stdout=stdout,
        stderr=stderr,
        client_factory=lambda key: Client(key, transport=httpx.MockTransport(wrapped)),
    )
    assert KEY not in stdout.getvalue() + stderr.getvalue()
    return code, stdout.getvalue(), stderr.getvalue(), calls


@pytest.mark.parametrize("capability", ORDINARY, ids=lambda c: c["source"])
def test_fixed_source_payload_and_full_response(capability):
    sample = dict(capability["sample"])
    primary = next(k for k in ("query", "video_id", "handle") if k in sample)
    value = sample.pop(primary)
    args = ["--" + primary.replace("_", "-"), value, "--options-json", json.dumps(sample)]

    def handler(request):
        assert request.method == "POST"
        assert str(request.url) == _client.QUERY_URL
        assert request.headers["X-API-Key"] == KEY
        payload = json.loads(request.content)
        assert payload["source"] == capability["source"]
        assert payload[primary] == value
        assert all(payload["params"][k] == v for k, v in sample.items())
        return httpx.Response(200, json=capability["outputExample"])

    code, output, error, calls = invoke(capability["source"], args, handler)
    assert code == 0 and not error and len(calls) == 1
    assert json.loads(output) == capability["outputExample"]


@pytest.mark.parametrize("source", [c["source"] for c in CAPABILITIES])
def test_schema_is_local_and_available_without_key(source):
    code, output, error, calls = invoke(
        source, ["--schema"], lambda _: pytest.fail(), env={"NO_KEY": "1"}
    )
    assert code == 0 and not error and not calls
    assert json.loads(output)["type"] == "object"


@pytest.mark.parametrize(
    "args",
    [
        [],
        ["--query", "   "],
        ["--query", "q", "--options-json", '{"num":0}'],
        ["--query", "q", "--options-json", '{"num":"10"}'],
        ["--query", "q", "--options-json", '{"num":true}'],
        ["--query", "q", "--options-json", '{"source":"youtube_search"}'],
        ["--query", "q", "--options-json", "[]"],
        ["--query", "q", "--options-json", '{"api_key":"secret-fixture"}'],
        ["--api-key", "secret-fixture"],
        ["--query", "q", "--options-json", "secret-fixture"],
    ],
)
def test_invalid_input_never_sends_request_or_echoes_values(args):
    code, output, error, calls = invoke("google_search", args, lambda _: pytest.fail())
    assert code == 2 and error and not output and not calls
    assert "secret-fixture" not in error


@pytest.mark.parametrize(
    "source,options,expected",
    [
        ("google_search", {}, {}),
        ("youtube_search", {}, {"max_results": 10}),
        ("youtube_search_extended", {}, {"max_results": 20}),
        ("youtube_transcript", {}, {"language": "en", "auto": True}),
        ("youtube_captions", {}, {"language": "en", "auto": False}),
    ],
)
def test_source_defaults_are_intentional(source, options, expected):
    primary = (
        ["--video-id", "dQw4w9WgXcQ"]
        if source in ("youtube_transcript", "youtube_captions")
        else ["--query", "q"]
    )
    code, _, _, calls = invoke(source, primary, lambda _: httpx.Response(200, json={"results": []}))
    assert code == 0 and json.loads(calls[0].content)["params"] == expected


@pytest.mark.parametrize("status", [401, 402, 403, 429, 500, 302])
def test_http_error_is_not_retried_and_raw_body_is_not_logged(status):
    code, output, error, calls = invoke(
        "google_search",
        ["--query", "q"],
        lambda _: httpx.Response(
            status, text="secret-fixture", headers={"Location": "https://example.com"}
        ),
    )
    assert code == 1 and len(calls) == 1 and not output and "secret-fixture" not in error


def test_timeout_retains_unknown_paid_outcome():
    def handler(request):
        raise httpx.ReadTimeout("secret-fixture", request=request)

    code, output, error, calls = invoke("google_search", ["--query", "q"], handler)
    assert code == 1 and len(calls) == 1 and "charged" in error and not output
    assert "secret-fixture" not in error


def test_compressed_result_is_decoded_once():
    code, output, error, _ = invoke(
        "google_search",
        ["--query", "q"],
        lambda _: httpx.Response(
            200, content=gzip.compress(b'{"results":[]}'), headers={"Content-Encoding": "gzip"}
        ),
    )
    assert code == 0 and json.loads(output) == {"results": []} and not error


def test_response_limit_is_enforced(monkeypatch):
    monkeypatch.setattr(_client, "MAX_RESPONSE_BYTES", 20)
    code, output, error, calls = invoke(
        "google_search", ["--query", "q"], lambda _: httpx.Response(200, content=b"x" * 21)
    )
    assert code == 1 and len(calls) == 1 and not output and "exceeds" in error


def test_file_is_created_privately_and_existing_file_fails_before_post(tmp_path):
    path = tmp_path / "result.json"
    handler = lambda _: httpx.Response(200, json={"results": []})
    args = ["--query", "q", "--output", str(path)]
    code, output, error, calls = invoke("google_search", args, handler)
    assert code == 0 and not output and not error and len(calls) == 1
    assert json.loads(path.read_text()) == {"results": []}
    if os.name != "nt":
        assert path.stat().st_mode & 0o777 == 0o600
    code, output, error, calls = invoke("google_search", args, lambda _: pytest.fail())
    assert code == 2 and not calls and error
    assert json.loads(path.read_text()) == {"results": []}


def test_failed_post_retains_empty_reserved_file_without_repeating_call(tmp_path):
    path = tmp_path / "result.json"
    code, _, error, calls = invoke(
        "google_search",
        ["--query", "q", "--output", str(path)],
        lambda _: httpx.Response(500, text="secret-fixture"),
    )
    assert code == 1 and len(calls) == 1 and path.read_text() == "" and "incomplete" in error


@pytest.mark.parametrize(
    "args",
    [
        ["--operation", "submit", "--video-id", "dQw4w9WgXcQ"],
        [
            "--operation",
            "submit",
            "--allow-submit",
            "--video-id",
            "dQw4w9WgXcQ",
            "--job-id",
            "job_existing",
        ],
        ["--operation", "result", "--job-id", "job_existing", "--video-id", "dQw4w9WgXcQ"],
        ["--job-id", "../secret-fixture"],
    ],
)
def test_download_requires_explicit_submission_and_reads_never_accept_submit_arguments(args):
    code, output, error, calls = invoke("youtube_download", args, lambda _: pytest.fail())
    assert code == 2 and not calls and error and not output


def test_submit_posts_once_and_drops_storage_fields_from_receipt():
    def handler(request):
        payload = json.loads(request.content)
        assert str(request.url) == _client.ASYNC_URL
        assert payload["params"]["storage"] == STORAGE
        return httpx.Response(
            200, json={"id": "job_fixture", "status": "pending", "params": payload["params"]}
        )

    code, output, error, calls = invoke(
        "youtube_download",
        ["--operation", "submit", "--allow-submit", "--video-id", "dQw4w9WgXcQ"],
        handler,
        env={"FLASHDATA_API_KEY": KEY, "FLASHDATA_DOWNLOAD_STORAGE": json.dumps(STORAGE)},
    )
    assert code == 0 and not error and len(calls) == 1
    assert json.loads(output) == {"id": "job_fixture", "status": "pending"}
    assert STORAGE["secret_key"] not in output


def test_pending_result_reads_once_and_retains_id():
    code, output, error, calls = invoke(
        "youtube_download",
        ["--operation", "result", "--job-id", "job_fixture"],
        lambda _: httpx.Response(
            200,
            json={
                "job": {
                    "id": "job_fixture",
                    "source": "youtube_download",
                    "status": "processing",
                    "params": {"storage": STORAGE},
                }
            },
        ),
    )
    assert code == 0 and not error and len(calls) == 1 and calls[0].method == "GET"
    assert json.loads(output)["job"]["id"] == "job_fixture"
    assert "storage" not in output


@pytest.mark.parametrize("bad_link", [False, True])
def test_completed_result_trusts_management_origin_and_never_forwards_key(bad_link):
    def handler(request):
        url = str(request.url)
        if url == _client.JOBS_URL + "/job_fixture":
            return httpx.Response(
                200,
                json={
                    "job": {
                        "id": "job_fixture",
                        "source": "youtube_download",
                        "status": "completed",
                    }
                },
            )
        if url == _client.AUTH_URL:
            return httpx.Response(200, json={"result_origin": "https://results.example"})
        if url == _client.JOBS_URL + "/job_fixture/results":
            return httpx.Response(
                302,
                headers={
                    "Location": "https://"
                    + ("evil.example" if bad_link else "results.example")
                    + "/result?signature=fixture"
                },
            )
        assert "X-API-Key" not in request.headers
        assert url == "https://results.example/result?signature=fixture"
        return httpx.Response(200, json={"files": [{"url": "https://customer.example/media"}]})

    code, output, error, calls = invoke(
        "youtube_download", ["--operation", "result", "--job-id", "job_fixture"], handler
    )
    assert all(c.method == "GET" for c in calls)
    if bad_link:
        assert code == 1 and len(calls) == 3 and not output and "trusted" in error
    else:
        assert code == 0 and len(calls) == 4 and not error and "output" in json.loads(output)


def test_download_rejects_another_job_id():
    code, output, error, calls = invoke(
        "youtube_download",
        ["--job-id", "job_fixture"],
        lambda _: httpx.Response(
            200,
            json={"job": {"id": "job_other", "source": "youtube_download", "status": "completed"}},
        ),
    )
    assert code == 1 and not output and "match" in error and len(calls) == 1
