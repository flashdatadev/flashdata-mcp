"""Call one hosted FlashData MCP tool without retrying paid submissions."""

import argparse
import asyncio
import json
import os
import sys
from datetime import timedelta
from pathlib import Path

import httpx
from mcp import ClientSession
from mcp.client.streamable_http import streamable_http_client

ENDPOINT = "https://data.flashdata.dev/mcp"


async def call_tool(request, api_key, *, transport=None):
    async with httpx.AsyncClient(
        headers={"X-API-Key": api_key}, timeout=120,
        follow_redirects=False, trust_env=False, transport=transport,
    ) as http:
        async with streamable_http_client(ENDPOINT, http_client=http) as (read, write, _):
            async with ClientSession(read, write) as session:
                await session.initialize()
                result = await session.call_tool(
                    request["name"], arguments=request["arguments"],
                    read_timeout_seconds=timedelta(seconds=120),
                )
                if result.isError:
                    raise RuntimeError("MCP tool reported an error.")
                if result.structuredContent is not None:
                    return result.structuredContent
                return json.loads(next(item.text for item in result.content if item.type == "text"))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("request_file", type=Path, help="JSON object with name and arguments")
    args = parser.parse_args()
    api_key = os.environ.get("FLASHDATA_API_KEY")
    if not api_key:
        print("Set FLASHDATA_API_KEY through your environment or secret manager.", file=sys.stderr)
        return 2
    try:
        request = json.loads(args.request_file.read_text(encoding="utf-8"))
        if (not isinstance(request, dict) or not isinstance(request.get("name"), str)
                or not request["name"] or not isinstance(request.get("arguments"), dict)):
            raise ValueError("Invalid tool request")
    except (OSError, ValueError):
        print("The input must be a JSON object with name and arguments fields.", file=sys.stderr)
        return 2
    try:
        body = asyncio.run(call_tool(request, api_key))
        print(json.dumps(body, ensure_ascii=False, indent=2))
    except Exception:
        print("MCP call failed. Check Jobs before retrying a paid submission; "
              "it may already have been accepted. No automatic retry was made.", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
