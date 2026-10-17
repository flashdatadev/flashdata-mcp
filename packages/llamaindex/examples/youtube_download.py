"""Explicit single submit, or read an existing job. Never submit to poll."""

import argparse

from llama_index.tools.flashdata import FlashDataTools


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument("--submit", action="store_true", help="Authorize one paid storage write")
    mode.add_argument("--job-id", help="Read an existing receipt without a new submission")
    parser.add_argument("--video-id", help="Required with --submit")
    parser.add_argument("--result", action="store_true", help="Read result instead of status")
    args = parser.parse_args()
    if args.submit and (not args.video_id or args.result):
        parser.error("--submit requires --video-id and cannot be combined with --result")
    submit, status, result = FlashDataTools(
        sources=["youtube_download"], allow_download=args.submit
    ).to_tool_list()
    if args.submit:
        output = submit.call(video_id=args.video_id, download_type="audio", output_format="m4a")
    else:
        output = (result if args.result else status).call(job_id=args.job_id)
    print(output.raw_output)


if __name__ == "__main__":
    main()
