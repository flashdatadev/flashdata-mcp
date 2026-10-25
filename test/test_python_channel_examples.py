"""Run the actual published examples through the real MCP SDK, without sockets."""

import asyncio
import importlib.util
import json
import re
import sys
from types import SimpleNamespace
from pathlib import Path

import httpx
import jsonschema
import pytest
from mcp import ClientSession  # Import before the HTTP-client fixture replaces its constructor.

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "registry/examples"))
from mcp_response import read_complete, call_complete

SPEC = importlib.util.spec_from_file_location("hosted_example", ROOT / "registry/examples/call_tool.py")
HELPER = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(HELPER)
CATALOG = json.loads((ROOT / "integrations/clawhub/catalog.json").read_text(encoding="utf-8"))
SCHEMAS = {
    entry["source"]: json.loads((ROOT / entry["directory"] / "references/schema.json").read_text(encoding="utf-8"))
    for entry in CATALOG["skills"]
}
SCHEMAS["get_job"] = {
    "type": "object", "properties": {"job_id": {"const": "job_fixture"}},
    "required": ["job_id"], "additionalProperties": False,
}
SCHEMAS["get_result"] = {"type": "object", "properties": {"result_id": {"type": "string"}, "offset": {"type": "integer"}}, "required": ["result_id", "offset"], "additionalProperties": False}
SCHEMAS["get_pricing"] = {"type": "object"}
EXAMPLES = []
for pattern in ("skills/*/scripts/*.py", "integrations/clawhub/skills/*/scripts/*.py", "integrations/modelscope/skills/*/scripts/*.py"):
    for path in sorted(ROOT.glob(pattern)):
        if path.name != "mcp_response.py":
            EXAMPLES.append(pytest.param(path.read_text(encoding="utf-8"), id=str(path.relative_to(ROOT))))


@pytest.fixture(autouse=True)
def no_network(monkeypatch):
    def denied(*args, **kwargs):
        raise AssertionError("Network access is forbidden in example tests")
    # Block real HTTP, not Windows asyncio's internal loopback socketpair.
    monkeypatch.setattr(httpx.HTTPTransport, "handle_request", denied)
    monkeypatch.setattr(httpx.AsyncHTTPTransport, "handle_async_request", denied)


def fixture_transport(*, text_only=False, outcome="success", long_result=False):
    calls = []
    document = json.dumps({"source": "youtube_transcript", "status": "done", "results": [{"fullText": "字幕😀" * 12000}]}, ensure_ascii=False)
    raw = document.encode("utf-16-le")

    def handle(request):
        assert str(request.url) == HELPER.ENDPOINT
        assert request.headers["X-API-Key"] == "fixture-api-key"
        message = json.loads(request.content)
        method = message["method"]
        if method == "notifications/initialized":
            return httpx.Response(202)
        if method == "initialize":
            result = {"protocolVersion": message["params"]["protocolVersion"], "capabilities": {"tools": {}},
                      "serverInfo": {"name": "offline-fixture", "version": "1.0.0"}}
        elif method == "tools/list":
            result = {"tools": [{"name": name, "inputSchema": schema} for name, schema in SCHEMAS.items()]}
        else:
            assert method == "tools/call"
            params = message["params"]
            calls.append(params)
            jsonschema.validate(params["arguments"], SCHEMAS[params["name"]])
            if outcome == "timeout":
                raise httpx.ReadTimeout("private-error-fixture-api-key", request=request)
            if params["name"] == "youtube_download":
                body = {"id": "job_fixture", "status": "pending", "source": "youtube_download"}
            elif params["name"] == "get_job":
                body = {"job": {"id": "job_fixture", "status": "pending", "source": "youtube_download"}}
            else:
                body = {"source": params["name"], "status": "done", "results": [{"text": "fixture 中文"}]}
            if long_result:
                offset = params["arguments"].get("offset", 0)
                total = len(raw) // 2
                end = min(offset + 16000, total)
                if end < total and 0xD800 <= int.from_bytes(raw[(end - 1) * 2:end * 2], "little") <= 0xDBFF:
                    end -= 1
                body = {"result_id": "result_fixture", "encoding": "json", "offset": offset,
                        "next_offset": end if end < total else None, "total_characters": total,
                        "chunk": raw[offset * 2:end * 2].decode("utf-16-le", "surrogatepass")}
            result = {"content": [{"type": "text", "text": json.dumps(body)}], "isError": False}
            if not text_only:
                result["structuredContent"] = body
            if outcome == "error":
                result = {"content": [{"type": "text", "text": "private-error-fixture-api-key"}], "isError": True}
        return httpx.Response(200, content=json.dumps({"jsonrpc": "2.0", "id": message["id"], "result": result}), headers={"content-type": "application/json"})

    return httpx.MockTransport(handle), calls


