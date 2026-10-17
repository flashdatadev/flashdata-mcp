"""Ground a product comparison with search snapshots. Running this example makes one paid FlashData request."""

from llama_index.tools.flashdata import FlashDataTools, to_documents


def main():
    tool = FlashDataTools(sources=["google_shopping"]).to_tool_list()[0]
    output = tool.call(query="USB microphone", num=5)
    print(output.raw_output)
    for document in to_documents("google_shopping", output.raw_output):
        print(document.metadata, document.text)


if __name__ == "__main__":
    main()
