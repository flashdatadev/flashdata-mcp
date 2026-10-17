"""Create a larger video research candidate set. Running this example makes one paid FlashData request."""

from llama_index.tools.flashdata import FlashDataTools, to_documents


def main():
    tool = FlashDataTools(sources=["youtube_search_extended"]).to_tool_list()[0]
    output = tool.call(query="retrieval evaluation tutorials", max_results=50)
    print(output.raw_output)
    for document in to_documents("youtube_search_extended", output.raw_output):
        print(document.metadata, document.text)


if __name__ == "__main__":
    main()
