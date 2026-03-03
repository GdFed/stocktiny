# TradingAgents-CN 接口使用清单（api.md）

说明
- 本文档通过扫描项目源代码自动汇总“被调用的接口”和“已暴露的后端接口”。
- 覆盖范围：
  1) FastAPI 后端已注册路由（按模块分组，含完整路径）
  2) 前端实际调用的接口（fetch/axios）
  3) 脚本与测试用例中实际调用的接口（requests/httpx/aiohttp）
  4) 项目中出现的第三方外部 HTTP API 调用（显式 URL）
- 生成依据：app/main.py 中包含的 include_router 前缀配置 + app/routers/* 路由定义 + frontend/src 中的 fetch/axios 调用 + scripts/tests 中的 HTTP 调用
- 注意：某些测试/文档中的旧路径可能与当前实现不完全一致，以下以“代码现状”为准，遇到冲突会在“备注”中标注。

更新时间：2026-03-03

---

## 1. 后端 FastAPI 路由总览（源于 app/main.py + 各 router 定义）

include_router 挂载与路由前缀组合（实际生效路径）：
- 健康检查: app.include_router(health.router, prefix="/api", tags=["health"])
  - GET /api/health
  - GET /api/healthz
  - GET /api/readyz
- 认证: app.include_router(auth.router, prefix="/api/auth", tags=["authentication"])
  - POST /api/auth/login
  - POST /api/auth/refresh
  - POST /api/auth/logout
  - GET  /api/auth/me
  - PUT  /api/auth/me
  - POST /api/auth/change-password
  - POST /api/auth/reset-password
  - POST /api/auth/create-user
  - GET  /api/auth/users
- 分析: app.include_router(analysis.router, prefix="/api/analysis", tags=["analysis"])
  - POST /api/analysis/single
  - GET  /api/analysis/test-route
  - GET  /api/analysis/tasks/{task_id}/status
  - GET  /api/analysis/tasks/{task_id}/result
  - GET  /api/analysis/tasks/all
  - GET  /api/analysis/tasks
  - POST /api/analysis/batch
  - POST /api/analysis/analyze
  - POST /api/analysis/analyze/batch
  - GET  /api/analysis/batches/{batch_id}
  - POST /api/analysis/tasks/{task_id}/cancel
  - GET  /api/analysis/user/queue-status
  - GET  /api/analysis/user/history
  - GET  /api/analysis/tasks/{task_id}/details
  - GET  /api/analysis/admin/zombie-tasks
  - POST /api/analysis/admin/cleanup-zombie-tasks
  - POST /api/analysis/tasks/{task_id}/mark-failed
  - DELETE /api/analysis/tasks/{task_id}
- 报告: app.include_router(reports.router, tags=["reports"])
  - router 前缀定义为 "/api/reports"，最终路径如下：
  - GET  /api/reports/list
  - GET  /api/reports/{report_id}/detail
  - GET  /api/reports/{report_id}/content/{module}
  - GET  /api/reports/{report_id}/download
  - DELETE /api/reports/{report_id}
- 筛选: app.include_router(screening.router, prefix="/api/screening", tags=["screening"])
  - GET  /api/screening/fields
  - POST /api/screening/run
  - POST /api/screening/enhanced
  - GET  /api/screening/fields           （重复定义，保持向后兼容）
  - GET  /api/screening/fields/{field_name}
  - POST /api/screening/validate
  - GET  /api/screening/industries
- 队列/SSE: 
  - app.include_router(queue.router, prefix="/api/queue", tags=["queue"])（此处未列出因未在搜索结果中出现端点）
  - app.include_router(sse.router, prefix="/api/stream", tags=["streaming"])
    - GET /api/stream/tasks/{task_id}
    - GET /api/stream/batches/{batch_id}
- 自选与标签:
  - app.include_router(favorites.router, prefix="/api", tags=["favorites"])
    - router 前缀为 "/favorites" → /api/favorites
    - GET  /api/favorites/
    - POST /api/favorites/
    - PUT  /api/favorites/{stock_code}
    - DELETE /api/favorites/{stock_code}
    - GET  /api/favorites/check/{stock_code}
    - GET  /api/favorites/tags
    - POST /api/favorites/sync-realtime
  - app.include_router(tags.router, prefix="/api", tags=["tags"])（未在搜索结果中列出具体端点）
- 股票与市场:
  - app.include_router(stocks_router.router, prefix="/api", tags=["stocks"])
    - router 前缀 "/stocks" → /api/stocks
    - GET /api/stocks/{code}/quote
    - GET /api/stocks/{code}/fundamentals
    - GET /api/stocks/{code}/kline
    - GET /api/stocks/{code}/news
  - app.include_router(multi_market_stocks_router.router, prefix="/api", tags=["multi-market"])
    - router 前缀 "/markets" → /api/markets
    - GET /api/markets
    - GET /api/markets/{market}/stocks/search
    - GET /api/markets/{market}/stocks/{code}/info
    - GET /api/markets/{market}/stocks/{code}/quote
    - GET /api/markets/{market}/stocks/{code}/daily
  - app.include_router(stock_data_router.router, tags=["stock-data"])
    - router 前缀 "/api/stock-data"
    - GET /api/stock-data/basic-info/{symbol}
    - GET /api/stock-data/quotes/{symbol}
    - GET /api/stock-data/list
    - GET /api/stock-data/combined/{symbol}
    - GET /api/stock-data/search
    - GET /api/stock-data/markets
    - GET /api/stock-data/sync-status/quotes
  - app.include_router(stock_sync_router.router, tags=["stock-sync"])
    - router 前缀 "/api/stock-sync"
    - POST /api/stock-sync/single
    - POST /api/stock-sync/batch
    - GET  /api/stock-sync/status/{symbol}
- 配置与系统:
  - app.include_router(config.router, prefix="/api", tags=["config"])
    - router 前缀 "/config" → /api/config
    - 系统/模型/数据源/数据库/设置/导入导出/默认项等大量端点（详情见代码，以下为常用）：
    - GET  /api/config/system
    - GET  /api/config/llm
    - POST /api/config/llm
    - POST /api/config/llm/set-default
    - GET  /api/config/datasource
    - POST /api/config/datasource
    - PUT  /api/config/datasource/{name}
    - DELETE /api/config/datasource/{name}
    - GET  /api/config/settings
    - GET  /api/config/settings/meta
    - PUT  /api/config/settings
    - POST /api/config/export
    - POST /api/config/import
    - （以及 providers、market-categories、model-catalog、database 等子路径的增删改查）
  - app.include_router(model_capabilities.router, tags=["model-capabilities"])
    - router 前缀 "/api/model-capabilities"
    - GET  /api/model-capabilities/default-configs
    - GET  /api/model-capabilities/depth-requirements
    - GET  /api/model-capabilities/capability-descriptions
    - GET  /api/model-capabilities/badges
    - GET  /api/model-capabilities/model/{model_name}
    - POST /api/model-capabilities/recommend
    - POST /api/model-capabilities/validate
    - POST /api/model-capabilities/batch-init
  - app.include_router(usage_statistics.router, tags=["usage-statistics"])
    - router 前缀 "/api/usage"
    - GET  /api/usage/records
    - GET  /api/usage/statistics
    - GET  /api/usage/cost/by-provider
    - GET  /api/usage/cost/by-model
    - GET  /api/usage/cost/daily
    - DELETE /api/usage/records/old
  - app.include_router(database.router, prefix="/api/system", tags=["database"])
    - router 前缀 "/database" → /api/system/database
    - GET  /api/system/database/status
    - GET  /api/system/database/stats
    - POST /api/system/database/test
    - POST /api/system/database/backup
    - GET  /api/system/database/backups
    - POST /api/system/database/import
    - POST /api/system/database/export
    - DELETE /api/system/database/backups/{backup_id}
    - POST /api/system/database/cleanup
    - POST /api/system/database/cleanup/analysis
    - POST /api/system/database/cleanup/logs
  - app.include_router(cache.router, tags=["cache"])
    - router 前缀 "/api/cache"
    - GET    /api/cache/stats
    - DELETE /api/cache/cleanup
    - DELETE /api/cache/clear
    - GET    /api/cache/details
    - GET    /api/cache/backend-info
  - app.include_router(operation_logs.router, prefix="/api/system", tags=["operation_logs"])
    - router 前缀 "/logs" → /api/system/logs
    - GET  /api/system/logs/list
    - GET  /api/system/logs/stats
    - GET  /api/system/logs/{log_id}
    - POST /api/system/logs/clear
    - POST /api/system/logs/create
    - GET  /api/system/logs/export/csv
  - app.include_router(logs.router, prefix="/api/system", tags=["logs"])
    - 注意：logs.py 定义的 router 前缀为 "/system-logs"，叠加 include 前缀后实际为：
    - GET    /api/system/system-logs/files
    - POST   /api/system/system-logs/read
    - POST   /api/system/system-logs/export
    - GET    /api/system/system-logs/statistics
    - DELETE /api/system/system-logs/files/{filename}
  - app.include_router(system_config_router.router, prefix="/api/system", tags=["system"])
    - GET /api/system/config/summary
    - GET /api/system/config/validate
- 通知:
  - app.include_router(notifications_router.router, prefix="/api", tags=["notifications"])
    - GET  /api/notifications
    - GET  /api/notifications/unread_count
    - POST /api/notifications/{notif_id}/read
    - POST /api/notifications/read_all
    - GET  /api/notifications/debug/redis_pool
  - app.include_router(websocket_notifications_router.router, prefix="/api", tags=["websocket"])
    - GET /api/ws/stats
- 调度器:
  - app.include_router(scheduler_router.router, tags=["scheduler"])
    - router 前缀 "/api/scheduler"
    - GET  /api/scheduler/jobs
    - GET  /api/scheduler/jobs/{job_id}
    - PUT  /api/scheduler/jobs/{job_id}/metadata
    - POST /api/scheduler/jobs/{job_id}/pause
    - POST /api/scheduler/jobs/{job_id}/resume
    - POST /api/scheduler/jobs/{job_id}/trigger
    - GET  /api/scheduler/jobs/{job_id}/history
    - GET  /api/scheduler/history
    - GET  /api/scheduler/stats
    - GET  /api/scheduler/health
    - GET  /api/scheduler/executions
    - GET  /api/scheduler/jobs/{job_id}/executions
    - GET  /api/scheduler/jobs/{job_id}/execution-stats
    - POST /api/scheduler/executions/{execution_id}/cancel
    - POST /api/scheduler/executions/{execution_id}/mark-failed
    - DELETE /api/scheduler/executions/{execution_id}
- 同步/多源同步:
  - app.include_router(sync_router.router)（未在本次搜索结果中定位具体端点）
  - app.include_router(multi_source_sync.router)
    - router 前缀 "/api/sync/multi-source"
    - GET  /api/sync/multi-source/sources/status
    - GET  /api/sync/multi-source/sources/current
    - GET  /api/sync/multi-source/status
    - POST /api/sync/multi-source/stock_basics/run
    - POST /api/sync/multi-source/test-sources
    - GET  /api/sync/multi-source/recommendations
    - GET  /api/sync/multi-source/history
    - DELETE /api/sync/multi-source/cache
- 多周期同步/历史/财务/新闻/社媒/内部消息:
  - app.include_router(multi_period_sync.router, tags=["multi-period-sync"])
    - router 前缀 "/api/multi-period-sync"
    - POST /api/multi-period-sync/start
    - POST /api/multi-period-sync/start-daily
    - POST /api/multi-period-sync/start-weekly
    - POST /api/multi-period-sync/start-monthly
    - POST /api/multi-period-sync/start-all-history
    - POST /api/multi-period-sync/start-incremental
    - GET  /api/multi-period-sync/statistics
    - GET  /api/multi-period-sync/period-comparison/{symbol}
    - GET  /api/multi-period-sync/supported-periods
    - GET  /api/multi-period-sync/health
  - app.include_router(historical_data.router, tags=["historical-data"])
    - router 前缀 "/api/historical-data"
    - GET  /api/historical-data/query/{symbol}
    - POST /api/historical-data/query
    - GET  /api/historical-data/latest-date/{symbol}
    - GET  /api/historical-data/statistics
    - GET  /api/historical-data/compare/{symbol}
    - GET  /api/historical-data/health
  - app.include_router(financial_data.router, tags=["financial-data"])
    - router 前缀 "/api/financial-data"
    - GET  /api/financial-data/query/{symbol}
    - GET  /api/financial-data/latest/{symbol}
    - GET  /api/financial-data/statistics
    - POST /api/financial-data/sync/start
    - POST /api/financial-data/sync/single
    - GET  /api/financial-data/sync/statistics
    - GET  /api/financial-data/health
  - app.include_router(news_data.router, tags=["news-data"])
    - router 前缀 "/api/news-data"
    - GET  /api/news-data/query/{symbol}
    - POST /api/news-data/query
    - GET  /api/news-data/latest
    - GET  /api/news-data/search
    - GET  /api/news-data/statistics
    - POST /api/news-data/sync/start
    - POST /api/news-data/sync/single
  - app.include_router(social_media.router, tags=["social-media"])
    - router 前缀 "/api/social-media"
    - POST /api/social-media/save
    - POST /api/social-media/query
    - GET  /api/social-media/latest/{symbol}
    - GET  /api/social-media/search
    - GET  /api/social-media/statistics
    - GET  /api/social-media/platforms
    - GET  /api/social-media/sentiment-analysis/{symbol}
    - GET  /api/social-media/health
  - app.include_router(internal_messages.router, tags=["internal-messages"])
    - router 前缀 "/api/internal-messages"
    - POST /api/internal-messages/save
    - POST /api/internal-messages/query
    - GET  /api/internal-messages/latest/{symbol}
    - GET  /api/internal-messages/search
    - GET  /api/internal-messages/research-reports/{symbol}
    - GET  /api/internal-messages/analyst-notes/{symbol}
    - GET  /api/internal-messages/statistics
    - GET  /api/internal-messages/message-types
    - GET  /api/internal-messages/categories
    - GET  /api/internal-messages/health
- 数据源初始化:
  - app.include_router(tushare_init.router, prefix="/api", tags=["tushare-init"])
    - router 前缀 "/api/tushare-init"
    - GET  /api/tushare-init/status
    - GET  /api/tushare-init/initialization-status
    - POST /api/tushare-init/start-basic
    - POST /api/tushare-init/start-full
    - POST /api/tushare-init/stop
  - app.include_router(akshare_init.router, prefix="/api", tags=["akshare-init"])
    - router 前缀 "/api/akshare-init"
    - GET  /api/akshare-init/status
    - GET  /api/akshare-init/connection-test
    - POST /api/akshare-init/start-full
    - POST /api/akshare-init/start-basic-sync
    - GET  /api/akshare-init/initialization-status
    - POST /api/akshare-init/stop
  - app.include_router(baostock_init.router, prefix="/api", tags=["baostock-init"])
    - router 前缀 "/api/baostock-init"
    - GET  /api/baostock-init/status
    - GET  /api/baostock-init/connection-test
    - POST /api/baostock-init/start-full
    - POST /api/baostock-init/start-basic
    - GET  /api/baostock-init/initialization-status
    - POST /api/baostock-init/stop
    - GET  /api/baostock-init/service-status
- 模拟交易:
  - app.include_router(paper_router.router, prefix="/api", tags=["paper"])
    - router 前缀 "/api/paper"
    - GET  /api/paper/account
    - POST /api/paper/order
    - GET  /api/paper/positions
    - GET  /api/paper/orders
    - POST /api/paper/reset

---

## 2. 前端实际调用的接口（frontend/src）

发现调用点（fetch/axios）：
- GET  /api/health
  - frontend/src/stores/app.ts（两处：一次 GET，另一次带 AbortController）
- GET  /api/system/config/validate
  - frontend/src/components/ConfigValidator.vue（axios.get）
  - frontend/src/App.vue（axios.get）
- 报告相关
  - GET  /api/reports/list?{query} — frontend/src/views/Reports/index.vue
  - GET  /api/reports/{reportId}/detail — frontend/src/views/Reports/ReportDetail.vue
  - GET  /api/reports/{reportId}/download?format={format}
    - frontend/src/views/Reports/ReportDetail.vue
    - frontend/src/views/Reports/index.vue
    - frontend/src/views/Dashboard/index.vue
    - frontend/src/views/Analysis/SingleAnalysis.vue
  - DELETE /api/reports/{reportId} — frontend/src/views/Reports/index.vue
- 分析/结果下载
  - GET  /api/analysis/tasks/{task_id}/result — frontend/src/views/Analysis/SingleAnalysis.vue

备注：
- 前端校验配置使用的是 /api/system/config/validate（后端 system_config 路由）。
- 报告模块下载接口会附加 Authorization 头，请确保登录态存在。

---

## 3. 脚本与测试中使用的接口（scripts/ 与 tests/）

按功能聚合常用端点（示例来源：搜索结果片段；并非穷举重复项）：

- 健康检查
  - GET /api/health（多处脚本/测试）
- 认证
  - POST /api/auth/login（大量测试/脚本使用）
- 分析
  - POST /api/analysis/single
  - GET  /api/analysis/tasks/{task_id}/status
  - GET  /api/analysis/tasks/{task_id}/result
  - GET  /api/analysis/tasks（部分测试）
  - POST /api/analysis/batch（批量分析用例）
- 报告
  - GET  /api/reports/list
  - GET  /api/reports/{report_id}/detail
  - GET  /api/reports/{report_id}/download?format=markdown
  - GET  /api/reports/{report_id}/content/{module}
  - DELETE /api/reports/{report_id}
- 调度器
  - GET  /api/scheduler/jobs
  - GET  /api/scheduler/jobs/{job_id}
  - PUT  /api/scheduler/jobs/{job_id}/metadata
  - POST /api/scheduler/jobs/{job_id}/pause|resume|trigger
  - GET  /api/scheduler/history
  - GET  /api/scheduler/stats
  - GET  /api/scheduler/health
- 配置
  - GET  /api/config/settings
  - GET  /api/config/settings/meta
- 同步/数据
  - POST /api/sync/multi-source/stock_basics/run
  - GET  /api/sync/stock_basics/status（历史脚本引用，现由 multi-source 路由统一）
  - POST /api/multi-period-sync/start-incremental?days_back=30
  - POST /api/financial-data/sync/start
  - POST /api/news-data/sync/start
  - GET  /api/sync/multi-source/status
- 行业/筛选
  - GET  /api/screening/industries
  - POST /api/screening/run

示例来源文件（节选）：
- scripts/debug/quick_test_stock_code.py, scripts/test_api_report_000002.py, scripts/test_scheduler_management.py,
  scripts/maintenance/restart_api_and_test.py, scripts/manual_sync_trigger.py, scripts/test_frontend_api.py,
  tests/test_frontend_backend_integration.py, tests/test_reports_api.py, tests/test_batch_analysis_planA.py,
  tests/test_industries_api.py, tests/test_api_analysis.py, tests/test_existing_results.py 等。

---

## 4. 第三方外部 HTTP API 调用（显式 URL）

在项目脚本/文档中出现的外部服务调用（用于连通性或密钥校验等）：
- DeepSeek
  - GET  https://api.deepseek.com/v1/models
- 阿里云 DashScope
  - POST https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation
- Google Generative Language
  - GET  https://generativelanguage.googleapis.com/v1beta/models?key={API_KEY}
- OpenAI
  - GET  https://api.openai.com/v1/models
- 百度千帆（Qianfan）
  - POST https://qianfan.baidubce.com/v2/chat/completions
  - POST https://aip.baidubce.com/oauth/2.0/token（脚本中以 token_url 参数构建）
- 其他示例/连通性测试
  - GET  https://httpbin.org/headers（UA 检查）
  - GET  https://82.push2.eastmoney.com（连通测试，示例出现在文档中）

说明：
- 以上 URL 多来自 scripts/* 与 docs/* 用于验证 API Key 或网络连通性，并非后端对外暴露接口。
- 数据源适配模块中还存在通过变量拼接 URL 的请求（如 AlphaVantage/Yahoo/EastMoney 等），因未在静态字符串中出现完整 URL，本文不一一展开。

---

## 5. 备注与潜在差异

- 日志模块路径差异：
  - 代码实现：/api/system/system-logs/*
  - 历史文档中出现：/api/system/logs/*
  - 以当前代码（logs.py 前缀 "/system-logs" + include 前缀 "/api/system"）为准。
- 测试中出现的旧路径（如 /api/analysis/task/{task_id}）已被新路径（/api/analysis/tasks/{task_id}/...）所替代。
- 若需严格校验“调用覆盖率”，可进一步统计每个端点在前端与测试中的出现次数。

---

## 6. 生成方法（简述）

- 扫描 router 定义：app/routers 目录下 APIRouter 与 @router.<method> 装饰器
- 结合 app/main.py 的 include_router 前缀计算实际生效路径
- 扫描前端 fetch/axios 调用：frontend/src
- 扫描脚本与测试中的 requests/httpx/aiohttp 调用：scripts 与 tests

如需继续维护本清单，可按上述方法定期更新。
