"""Build ModelScope skill folders from the maintained task skills and catalog."""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CHECK = '--check' in sys.argv
catalog = json.loads((ROOT / 'integrations/modelscope/catalog.json').read_text())
files = {}
for skill in catalog['skills']:
    original = (ROOT / skill['source_directory'] / 'SKILL.md').read_text()
    _, frontmatter, body = original.split('---', 2)
    frontmatter = re.sub(r'^description: .*$', 'description: ' + json.dumps(skill['description'], ensure_ascii=False), frontmatter, flags=re.M)
    body = body.replace('utm_source=skills-sh', 'utm_source=modelscope').replace(
        'npx --yes --package=@flashdata-dev/mcp@0.1.0 flashdata', skill['command'])
    intro = f"""# {skill['display_name']}

{skill['description']}

[功能文档与官网]({skill['homepage']}) · [获取 API Key](https://flashdata.dev/app/api-keys) · [当前价格](https://flashdata.dev/pricing)

## 在支持 Skills 的 Agent 中使用

从魔搭下载此 Skill，保留文件夹结构，放入所用 Agent 支持的 Skills 目录，再按客户端文档启用。此 Skill 使用终端命令；运行环境需要 Node.js 22.18+、npm 和联网能力，并通过该环境的密钥配置提供 `FLASHDATA_API_KEY`。沙箱需要在沙箱内配置这些依赖，不能假设宿主机配置自动可用。

示例任务：

> {skill['example']}

安装 Skill 和 CLI 免费；下面的数据查询消耗 FlashData Credits，客户端/模型和适用的存储费用另计。读取 Skill 不代表授权执行付费示例；根据用户任务和已授权预算选择参数。API Key 不应写进 Skill、公开表单或对话。

先检查本地CLI能否启动（不提交数据请求）：

```sh
{skill['command']} --help
```

已配置密钥后，可使用 `{skill['command']} call get_pricing` 免费读取当前价格；价格检查不等于实际数据查询成功。普通同步查询直接处理返回的 `result`，不要求存在job ID。需要异步时显式传入 `mode: "async"`，保存提交返回的 `id`（CLI为 `result.id`），用 `get_job` 的 `job_id` 读取同一任务，完成后从 `output`（CLI为 `result.output`）取结果。下载始终使用异步模式。不要在超时后自动重复提交收费请求。

"""
    if skill['source'] == 'youtube_download':
        intro += '下载还需要用户自有存储；在私密JSON文件中保存目标与凭据，并将 `FLASHDATA_STORAGE_FILE` 设置为文件路径，见[存储配置](references/storage.md)。上传所需的存储凭据会随请求发送至FlashData；只使用用户授权的目标和预算。\n\n'
    body = re.sub(r'^\s*# [^\n]+\n', '\n', body, count=1)
    files[skill['directory'] + '/SKILL.md'] = '---' + frontmatter + '---\n\n' + intro + '## API 调用、参数与结果参考\n' + body
    files[skill['directory'] + '/LICENSE'] = (ROOT / 'LICENSE').read_text()
    if skill['source'] == 'youtube_download':
        files[skill['directory'] + '/references/storage.md'] = (ROOT / skill['source_directory'] / 'references/storage.md').read_text()
for relative, content in files.items():
    target = ROOT / relative
    if CHECK:
        if target.read_text() != content:
            raise SystemExit('Generated content differs: ' + relative)
    else:
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(content)
print(f'{"Checked" if CHECK else "Generated"} {len(files)} files for {len(catalog["skills"])} ModelScope skills; no publication performed.')
