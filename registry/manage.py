"""Validate and publish explicit Registry manifests without overwriting versions."""

import argparse
import json
import os
from pathlib import Path
import subprocess
from urllib.error import HTTPError
from urllib.parse import quote
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parent
SCHEMA_URL = 'https://static.modelcontextprotocol.io/schemas/2025-12-11/server.schema.json'
API = 'https://registry.modelcontextprotocol.io/v0.1'
PUBLISHER_META = 'io.modelcontextprotocol.registry/publisher-provided'
OFFICIAL_META = 'io.modelcontextprotocol.registry/official'


def manifests(scope):
    paths = sorted((ROOT / 'servers').glob('*/server.json')) if scope == 'tasks' else [ROOT / 'server.json']
    if scope == 'tasks' and len(paths) != 15:
        raise ValueError('Expected all 15 task manifests')
    return [(path, json.loads(path.read_text())) for path in paths]


def read_json(url):
    request = Request(url, headers={'User-Agent': 'FlashData-Registry-Publisher/1.0', 'Accept': 'application/json'})
    try:
        with urlopen(request, timeout=30) as response:
            return json.load(response)
    except HTTPError as error:
        if error.code == 404:
            return None
        raise


def version_url(manifest):
    return f"{API}/servers/{quote(manifest['name'], safe='')}/versions/{quote(manifest['version'], safe='')}"


def verify(manifest, published):
    if published is None:
        raise ValueError('Published version was not found')
    server = published['server']
    for field, expected in manifest.items():
        if field != '$schema' and server.get(field) != expected:
            raise ValueError(f"{manifest['name']}: published {field} differs; use a new version")
    for field in ('packages', 'remotes'):
        if field not in manifest and server.get(field):
            raise ValueError(f"{manifest['name']}: unexpected {field}")
    if published['_meta'][OFFICIAL_META]['status'] != 'active':
        raise ValueError(f"{manifest['name']}: published version is not active")


def publish_one(path, manifest, publisher):
    url = version_url(manifest)
    published = read_json(url)
    if published is not None:
        verify(manifest, published)
        action = 'already-published'
    else:
        # A failed or ambiguous write is never retried here. Rerunning first
        # checks this immutable version, so a partial batch can resume safely.
        subprocess.run([publisher, 'publish', str(path)], check=True)
        published = read_json(url)
        verify(manifest, published)
        action = 'published'
    return {'action': action, 'url': url, 'response': published}


def validate():
    from jsonschema import Draft7Validator, FormatChecker

    schema = read_json(SCHEMA_URL)
    validator = Draft7Validator(schema, format_checker=FormatChecker())
    task_manifests = manifests('tasks')
    catalog = json.loads((ROOT / 'catalog.json').read_text())
    expected_sources = {task['source'] for task in catalog}
    actual_sources = set()
    names, artifacts = set(), set()
    for path, manifest in manifests('hosted') + task_manifests:
        if manifest['$schema'] != SCHEMA_URL:
            raise ValueError(f'{path}: unexpected schema')
        validator.validate(manifest)
        metadata = manifest.get('_meta', {}).get(PUBLISHER_META, {})
        if len(json.dumps(metadata, ensure_ascii=False, separators=(',', ':')).encode()) > 4096:
            raise ValueError(f'{path}: publisher metadata exceeds 4096 bytes')
        if manifest['name'] in names:
            raise ValueError('Duplicate Registry name')
        names.add(manifest['name'])
        if path != ROOT / 'server.json':
            info = metadata['dev.flashdata']
            source = info['source']
            actual_sources.add(source)
            if source not in expected_sources or set(info['tools']) != {source, 'get_pricing', 'get_job', 'get_result'}:
                raise ValueError(f'{path}: incorrect source/tool boundary')
            if manifest.get('remotes') or len(manifest['packages']) != 1:
                raise ValueError(f'{path}: task registration must reference one local package')
            package = manifest['packages'][0]
            if package['registryType'] != 'mcpb' or package['transport'] != {'type': 'stdio'}:
                raise ValueError(f'{path}: incorrect package transport')
            if len(package['fileSha256']) != 64 or package['identifier'] in artifacts:
                raise ValueError(f'{path}: missing digest or duplicate task bundle')
            artifacts.add(package['identifier'])
            env = package['environmentVariables']
            if len(env) != 1 or env[0]['name'] != 'FLASHDATA_API_KEY' or not env[0]['isSecret'] or not env[0]['isRequired'] or 'value' in env[0] or 'default' in env[0]:
                raise ValueError(f'{path}: expected a required secret key without a stored value')
        print(f"Validated {manifest['name']} {manifest['version']}")
    if actual_sources != expected_sources or len(artifacts) != 15:
        raise ValueError('Task manifests must cover every source once')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('action', choices=['validate', 'publish'])
    parser.add_argument('--scope', choices=['tasks', 'hosted'], default='tasks')
    parser.add_argument('--publisher')
    parser.add_argument('--output', type=Path)
    args = parser.parse_args()
    if args.action == 'validate':
        validate()
        return
    if not args.publisher or not args.output:
        parser.error('publish requires --publisher and --output')
    args.output.mkdir(parents=True, exist_ok=True)
    for path, manifest in manifests(args.scope):
        result = publish_one(path, manifest, args.publisher)
        filename = manifest['name'].split('/')[1] + '.json'
        (args.output / filename).write_text(json.dumps(result, indent=2) + '\n')
        print(f"{result['action']}: {manifest['name']} {manifest['version']}")
        if os.environ.get('GITHUB_STEP_SUMMARY'):
            with open(os.environ['GITHUB_STEP_SUMMARY'], 'a') as summary:
                summary.write(f"- {result['action']}: [{manifest['name']} {manifest['version']}]({result['url']})\n")


if __name__ == '__main__':
    main()
