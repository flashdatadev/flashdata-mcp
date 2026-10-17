import copy
import hashlib
import json
import runpy
from pathlib import Path

import httpx
import pytest
from haystack import Pipeline
from haystack.components.builders import PromptBuilder
from haystack.utils import Secret
from jsonschema import Draft202012Validator

import flashdata_haystack as integration
from flashdata_haystack import _base
from flashdata_haystack._client import Client, FlashDataError

ROOT = Path(__file__).resolve().parents[1]
CAPABILITIES = json.loads((ROOT / "capabilities.json").read_text())
ENTRIES = json.loads((ROOT / "entries.json").read_text())
REALTIME = [item for item in CAPABILITIES if item["source"] != "youtube_download"]
CLASSES = [getattr(integration, name) for item in ENTRIES for name in item["components"]]


def component_class(source):
    name = next(item["components"][0] for item in ENTRIES if item["source"] == source)
    return getattr(integration, name)


@pytest.fixture
def mock_api(monkeypatch):
    requests = []
    handler = None

    def set_handler(callback):
        nonlocal handler
        handler = callback
        return requests

    def transport(request):
        requests.append(request)
        return handler(request)

    monkeypatch.setenv("FLASHDATA_API_KEY", "test-private-api-key")
    monkeypatch.setattr(
        _base, "Client", lambda key: Client(key, transport=httpx.MockTransport(transport))
    )
    return set_handler


@pytest.mark.parametrize("capability", REALTIME, ids=lambda item: item["source"])
def test_real_pipeline_preserves_contract_and_documents(capability, mock_api):
    response = copy.deepcopy(capability["outputExample"])
    response["new_provider_field"] = {"retained": True}
    requests = mock_api(lambda request: httpx.Response(200, json=response))
    inputs = copy.deepcopy(capability["sample"])
    original = copy.deepcopy(inputs)
    pipe = Pipeline()
    pipe.add_component("data", component_class(capability["source"])())
    pipe.add_component(
        "prompt",
        PromptBuilder(
            template="{% for d in documents %}{{d.content}}{% endfor %}",
            required_variables=["documents"],
        ),
    )
    pipe.connect("data.documents", "prompt.documents")
    output = pipe.run({"data": inputs}, include_outputs_from={"data"})
    assert inputs == original
    assert output["data"]["result"] == response
    assert len(output["data"]["documents"]) == len(response["results"])
    for index, doc in enumerate(output["data"]["documents"]):
        assert json.loads(doc.content) == response["results"][index]
        assert doc.meta == {"source": capability["source"], "result_index": index}
    assert len(requests) == 1
    request = requests[0]
    payload = json.loads(request.content)
    assert str(request.url) == "https://data.flashdata.dev/v1/queries/realtime"
    assert request.headers["X-API-Key"] == "test-private-api-key"
    assert payload["source"] == capability["source"]
    model = component_class(capability["source"]).input_model
    expected = model.model_validate(inputs).model_dump(exclude_none=True, by_alias=True)
    primary = next(key for key in ("query", "video_id", "handle") if key in expected)
    assert payload == {
        "source": capability["source"],
        primary: expected.pop(primary),
        "params": expected,
    }


@pytest.mark.parametrize("cls", CLASSES, ids=lambda cls: cls.__name__)
def test_pipeline_round_trip_and_tool_schema_without_resolving_keys(cls, monkeypatch):
    monkeypatch.delenv("FLASHDATA_API_KEY", raising=False)
    monkeypatch.delenv("FLASHDATA_DOWNLOAD_STORAGE", raising=False)
    instance = cls()
    pipe = Pipeline()
    pipe.add_component("capability", instance)
    serialized = pipe.dumps()
    restored = Pipeline.loads(serialized, allowed_modules=["flashdata_haystack"])
    assert restored.get_component("capability").to_dict() == instance.to_dict()
    tool = integration.as_tool(cls())
    Draft202012Validator.check_schema(tool.parameters)
    assert "api_key" not in tool.parameters["properties"]
    assert "storage" not in tool.parameters["properties"]
    assert "allow_submit" not in tool.parameters["properties"]
    assert "source" not in tool.parameters["properties"]
    assert tool.parameters["additionalProperties"] is False


