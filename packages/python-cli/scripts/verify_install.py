"""Verify local wheels through uvx and together in one clean environment; no API key."""

import hashlib
import json
import os
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def main():
    env = {k: v for k, v in os.environ.items() if not k.startswith("FLASHDATA_")}
    env.pop("PYTHONPATH", None)
    packages = json.loads((ROOT / "packages.json").read_text())
    wheels = [
        ROOT / "dist" / (p["project"].replace("-", "_") + f"-{p['version']}-py3-none-any.whl")
        for p in packages
    ]
    results = []
    with tempfile.TemporaryDirectory(prefix="flashdata-cli-install-") as tmp:
        venv = Path(tmp) / "venv"
        subprocess.run(["uv", "venv", "--python", sys.executable, str(venv)], env=env, check=True)
        bindir = venv / ("Scripts" if os.name == "nt" else "bin")
        python = bindir / ("python.exe" if os.name == "nt" else "python")
        subprocess.run(
            ["uv", "pip", "install", "--python", str(python), *map(str, wheels)],
            env=env,
            check=True,
        )
        for p, wheel in zip(packages, wheels):
            isolated = subprocess.run(
                [
                    "uv",
                    "tool",
                    "run",
                    "--isolated",
                    "--python",
                    sys.executable,
                    "--from",
                    str(wheel),
                    p["command"],
                    "--schema",
                ],
                env=env,
                check=True,
                capture_output=True,
                text=True,
            )
            schema = json.loads(isolated.stdout)
            command = bindir / (p["command"] + (".exe" if os.name == "nt" else ""))
            shared = subprocess.run(
                [str(command), "--schema"], env=env, check=True, capture_output=True, text=True
            )
            assert json.loads(shared.stdout) == schema
            assert "properties" in schema and "api_key" not in schema["properties"]
            version = subprocess.run(
                [str(command), "--version"], env=env, check=True, capture_output=True, text=True
            )
            assert version.stdout.strip() == p["command"] + " " + p["version"]
            results.append(
                {
                    "source": p["source"],
                    "project": p["project"],
                    "python": sys.version.split()[0],
                    "wheel_sha256": hashlib.sha256(wheel.read_bytes()).hexdigest(),
                    "uvx_schema_passed": True,
                    "shared_environment_passed": True,
                }
            )
    (ROOT / "evidence").mkdir(exist_ok=True)
    (ROOT / "evidence/uvx-installation.json").write_text(json.dumps(results, indent=2) + "\n")
    print("15 isolated uvx commands and 15 commands in one shared environment passed.")


if __name__ == "__main__":
    main()
