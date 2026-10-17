"""Generate independently installable formulae from the checked Python CLI artifacts."""

import hashlib
import json
import re
import tomllib
from pathlib import Path

from packaging.markers import default_environment
from packaging.requirements import Requirement

ROOT = Path(__file__).resolve().parents[1]
CLI = ROOT / "packages/python-cli"
TAP = "rocosen/flashdata-mcp"
REPOSITORY = "https://github.com/rocosen/flashdata-mcp"
DESCRIPTIONS = {
    "google_search": "Export Google web search results as JSON",
    "google_news": "Export Google News search results as JSON",
    "google_images": "Find Google image results with source URLs and dimensions",
    "google_shopping": "Export Google Shopping merchant offers as JSON",
    "google_videos": "Find video references across websites with Google search",
    "google_places": "Export Google Places local business search results",
    "youtube_search": "Find YouTube videos by keyword and filters",
    "youtube_search_extended": "Request larger YouTube video search result sets",
    "youtube_metadata": "Inspect YouTube video metadata and available chapters",
    "youtube_transcript": "Export existing YouTube transcripts with timestamps",
    "youtube_captions": "Retrieve existing YouTube uploader captions",
    "youtube_trainability": "Inspect YouTube Creative Commons license labels",
    "youtube_channel": "Export YouTube channel details and recent video snapshots",
    "youtube_suggestions": "Retrieve YouTube autocomplete suggestions",
    "youtube_download": "Deliver YouTube video or audio to customer cloud storage",
}


def dependency_resources():
    lock = tomllib.loads((CLI / "uv.lock").read_text())
    environment = dict(
        default_environment(), python_version="3.14", python_full_version="3.14.5"
    )
    packages = lock["package"]
    todo = ["httpx", "pydantic", "jsonschema"]
    selected = {}
    while todo:
        name = todo.pop()
        if name in selected:
            continue
        candidates = [p for p in packages if p["name"] == name]
        candidates = [
            p
            for p in candidates
            if not p.get("resolution-markers")
            or any(
                Requirement(f"{name}; {marker}").marker.evaluate(environment)
                for marker in p["resolution-markers"]
            )
        ]
        assert len(candidates) == 1, (name, candidates)
        package = candidates[0]
        selected[name] = package
        for dependency in package.get("dependencies", []):
            marker = dependency.get("marker")
            if not marker or Requirement(
                f"{dependency['name']}; {marker}"
            ).marker.evaluate(environment):
                todo.append(dependency["name"])
    resources = []
    for name, package in sorted(selected.items()):
        sdist = package["sdist"]
        resources.append(
            {
                "name": name,
                "version": package["version"],
                "url": sdist["url"],
                "sha256": sdist["hash"].removeprefix("sha256:"),
            }
        )
    return resources


