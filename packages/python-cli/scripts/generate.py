"""Build independent CLI distributions from one maintained runtime."""

import json
import shlex
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CAPABILITIES = json.loads((ROOT / "capabilities.json").read_text())
PURPOSES = {
    "google_search": "Collect current web evidence for an AI research agent",
    "google_news": "Save a news topic snapshot for a daily briefing",
    "google_images": "Build an image-reference inventory for manual review",
    "google_shopping": "Compare product offers in a purchasing research pipeline",
    "google_videos": "Find video tutorials across websites",
    "google_places": "Create a local-business research dataset",
    "youtube_search": "Discover videos for a research shortlist",
    "youtube_search_extended": "Build a larger video discovery dataset",
    "youtube_metadata": "Inspect video metadata and chapters before ingestion",
    "youtube_transcript": "Export timestamped automatic captions for retrieval",
    "youtube_captions": "Export uploader captions for subtitle review",
    "youtube_trainability": "Record Creative Commons license-label evidence",
    "youtube_channel": "Snapshot channel metadata and recent videos",
    "youtube_suggestions": "Expand research topics with localized autocomplete",
    "youtube_download": "Deliver authorized YouTube media to your cloud storage",
}


def generate():
    from flashdata_cli.cli import CONTRACTS

    manifest = []
    for capability in CAPABILITIES:
        source = capability["source"]
        suffix = (
            source.replace("_", "-") if source != "youtube_download" else "youtube-cloud-storage"
        )
        name = "flashdata-" + suffix
        module = name.replace("-", "_") + "_cli"
        package = ROOT / "packages" / name
        package.mkdir(parents=True, exist_ok=True)
        shutil.copytree(
            ROOT / "src/flashdata_cli",
            package / module,
            dirs_exist_ok=True,
            ignore=shutil.ignore_patterns("__pycache__"),
        )
        (package / module / "_capability.py").write_text(
            f"SOURCE = {source!r}\nCOMMAND = {name!r}\n"
        )
        shutil.copy2(ROOT / "LICENSE", package / "LICENSE")
        schema = CONTRACTS[source].model_json_schema()
        (package / "input.schema.json").write_text(json.dumps(schema, indent=2) + "\n")
        sample = dict(capability["sample"])
        primary = next(k for k in ("query", "video_id", "handle") if k in sample)
        value = sample.pop(primary)
        command = f"uvx {name}@0.1.0 --{primary.replace('_', '-')} {shlex.quote(value)}"
        if sample:
            command += " --options-json " + shlex.quote(json.dumps(sample))
        download = source == "youtube_download"
        if download:
            command = f"uvx {name}@0.1.0 --operation result --job-id job_YOUR_SAVED_ID"
        options = []
        for key, value in schema["properties"].items():
            if key == primary:
                continue
            info = value.get("description", "Source-specific option; see --schema.")
            if "default" in value:
                info += f" Default: `{json.dumps(value['default'])}`."
            options.append(f"| `{key}` | {info} |")
        option_table = (
            ("| Option | Meaning |\n| --- | --- |\n" + "\n".join(options))
            if options
            else "No additional source options."
        )
        limitations = capability["limits"].replace("SDK", "CLI")
        if source == "youtube_search":
            limitations += " This CLI defaults to 10 requested results (maximum 20)."
        if source == "youtube_download":
            limitations = limitations.replace(
                "Storage is server configuration.", "Storage comes from an environment variable."
            )
        download_guide = (
            f"""
## Submit once and keep the job ID

The default operation is `status`. Status and result accept only a saved job ID,
and never submit a paid query. A pending/running response does not mean delivery is complete.

For a new delivery, supply your own authorized video and storage configuration:

```sh
uvx {name}@0.1.0 --operation submit --allow-submit \\
  --video-id YOUR_VIDEO_ID \\
  --options-json '{{"download_type":"audio","output_format":"m4a"}}' \\
  --output delivery-receipt.json
```

Set `FLASHDATA_DOWNLOAD_STORAGE` through your secret manager, containing the documented
storage JSON. Never paste it into command arguments or source code. The supported providers
are s3, s3_compatible, gcs, azure, oss, bos, cos and tos. Use your own bucket/container,
optional object_prefix, and the provider-specific credentials. S3-compatible endpoints must
use HTTPS. [Storage fields and examples](https://flashdata.dev/docs/sources/youtube_download).

Keep the returned `id`. Read that same job with `--operation status --job-id ID` or
`--operation result --job-id ID`. Omit submission inputs when resuming. There is no automatic
polling or resubmission. Only the lifecycle receipt and delivery JSON are exported; media is
written by FlashData to your storage. Result JSON expires after 24 hours. Delivery manifests
can contain signed private URLs; protect the output file. Storage credentials from job params
are excluded from CLI output.
"""
            if download
            else ""
        )
        readme = f"""# {capability["name"]} CLI — FlashData

{PURPOSES[source]}. This command calls the `{source}` API and returns JSON for your
shell script, data pipeline or agent tool runner. It does not invoke a language model.

{limitations}

## Install and run

Requires Python 3.10 or newer. [uv installation](https://docs.astral.sh/uv/getting-started/installation/)
provides `uvx`, which runs this package in an isolated environment.

1. [Create a FlashData account](https://flashdata.dev/signup), obtain an API Key and fund Credits.
2. Set `FLASHDATA_API_KEY` using your shell or secret manager. The CLI does not accept a key flag
   or persist credentials. [Authentication and source documentation](https://flashdata.dev/docs/sources/{source}).
3. Run this example after reviewing the input and cost:

```sh
{command} --output result.json
```

`--output` creates a new file with owner-only permissions where supported and refuses existing
files before making a paid request. Without it, the full JSON response goes to stdout. Errors
go to stderr. Exit 0 means the response was exported, 2 means local input/configuration failure,
and 1 means request or output failure. For downloads, exit 0 can describe an unfinished job.

For repeated use, install `uv tool install {name}==0.1.0`; the command name is `{name}`.
Alternatively use `python -m pip install {name}==0.1.0` in your virtual environment.

## Inputs and output

Use `--{primary.replace("_", "-")}` for the primary input. Additional options use
`--options-json` as a JSON object, with strict field/type/range validation. Source is fixed by
this package. Google count and locale options remain omitted unless supplied.

{option_table}

Run `uvx {name}@0.1.0 --schema` to inspect all fields, nested filters, allowed values and
defaults without a Key or an API call. `--help` and `--version` are also local-only.

The JSON output preserves the API result envelope and optional fields: {capability["outputs"]}.
Missing fields remain missing; empty results remain empty. No article text, translated captions,
model conclusions, rights grants or keyword volumes are invented. Exact source contracts are
documented [here](https://flashdata.dev/docs/sources/{source}).
{download_guide}
## Fees and failure handling

This MIT-licensed CLI is free to install. FlashData API requests consume paid Credits;
[current pricing](https://flashdata.dev/pricing) applies. Extended YouTube Search has a separate
rate. Media delivery is billed by delivered volume, and your cloud-storage costs are separate.
There is no automatic pagination, retry, polling, scheduled execution or model call.

Each HTTP request has a 120-second network timeout (15-second connect timeout) and a 20-MiB response
limit. A timeout or failure may occur after a paid request has been accepted. Check Jobs in
the [FlashData console](https://flashdata.dev) before resubmitting. HTTP 401 means check the Key;
402 means insufficient Credits; 429 means rate/quota limit. A partial output file is retained
on failure. Do not retry a paid query just because output handling failed.

Input values and your API Key are sent to FlashData to perform the request. A completed
download-result read may fetch a signed JSON object from the result origin returned by
FlashData; the API Key is never sent to that object URL. Only process data appropriate for
your output destination. [Privacy policy](https://flashdata.dev/legal/privacy).

Source and MIT license are included in the source distribution.

[Source documentation](https://flashdata.dev/docs/sources/{source}) ·
[Pricing](https://flashdata.dev/pricing) · [Sign up](https://flashdata.dev/signup)
"""
        (package / "README.md").write_text(readme)
        summary = f"{PURPOSES[source]} with the FlashData JSON CLI"
        metadata = f'''[build-system]
requires = ["hatchling>=1.27,<2"]
build-backend = "hatchling.build"

[project]
name = "{name}"
version = "0.1.0"
description = {json.dumps(summary)}
readme = "README.md"
requires-python = ">=3.10"
license = "MIT"
license-files = ["LICENSE"]
authors = [{{name = "FlashData", email = "support@flashdata.dev"}}]
keywords = {json.dumps([source.replace("_", "-"), "cli", "json", "uvx", "flashdata"])}
classifiers = ["Intended Audience :: Developers", "Programming Language :: Python :: 3", "Environment :: Console"]
dependencies = ["httpx>=0.28.1,<1", "pydantic>=2.7.4,<3", "jsonschema>=4.23,<5"]

[project.scripts]
{name} = "{module}.cli:main"

[project.urls]
Homepage = "https://flashdata.dev/docs/sources/{source}"
Documentation = "https://flashdata.dev/docs/sources/{source}"
Pricing = "https://flashdata.dev/pricing"
Support = "https://flashdata.dev"
Source = "https://github.com/rocosen/flashdata-mcp/tree/main/packages/python-cli"

[tool.hatch.build.targets.wheel]
packages = ["{module}"]
'''
        (package / "pyproject.toml").write_text(metadata)
        manifest.append(
            {
                "source": source,
                "project": name,
                "command": name,
                "module": module,
                "version": "0.1.0",
                "pypi_url": None,
                "published": False,
            }
        )
    (ROOT / "packages.json").write_text(json.dumps(manifest, indent=2) + "\n")
    print(f"Generated {len(manifest)} independent distributions.")


if __name__ == "__main__":
    generate()
