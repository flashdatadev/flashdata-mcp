# Publishing the independent package

Use the existing `flashdata-dev` PyPI account and `flashdata-haystack` project.
Inspect its current Trusted Publishers before changing configuration; adding a
publisher requires the project owner's approval. Preserve existing bindings.

| Field | Value |
| --- | --- |
| PyPI project | `flashdata-haystack` |
| GitHub owner | `flashdatadev` |
| Repository | `flashdata-mcp` |
| Workflow filename | `haystack-publish.yml` |
| GitHub environment | `pypi-haystack` |

The GitHub environment must allow only tags matching `haystack-v*`. Configure
the environment and project publisher before dispatching; committing the
workflow does not grant publishing access. No long-lived PyPI token is needed.

The workflow runs only by manual dispatch on a `haystack-vVERSION` tag matching
`pyproject.toml`. Ordinary pushes, pull requests and tag creation do not publish.
It runs the existing network-disabled tests, builds wheel and sdist, checks the
distributions and verifies installation before publishing with GitHub OIDC.
Haystack telemetry and tracing are disabled during validation.

Prepare the README and versioned guide links before building. After publication,
compare both public files against the workflow artifact and verify a fresh PyPI
installation, all 17 component/tool schemas and pipeline serialization without
service requests. Record the actual version and hashes before marking complete.

PyPI distribution is one shared package for 15 capabilities. It is separate from
the existing Haystack directory review; do not resubmit directory entries as
part of a package release.
