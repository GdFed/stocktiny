# API 接口清单（项目内实际调用的接口）

说明
- 本清单聚焦于项目内“已被调用”的 HTTP 接口：
  - 前端调用后端的内部接口（/api/v1/*）
  - 前端直接使用的流式接口（SSE/Fetch）
- 后续将补充后端对外部三方服务的调用清单（如 tushare/akshare/efinance/yfinance/pytdx/baostock、钉钉/飞书/Discord 等）。

基础信息
- 统一前缀：/api/v1（见 api/v1/router.py）
- Axios 客户端（apps/dsa-web/src/api/index.ts）
  - baseURL: API_BASE_URL（由前端常量配置）
  - timeout: 30000ms
  - withCredentials: true
  - 401 拦截：若返回 401 且非 /login 页面，会重定向至 /login?redirect=当前路径
- 返回字段命名：
  - 服务端多为 snake_case
  - 前端统一通过 toCamelCase 转为 camelCase（apps/dsa-web/src/api/utils.ts）

目录
- Auth 认证
- Agent 智能体
- Analysis 分析
- History 历史
- Backtest 回测
- Stocks 识图提取
- System Config 系统配置
- Streaming 接口（SSE）
- 客户端通用行为
- 待补充（后端外部 API）

---

Auth 认证（apps/dsa-web/src/api/auth.ts, api/v1/endpoints/auth.py）
- GET /api/v1/auth/status
  - 功能：获取认证状态（authEnabled、loggedIn、passwordSet、passwordChangeable）
  - 响应：200 OK
- POST /api/v1/auth/login
  - 功能：登录或首次设置密码
  - 请求体（JSON）：
    - password: string
    - passwordConfirm?: string（首次设置时需要）
  - 响应：
    - 200 OK：Set-Cookie 写入会话
    - 400/401/429：错误码按后端定义返回
- POST /api/v1/auth/change-password
  - 功能：修改密码（需有效会话）
  - 请求体（JSON）：
    - currentPassword: string
    - newPassword: string
    - newPasswordConfirm: string
  - 响应：
    - 204 No Content
    - 400 错误时返回 JSON 错误描述
- POST /api/v1/auth/logout
  - 功能：注销，清除会话 Cookie
  - 响应：204 No Content

Agent 智能体（apps/dsa-web/src/api/agent.ts, ChatPage.tsx, api/v1/endpoints/agent.py）
- GET /api/v1/agent/strategies
  - 功能：获取可用策略列表
  - 响应：200 OK，{ strategies: [{ id, name, description }] }
- POST /api/v1/agent/chat
  - 功能：同步对话
  - 请求体（JSON）：
    - message: string
    - skills?: string[]
  - 响应：200 OK，{ success, content, session_id, error? }
  - 前端超时：120000ms
- POST /api/v1/agent/chat/stream
  - 功能：流式对话（SSE 风格流，使用 fetch 直连）
  - 请求体（JSON，同上）：
    - message: string
    - session_id?: string
    - skills?: string[]
    - context?: object（跟进上下文）
  - 响应：text/event-stream 风格数据流（详见“Streaming 接口”）
  - 400：当未启用 AGENT_MODE 时返回 { detail: "Agent mode is not enabled" }

Analysis 分析（apps/dsa-web/src/api/analysis.ts, api/v1/endpoints/analysis.py）
- POST /api/v1/analysis/analyze
  - 功能：触发股票分析（支持同步/异步）
  - 请求体（JSON）：
    - stock_code: string（或 stock_codes: string[] 批量，当前只处理第一个）
    - report_type?: "detailed" | ...（默认 "detailed"）
    - force_refresh?: boolean（默认 false）
    - async_mode?: boolean（默认 false）
  - 响应：
    - 200 OK：同步模式返回 AnalysisResult
    - 202 Accepted：异步模式返回 { task_id, status, message }
    - 409 Conflict：相同股票正在分析中，返回 { error, message, stock_code, existing_task_id }
    - 400/500：错误描述
- GET /api/v1/analysis/status/{task_id}
  - 功能：查询分析任务状态
  - 响应：
    - 200 OK：TaskStatus（进行中/已完成。已完成时 result 内含 AnalysisResult 与 report）
    - 404 Not Found：任务不存在或已过期
    - 500：内部错误
- GET /api/v1/analysis/tasks
  - 功能：获取任务列表（可选状态筛选）
  - 查询参数：
    - status?: pending,processing,completed,failed（可逗号分隔多个）
    - limit?: 1..100（默认 20）
  - 响应：200 OK，TaskListResponse
- GET /api/v1/analysis/tasks/stream
  - 功能：任务状态 SSE（详见“Streaming 接口”）
  - 响应：text/event-stream

History 历史（apps/dsa-web/src/api/history.ts, api/v1/endpoints/history.py）
- GET /api/v1/history
  - 功能：历史列表
  - 查询参数：
    - stock_code?: string
    - start_date?: YYYY-MM-DD
    - end_date?: YYYY-MM-DD
    - page?: number（默认 1）
    - limit?: number（默认 20，max 100）
  - 响应：200 OK，{ total, page, limit, items: HistoryItem[] }
- GET /api/v1/history/{query_id}
  - 功能：历史报告详情
  - 响应：
    - 200 OK：AnalysisReport（包含 meta/summary/strategy/details 等）
    - 404 Not Found：未找到记录
    - 500：内部错误
- GET /api/v1/history/{query_id}/news
  - 功能：获取报告关联新闻
  - 查询参数：limit（默认 20, 1..100）
  - 响应：200 OK，{ total, items: NewsIntelItem[] }

Backtest 回测（apps/dsa-web/src/api/backtest.ts, api/v1/endpoints/backtest.py）
- POST /api/v1/backtest/run
  - 功能：触发回测
  - 请求体（JSON，可选字段）：
    - code?: string
    - force?: boolean
    - eval_window_days?: number
    - min_age_days?: number
    - limit?: number
  - 响应：
    - 200 OK：BacktestRunResponse
    - 500：内部错误
- GET /api/v1/backtest/results
  - 功能：分页获取回测结果
  - 查询参数：
    - code?: string
    - eval_window_days?: number
    - page?: number（默认 1）
    - limit?: number（默认 20，max 200）
  - 响应：200 OK，BacktestResultsResponse
- GET /api/v1/backtest/performance
  - 功能：获取整体回测表现
  - 查询参数：eval_window_days?: number
  - 响应：
    - 200 OK：PerformanceMetrics
    - 404 Not Found：无回测汇总（前端会返回 null）
    - 500：内部错误
- GET /api/v1/backtest/performance/{code}
  - 功能：获取单股回测表现
  - 查询参数：eval_window_days?: number
  - 响应：
    - 200 OK：PerformanceMetrics
    - 404 Not Found：无该股汇总（前端会返回 null）
    - 500：内部错误

Stocks 识图提取（apps/dsa-web/src/api/stocks.ts, api/v1/endpoints/stocks.py）
- POST /api/v1/stocks/extract-from-image
  - 功能：从图片识别可能的股票代码
  - 请求：multipart/form-data，字段 file: File
  - 响应：200 OK，{ codes: string[], raw_text?: string }
  - 前端超时：60000ms

System Config 系统配置（apps/dsa-web/src/api/systemConfig.ts, api/v1/endpoints/system_config.py）
- GET /api/v1/system/config
  - 功能：获取系统配置（可包含 schema）
  - 查询参数：include_schema?: boolean（默认 true）
  - 响应：200 OK，SystemConfigResponse
- GET /api/v1/system/config/schema
  - 功能：仅获取配置 schema
  - 响应：200 OK，SystemConfigSchemaResponse
- POST /api/v1/system/config/validate
  - 功能：校验配置项
  - 请求体（JSON）：
    - items: [{ key: string, value: string }]
  - 响应：200 OK，ValidateSystemConfigResponse
- PUT /api/v1/system/config
  - 功能：更新系统配置
  - 请求体（JSON）：
    - config_version: string
    - mask_token: string（前端默认 ******）
    - reload_now: boolean（前端默认 true）
    - items: [{ key: string, value: string }]
  - 响应：
    - 200 OK：UpdateSystemConfigResponse
    - 400 Bad Request：校验失败，返回 issues（前端抛出 SystemConfigValidationError）
    - 409 Conflict：版本冲突，返回 current_config_version（前端抛出 SystemConfigConflictError）

Streaming 接口（SSE / 流式返回）
- /api/v1/agent/chat/stream（POST，body JSON；前端使用 fetch 处理）
  - 事件格式：按行 "data: {...}\n\n"
  - 事件类型（type）：
    - thinking：AI 正在思考（message/step）
    - tool_start：开始调用工具（tool/display_name）
    - tool_done：工具调用完成（success/duration）
    - generating：生成最终答案
    - done：结束，{ success, content?, error?, total_steps?, session_id }
    - error：错误，{ message }
- /api/v1/analysis/tasks/stream（GET，SSE）
  - 事件类型（event 字段 + data）：
    - connected：连接成功
    - task_created：新任务创建
    - task_started：任务开始
    - task_completed：任务完成
    - task_failed：任务失败
    - heartbeat：心跳（每 30 秒）

客户端通用行为与注意
- Axios 全局设置：
  - withCredentials: true，后端通过 Cookie Session 管理登录态
  - 401 自动跳转登录页（非 /login 时）
- 字段命名转换：
  - 服务端 snake_case → 前端 toCamelCase 深度转换
  - 文档中的请求字段以服务端名称为准（snake_case）
- 超时设置（前端）：
  - 普通接口默认 30s
  - Agent chat（同步）：120s
  - 图片识别：60s
- 错误处理惯例：
  - 分析异步触发 /analyze：409 DuplicateTask 前端抛 DuplicateTaskError
  - 系统配置更新：400 抛 SystemConfigValidationError（包含 issues），409 抛 SystemConfigConflictError

待补充（后端外部 API 调用清单）
- 计划扫描并补充以下模块的外部 HTTP/SDK 请求：
  - data_provider/*（tushare, akshare, efinance, yfinance, pytdx, baostock）
  - bot/platforms/*（dingtalk, feishu, discord）
  - src/search_service.py（新闻/搜索来源）
  - src/notification.py（通知渠道）
- 补充内容将包含：
  - 外部服务名称与基准 URL
  - 被调用的接口/方法与参数
  - 认证方式（Token/Key/Headers）
  - 调用位置（文件/函数）
  - 重试/超时/错误处理策略

版本记录
- 2026-03-03：初版，覆盖全部前端→后端接口与两处 SSE 流，整理了请求/响应与错误语义。
