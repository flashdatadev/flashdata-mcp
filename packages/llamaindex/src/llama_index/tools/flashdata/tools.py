"""Native FunctionTools with source-specific schemas and structured raw_output."""

from functools import partial

from llama_index.core.tools import FunctionTool

from ._catalog import CONTRACTS
from ._execution import Execution
from ._inputs import DownloadJobInput


class FlashDataTools:
    """Select capabilities when constructing the agent, outside model arguments.

    Every query may use paid FlashData Credits. Download submission also requires
    allow_download=True and application-owned destination credentials.
    """

    def __init__(self, sources, *, api_key=None, storage=None, allow_download=False):
        if isinstance(sources, str):
            raise TypeError("sources must be a sequence, for example ['google_search'].")
        self.sources = tuple(sources)
        if not self.sources or len(set(self.sources)) != len(self.sources):
            raise ValueError("Select one or more distinct sources.")
        if any(source not in CONTRACTS for source in self.sources):
            raise ValueError("Unknown FlashData source.")
        self._execution = Execution(api_key, storage=storage, allow_download=allow_download)

    def _invoke(self, source, operation, **kwargs):
        if operation == "submit":
            return self._execution.submit(kwargs)
        if operation in ("status", "result"):
            return self._execution.read_job(kwargs, result=operation == "result")
        return self._execution.query(source, kwargs)

    def to_tool_list(self) -> list[FunctionTool]:
        """Build native tools. LlamaIndex supplies thread-based acall support."""
        tools = []
        for source in self.sources:
            model, description = CONTRACTS[source]
            operations = (
                ("submit", "status", "result") if source == "youtube_download" else ("query",)
            )
            for operation in operations:
                name = f"flashdata_{source}"
                schema = model
                detail = description + " FlashData API calls require paid Credits."
                if operation != "query":
                    name += f"_{operation}"
                if operation in ("status", "result"):
                    schema = DownloadJobInput
                    detail = (
                        f"Read the {operation} of the same YouTube download job ID. "
                        "Never submit again to poll. Pending jobs return lifecycle status. "
                        "Completed result JSON expires after 24 hours."
                    )
                tools.append(
                    FunctionTool.from_defaults(
                        fn=partial(self._invoke, source, operation),
                        name=name,
                        description=detail,
                        fn_schema=schema,
                    )
                )
        return tools
