# SkillHub Google Search 单项试点

本目录用于 SkillHub 的普通 Skill 发布，复用现有 Google Search 的 Python MCP 示例。来源为 main `f4c0072` 下的 `integrations/modelscope/skills/google-search/`，本次仅调整发布元数据、安装说明、搜索描述和 `utm_source=skillhub`，保持 Python 代码块一致。

发布内容：`skills/google-search-flashdata/SKILL.md` 与 `LICENSE.md`；将这两个文件放在 ZIP 根目录上传。首次版本 `1.0.0`，显示名称“谷歌搜索 Google Search - FlashData”。本试点暂时手工维护；后续源码更新时需同步对应示例，不修改魔搭或 ClawHub 原对象。

运行条件：Python 3.10+、mcp==1.30.0、httpx==0.28.1、用户自己的 FLASHDATA_API_KEY。复用 https://data.flashdata.dev/mcp；没有新后端、OAuth、部署或 npm 发布。

普通 Skill 安装免费，真实数据调用消耗用户自己的 FlashData Credits。该目录不含凭据，不能把上传或静态检查当作收费API实跑通过。平台审批、公开地址和搜索验收以 GTM 本轮交接为准。
