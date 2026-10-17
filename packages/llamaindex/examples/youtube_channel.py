"""Snapshot a channel for research triage. Running this example makes one paid FlashData request."""

from llama_index.tools.flashdata import FlashDataTools, to_documents


def main():
    tool = FlashDataTools(sources=["youtube_channel"]).to_tool_list()[0]
    output = tool.call(handle="@GoogleDevelopers", video_limit=5)
    print(output.raw_output)
    for document in to_documents("youtube_channel", output.raw_output):
        print(document.metadata, document.text)


if __name__ == "__main__":
    main()
