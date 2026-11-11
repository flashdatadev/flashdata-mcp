# Publishing the independent package

The build, tests and source installation are separate from PyPI publication
and official LlamaIndex directory admission. Confirm the actual project/version
status on PyPI before registering a publisher or dispatching a release.

Use the existing `flashdata-dev` PyPI account and existing
`llama-index-tools-flashdata` project. Releases use the maintained brand
repository after its migration from `rocosen`. Inspect the project's current
Trusted Publisher binding before dispatching; adding or changing a binding
requires the project owner's approval:

| Field | Value |
| --- | --- |
| PyPI project | `llama-index-tools-flashdata` |
| GitHub owner | `flashdatadev` |
| Repository | `flashdata-mcp` |
| Workflow filename | `llamaindex-publish.yml` |
| GitHub environment | `pypi-llamaindex` |

Inspect the existing GitHub environment under the brand repository and preserve
its protections. Its deployment policy must restrict releases to tags matching
`llamaindex-v*`. The checked-in workflow does not configure either platform;
do not create another PyPI project or assume the migrated repository is already
authorized. The PyPI project name and existing release history remain unchanged.

The workflow runs only by explicit manual dispatch on a `llamaindex-vVERSION`
tag matching `pyproject.toml`. A normal push, pull request or tag creation does
not publish the package. It rebuilds, tests and checks the distributions before
the OIDC publish job. No long-lived PyPI token is required.

Prepare the release README and absolute task-guide links before building,
because the uploaded distribution contains the PyPI project description. After
publication, read back the exact version and artifact hashes and install it in a
fresh environment before marking the release complete. PyPI publication is one
shared package, not 15 official LlamaIndex/LlamaHub entries.

LlamaIndex no longer accepts new integration packages in its monorepo. Do not
submit this `pyproject.toml` there. Documentation contributions remain possible,
but independent listing admission must be established separately.
