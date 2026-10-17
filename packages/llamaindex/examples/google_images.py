"""Prepare an image reference shortlist. Running this example makes one paid FlashData request."""

from llama_index.tools.flashdata import FlashDataTools, to_documents


def main():
    tool = FlashDataTools(sources=["google_images"]).to_tool_list()[0]
    output = tool.call(query="rooftop solar installation", num=5)
    print(output.raw_output)
    for document in to_documents("google_images", output.raw_output):
        print(document.metadata, document.text)


if __name__ == "__main__":
    main()
