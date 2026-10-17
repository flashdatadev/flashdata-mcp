"""Record license-label metadata during dataset review. Running this example makes one paid FlashData request."""

from llama_index.tools.flashdata import FlashDataTools, to_documents


def main():
    tool = FlashDataTools(sources=["youtube_trainability"]).to_tool_list()[0]
    output = tool.call(video_id="dQw4w9WgXcQ")
    print(output.raw_output)
    for document in to_documents("youtube_trainability", output.raw_output):
        print(document.metadata, document.text)


if __name__ == "__main__":
    main()
