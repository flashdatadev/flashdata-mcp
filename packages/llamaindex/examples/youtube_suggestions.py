"""Explore query phrasing before a video search. Running this example makes one paid FlashData request."""

from llama_index.tools.flashdata import FlashDataTools, to_documents


def main():
    tool = FlashDataTools(sources=["youtube_suggestions"]).to_tool_list()[0]
    output = tool.call(query="vector database", language="en", region="US")
    print(output.raw_output)
    for document in to_documents("youtube_suggestions", output.raw_output):
        print(document.metadata, document.text)


if __name__ == "__main__":
    main()
