"""Check the built wheel in a fresh environment, including the packaged schema."""

import os
import subprocess
import sys
import tempfile
import tomllib
from pathlib import Path

root = Path(__file__).resolve().parents[1]
project = tomllib.loads((root / "pyproject.toml").read_text())["project"]
version = project["version"]
wheel = root / "dist" / f"{project['name'].replace('-', '_')}-{version}-py3-none-any.whl"
assert wheel.is_file(), f"Build the current release first: {wheel}"
with tempfile.TemporaryDirectory(prefix="flashdata-llamaindex-install-") as directory:
    env = Path(directory) / "venv"
    subprocess.run(["uv", "venv", "--python", sys.executable, str(env)], check=True)
    python = env / ("Scripts/python.exe" if os.name == "nt" else "bin/python")
    subprocess.run(["uv", "pip", "install", "--python", str(python), str(wheel)], check=True)
    subprocess.run(
        [
            str(python),
            "-c",
            """
import json
import sys
from importlib.metadata import version
from llama_index.tools.flashdata import FlashDataTools, FlashDataReader
from llama_index.tools.flashdata._catalog import CONTRACTS
from llama_index.tools.flashdata._storage import storage_config
from llama_index.tools.flashdata._inputs import YouTubeTranscriptInput, YouTubeCaptionsInput
assert version("llama-index-tools-flashdata") == sys.argv[1]
for model in (YouTubeTranscriptInput, YouTubeCaptionsInput):
    assert model(video_id="dQw4w9WgXcQ", language=["en", "es"]).language == ["en", "es"]
    assert "language" not in model(video_id="dQw4w9WgXcQ").model_dump(exclude_none=True)
assert len(FlashDataTools(list(CONTRACTS)).to_tool_list()) == 17
assert FlashDataReader('youtube_transcript').source == 'youtube_transcript'
assert storage_config(json.dumps(dict(storage_type='s3', storage_url='test-bucket',
                                     access_key='test', secret_key='test')))
print('wheel installation and runtime schema: OK')
""",
            version,
        ],
        cwd=directory,
        check=True,
    )
