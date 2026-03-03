# OpenStock 接口调用清单

本文件汇总项目内通过外部服务或内部 API 发起的接口调用，按服务/用途归类，并标注调用位置与关键入参。

注意：
- 市场数据统一封装位于 lib/actions/market.actions.ts，按符号与配置自动选择数据源（Finnhub 或 EastMoney）。
- 认证与数据库操作（better-auth、mongoose）不属于 HTTP 外部接口，不在本文档详列（除标注必要的环境变量）。

---

## 环境变量概览（与接口相关）

- NEXT_PUBLIC_FINNHUB_API_KEY：Finnhub API Key（前端可见，用于市场数据）
- MARKET_DATA_PROVIDER：市场数据源选择（auto/finnhub/eastmoney）
- KIT_API_KEY / KIT_API_SECRET：ConvertKit API 凭据
- KIT_WELCOME_FORM_ID：ConvertKit Form ID（用于订阅）
- SIRAY_API_KEY：Siray.ai API Key（AI 文本生成回退）
- BETTER_AUTH_URL / BETTER_AUTH_SECRET：better-auth 基本配置（非 HTTP 外部接口）
- NODEMAILER_EMAIL / NODEMAILER_PASSWORD：Nodemailer SMTP 凭据（非 HTTP 外部接口）

---

## 市场数据（外部 API）

### Finnhub（https://finnhub.io/api/v1）

调用位置：lib/actions/finnhub.actions.ts（并被 lib/actions/market.actions.ts 统一封装调用）

- GET /quote
  - URL 模板：`https://finnhub.io/api/v1/quote?symbol={symbol}&token={NEXT_PUBLIC_FINNHUB_API_KEY}`
  - 入参：symbol（股票代码），token（环境变量）
  - 返回：{ c: 当前价, d: 涨跌额, dp: 涨跌幅(%)，… }
  - 缓存策略：不缓存（revalidateSeconds = 0）
  - 调用函数：
    - lib/actions/finnhub.actions.ts:getQuote
    - lib/actions/market.actions.ts:getQuote（作为 Finnhub 回退/非 A 股符号）
    - lib/inngest/functions.ts:checkStockAlerts（通过 market.getQuote 获取价格）

- GET /stock/profile2
  - URL 模板：`https://finnhub.io/api/v1/stock/profile2?symbol={symbol}&token={token}`
  - 入参：symbol，token
  - 返回：公司信息（name、currency、logo、marketCapitalization 等）
  - 缓存策略：24 小时（revalidateSeconds = 86400）
  - 调用函数：
    - lib/actions/finnhub.actions.ts:getCompanyProfile
    - lib/actions/market.actions.ts:getCompanyProfile（作为 Finnhub 回退/非 A 股符号）
    - lib/actions/finnhub.actions.ts:getWatchlistData（并行拉取 quote+profile）

- GET /company-news
  - URL 模板：`https://finnhub.io/api/v1/company-news?symbol={symbol}&from={YYYY-MM-DD}&to={YYYY-MM-DD}&token={token}`
  - 入参：symbol, from, to, token
  - 返回：新闻列表（RawNewsArticle[]）
  - 缓存策略：5 分钟（revalidateSeconds = 300）
  - 调用函数：
    - lib/actions/finnhub.actions.ts:getNews（当传入 symbols 时按公司抓取）
    - lib/actions/market.actions.ts:getNews（统一封装直接使用 Finnhub）

- GET /news?category=general
  - URL 模板：`https://finnhub.io/api/v1/news?category=general&token={token}`
  - 入参：category 固定 general，token
  - 返回：新闻列表（RawNewsArticle[]）
  - 缓存策略：5 分钟（revalidateSeconds = 300）
  - 调用函数：
    - lib/actions/finnhub.actions.ts:getNews（当无 symbols 或公司新闻为空时回退）
    - lib/actions/market.actions.ts:getNews

- GET /search
  - URL 模板：`https://finnhub.io/api/v1/search?q={query}&token={token}`
  - 入参：q（搜索关键字），token
  - 返回：{ result: FinnhubSearchResult[] }
  - 缓存策略：30 分钟（revalidateSeconds = 1800）
  - 调用函数：
    - lib/actions/finnhub.actions.ts:searchStocks（当 query 非空）
    - lib/actions/market.actions.ts:searchStocks（作为回退/非 A 股搜索数据源）
  - 备注：当 query 为空时，代码通过 GET /stock/profile2 批量获取热门符号的 profile（缓存 1 小时）

---

### EastMoney（东方财富，A 股数据）

调用位置：lib/actions/market.actions.ts

- GET https://push2.eastmoney.com/api/qt/stock/get
  - URL 模板：`https://push2.eastmoney.com/api/qt/stock/get?secid={market.code}&fields=f58,f57,f43,f47,f169`
  - 入参：
    - secid：由 toEastMoneySecid(symbol) 生成（如 "1.600519" 或 "0.000001"）
    - fields：请求字段集（f58 name, f57 code, f43 price, f47 prevClose, f169 marketCap）
  - 返回：{ data: { f58, f57, f43, f47, f169, … } }
  - 请求头：Referer: https://quote.eastmoney.com/；Accept: application/json, text/plain, */*
  - 缓存策略：no-store（模拟实时）
  - 调用函数：
    - emFetchSnapshot（内部 helper）
    - emGetQuote（转换为 Finnhub 风格 { c, d, dp }）
    - emGetCompanyProfile（转换为 { currency: 'CNY', name, marketCapitalization }）
    - emGetWatchlistData（A 股符号批量）