def configure_example(monkeypatch, tmp_path, transport):
    monkeypatch.setenv("FLASHDATA_API_KEY", "fixture-api-key")
    monkeypatch.setenv("FLASHDATA_JOB_ID", "job_fixture")
    storage = tmp_path / "storage.json"
    storage.write_text(json.dumps({"storage_type": "s3", "storage_url": "fixture-bucket",
                                  "access_key": "fixture-storage-access", "secret_key": "fixture-storage-secret",
                                  "region": "us-east-1"}), encoding="utf-8")
    monkeypatch.setenv("FLASHDATA_STORAGE_FILE", str(storage))
    original = httpx.AsyncClient

    def client(*args, **kwargs):
        assert kwargs["follow_redirects"] is False
        assert kwargs["trust_env"] is False
        return original(*args, **kwargs, transport=transport)
    monkeypatch.setattr(httpx, "AsyncClient", client)


@pytest.mark.parametrize("code", EXAMPLES)
@pytest.mark.parametrize("text_only", [False, True])
def test_actual_skill_examples(code, text_only, monkeypatch, tmp_path, capsys):
    transport, calls = fixture_transport(text_only=text_only)
    configure_example(monkeypatch, tmp_path, transport)
    exec(compile(code, "published-example.py", "exec"), {})
    captured = capsys.readouterr()
    output = json.loads(captured.out)
    assert len(calls) == 1
    assert "fixture-api-key" not in captured.out
    assert "fixture-storage-" not in captured.out
    if calls[0]["name"] == "youtube_download":
        assert output == {"id": "job_fixture", "status": "pending", "source": "youtube_download"}
        assert calls[0]["arguments"]["storage"]["secret_key"] == "fixture-storage-secret"
    elif calls[0]["name"] == "get_job":
        assert output["job"]["status"] == "pending"
        assert "output" not in output
    else:
        assert output["source"] == calls[0]["name"]


@pytest.mark.parametrize("outcome", ["error", "timeout"])
def test_skill_errors_do_not_retry_or_print_private_response(outcome, monkeypatch, tmp_path, capsys):
    code = EXAMPLES[0].values[0]
    transport, calls = fixture_transport(outcome=outcome)
    configure_example(monkeypatch, tmp_path, transport)
    with pytest.raises(SystemExit) as error:
        exec(compile(code, "published-example.py", "exec"), {})
    assert "private-error" not in str(error.value)
    assert not capsys.readouterr().out
    assert len(calls) == 1


@pytest.mark.parametrize("request_path", sorted((ROOT / "registry/examples").glob("*.json")), ids=lambda p: p.name)
@pytest.mark.parametrize("text_only", [False, True])
def test_registry_helper(request_path, text_only):
    request = json.loads(request_path.read_text(encoding="utf-8"))
    if request["name"] == "get_job":
        request["arguments"]["job_id"] = "job_fixture"
    transport, calls = fixture_transport(text_only=text_only)
    body = asyncio.run(HELPER.call_tool(request, "fixture-api-key", transport=transport))
    assert isinstance(body, dict)
    assert len(calls) == 1


@pytest.mark.parametrize("outcome", ["error", "timeout"])
def test_registry_errors_do_not_retry(outcome):
    transport, calls = fixture_transport(outcome=outcome)
    with pytest.raises(Exception):
        asyncio.run(HELPER.call_tool({"name": "google_search", "arguments": {"query": "fixture"}},
                                    "fixture-api-key", transport=transport))
    assert len(calls) == 1