@pytest.mark.parametrize("capability", REALTIME, ids=lambda item: item["source"])
def test_agent_tool_invocation_uses_real_component(capability, mock_api):
    requests = mock_api(lambda request: httpx.Response(200, json=capability["outputExample"]))
    tool = integration.as_tool(component_class(capability["source"])())
    result = tool.invoke(**capability["sample"])
    assert result["result"] == capability["outputExample"]
    assert len(requests) == 1


@pytest.mark.parametrize(
    "kwargs", [{"query": " "}, {"query": "test", "num": 101}, {"query": "test", "num": True}]
)
def test_invalid_input_fails_before_request(kwargs, mock_api):
    requests = mock_api(lambda request: pytest.fail("Invalid input must not reach the network"))
    with pytest.raises(FlashDataError):
        integration.FlashDataGoogleSearch().run(**kwargs)
    assert requests == []


def test_missing_key_and_raw_credentials_rejected(monkeypatch):
    monkeypatch.delenv("FLASHDATA_API_KEY", raising=False)
    with pytest.raises(FlashDataError, match="configured"):
        integration.FlashDataGoogleSearch().run(query="test")
    with pytest.raises(TypeError):
        integration.FlashDataGoogleSearch(api_key="raw-secret")
    with pytest.raises(TypeError):
        integration.FlashDataYouTubeDownloadSubmit(storage="raw-secret")


def test_serialization_refuses_token_secrets_and_does_not_mutate_input(monkeypatch):
    monkeypatch.setenv("FLASHDATA_API_KEY", "never-export-this-secret")
    component = integration.FlashDataGoogleSearch()
    data = component.to_dict()
    original = copy.deepcopy(data)
    integration.FlashDataGoogleSearch.from_dict(data)
    assert data == original
    assert "never-export-this-secret" not in json.dumps(data)
    with pytest.raises(ValueError):
        integration.FlashDataGoogleSearch(api_key=Secret.from_token("private-token")).to_dict()
    with pytest.raises(ValueError):
        integration.FlashDataYouTubeDownloadSubmit(
            storage=Secret.from_token("private-storage")
        ).to_dict()


@pytest.mark.parametrize("status", [401, 402, 403, 429, 500])
def test_api_errors_redacted_and_never_retried(status, mock_api):
    requests = mock_api(
        lambda request: httpx.Response(status, json={"error": "private-storage-secret"})
    )
    with pytest.raises(FlashDataError) as error:
        integration.FlashDataGoogleSearch().run(query="test")
    assert str(status) in str(error.value)
    assert "private-storage-secret" not in str(error.value)
    assert "test-private-api-key" not in str(error.value)
    assert len(requests) == 1


def test_timeout_has_unknown_billing_outcome_without_retry(mock_api):
    def timeout(request):
        raise httpx.ReadTimeout("sensitive response fragment", request=request)

    requests = mock_api(timeout)
    with pytest.raises(FlashDataError, match="already have been accepted") as error:
        integration.FlashDataGoogleSearch().run(query="test")
    assert "sensitive" not in str(error.value)
    assert len(requests) == 1


def test_empty_results_and_caption_defaults(mock_api):
    requests = mock_api(lambda request: httpx.Response(200, json={"results": []}))
    result = integration.FlashDataYouTubeCaptions().run(video_id="dQw4w9WgXcQ")
    assert result["documents"] == []
    assert json.loads(requests[0].content)["params"]["auto"] is False
    integration.FlashDataYouTubeTranscript().run(video_id="dQw4w9WgXcQ")
    assert json.loads(requests[1].content)["params"]["auto"] is True


def test_download_defaults_to_no_submission_and_no_secret_resolution(monkeypatch):
    monkeypatch.delenv("FLASHDATA_API_KEY", raising=False)
    with pytest.raises(FlashDataError, match="allow_submit=True"):
        integration.FlashDataYouTubeDownloadSubmit().run(video_id="dQw4w9WgXcQ")


