"""Wrap components with their exact validation schema and a bounded JSON result."""

from haystack.tools import ComponentTool


def as_tool(component) -> ComponentTool:
    """Wrap a fresh component instance; Haystack forbids reusing a pipeline-owned instance."""
    return ComponentTool(
        component=component,
        parameters=component.input_model.model_json_schema(),
        outputs_to_string={"source": "result"},
    )
