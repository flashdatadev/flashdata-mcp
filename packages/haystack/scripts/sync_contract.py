"""Vendor the reviewed CLI contracts, recording their exact source hashes."""

import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT.parent / "python-cli" / "src" / "flashdata_cli"
TARGET = ROOT / "src" / "flashdata_haystack"


def main():
    files = {}
    for name in ("_client.py", "_inputs.py", "_storage.py", "storage.schema.json"):
        raw = (SOURCE / name).read_bytes()
        output = raw.replace(b"flashdata-cli/0.1.0", b"flashdata-haystack/0.1.0")
        (TARGET / name).write_bytes(output)
        files[name] = {
            "source_sha256": hashlib.sha256(raw).hexdigest(),
            "packaged_sha256": hashlib.sha256(output).hexdigest(),
        }
    (ROOT / "contract-provenance.json").write_text(
        json.dumps(
            {
                "source": "../python-cli/src/flashdata_cli",
                "changes": "User-Agent only",
                "files": files,
            },
            indent=2,
        )
        + "\n"
    )


if __name__ == "__main__":
    main()
