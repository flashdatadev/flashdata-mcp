"""Collect local options for a planning assistant. Running this example makes one paid FlashData request."""

from llama_index.tools.flashdata import FlashDataTools, to_documents


def main():
    tool = FlashDataTools(sources=["google_places"]).to_tool_list()[0]
    output = tool.call(query="coworking Singapore", num=5)
    print(output.raw_output)
    for document in to_documents("google_places", output.raw_output):
        print(document.metadata, document.text)


if __name__ == "__main__":
    main()