def main():
    packages = json.loads((CLI / "packages.json").read_text())
    builds = {
        p["project"]: p for p in json.loads((CLI / "evidence/builds.json").read_text())
    }
    resources = dependency_resources()
    assert len(packages) == 15 and len(resources) == 16
    formula_dir = ROOT / "Formula"
    guide_dir = ROOT / "homebrew/guides"
    formula_dir.mkdir(exist_ok=True)
    guide_dir.mkdir(parents=True, exist_ok=True)
    entries = []
    for package in packages:
        name, source, version = (
            package["project"],
            package["source"],
            package["version"],
        )
        (artifact,) = [
            a for a in builds[name]["artifacts"] if a["filename"].endswith(".tar.gz")
        ]
        assert (
            hashlib.sha256(
                (CLI / "dist" / artifact["filename"]).read_bytes()
            ).hexdigest()
            == artifact["sha256"]
        )
        classname = "".join(part.title() for part in name.split("-"))
        primary = (
            "handle"
            if source == "youtube_channel"
            else "query"
            if source.startswith("google_")
            or source
            in ("youtube_search", "youtube_search_extended", "youtube_suggestions")
            else "video_id"
        )
        resource_blocks = "\n\n".join(
            f'  resource "{r["name"]}" do\n    url "{r["url"]}"\n    sha256 "{r["sha256"]}"\n  end'
            for r in resources
        )
        formula = f'''class {classname} < Formula
  include Language::Python::Virtualenv

  desc "{DESCRIPTIONS[source]}"
  homepage "https://flashdata.dev/docs/sources/{source}"
  url "{REPOSITORY}/releases/download/python-cli-v{version}/{artifact["filename"]}"
  sha256 "{artifact["sha256"]}"
  license "MIT"

  livecheck do
    url "{REPOSITORY}.git"
    regex(/^python-cli-v(\\d+(?:\\.\\d+)+)$/i)
    strategy :git
  end

  depends_on "rust" => :build
  depends_on "python@3.14"

{resource_blocks}

  def install
    # Older Rust/LLVM can misalign Mach-O string tables when stripping symbols.
    # See https://github.com/rust-lang/rust/issues/157750.
    if OS.mac?
      ENV["CARGO_PROFILE_RELEASE_STRIP"] = "none"
      ENV["CARGO_PROFILE_RELEASE_BUILD_OVERRIDE_STRIP"] = "none"
    end
    virtualenv_install_with_resources(using: "python@3.14")
  end

  def caveats
    <<~EOS
      Set FLASHDATA_API_KEY through your shell or secret manager before querying.
      Installation is free; API requests consume paid FlashData Credits.
      Help, version and schema commands do not call the API.
      Source documentation: https://flashdata.dev/docs/sources/{source}
    EOS
  end

  test do
    ENV.delete("FLASHDATA_API_KEY")
    ENV.delete("FLASHDATA_DOWNLOAD_STORAGE")
    assert_match "{name} #{{version}}", shell_output("#{{bin}}/{name} --version")
    schema = JSON.parse(shell_output("#{{bin}}/{name} --schema"))
    assert_includes schema.fetch("required"), "{primary}"
    refute schema.fetch("properties").key?("source")
    assert_match "Invalid source input", shell_output("#{{bin}}/{name} 2>&1", 2)
  end
end
'''
        (formula_dir / f"{name}.rb").write_text(formula)
        guide = (CLI / "packages" / name / "README.md").read_text()
        start = guide.index("Requires Python 3.10")
        end = guide.index("1. [Create a FlashData account]")
        guide = (
            guide[:start]
            + f"""Install [Homebrew](https://brew.sh), then add this repository as a third-party tap.
Homebrew builds an isolated Python 3.14 environment and the declared dependencies,
including two Rust extensions. First installation can take several minutes.

```sh
brew tap {TAP} {REPOSITORY}.git
brew install {TAP}/{name}
```

On Homebrew versions that require explicit trust, review
[this formula](../../Formula/{name}.rb), then authorize only this formula:
`brew trust --formula {TAP}/{name}` and repeat the install command.
This is a FlashData-maintained tap, separate from Homebrew's official core directory.

{name} is the installed command. Inspect inputs without an API call:

```sh
{name} --schema
```

"""
            + guide[end:]
        )
        guide = guide.replace(f"uvx {name}@{version}", name)
        if not source.startswith("google_"):
            guide = guide.replace(
                " Google count and locale options remain omitted unless supplied.", ""
            )
        rates = ""
        if source == "youtube_search_extended":
            rates = " Extended YouTube Search has a separate higher rate than standard search."
        elif source == "youtube_download":
            rates = " Media delivery is billed by delivered volume; cloud-storage costs are separate."
        guide = guide.replace(
            " Extended YouTube Search has a separate\n"
            "rate. Media delivery is billed by delivered volume, and your cloud-storage costs are separate.",
            rates,
        )
        if source != "youtube_download":
            guide = guide.replace(
                " For downloads, exit 0 can describe an unfinished job.", ""
            ).replace(
                " A completed\ndownload-result read may fetch a signed JSON object from the result origin returned by\n"
                "FlashData; the API Key is never sent to that object URL.",
                "",
            )
        guide = re.sub(
            r"For repeated use, install `uv tool install .*?virtual environment\.\n",
            "",
            guide,
            flags=re.DOTALL,
        )
        guide = guide.replace(
            "Source and MIT license are included in the source distribution.",
            f"""Update the tap with `brew update`, then `brew upgrade {TAP}/{name}` when a new
version is available. Remove only this command with `brew uninstall {TAP}/{name}`.
Other capability formulae have their own environments and can remain installed.
Homebrew installation and removal do not create, revoke or store your API Key.

Source and MIT license are included in the source distribution.
[Formula source](../../Formula/{name}.rb) · [All 15 Homebrew commands](../README.md)""",
        )
        assert "uvx " not in guide and "pip install" not in guide
        (guide_dir / f"{name}.md").write_text(guide)
        entries.append(
            {
                "source": source,
                "formula_id": f"{TAP}/{name}",
                "version": version,
                "formula_url": f"{REPOSITORY}/blob/main/Formula/{name}.rb",
                "guide_url": f"{REPOSITORY}/blob/main/homebrew/guides/{name}.md",
                "homepage": f"https://flashdata.dev/docs/sources/{source}",
                "core_directory_url": None,
            }
        )
    (ROOT / "homebrew/resources.json").write_text(
        json.dumps(resources, indent=2) + "\n"
    )
    (ROOT / "homebrew/formulae.json").write_text(json.dumps(entries, indent=2) + "\n")
    print("Generated 15 formulae and guides with 16 pinned runtime resources each.")


if __name__ == "__main__":
    main()
