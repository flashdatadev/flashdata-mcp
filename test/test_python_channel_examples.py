"""Run the actual published examples through the real MCP SDK, without sockets."""

import asyncio
import importlib.util
import json
import re
import socket
from pathlib import Path

import httpx
import jsonschema
import pytest

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("hosted_example", ROOT / "registry/examples/call_tool.py")
HELPER = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(HELPER)
CATALOG = json.loads((ROOT / "integrations/clawhub/catalog.json").read_text())
SCHEMAS = {
    entry["source"]: json.loads((ROOT / entry["directory"] / "references/schema.json").read_text())
    for entry in CATALOG["skills"]
}
SCHEMAS["get_job"] = {
    "type": "object", "properties": {"job_id": {"const": "job_fixture"}},
    "required": ["job_id"], "additionalProperties": False,
}
SCHEMAS["get_pricing"] = {"type": "object"}
EXAMPLES = []
for pattern in ("skills/*/SKILL.md", "integrations/clawhub/skills/*/SKILL.md", "integrations/modelscope/skills/*/SKILL.md"):
    for path in sorted(ROOT.glob(pattern)):
        for index, block in enumerate(re.findall(r"```python\n([\s\S]*?)\n```", path.read_text())):
            EXAMPLES.append(pytest.param(block, id=f"{path.relative_to(ROOT)}:{index}"))


@pytest.fixture(autouse=True)
def no_network(monkeypatch):
    def denied(*args, **kwargs):
        raise AssertionError("Network access is forbidden in example tests")
    monkeypatch.setattr(socket, "create_connection", denied)
    monkeypatch.setattr(socket.socket, "connect", denied)


def fixture_transport(*, text_only=False, outcome="success"):
    calls = []

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
            result = {"content": [{"type": "text", "text": json.dumps(body)}], "isError": False}
            if not text_only:
                result["structuredContent"] = body
            if outcome == "error":
                result = {"content": [{"type": "text", "text": "private-error-fixture-api-key"}], "isError": True}
        return httpx.Response(200, json={"jsonrpc": "2.0", "id": message["id"], "result": result})

    return httpx.MockTransport(handle), calls


def configure_example(monkeypatch, tmp_path, transport):
    monkeypatch.setenv("FLASHDATA_API_KEY", "fixture-api-key")
    monkeypatch.setenv("FLASHDATA_JOB_ID", "job_fixture")
    storage = tmp_path / "storage.json"
    storage.write_text(json.dumps({"storage_type": "s3", "storage_url": "fixture-bucket",
                                  "access_key": "fixture-storage-access", "secret_key": "fixture-storage-secret",
                                  "region": "us-east-1"}))
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
    request = json.loads(request_path.read_text())
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
