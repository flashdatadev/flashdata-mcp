"""Discover videos before building a caption collection. Running this example makes one paid FlashData request."""

from llama_index.tools.flashdata import FlashDataTools, to_documents


def main():
    tool = FlashDataTools(sources=["youtube_search"]).to_tool_list()[0]
    output = tool.call(query="RAG evaluation tutorials", max_results=5)
    print(output.raw_output)
    for document in to_documents("youtube_search", output.raw_output):
        print(document.metadata, document.text)


if __name__ == "__main__":
    main()
