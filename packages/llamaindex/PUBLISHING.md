# Publishing the independent package

The build, tests and source installation are separate from PyPI publication
and official LlamaIndex directory admission. Confirm the actual project/version
status on PyPI before registering a publisher or dispatching a release.

Use the existing `flashdata-dev` PyPI account. The initial release requires
owner approval of this project-specific Trusted Publisher; check for an existing
binding before adding it:

| Field | Value |
| --- | --- |
| PyPI project | `llama-index-tools-flashdata` |
| GitHub owner | `rocosen` |
| Repository | `flashdata-mcp` |
| Workflow filename | `llamaindex-publish.yml` |
| GitHub environment | `pypi-llamaindex` |

Confirm the project is still available before registering. Configure the GitHub
environment under this repository with deployment restricted to tags matching
`llamaindex-v*`. The checked-in workflow does not configure either platform.

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
