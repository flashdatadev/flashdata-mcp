"""CLI entry point shared at build time by fifteen independently named packages."""

import argparse
import json
import os
import sys
from pathlib import Path
from urllib.parse import urlsplit

from pydantic import ValidationError

from . import __version__
from ._client import UNKNOWN_OUTCOME, Client, FlashDataError
from ._inputs import (
    DownloadJobInput,
    GoogleInput,
    YouTubeCaptionsInput,
    YouTubeChannelInput,
    YouTubeDownloadInput,
    YouTubeExtendedSearchInput,
    YouTubeMetadataInput,
    YouTubeSearchInput,
    YouTubeSuggestionsInput,
    YouTubeTrainabilityInput,
    YouTubeTranscriptInput,
)
from ._storage import storage_config

CONTRACTS = {
    **{
        f"google_{kind}": GoogleInput
        for kind in ("search", "news", "images", "shopping", "videos", "places")
    },
    "youtube_search": YouTubeSearchInput,
    "youtube_search_extended": YouTubeExtendedSearchInput,
    "youtube_metadata": YouTubeMetadataInput,
    "youtube_transcript": YouTubeTranscriptInput,
    "youtube_captions": YouTubeCaptionsInput,
    "youtube_trainability": YouTubeTrainabilityInput,
    "youtube_channel": YouTubeChannelInput,
    "youtube_suggestions": YouTubeSuggestionsInput,
    "youtube_download": YouTubeDownloadInput,
}


class Parser(argparse.ArgumentParser):
    def error(self, message):
        raise FlashDataError("Invalid command arguments. Use --help for supported options.")


def parser_for(source, command):
    parser = Parser(
        prog=command,
        description=(
            f"Run the {source} FlashData API and export JSON. API calls use paid Credits. "
            "Read FLASHDATA_API_KEY from the environment; never pass credentials as arguments."
        ),
    )
    parser.add_argument("--version", action="version", version=f"{command} {__version__}")
    parser.add_argument(
        "--schema", action="store_true", help="Print the input schema; no API call."
    )
    parser.add_argument(
        "--output", type=Path, help="New JSON file (0600); existing files are refused."
    )
    primary = (
        "handle"
        if source == "youtube_channel"
        else "query"
        if (
            source.startswith("google_")
            or source in ("youtube_search", "youtube_search_extended", "youtube_suggestions")
        )
        else "video-id"
    )
    parser.add_argument("--" + primary, help="Primary query, channel handle, or YouTube ID/URL.")
    parser.add_argument(
        "--options-json", help="Source options as a JSON object, without credentials."
    )
    if source == "youtube_download":
        parser.add_argument("--operation", choices=["status", "result", "submit"], default="status")
        parser.add_argument("--job-id", help="Previously saved job ID for status/result.")
        parser.add_argument(
            "--allow-submit", action="store_true", help="Permit one paid storage write."
        )
    return parser


def payload_for(source, args, environ):
    operation = getattr(args, "operation", "query")
    if operation in ("status", "result"):
        if args.video_id or args.options_json or args.allow_submit:
            raise FlashDataError("Status/result accepts --job-id, without submission inputs.")
        return operation, DownloadJobInput(job_id=args.job_id).model_dump()
    try:
        options = json.loads(args.options_json) if args.options_json is not None else {}
    except ValueError:
        raise FlashDataError("--options-json must be a JSON object.") from None
    if not isinstance(options, dict) or any(
        field in options for field in ("source", "query", "video_id", "handle", "storage")
    ):
        raise FlashDataError(
            "Use dedicated primary inputs; source is fixed and secrets use env vars."
        )
    values = dict(options)
    for primary in ("query", "video_id", "handle"):
        value = getattr(args, primary, None)
        if value is not None:
            values[primary] = value
    data = CONTRACTS[source].model_validate(values).model_dump(exclude_none=True, by_alias=True)
    primary = next(key for key in ("query", "video_id", "handle") if key in data)
    payload = {"source": source, primary: data.pop(primary), "params": data}
    if operation == "submit":
        if args.job_id or not args.allow_submit:
            raise FlashDataError(
                "New delivery requires --allow-submit; saved jobs use status/result."
            )
        storage = storage_config(environ.get("FLASHDATA_DOWNLOAD_STORAGE", ""))
        endpoint = storage.get("endpoint_url")
        if endpoint:
            url = urlsplit(endpoint)
            if (
                url.scheme != "https"
                or not url.hostname
                or url.username
                or url.password
                or url.query
                or url.fragment
            ):
                raise FlashDataError("Storage endpoint must be an HTTPS URL without credentials.")
        payload["params"]["storage"] = storage
    return operation, payload


def run(
    source, command, argv=None, *, environ=None, stdout=None, stderr=None, client_factory=Client
):
    environ = os.environ if environ is None else environ
    stdout = sys.stdout if stdout is None else stdout
    stderr = sys.stderr if stderr is None else stderr
    output = None
    request_started = False
    output_complete = False
    try:
        args = parser_for(source, command).parse_args(argv)
        if args.schema:
            stdout.write(json.dumps(CONTRACTS[source].model_json_schema(), indent=2) + "\n")
            return 0
        operation, payload = payload_for(source, args, environ)
        key = environ.get("FLASHDATA_API_KEY", "").strip()
        if not key or any(ord(c) < 32 or ord(c) == 127 for c in key):
            raise FlashDataError("Set a valid FLASHDATA_API_KEY environment variable.")
        if args.output:
            # Reserve the new path before spending Credits, without replacing user files.
            fd = os.open(args.output, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
            output = os.fdopen(fd, "w", encoding="utf-8")
        client = client_factory(key)
        request_started = True
        result = (
            client.query(payload)
            if operation == "query"
            else client.submit(payload)
            if operation == "submit"
            else client.status(payload["job_id"])
            if operation == "status"
            else client.result(payload["job_id"])
        )
        destination = output if output else stdout
        destination.write(json.dumps(result, ensure_ascii=False, allow_nan=False, indent=2) + "\n")
        destination.flush()
        output_complete = True
        return 0
    except ValidationError:
        stderr.write("Invalid source input. See --schema for fields, types, ranges and defaults.\n")
        return 2
    except FlashDataError as error:
        stderr.write(str(error) + "\n")
        return 1 if request_started else 2
    except (OSError, ValueError, TypeError):
        stderr.write(
            (
                "Could not save the response. " + UNKNOWN_OUTCOME
                if request_started
                else "Could not prepare output or inputs. Check the new output path."
            )
            + "\n"
        )
        return 1 if request_started else 2
    finally:
        if output:
            output.close()
            if not output_complete:
                stderr.write(
                    "The newly reserved output file is incomplete; check Jobs before retrying.\n"
                )


def main():
    from ._capability import COMMAND, SOURCE

    raise SystemExit(run(SOURCE, COMMAND))
