"""Verify the built wheel in a clean environment without making service requests."""

import json
import os
import subprocess
import sys
import tempfile
import tomllib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def main():
    project = tomllib.loads((ROOT / "pyproject.toml").read_text())["project"]
    version = project["version"]
    wheel = ROOT / "dist" / f"{project['name'].replace('-', '_')}-{version}-py3-none-any.whl"
    assert wheel.is_file(), f"Build the current release first: {wheel}"
    with tempfile.TemporaryDirectory(prefix="flashdata-haystack-install-") as directory:
        env_path = Path(directory) / "venv"
        subprocess.run(["uv", "venv", "--python", sys.executable, str(env_path)], check=True)
        python = env_path / ("Scripts/python.exe" if os.name == "nt" else "bin/python")
        subprocess.run(["uv", "pip", "install", "--python", str(python), str(wheel)], check=True)
        script = """import json, sys
from pathlib import Path
from haystack import Pipeline
import flashdata_haystack as package
from importlib.metadata import version
from flashdata_haystack._inputs import YouTubeTranscriptInput, YouTubeCaptionsInput
assert version("flashdata-haystack") == package.__version__ == sys.argv[2]
for model in (YouTubeTranscriptInput, YouTubeCaptionsInput):
    assert model(video_id="dQw4w9WgXcQ", language=["en", "es"]).language == ["en", "es"]
    assert "language" not in model(video_id="dQw4w9WgXcQ").model_dump(exclude_none=True)
entries = json.loads(Path(sys.argv[1]).read_text())
total = 0
for entry in entries:
    for name in entry["components"]:
        cls = getattr(package, name)
        pipe = Pipeline()
        pipe.add_component("source", cls())
        Pipeline.loads(pipe.dumps(), allowed_modules=["flashdata_haystack"])
        package.as_tool(cls())
        total += 1
print(json.dumps({"capabilities": len(entries), "components": total, "version": package.__version__, "module": package.__file__}))
"""
        result = subprocess.run(
            [str(python), "-c", script, str(ROOT / "entries.json"), version],
            cwd=directory,
            env={
                **os.environ,
                "HAYSTACK_TELEMETRY_ENABLED": "false",
                "HAYSTACK_AUTO_TRACE_ENABLED": "false",
            },
            text=True,
            capture_output=True,
            check=True,
        )
        print(result.stdout.strip())
        data = json.loads(result.stdout)
        assert data["capabilities"] == 15 and data["components"] == 17
        assert str(env_path) in data["module"]


if __name__ == "__main__":
    main()