def test_authorized_download_submits_once_and_redacts_receipt(mock_api, monkeypatch):
    storage = {
        "storage_type": "s3",
        "storage_url": "customer-owned-bucket",
        "access_key": "private-access",
        "secret_key": "private-secret",
    }
    monkeypatch.setenv("FLASHDATA_DOWNLOAD_STORAGE", json.dumps(storage))
    requests = mock_api(
        lambda request: httpx.Response(
            200,
            json={
                "id": "job_saved",
                "status": "pending",
                "source": "youtube_download",
                "params": {"storage": storage},
            },
        )
    )
    result = integration.FlashDataYouTubeDownloadSubmit(allow_submit=True).run(
        video_id="dQw4w9WgXcQ", download_type="audio", output_format="m4a"
    )
    assert len(requests) == 1
    assert str(requests[0].url) == "https://data.flashdata.dev/v1/queries"
    assert json.loads(requests[0].content)["params"]["storage"] == storage
    assert result == {
        "result": {"id": "job_saved", "status": "pending", "source": "youtube_download"}
    }
    assert "private-secret" not in json.dumps(result)


@pytest.mark.parametrize(
    "response",
    [
        {"job": {"id": "job_saved", "source": "google_search", "status": "completed"}},
        {"job": {"id": "job_other", "source": "youtube_download", "status": "completed"}},
    ],
)
def test_download_read_rejects_wrong_job_or_source(response, mock_api):
    requests = mock_api(lambda request: httpx.Response(200, json=response))
    with pytest.raises(FlashDataError):
        integration.FlashDataYouTubeDownloadStatus().run(job_id="job_saved")
    assert len(requests) == 1


def test_download_result_reads_only_and_does_not_forward_key(mock_api):
    def handler(request):
        path = request.url.path
        if path == "/v2/jobs/job_saved":
            return httpx.Response(
                200,
                json={
                    "job": {
                        "id": "job_saved",
                        "source": "youtube_download",
                        "status": "completed",
                        "params": {"storage": "private-storage"},
                    }
                },
            )
        if path == "/v2/api-access":
            return httpx.Response(200, json={"result_origin": "https://results.example.test"})
        if path == "/v2/jobs/job_saved/results":
            return httpx.Response(
                302, headers={"Location": "https://results.example.test/manifest?signature=fixture"}
            )
        assert request.url.host == "results.example.test"
        assert "X-API-Key" not in request.headers
        return httpx.Response(200, json={"files": [{"name": "audio.m4a"}]})

    requests = mock_api(handler)
    result = integration.FlashDataYouTubeDownloadResult().run(job_id="job_saved")
    assert result["result"]["output"] == {"files": [{"name": "audio.m4a"}]}
    assert "private-storage" not in json.dumps(result)
    assert len(requests) == 4
    assert all(request.method == "GET" for request in requests)


def test_result_rejects_untrusted_signed_url(mock_api):
    def handler(request):
        if request.url.path == "/v2/jobs/job_saved":
            return httpx.Response(
                200,
                json={
                    "job": {"id": "job_saved", "source": "youtube_download", "status": "completed"}
                },
            )
        if request.url.path == "/v2/api-access":
            return httpx.Response(200, json={"result_origin": "https://results.example.test"})
        return httpx.Response(302, headers={"Location": "https://untrusted.example.test/manifest"})

    requests = mock_api(handler)
    with pytest.raises(FlashDataError, match="trusted FlashData storage"):
        integration.FlashDataYouTubeDownloadResult().run(job_id="job_saved")
    assert len(requests) == 3


def test_vendored_contracts_match_reviewed_source():
    provenance = json.loads((ROOT / "contract-provenance.json").read_text())
    for name, expected in provenance["files"].items():
        path = ROOT / "src" / "flashdata_haystack" / name
        assert hashlib.sha256(path.read_bytes()).hexdigest() == expected["packaged_sha256"]


@pytest.mark.parametrize("capability", CAPABILITIES, ids=lambda item: item["source"])
def test_documented_pipeline_runs_with_fixture(capability, mock_api, capsys):
    if capability["source"] == "youtube_download":
        response = {
            "job": {
                "id": "job_REPLACE-WITH-SAVED-RECEIPT",
                "source": "youtube_download",
                "status": "processing",
            }
        }
    else:
        response = capability["outputExample"]
    mock_api(lambda request: httpx.Response(200, json=response))
    example = ROOT / "examples" / f"{capability['source']}.py"
    runpy.run_path(str(example), run_name="__main__")
    assert capsys.readouterr().out
