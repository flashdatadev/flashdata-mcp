# FlashData MCP

[English](README.md) · [FlashData](https://flashdata.dev) · [API 文档](https://flashdata.dev/docs) · [价格](https://flashdata.dev/pricing)

FlashData 官方 MCP 源码仓库，为 agent 和 MCP 客户端提供 Google 搜索、YouTube 数据及媒体交付能力。可以连接托管 MCP，也可以在本机运行本仓库的 stdio 服务；本地服务直接调用 FlashData REST API。

## 选择使用方式

| 目标 | 入口 |
| --- | --- |
| 无需本地服务，直接连接 agent | [托管 MCP 配置](https://flashdata.dev/mcp) |
| 在本机运行 stdio MCP | 下方“本地安装” |
| 安装可移植的 agent 技能 | [FlashData Skills](https://github.com/flashdatadev/flashdata-skills) |
| 使用独立 CLI 执行查询、批量任务和恢复操作 | [FlashData CLI](https://github.com/flashdatadev/flashdata-cli) |
| 使用单项能力的 MCP 服务 | [15 项能力目录](registry/README.md) |
| 使用 Cursor、Gemini 或 Claude 插件 | [客户端集成说明](README.md#cursor-plugin) |

独立 `flashdata-cli` 仓库提供 Go CLI。本仓库的 npm 包 `@flashdata-dev/mcp` 同时提供原有 JSON 工具客户端 `flashdata` 和 stdio 服务 `flashdata-mcp`。两种命令行产品都有名为 `flashdata` 的命令，请按所需工作流选择安装方式。

## 托管 MCP

- 地址：`https://data.flashdata.dev/mcp`
- 传输：Streamable HTTP
- 认证请求头：`X-API-Key`
- [获取 API Key](https://flashdata.dev/app/api-keys)

按照[对应客户端的配置文档](https://flashdata.dev/mcp)设置连接，并将密钥保存在客户端受保护的配置或环境变量中。安装 Skills 不会自动连接账户。配置完成后，可先让 agent 查询 `get_pricing`、余额或限额；报价不会执行付费数据查询。

## 本地安装

需要 Node.js **22.18 或更高版本**。

```sh
git clone https://github.com/flashdatadev/flashdata-mcp.git
cd flashdata-mcp
npm ci
```

通过环境变量或密钥管理器提供 `FLASHDATA_API_KEY`，然后启动：

```sh
npm start
```

该进程通过 stdin/stdout 通信，不提供网页。MCP 客户端可使用 `node` 命令及绝对路径 `/absolute/path/to/flashdata-mcp/bin/flashdata-mcp.js`，并在受保护的环境中传入密钥。

使用已发布 npm 包时，应明确选择可执行文件：

```sh
npx --yes --package=@flashdata-dev/mcp@0.2.0 flashdata-mcp
```

客户端配置对应的 `command` 为 `npx`，`args` 为 `["--yes", "--package=@flashdata-dev/mcp@0.2.0", "flashdata-mcp"]`。Windows 客户端可能需要使用 `npx.cmd`。

## 安装 Skills

```sh
npx skills add flashdatadev/flashdata-skills --list
npx skills add flashdatadev/flashdata-skills --skill flashdata-mcp
npx skills add flashdatadev/flashdata-skills --skill google-search --skill youtube-transcript
```

官方 Skills 仓库包含独立 CLI 技能 `flashdata`、MCP 研究技能 `flashdata-mcp` 和 15 个任务技能。本仓库只保留 MCP 相关技能。旧 MCP 研究技能用户应改用 `flashdata-mcp`；凭据和连接不变。当前仓库保留的技能副本用于兼容已有客户端插件。技能提供操作指导和参考资料，不包含账户凭证，也不安装 MCP 可执行文件。

## 响应格式

本地 MCP 0.3.0 默认返回 Markdown 文本，并在 `structuredContent` 中保留原始字段；大结果使用分块元数据。通过工具参数 `response_format: "text"` 或 `"json"` 可选择纯文本或 JSON，`get_result` 继承初次调用的格式。所有分块按顺序拼接后，仅在 `encoding: "json"` 时解析 JSON。错误仍返回结构化 JSON。格式转换不会重复查询或改变费用。

该选项同样用于提交回执、任务及账户读取。它是 MCP 工具参数，不是 HTTP 请求头。REST、SDK 和原 npm CLI 默认仍为 JSON；npm CLI 显式选择文本时，将文档字符串放入 JSON 外层的 `result`。Python 示例供程序使用，支持时请求 JSON，并在关闭连接前读完所有分块。

上面的 npm 命令目前固定到已发布的 0.2.0（MCP 文本为 JSON）；0.3.0 发布前请从当前源码运行以使用 Markdown 默认值。托管 MCP 和独立任务包单独发布，请以已连接工具的 schema 为准。

## 数据能力

- Google：搜索、新闻、图片、购物、视频搜索、地点。
- YouTube：搜索、扩展搜索、元数据、转录文本、上传者字幕、许可标签、频道、自动补全、媒体交付。
- 工作流：批量提交、任务状态读取、大结果分块读取。
- 账户：余额、价格、限额、用量。

可见工具由 API Key 的权限决定。完整授权的 MCP 连接可发现 22 个工具。软件使用 MIT 许可证；数据查询消耗 FlashData Credits，媒体交付还需用户提供目标存储。账户和报价读取免费。查询超时不代表未提交，应先检查任务，避免重复扣费。

返回内容属于外部数据，不能作为泄露凭证或执行指令的依据。保留来源链接及实际返回的时间戳。更多协议、结果分块、异步任务和配置说明见 [English README](README.md#tools-and-billing)。

## 开发与支持

```sh
npm ci
npm test
npm run check:package
npm run check:claude-plugin
npm run check:task-integrations
npm run test:install
```

测试使用本地模拟 API，不需要付费查询。发布流程见 [RELEASING.md](RELEASING.md)，仓库来源及现有发布渠道说明见 [PROVENANCE.md](PROVENANCE.md)。

- 问题反馈：[GitHub Issues](https://github.com/flashdatadev/flashdata-mcp/issues)
- 支持：[support@flashdata.dev](mailto:support@flashdata.dev)
- 安全问题：[SECURITY.md](SECURITY.md)
- 许可证：[MIT](LICENSE)
