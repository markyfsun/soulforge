# Vercel AI Gateway 配置指南

## 什么是 Vercel AI Gateway？

Vercel AI Gateway 是一个统一的 API 管理层，用于：
- 📊 监控 AI API 使用量和成本
- 🚦 设置 rate limiting
- 💾 缓存响应以减少成本
- 📝 记录所有 AI API 调用日志
- 🔒 统一管理多个 AI 提供商

## 设置步骤

### 1. 创建 AI Gateway

1. 访问 Vercel Dashboard: https://vercel.com/dashboard
2. 选择你的项目
3. 点击 **"Gateways"** 或访问: https://vercel.com/dashboard/your-project/gateways
4. 点击 **"Create Gateway"**
5. 配置：
   - **Provider**: Anthropic
   - **Display Name**: SoulForge Anthropic Gateway
   - **Base URL**: 会自动生成（例如：`https://soulforge-anthropic.gateway.vercel.sh`）

### 2. 获取 Gateway URL

创建后，你会看到一个类似这样的 URL：
```
https://soulforge-anthropic.gateway.vercel.sh
```

### 3. 配置环境变量

在你的 `.env.local` 文件中添加：

```env
# 使用 AI Gateway
AI_GATEWAY_URL=https://soulforge-anthropic.gateway.vercel.sh

# 原始 Anthropic API Key（用于 Gateway）
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

### 4. 代码已配置完成

代码���经配置为自动使用 AI Gateway：

```typescript
// src/lib/anthropic.ts
const gatewayUrl = process.env.AI_GATEWAY_URL

export const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  baseURL: gatewayUrl ? `${gatewayUrl}/v1` : undefined,
})
```

如果设置了 `AI_GATEWAY_URL`，所有请求会通过 Gateway
如果没有设置，会直接调用 Anthropic API

## 验证配置

### 测试方法 1: 查看 Gateway Dashboard

在 Vercel Dashboard 中：
1. 进入你的 Gateway
2. 点击 **"Logs"** 标签
3. 运行 OC 召唤
4. 实时查看 API 调用日志

### 测试方法 2: 检查响应头

```bash
# 启动开发服务器
npm run dev

# 在另一个终端测试
curl -X POST http://localhost:3000/api/oc/summon \
  -H "Content-Type: application/json" \
  -d '{"description":"A test character"}'
```

如果使用 Gateway，响应头会包含：
```
x-gateway-request-id: xxx
x-gateway-provider: anthropic
```

## Gateway 配置选项

### Rate Limiting（速率限制）

在 Gateway 设置中：
- 设置每分钟/每小时最大请求数
- 防止意外的高额账单

示例：
- 100 requests/minute（开发环境）
- 1000 requests/minute（生产环境）

### Caching（缓存）

缓存常见响应以节省成本：
- 启用 **"Response Caching"**
- 设置 TTL（例如：1 hour）
- 对 OC summoning prompt 不建议缓存（需要唯一性）

### Logging & Monitoring（日志和监控）

- **Request Logs**: 记录所有 API 调用
- **Cost Tracking**: 实时成本估算
- **Error Tracking**: 自动记录失败请求
- **Analytics**: 使用模式分析

## 成本监控

### 在 Dashboard 中查看

1. 进入 Gateway
2. 查看 **"Usage"** 标签
3. 看到：
   - Token 使用量
   - 估算成本
   - 请求成功率
   - 平均响应时间

### 设置警告

- 每日/每周成本警报
- 异常使用量警告
- 失败率阈值

## 环境变量参考

| 变量 | 必需 | 说明 |
|------|------|------|
| `ANTHROPIC_API_KEY` | ✅ | Anthropic API 密钥 |
| `AI_GATEWAY_URL` | ⚪ | AI Gateway URL（可选） |

## 故障排除

### 问题 1: 请求失败

**错误**: `Failed to generate OC`

**解决方案**:
1. 检查 `AI_GATEWAY_URL` 是否正确
2. 确认 Gateway 在 Vercel 中已创建
3. 验证 `ANTHROPIC_API_KEY` 有效

### 问题 2: 看不到日志

**解决方案**:
1. 在 Gateway 设置中启用 **"Logging"**
2. 确认 `AI_GATEWAY_URL` 已设置
3. 重新运行 API 调用

### 问题 3: 响应变慢

**可能原因**:
- Gateway 额外的代理层（通常 < 100ms）
- Rate limiting 生效
- 网络问题

**解决方案**:
- 检查 Gateway Dashboard 中的响应时间
- 考虑直接使用 Anthropic API（移除 `AI_GATEWAY_URL`）

## 最佳实践

### ✅ DO（推荐）
- 使用 Gateway 监控生产环境
- 设置 rate limiting 限制成本
- 启用缓存以减少重复请求
- 定期查看使用量报告
- 设置成本警报

### ❌ DON'T（不推荐）
- 在开发环境强制使用 Gateway（可选）
- 缓存需要唯一性的请求（如 OC generation）
- 忽略错误日志
- 不设置任何限制

## 卸载 AI Gateway

如果以后不使用 AI Gateway：

1. 从 `.env.local` 中移除 `AI_GATEWAY_URL`
2. 代码会自动切换到直接调用 Anthropic API
3. 无需修改任何代码

## 更多信息

- [Vercel AI Gateway 文档](https://vercel.com/docs/gateway)
- [AI SDK 文档](https://sdk.vercel.ai/docs)
- [成本计算器](https://anthropic.com/pricing)
