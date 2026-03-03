# AlphaCouncil API 文档

本文件汇总了项目内所有通过接口调用的“内部路由”和其对应的“上游外部服务/SDK”，并标注请求方法、请求体、必要头、环境变量与响应结构，便于排查联调与运维配置。

- 运行环境：Vite 本地开发通过自定义中间件将 /api/* 映射到 `api/*` 下的 serverless 处理器（见 dev/api-dev-plugin.ts）。
- 前端调用统一走相对路径，支持通过环境变量切换到实际后端地址：
  - AI 基座：VITE_API_AI_BASE（默认 `/api/ai`）
  - 股票基座：VITE_API_STOCK_BASE（默认 `/api/stock`）

----------------------------------------

## 1) 内部路由（本项目提供）

### 1.1 实时股票数据
- 路径：
  - GET  /api/stock/:symbol
  - POST /api/stock/:symbol
- 说明：代理聚合数据（Juhe）沪深股票实时接口，兼容 GET/POST。`symbol` 可以为纯数字（自动加 sh/sz 前缀）、或已带 `sh`/`sz` 前缀。
- 请求参数：
  - 路径参数：`symbol`（必需）
  - GET 查询参数（可选）：`apiKey` 用于在未配置服务端环境变量时临时透传
  - POST JSON Body（可选）：`{ "symbol": "600519", "apiKey": "xxx" }`
- 请求头：
  - POST: `Content-Type: application/json`
- 环境变量：
  - VITE_API_JUHE_API_KEY（优先使用；未配置则尝试请求体/查询参数 apiKey）
- 返回结构（成功）：
  ```json
  {
    "success": true,
    "data": {
      "data": { /* StockRealtimeData 实时数据 */ },
      "dapandata": { /* 大盘数据，可选 */ },
      "gopicture": { "minurl": "...", "dayurl": "...", "weekurl": "...", "monthurl": "..." }
    }
  }
  ```
  - 前端 `services/juheService.ts` 取值方式：
    - `const stockData = result.data.data;`
    - 可选附加：`result.data.dapandata`
- 返回结构（失败）：
  ```json
  { "success": false, "error": "缺少股票代码 | 未配置聚合数据 API Key | <Juhe 返回 reason> | 服务器内部错误" }
  ```
- 示例：
  - GET: `/api/stock/600519`
  - POST:
    ```bash
    curl -X POST http://localhost:5173/api/stock/600519 \
      -H "Content-Type: application/json" \
      -d '{"symbol":"600519"}'
    ```

----------------------------------------

### 1.2 AI 代理（统一输出 { success, text }）

所有 AI 接口均为 POST，返回统一结构：
```json
{ "success": true, "text": "<模型回复内容>" }
```
失败时：
```json
{ "success": false, "error": "<错误信息>" }
```

前端统一入口（services/geminiService.ts）按 Provider 分别调用：
- `${VITE_API_AI_BASE || '/api/ai'}/gemini`
- `${VITE_API_AI_BASE || '/api/ai'}/deepseek`
- `${VITE_API_AI_BASE || '/api/ai'}/qwen`
- `${VITE_API_AI_BASE || '/api/ai'}/openrouter`
- `${VITE_API_AI_BASE || '/api/ai'}/aiplat`

均需 `Content-Type: application/json`。以下分别说明各路由的请求体与默认值。

#### 1.2.1 /api/ai/gemini
- 方法：POST
- 请求体：
  ```json
  {
    "model": "gemini-2.5-flash",     // 可选，默认值
    "prompt": "<string>",        // 必需（服务端以 GoogleGenAI SDK 的 contents 字段传入）
    "temperature": 0.7,              // 可选
    "tools": [{ "googleSearch": {} }], // 可选，默认启用搜索工具
    "apiKey": "<可选，前端备用>"
  }
  ```
- 环境变量优先：VITE_API_GEMINI_API_KEY

#### 1.2.2 /api/ai/deepseek
- 方法：POST
- 请求体：
  ```json
  {
    "model": "deepseek-chat",        // 可选，默认
    "systemPrompt": "<string>",  // 可选
    "prompt": "<string>",        // 必需
    "temperature": 0.7,              // 可选
    "apiKey": "<可选，前端备用>"
  }
  ```
- 环境变量优先：VITE_API_DEEPSEEK_API_KEY

#### 1.2.3 /api/ai/qwen
- 方法：POST
- 请求体：
  ```json
  {
    "model": "qwen-plus",            // 可选，默认
    "systemPrompt": "<string>",  // 可选
    "prompt": "<string>",        // 必需
    "temperature": 0.7,              // 可选
    "apiKey": "<可选，前端备用>"
  }
  ```
- 环境变量优先：VITE_API_QWEN_API_KEY

#### 1.2.4 /api/ai/openrouter
- 方法：POST
- 请求体：
  ```json
  {
    "model": "openai/gpt-4o-mini",   // 可选，默认
    "systemPrompt": "<string>",  // 可选
    "prompt": "<string>",        // 必需
    "temperature": 0.7,              // 可选
    "apiKey": "<可选，前端备用>"
  }
  ```
- 环境变量优先：VITE_API_OPENROUTER_API_KEY

#### 1.2.5 /api/ai/aiplat
- 方法：POST
- 请求体：
  ```json
  {
    "model": "openai/gpt-5",        // 可选，默认
    "systemPrompt": "<string>", // 可选
    "prompt": "<string>",       // 必需
    "temperature": 0.7,             // 可选
    "apiKey": "<可选，前端备用>",
    "baseUrl": "<可选，前端备用>" // 若服务端无环境变量则用此
  }
  ```
- 环境变量优先：
  - VITE_API_AIPLAT_API_BASE（形如 `https://your-llm.example.com`）
  - VITE_API_AIPLAT_API_KEY
