"""Generate and validate all fifteen wheel/sdist pairs without calling FlashData."""

import hashlib
import json
import os
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def main():
    env = dict(os.environ, PYTHONPATH=str(ROOT / "src"), SOURCE_DATE_EPOCH="1767225600")
    subprocess.run([sys.executable, str(ROOT / "scripts/generate.py")], env=env, check=True)
    packages = json.loads((ROOT / "packages.json").read_text())
    assert len(packages) == len({p["project"] for p in packages}) == 15
    dist = ROOT / "dist"
    dist.mkdir(exist_ok=True)
    evidence = []
    expected = set()
    for package in packages:
        subprocess.run(
            [
                sys.executable,
                "-m",
                "build",
                "--no-isolation",
                "--outdir",
                str(dist),
                str(ROOT / "packages" / package["project"]),
            ],
            env=env,
            check=True,
        )
        prefix = package["project"].replace("-", "_") + "-" + package["version"]
        names = [prefix + ".tar.gz", prefix + "-py3-none-any.whl"]
        expected.update(names)
        evidence.append(
            {
                "project": package["project"],
                "artifacts": [
                    {
                        "filename": name,
                        "sha256": hashlib.sha256((dist / name).read_bytes()).hexdigest(),
                    }
                    for name in names
                ],
            }
        )
    assert {p.name for p in dist.iterdir()} == expected, "Unexpected or stale distributions"
    subprocess.run(
        [sys.executable, "-m", "twine", "check", *map(str, sorted(dist.iterdir()))], check=True
    )
    (ROOT / "evidence").mkdir(exist_ok=True)
    (ROOT / "evidence/builds.json").write_text(json.dumps(evidence, indent=2) + "\n")
    print("Built and checked 15 independent projects / 30 distributions.")


if __name__ == "__main__":
    main()