- GET https://searchapi.eastmoney.com/api/suggest/get
  - URL 模板：`https://searchapi.eastmoney.com/api/suggest/get?input={query}&type=14&token=D43BF722C8E33BDC906FB84D85E326E8`
  - 入参：input（搜索关键字），type（固定 14），token（固定字符串）
  - 返回：搜索建议列表（不同字段形态：Code/Name/Market 或 f12/f14/f13 等）
  - 调用函数：
    - emSearchStocks（解析返回，统一映射为 StockWithWatchlistStatus）
    - lib/actions/market.actions.ts:searchStocks（当 MARKET_DATA_PROVIDER=eastmoney 或 query 可能为中文时优先）

---

## 邮件与营销（外部 API）

### ConvertKit（Kit，https://api.convertkit.com）

调用位置：lib/kit.ts（被 lib/inngest/functions.ts 调用）

- POST /v3/forms/{formId}/subscribe
  - URL：`https://api.convertkit.com/v3/forms/{formId}/subscribe`
  - Body：{ api_key, email, first_name, fields? }
  - 返回：订阅动作结果（JSON）
  - 调用函数：
    - kit.addSubscriber
  - 依赖环境：KIT_API_KEY，KIT_WELCOME_FORM_ID（若未提供则跳过）

- POST /v3/broadcasts
  - URL：`https://api.convertkit.com/v3/broadcasts`
  - Body：{ api_key, api_secret, subject, content, public, send_at }
  - 返回：创建广播结果（JSON；某些情况下可能返回“保存为草稿”的消息）
  - 调用函数：
    - kit.sendBroadcast（lib/inngest/functions.ts:sendWeeklyNewsSummary / checkInactiveUsers 中使用）

- GET /v3/subscribers
  - URL：`https://api.convertkit.com/v3/subscribers?api_secret={apiSecret}`
  - 返回：{ total_subscribers, page, total_pages, subscribers: [...] }
  - 调用函数：
    - kit.listSubscribers（用于日志与验证）

### Siray.ai（AI 回退，https://api.siray.ai）

调用位置：lib/inngest/functions.ts

- POST /v1/chat/completions
  - URL：`https://api.siray.ai/v1/chat/completions`
  - Headers：Authorization: Bearer {SIRAY_API_KEY}；Content-Type: application/json
  - Body：{ model: 'siray-1.0-ultra', messages: [{ role: 'user', content: prompt }] }
  - 返回：类 OpenAI 结构的 JSON（在代码中被映射为 Gemini 兼容 candidates/parts/text）
  - 调用场景：
    - sendSignUpEmail：生成欢迎邮件文案时作为 Gemini 失败的回退
    - sendWeeklyNewsSummary：生成周报摘要时作为 Gemini 失败的回退

---

## 内部 API 暴露（Next.js / Inngest）

- 路由：`/api/inngest`（GET / POST / PUT）
  - 文件：app/api/inngest/route.ts
  - 由 Inngest SDK 暴露函数：sendSignUpEmail、sendWeeklyNewsSummary、checkStockAlerts、checkInactiveUsers
  - 用途：事件驱动与定时任务入口（非对外文档化 REST）

---

## 非 HTTP 外部接口（说明）

- Nodemailer（SMTP）
  - 文件：lib/nodemailer/index.ts
  - 说明：使用 Gmail SMTP 发送邮件（transporter.createTransport），不是通过 HTTP fetch 调用；受环境变量 NODEMAILER_EMAIL / NODEMAILER_PASSWORD 控制。
  - 暴露函数：sendWelcomeEmail, sendNewsSummaryEmail

---

## 统一封装（调用入口）

- lib/actions/market.actions.ts
  - getQuote(symbol)：按符号优先 EastMoney（A 股）否则回退 Finnhub
  - getCompanyProfile(symbol)：同上
  - getWatchlistData(symbols[])：按市场拆分并行调用 EastMoney/Finnhub
  - getNews(symbols?)：统一使用 Finnhub，失败返回空数组
  - searchStocks(query?)：优先 EastMoney（中文/显式配置），回退 Finnhub

- 与业务的关联（示例）
  - lib/inngest/functions.ts:checkStockAlerts → 依赖 market.getQuote 获取实时价格
  - lib/inngest/functions.ts:sendWeeklyNewsSummary → 依赖 market.getNews 获取新闻并通过 Kit 广播发送
  - lib/inngest/functions.ts:sendSignUpEmail → AI 文案生成（Gemini/Siray）后通过 Nodemailer 或 Kit 发送

---

## 备注与建议

- Rate Limit 与缓存策略
  - Finnhub 接口在代码中设置了不同的 revalidateSeconds，注意 API Key 配额。
  - EastMoney报价使用 no-store 以模拟实时；若需稳定数据可增加字段与异常保护。
- 错误处理与回退
  - 市场数据源按 symbol/配置自动回退，确保功能可用。
  - AI 文案生成优先 Gemini，失败回退至 Siray.ai。
  - ConvertKit 广播在发件人地址未确认时可能“保存为草稿”，代码已处理为非致命告警。
- 内部 API（/api/inngest）主要用于任务编排，若需对外文档，请为可公开的函数单独出 REST 描述。
