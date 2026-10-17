"""Check the built wheel in a fresh environment, including the packaged schema."""

import subprocess
import sys
import tempfile
from pathlib import Path

wheel = next(Path("dist").glob("*.whl")).resolve()
with tempfile.TemporaryDirectory(prefix="flashdata-llamaindex-install-") as directory:
    env = Path(directory) / "venv"
    subprocess.run(["uv", "venv", "--python", sys.executable, str(env)], check=True)
    python = env / "bin/python"
    subprocess.run(["uv", "pip", "install", "--python", str(python), str(wheel)], check=True)
    subprocess.run(
        [
            str(python),
            "-c",
            """
import json
from llama_index.tools.flashdata import FlashDataTools, FlashDataReader
from llama_index.tools.flashdata._catalog import CONTRACTS
from llama_index.tools.flashdata._storage import storage_config
assert len(FlashDataTools(list(CONTRACTS)).to_tool_list()) == 17
assert FlashDataReader('youtube_transcript').source == 'youtube_transcript'
assert storage_config(json.dumps(dict(storage_type='s3', storage_url='test-bucket',
                                     access_key='test', secret_key='test')))
print('wheel installation and runtime schema: OK')
""",
        ],
        cwd=directory,
        check=True,
    )
