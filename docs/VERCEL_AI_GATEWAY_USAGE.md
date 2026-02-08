# Vercel AI Gateway 使用指南

## ✅ 配置完成

SoulForge 现在已经配置为使用 Vercel AI Gateway！

## 📋 环境变量配置

在 `.env.local` 或 Vercel 环境变量中设置：

```env
# AI 模型配置
AI_MODEL=anthropic/claude-3-5-sonnet-20241022

# Anthropic API Key
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

## 🎯 如何使用 AI Gateway

### 选项 1: 使用 AI Gateway（推荐用于生产环境）

1. **创建 AI Gateway**
   - 访问：https://vercel.com/dashboard/your-project/gateways
   - 点击 "Create Gateway"
   - Provider: 选择 "Anthropic"
   - 命名：`soulforge-anthropic`

2. **获取 Gateway URL**
   - 创建后会显示类似：`https://soulforge-anthropic.gateway.vercel.sh`

3. **配置环境变量**
   ```env
   AI_MODEL=anthropic/claude-3-5-sonnet-20241022
   ANTHROPIC_API_KEY=sk-ant-your-key-here
   ```

4. **Vercel 会自动路由**
   - 所有使用 `AI_MODEL` 的请求会自动通过 Gateway
   - 无需修改代码！

### 选项 2: 直接调用 Anthropic API（开发环境）

```env
AI_MODEL=anthropic/claude-3-5-sonnet-20241022
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

不创建 Gateway，请求会直接到 Anthropic API。

## 🔍 验证配置

### 检查日志

启动开发服务器时，会看到：
```
[AI] Using model: anthropic/claude-3-5-sonnet-20241022
```

### 测试 OC Summoning

1. 访问 http://localhost:3000/summon
2. 输入描述
3. 点击 "Summon OC"
4. 如果成功，说明配置正确！

## 📊 在 Gateway 中监控

如果你创建了 AI Gateway：

1. **查看日志**
   - 进入 Gateway Dashboard
   - 点击 "Logs" 标签
   - 实时查看所有 AI API 调用

2. **查看使用量**
   - "Usage" 标签
   - 查看 token 使用量和成本

3. **设置警告**
   - 配置成本警报
   - 设置 rate limiting

## 🎨 支持的模型

### Anthropic 模型
- `anthropic/claude-3-5-sonnet-20241022` (推荐，平衡)
- `anthropic/claude-3-5-haiku-20241022` (快速，便宜)
- `anthropic/claude-opus-4-5-20251101` (最强)

### Google 模型（通过 Gateway）
- `google/gemini-2.0-flash-exp`
- `google/gemini-1.5-pro`
- `google/gemini-1.5-flash`

## 💡 提示

- ✅ **生产环境**：使用 AI Gateway 进行监控和成本控制
- ✅ **开发环境**：可以直接使用 Anthropic API
- ✅ **切换模型**：只需修改 `AI_MODEL` 环境变量
- ✅ **无需改代码**：所有配置都通过环境变量

## 🚀 部署到 Vercel

1. 连接 GitHub 仓库到 Vercel
2. 在 Vercel 项目设置中添加环境变量：
   ```
   AI_MODEL=anthropic/claude-3-5-sonnet-20241022
   ANTHROPIC_API_KEY=sk-ant-your-key-here
   ```
3. Deploy！
4. Vercel 会自动使用配置

---

**配置完成！** 🎉

现在 SoulForge 已经可以使用 Vercel AI Gateway 了。
