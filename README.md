# 星伴 Creator Agent Web

面向 KOL 的 AI 经纪人与内容团队，帮助红人完成智能选品、Momcozy 建联、爆款内容策划、AI 视频生产和数据复盘。

## 当前体验

- 「今日」根据合作价值和截止时间安排下一步行动。
- 「合作机会」提供可解释选品，并在申请对外发送前要求红人确认。
- 「爆款创作」把账号信号、评论需求与品牌 Brief 转成内容切角和分镜脚本。
- 「AI 视频」演示素材选择、成片配置、生成与保存流程。
- 「数据复盘」同时分析流量、互动、购买意向和佣金信号。
- 「AI 经纪人」通过服务端 Responses API 连接模型，结合当前页面、商品、申请状态与最近对话，实时回答选品、合作、创作和复盘问题。

商品、合作与复盘模块当前使用演示数据；AI 经纪人已使用真实模型回复。API 密钥只保存在服务端环境变量中，不会发送到浏览器。

## 本地运行

```bash
npm install
cp .env.example .env.local
# 在 .env.local 中填写 OPENAI_API_KEY
npm run dev
```

默认模型为 `gpt-6-astra`，可通过 `OPENAI_MODEL` 覆盖。部署时应把 `OPENAI_API_KEY` 配置为托管环境的服务端 Secret。

验证生产构建：

```bash
npm test
```
