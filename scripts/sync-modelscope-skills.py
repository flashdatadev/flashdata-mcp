"""Build ModelScope skill folders from the maintained task skills and catalog."""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CHECK = '--check' in sys.argv
catalog = json.loads((ROOT / 'integrations/modelscope/catalog.json').read_text(encoding='utf-8'))
files = {}
for skill in catalog['skills']:
    original = (ROOT / skill['source_directory'] / 'SKILL.md').read_text(encoding='utf-8')
    _, frontmatter, body = original.split('---', 2)
    frontmatter = re.sub(r'^description: .*$', 'description: ' + json.dumps(skill['description'], ensure_ascii=False), frontmatter, flags=re.M)
    body = body.replace('utm_source=skills-sh', 'utm_source=modelscope')
    for path in ('docs', 'pricing', 'mcp'):
        body = body.replace(f'https://flashdata.dev/{path}', f'https://flashdata.dev/zh/{path}')
    intro = f"""# {skill['display_name']}

{skill['description']}

[功能文档与官网]({skill['homepage']}) · [获取 API Key](https://flashdata.dev/app/api-keys) · [当前价格](https://flashdata.dev/zh/pricing)

## 在支持 Skills 的 Agent 中使用

从魔搭下载此 Skill，保留文件夹结构，放入所用 Agent 支持的 Skills 目录，再按客户端文档启用。此 Skill 使用 Python 调用托管的 FlashData MCP；运行环境需要 Python 3.10+、下方列出的 Python 依赖和联网能力，并通过该环境的密钥配置提供 `FLASHDATA_API_KEY`。沙箱需要在沙箱内配置这些依赖，不能假设宿主机配置自动可用。

示例任务：

> {skill['example']}

安装 Skill 和 Python 依赖免费；下面的数据查询消耗 FlashData Credits，客户端/模型和适用的存储费用另计。读取 Skill 不代表授权执行付费示例；根据用户任务和已授权预算选择参数。API Key 不应写进 Skill、公开表单或对话。

先创建或启用 Python 虚拟环境，按下方快速开始安装依赖；保留 `scripts/` 目录，在技能目录内运行 `python3 scripts/example.py`。请求只发送至 `https://data.flashdata.dev/mcp`，无需在本地运行 Node.js 客户端。

要免费读取当前价格，让已连接的 MCP 客户端调用 `get_pricing`，参数为 `{{"source":"{skill['source']}"}}`。这是单独的读取操作，不执行付费示例、不需要存储凭据，价格响应也没有 job ID。价格检查不等于实际数据查询成功。Python 示例直接输出 MCP 结构化数据；普通同步查询处理 `results`，不要求存在 job ID。异步请求显式使用 `mode: "async"`，保存返回的 `id`，再通过 `get_job` 的 `job_id` 读取同一任务，完成后处理 `output`。下载始终使用异步模式。不要在超时后自动重复提交收费请求。

"""
    if skill['source'] == 'youtube_download':
        intro += '下载还需要用户自有存储；在私密JSON文件中保存目标与凭据，并将 `FLASHDATA_STORAGE_FILE` 设置为文件路径，见[存储配置](references/storage.md)。上传所需的存储凭据会随请求发送至FlashData；只使用用户授权的目标和预算。\n\n'
    body = re.sub(r'^\s*# [^\n]+\n', '\n', body, count=1)
    files[skill['directory'] + '/SKILL.md'] = '---' + frontmatter + '---\n\n' + intro + '## API 调用、参数与结果参考\n' + body
    files[skill['directory'] + '/LICENSE'] = (ROOT / 'LICENSE').read_text(encoding='utf-8')
    if skill['source'] == 'youtube_download':
        files[skill['directory'] + '/references/storage.md'] = (ROOT / skill['source_directory'] / 'references/storage.md').read_text(encoding='utf-8')
    for script in (ROOT / skill['source_directory'] / 'scripts').glob('*.py'):
        files[skill['directory'] + '/scripts/' + script.name] = script.read_text(encoding='utf-8')
for relative, content in files.items():
    target = ROOT / relative
    if CHECK:
        if target.read_text(encoding='utf-8') != content:
            raise SystemExit('Generated content differs: ' + relative)
    else:
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(content, encoding='utf-8')
print(f'{"Checked" if CHECK else "Generated"} {len(files)} files for {len(catalog["skills"])} ModelScope skills; no publication performed.')