@pytest.mark.parametrize("text_only", [False, True])
def test_transcript_example_reads_every_chunk_in_same_session(text_only, monkeypatch, tmp_path, capsys):
    code = (ROOT / "skills/youtube-transcript/scripts/example.py").read_text(encoding="utf-8")
    transport, calls = fixture_transport(text_only=text_only, long_result=True)
    configure_example(monkeypatch, tmp_path, transport)
    exec(compile(code, "transcript-example.py", "exec"), {})
    output = json.loads(capsys.readouterr().out)
    assert output["results"][0]["fullText"] == "字幕😀" * 12000
    assert calls[0]["name"] == "youtube_transcript"
    assert len(calls) > 2
    assert all(call["name"] == "get_result" for call in calls[1:])


def test_real_http_is_blocked():
    with pytest.raises(AssertionError, match="Network access is forbidden"):
        httpx.get("https://example.invalid")


@pytest.mark.parametrize("encoding", ["json", "markdown", "text"])
@pytest.mark.parametrize("fault", [None, "expired", "offset", "total", "encoding", "id", "truncated", "timeout"])
def test_chunk_reader_encoding_unicode_and_failures(encoding, fault):
    text = json.dumps({"text": "x😀中文"}, ensure_ascii=False) if encoding == "json" else "x😀中文"
    raw = text.encode("utf-16-le")
    # Split just after a high surrogate, as the JavaScript cache can do.
    split = (text.index("😀") + 1) * 2
    total = len(raw) // 2
    def result(offset, end):
        body = {"result_id": "r", "encoding": encoding, "total_characters": total,
                "offset": offset, "next_offset": end if end < total else None,
                "chunk": raw[offset * 2:end * 2].decode("utf-16-le", "surrogatepass")}
        return SimpleNamespace(isError=False, structuredContent=body, content=[])
    first = result(0, split // 2)
    second = result(split // 2, total)
    if fault == "expired": second.isError = True
    elif fault == "offset": second.structuredContent["offset"] = 0
    elif fault == "total": second.structuredContent["total_characters"] += 1
    elif fault == "encoding": second.structuredContent["encoding"] = "invalid"
    elif fault == "id": second.structuredContent["result_id"] = "other"
    elif fault == "truncated": second.structuredContent["chunk"] = ""
    class Session:
        calls = []
        async def call_tool(self, name, arguments, **kwargs):
            self.calls.append(name)
            assert name == "get_result"
            assert arguments == {"result_id": "r", "offset": split // 2}
            if fault == "timeout": raise TimeoutError()
            return second
    session = Session()
    if fault:
        with pytest.raises((RuntimeError, TimeoutError)):
            asyncio.run(read_complete(session, first))
    else:
        output = asyncio.run(read_complete(session, first))
        assert output == (json.loads(text) if encoding == "json" else {"content": text, "format": encoding})
    assert session.calls == ["get_result"]


def test_examples_negotiate_json_only_when_advertised():
    class Session:
        arguments = None
        async def list_tools(self, cursor=None):
            return SimpleNamespace(tools=[SimpleNamespace(name="google_search", inputSchema={"properties": {
                "response_format": {"enum": ["markdown", "text", "json"]}}})], nextCursor=None)
        async def call_tool(self, name, arguments, **kwargs):
            self.arguments = arguments
            return SimpleNamespace(isError=False, structuredContent={"status": "done"}, content=[])
    session = Session()
    asyncio.run(call_complete(session, "google_search", {"query": "fixture"}))
    assert session.arguments == {"query": "fixture", "response_format": "json"}


def test_bundled_readers_are_identical():
    expected = (ROOT / "registry/examples/mcp_response.py").read_bytes()
    for pattern in ("skills/*/scripts/mcp_response.py", "integrations/*/skills/*/scripts/mcp_response.py"):
        for path in ROOT.glob(pattern):
            assert path.read_bytes() == expected, path
