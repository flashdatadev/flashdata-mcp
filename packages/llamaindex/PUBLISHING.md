# Publishing the independent package

The package is not yet on PyPI. The build, tests and source installation are
separate from publication and official LlamaIndex directory admission.

Use the existing `flashdata-dev` PyPI account. After its owner completes the
required login/2FA, create this pending Trusted Publisher:

| Field | Value |
| --- | --- |
| PyPI project | `llama-index-tools-flashdata` |
| GitHub owner | `rocosen` |
| Repository | `flashdata-mcp` |
| Workflow filename | `llamaindex-publish.yml` |
| GitHub environment | `pypi-llamaindex` |

Confirm the project is still available before registering. Configure the GitHub
environment under this repository and confirm its intended protection settings.
These account steps are pending; the checked-in workflow does not perform them.

The workflow runs only by explicit manual dispatch on a `llamaindex-vVERSION`
tag matching `pyproject.toml`. A normal push, pull request or tag creation does
not publish the package. It rebuilds, tests and checks the distributions before
the OIDC publish job. No long-lived PyPI token is required.

After publication, read back the exact PyPI version and artifact hashes, install
it in a fresh environment, and only then replace the pending-install wording in
the README and task guides. PyPI publication is one shared package, not 15
official LlamaIndex/LlamaHub entries.

LlamaIndex no longer accepts new integration packages in its monorepo. Do not
submit this `pyproject.toml` there. Documentation contributions remain possible,
but independent listing admission must be established separately.
