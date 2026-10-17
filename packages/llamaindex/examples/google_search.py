"""Collect web evidence for a research agent. Running this example makes one paid FlashData request."""

from llama_index.tools.flashdata import FlashDataTools, to_documents


def main():
    tool = FlashDataTools(sources=["google_search"]).to_tool_list()[0]
    output = tool.call(query="retrieval augmented generation evaluation", num=5)
    print(output.raw_output)
    for document in to_documents("google_search", output.raw_output):
        print(document.metadata, document.text)


if __name__ == "__main__":
    main()
