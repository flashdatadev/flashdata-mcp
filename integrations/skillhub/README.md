# SkillHub：15个独立能力 Skill

本目录用于 SkillHub 的普通 Skill 发布，复用 `integrations/modelscope/skills/` 的15项 Python MCP 示例。Google Search 已完成单项发布，用户授权继续发布其余14项；仅调整发布元数据、安装说明、搜索描述和 `utm_source=skillhub`，保持 Python 代码块一致。

每项发布内容：各目录下的 `SKILL.md` 与 `LICENSE.md` 放在 ZIP 根目录上传；下载项还必须包含 `references/storage.md`。平台不接受无扩展名的 LICENSE，改用 LICENSE.md，许可证原文不变。15项首次版本均为 `1.0.0`；Google Search 原对象保持，不重复创建。本目录手工维护，后续源码更新时需同步对应示例，不修改魔搭或 ClawHub 原对象。

运行条件：Python 3.10+、mcp==1.30.0、httpx==0.28.1、用户自己的 FLASHDATA_API_KEY。复用 https://data.flashdata.dev/mcp；没有新后端、OAuth、部署或 npm 发布。

普通 Skill 安装免费，真实数据调用消耗用户自己的 FlashData Credits。该目录不含凭据，不能把上传或静态检查当作收费API实跑通过。平台审批、公开地址和搜索验收以 GTM 本轮交接为准。