- 注意：该服务使用 `Authorization: <API_KEY>`（非 Bearer）

----------------------------------------

## 2) 上游外部服务/SDK（内部路由调用的目标）

以下为内部路由转发/调用的目标服务，用于排查 401/请求格式等问题。

### 2.1 聚合数据（股票）
- Endpoint：
  - GET `http://web.juhe.cn/finance/stock/hs?gid={sh|sz}{symbol}&key=<VITE_API_JUHE_API_KEY>`
- 关键点：
  - `gid` 例：`sh600519` 或 `sz000001`（内部根据首位是否为 6 自动推断 `sh|sz`）
  - 返回字段 `result[0]` 中包含：
    - `data`（实时行情）
    - `dapandata`（指数数据，可选）
    - `gopicture`（K 线图链接）

### 2.2 DeepSeek
- Endpoint：POST `https://api.deepseek.com/chat/completions`
- Headers：
  - `Content-Type: application/json`
  - `Authorization: Bearer <VITE_API_DEEPSEEK_API_KEY 或前端 apiKey>`
- Body（OpenAI 兼容）：
  ```json
  {
    "model": "deepseek-chat",
    "messages": [
      { "role": "system", "content": "<systemPrompt>" },
      { "role": "user", "content": "<prompt>" }
    ],
    "temperature": 0.7,
    "stream": false
  }
  ```

### 2.3 OpenRouter
- Endpoint：POST `https://openrouter.ai/api/v1/chat/completions`
- Headers：
  - `Content-Type: application/json`
  - `Authorization: Bearer <VITE_API_OPENROUTER_API_KEY 或前端 apiKey>`
  - 可选推荐：`HTTP-Referer`, `X-Title`
- Body（OpenAI 兼容，见 1.2.4）

### 2.4 AIPLAT（自定义 LLM Hub）
- Endpoint：POST `${VITE_API_AIPLAT_API_BASE}/v1/chat/completions`
- Headers：
  - `Content-Type: application/json`
  - `Authorization: <VITE_API_AIPLAT_API_KEY 或前端 apiKey>`（注意非 Bearer）
- Body（OpenAI 兼容，见 1.2.5）

### 2.5 通义千问（Qwen）
- Endpoint：POST `https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions`
- Headers：
  - `Content-Type: application/json`
  - `Authorization: Bearer <VITE_API_QWEN_API_KEY 或前端 apiKey>`
- Body（OpenAI 兼容，见 1.2.3）

### 2.6 Google Gemini（SDK）
- 使用 SDK：`@google/genai`（`GoogleGenAI`）
- 鉴权：`new GoogleGenAI({ apiKey: VITE_API_GEMINI_API_KEY || apiKey })`
- 调用：
  ```ts
  ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: "<prompt>",     // 服务里直接传入 prompt 字符串
    config: {
      temperature: 0.7,
      tools: [{ googleSearch: {} }]
    }
  })
  ```
- 返回：服务端统一提取 `response.text`

----------------------------------------

## 3) 前端调用点（便于回溯）

### 3.1 services/juheService.ts
- 基座：`VITE_API_STOCK_BASE`，未配置回退 `/api/stock`
- 请求：
  ```ts
  fetch(`${BASE}/${symbol}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ symbol, apiKey })
  })
  ```
- 解析：
  - 需 `result.success === true`
  - `const stockData = result.data.data`
  - 可选：`stockData.dapandata = result.data.dapandata`

### 3.2 services/geminiService.ts
- 基座：`VITE_API_AI_BASE`，未配置回退 `/api/ai`
- 根据 `ModelProvider` 分流到上节 1.2 五个路由，统一 `POST JSON`，解析 `{ success, text }`

----------------------------------------

## 4) CORS 与方法支持

- 所有 AI 路由与股票路由均已在服务端统一设置：
  - `Access-Control-Allow-Origin: *`
  - `Access-Control-Allow-Methods: 'POST, OPTIONS'`（股票额外支持 `GET`）
  - `Access-Control-Allow-Headers: 'Content-Type'`
- `OPTIONS` 预检直接返回 200

----------------------------------------

## 5) 环境变量清单（.env）

- VITE_API_GEMINI_API_KEY
- VITE_API_DEEPSEEK_API_KEY
- VITE_API_QWEN_API_KEY
- VITE_API_OPENROUTER_API_KEY（可选）
- VITE_API_JUHE_API_KEY
- VITE_API_AI_BASE（可选，例：http://your-host/api/ai；默认 /api/ai）
- VITE_API_STOCK_BASE（可选，例：http://your-host/api/stock；默认 /api/stock）
- VITE_API_AIPLAT_API_BASE（可选，自定义 LLM Hub 基础地址）
- VITE_API_AIPLAT_API_KEY（可选，自定义 LLM Hub 鉴权）

----------------------------------------

## 6) 快速排错建议

- 401/403：优先检查对应 Provider 的 API Key 是否配置在服务器环境变量中；仅在缺失时才依赖前端传入的 `apiKey`。
- 4xx（OpenAI 兼容接口）：检查 `model` 名称与请求体是否符合上游格式；`stream` 当前均为 `false`。
- AIPLAT 特殊点：`Authorization` 头直接使用 API Key 字符串（非 Bearer）。
- 股票 Juhe：确认 `gid` 是否正确加上 `sh|sz` 前缀；500 常见于 Key 未配置或网络问题。
