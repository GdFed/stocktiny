# 数据基础蓝图（Data Foundation）

目标
- 基于现有项目功能与核心接口（见 src/hooks/api/README.md 与 src/types/index.ts），梳理支撑这些功能所需的底层数据域、来源、刷新策略、校验与治理，形成可用于后端落地与数据平台建设的蓝图。
- 约束：前端契约以 src/types/index.ts 为准；接口以 src/hooks/api/README.md 列表为准；当前前端具备 Mock 兜底与 validate 校验。

范围总览（数据域 → 接口 → 前端类型）
- 市场快照（Market Snapshot） → GET /market/summary → MarketData
- 情绪周期（Emotion Cycle） → GET /emotion/phases → EmotionPhaseData[]
- 连板天梯（Ladder Board） → GET /ladder/levels → LadderLevel[]
- 四维选股（Four-Dimension） → GET /four-dimension/summary → FourDimensionAnalysis
- 策略引擎（Strategies） → GET /strategies → BuyStrategy[]/SellStrategy[]（封装为 StrategiesData）
- 仓位管理（Position Config） →（接口由产品决定，当前前端使用配置/推导）→ PositionConfig
- 风险控制（Risk Control） → GET /risk/rules → RiskRule[]（扩展 RiskLimit）
- 复盘清单（Review Checklist） → GET /checklist/steps → ChecklistStep[]
- AI 智能分析（AI Analysis） → GET /ai/analysis → AIAnalysis

环境与调用约束（前端）
- HTTP 基础：src/services/http.ts，Base URL 由 VITE_API_BASE 决定；超时由 VITE_API_TIMEOUT 控制。
- 校验与兜底：useFetchWithFallback(validate)，失败不抛错，返回 mock 并标记 isFallback=true。
- 建议后端遵守：200 + JSON；结构对齐 types；错误码明确；SSE/流式需提供事件结构。

---

一、股票主数据（Security Master）

用途
- 为各域提供统一的标的元信息：代码、名称、交易所、流通/总股本、市值、板数（boards）、主题标签、行业、是否中军（mid-cap proxy）等。
- 关联：LadderStock、AIAnalysis.targetStock、FourDimensionAnalysis.character/theme、策略域的筛选条件。

核心字段建议
- identity：code（如 000001.SZ/SH）、exchange（SZ/SH）、name、isin（可选）、status（listed/suspended）。
- attributes：marketCap、floatCap、boards（当日连板数）、themeTags[]（主题/板块标签）、industry、riskFlags[]。
- liquidity：avgTurnover20d、avgPremium5d、repairRate（历史回修率）、yearlyLimitUpCount、maxConsecutiveBoards。
- governance：source（exch/vendor）、snapshotTs、validFrom/validTo、version。

刷新与一致性
- 主数据每日收盘后全量刷新；事件型变更（停复牌/更名/并表）实时或 T+1 更新。
- 提供变更日志（CDC），确保 FourDimension/策略计算的可重放性。

---

二、市场快照与核心指标（MarketData）

对应类型
- MarketData：limitUpCount、limitDownCount、brokenBoardRate、premiumRate、advanceRate1to2、advanceRate2to3、maxHeight。

定义与计算
- limitUpCount：当日涨停家数（包含一字板，是否剔除 ST 需在元数据中声明）。
- limitDownCount：当日跌停家数。
- brokenBoardRate：炸板率（含义需统一：前一日涨停当日未封？或当日盘中炸板），建议公式与口径固定。
- premiumRate：昨日涨停次日集合竞价平均溢价率。
- advanceRate1to2/2to3：连板推进率（从首板/二板到更高板的比例）。
- maxHeight：当日空间高度（最高连板数）。

时间粒度与刷新
- 盘中滚动（1-5 分钟快照）、收盘汇总（EOD）。
- 提供 snapshotTs，前端可显示“上次更新时间”。

数据质量
- 来源一致性（交易所/券商/聚合商）；容错策略（缺数据时降级为上次有效值 + 标记 stale）。

---

三、情绪周期（EmotionPhaseData）

对应类型
- EmotionPhase 枚举：'ice'/'recovery'/'ferment'/'peak'/'diverge'/'decline'
- EmotionPhaseData：id/name/color/bgColor/features/strategy/position（展示与建议文案）

生成规则（推荐）
- 输入：MarketData（limitUp/limitDown/maxHeight/炸板率/溢价率/推进率）
- 判定：以阈值和趋势组合判定阶段（示例）
  - 冰点：limitUpCount < 30 且 brokenBoardRate > 40%
  - 复苏：limitUpCount 回升、premiumRate > 0、advanceRate1to2 上升
  - 发酵：主线明确、maxHeight 上升、推进率稳定高
  - 高潮：limitUp 满屏、maxHeight ≥ 7
  - 分歧：龙头炸板/天地板频现、brokenBoardRate 上升
  - 退潮：普遍 A 杀、premiumRate 转负、推进率骤降
- 输出：阶段文案与建议；position 为仓位建议区间（如 20-40% 等）。

刷新策略
- 盘中与收盘两档；收盘锁定 EOD 阶段，用于次日预案。

---

四、连板天梯（LadderLevel/LadderStock）

对应类型
- LadderLevel：level（板数）、stocks[]
- LadderStock：code/name/boards/theme/change/volume

生成规则与依赖
- 输入：当日涨停榜与连板统计、逐日板序（计算连板是否连续）、龙虎榜/席位质量（用于后续 fund seatQuality）。
- 关联：themeTags（主数据）、boards（从逐日连板推导）。
- 派生：空间龙（max boards）、板块龙（theme 聚合下最高 boards）、中军（midCapStarted=true 的主题主力标的）。

刷新策略
- 盘中实时（连板变更与炸板回退）；收盘快照。

一致性与审计
- 提供每只股票的连板轨迹（日期→板数），便于后续验证与回放。

---

五、四维选股（FourDimensionAnalysis）

对应类型
- ThemeAnalysis：score/mainTheme/limitUpCount/ladderStructure/midCapStarted
- StockCharacter：score/yearlyLimitUpCount/maxConsecutiveBoards/repairRate/avgPremium/marketCap
- TechnicalSignal：score/sealRatio/sealTime/turnoverRate/pattern
- FundVerification：score/dragonTigerList/institutionNetBuy/seatQuality/relayExpectation
- totalScore：综合分

底层数据需求
- 主题维度（ThemeAnalysis）
  - 主题分类/词典：theme taxonomy（名称、别名、关键词、行业映射）
  - 主题热度：当日/近 n 日涨停家数、资金净流入、主线强度（龙头高度、梯队完整度）
  - 中军启动：midCapStarted（中等市值权重股是否启动）

- 选手气质（StockCharacter）
  - 历史行为：yearlyLimitUpCount、maxConsecutiveBoards、repairRate（跌后修复率）
  - 溢价：avgPremium（前一日涨停次日平均溢价）
  - 规模：marketCap（主数据），可引入流通市值分档。

- 技术结构（TechnicalSignal）
  - 当日/分时：sealRatio（封单强度）、sealTime（封板时点）、turnoverRate、pattern（形态枚举）
  - K 线/分时：平台突破、回踩确认、缩量/放量、均线结构。

- 资金验证（FundVerification）
  - 龙虎榜：席位列表（游资/机构/营业部）、净买入、席位质量（seatQuality 枚举）
  - 机构交易：institutionNetBuy（当日/近 n 日），共现关系网络（可选）
  - 接力预期：relayExpectation（结合席位质量与主题/技术同向性）

评分与版本
- 每维度提供 vX 版本化算法，配置化权重；输出 score 与解释因子（XAI 风格，便于审计）。
- totalScore = 加权聚合；保留原子分与归一化分，防止量纲混淆。

刷新策略
- 盘中技术/资金维度高频更新；主题/气质维度低频（EOD/滚动窗口）。
- 输出带 snapshotTs 与 scoreVersion。

---

六、策略引擎（BuyStrategy/SellStrategy）

对应类型
- BuyStrategy：level/name/scenario/conditions[]/operation/position/status
- SellStrategy：level/name/conditions[]/operation/status

底层数据依赖
- 触发条件绑定到四维/天梯/市场/AI：
  - 例：Level 2 确认性买入 → 技术突破（pattern）、量能持续（turnoverRate）、龙头≥3 连板（Ladder）、主题同向（Theme）、资金验证（Fund）
- 状态迁移
  - pending → executable（条件满足）→ executed（下单成功）或 expired（窗口过期）
  - 卖出：pending → triggered → executed

事件与审计
- 记录每次策略触发的证据集（指标快照/行情片段），保证可追溯与复盘。

---

七、仓位管理（PositionConfig）

对应类型
- PositionConfig：totalPosition/suggestedRange/leaderPosition/followerPosition/cashPosition/riskLevel

数据依赖与生成
- 依据 EmotionPhase 与策略级别确定总仓位与单票上限；风险规则联动降级（触发红线自动降仓）。
- riskLevel 来源：情绪阶段与市场波动（可引入波动率/回撤指标）。

持久化与合规
- 按日存储组合仓位建议与实际执行记录；保留变更轨迹。

---

八、风险控制（RiskRule/RiskLimit）

对应类型
- RiskRule：id/title/enabled/triggered
- RiskLimit：type（daily/weekly/monthly）/current/limit/percentage

数据依赖
- 来自事件与指标流：一字首开接力、高位缩量加速、跌停撬板等需从盘口/分时与连板轨迹判定。
- 配置源：策略红线库（可通过后端 CMS 管理），支持启停与参数化阈值。

日志与执行
- 触发即记录并执行降级动作；输出与前端提示保持一致（toast/状态位）。

---

九、复盘清单（ChecklistStep/ChecklistItem）

对应类型
- ChecklistStep：id/title/duration/items[]；ChecklistItem：id/title/completed

数据基础
- 清单模板库：不同阶段/账户类型的复盘模板（可配置）
- 数据绑定：每个条目关联数据视图（涨停/炸板/溢价/梯队/龙虎榜/次日预案）

刷新与归档
- 每日生成实例（绑定当日 EOD 指标与快照），支持完成度打点与历史归档。

---

十、AI 智能分析（AIAnalysis）

对应类型
- AIAnalysis：status/emotionPhase/emotionDay/recommendedThemes[]/targetStock/suggestion/confidence

输入特征（建议）
- 市场：MarketData、EmotionPhase、Ladder（空间龙/板块龙/中军）
- 四维：FourDimensionAnalysis 原子分与解释因子（theme/technical/fund/character）
- 风控：active RiskRules、风险偏好（conservative/moderate/aggressive）
- 用户偏好（可选）：行业偏好、仓位上限、避免题材等

输出与传输
- SSE/Chunk：逐 token 流式返回 suggestion；status 从 'analyzing' 渐进至 'completed'
- 错误与降级：结构校验失败或网络错误 → 返回本地兜底建议（基于规则/四维的保底文案）

审计与合规
- Prompt 留痕（脱敏）、模型/参数、调用耗时、错误类型；限流与配额管理。

---

横切能力与治理

数据质量与校验
- 前端 validate 规则需在后端强化：schema 校验（zod/JSON Schema）、字段范围与枚举、空值策略。
- 针对评分类输出，提供解释因子与校验报告（防止“黑盒”）。

缓存与一致性
- 市场快照/连板/资金为高频数据：Redis/LRU + TTL；防抖与去重。
- 主题/气质等低频数据：数据库持久化（PostgreSQL/ClickHouse），支持历史查询。

ID 与命名规范
- 股票：code 统一 '000001.SZ' 格式（或 exchange + code 分列）；主题使用规范化 slug；席位使用标准 ID。
- 风险规则/策略：id 使用带版本的命名（risk.no_open_one_word.v1）。

时间与时区
- 全链路使用 UTC 存储 + Asia/Shanghai 显示；提供 snapshotTs/timeWindow 字段。

合规与隐私
- 禁止在前端暴露 Key；后端代理模型与行情；必要留痕（脱敏）；速率限制与访问控制。

---

接口层与存储层建议

API 契约（与前端保持）
- GET /market/summary → MarketData（盘中 + EOD）
- GET /emotion/phases → EmotionPhaseData[]（依 MarketData 判定）
- GET /ladder/levels → LadderLevel[]（盘中 + EOD）
- GET /four-dimension/summary → FourDimensionAnalysis（含 scoreVersion）
- GET /risk/rules → RiskRule[]；GET /risk/limits → RiskLimit[]（可选）
- GET /strategies → { buy: BuyStrategy[]; sell: SellStrategy[] }
- GET /checklist/steps → ChecklistStep[]
- GET /ai/analysis → AIAnalysis（SSE: /ai/analysis/stream）

存储选型
- OLTP：PostgreSQL（主数据、规则、模板、日内状态）
- 时序/分析：ClickHouse（行情/K 线/盘口/溢价/推进率/龙虎榜明细）
- 缓存：Redis（快照/榜单/连板）、SSE 会话状态
- 对象存储：审计日志/模型提示留痕（加密）

核心表（示例）
- security_master(security_id, code, exchange, name, market_cap, float_cap, industry, status, attrs_json, valid_from, valid_to)
- theme_taxonomy(theme_id, name, aliases[], keywords[], industry_map, status)
- market_snapshot(ts, limit_up, limit_down, broken_board_rate, premium_rate, advance_1_to_2, advance_2_to_3, max_height, source)
- board_trajectory(code, trade_date, boards, is_broken, theme, volume, change)
- dragon_tiger(detail_id, trade_date, code, seat_id, net_buy, seat_quality, institution_flag)
- kline_daily(code, trade_date, o,h,l,c,vol,turnover_rate,seal_time,seal_ratio)
- four_dim_scores(code, ts, theme_score, character_score, technical_score, fund_score, total_score, version, factors_json)
- risk_rules(rule_id, title, enabled, params_json, version)
- position_config(date, suggested_range, leader_position, follower_position, cash_position, risk_level)
- strategies(strategy_id, type, level, name, scenario, conditions_json, operation, position, status)
- checklist_templates(step_id, title, duration, items_json)
- ai_sessions(session_id, ts, input_features_json, output_json, status, model_meta, stream_tokens_log_uri)

索引与性能
- code + trade_date/ts 复合索引；主题/席位维度二级索引；热路径 Redis 缓存（ladder、market）。

---

刷新与调度策略

调度层（示例）
- 市场快照：盘中每 1-5 分钟；收盘汇总
- 连板/龙虎榜：盘中事件驱动更新；EOD 明细入库
- 四维评分：盘中技术/资金维度滚动；EOD 聚合与版本化
- 情绪阶段：随 MarketData 更新；收盘锁定
- AI 分析：按需触发；SSE 推流；失败重试 + 降级

一致性与回退
- 后端统一兜底策略与“数据新鲜度”标识；当数据延迟/缺失时输出 stale=true 与上次有效时间。

---

错误处理与降级（与前端一致）

策略
- 网络/服务端错误 → ApiError → fallback（mock）
- 校验失败 → validate=false → fallback（不视为硬错误）
- 超时 → VITE_API_TIMEOUT 控制；Abort + ApiError；建议后端支持重试与超时日志

对齐
- 所有接口响应附带 meta：snapshotTs、stale、source、version；便于前端提示与调试。

---

版本化与实验（A/B）

- 四维评分与情绪判定提供 version 字段；灰度切换与实验对比（收益、命中率、回撤、夏普）。
- 风险规则参数化（阈值/窗口）版本管理；策略剧本按版本归档。

---

最小可用数据集（MVP）与迭代路线

MVP（优先落地）
- /market/summary（EOD 与盘中快照）
- /ladder/levels（盘中榜单与 EOD 快照）
- /four-dimension/summary（至少 technical + fund 两维评分）
- /ai/analysis（后端代理，返回 AIAnalysis 结构；前端可先非流式）
- /risk/rules（红线清单）
- /emotion/phases（由市场快照推断）

迭代增强
- 引入主数据与主题词典；完善 StockCharacter 与 ThemeAnalysis
- 龙虎榜席位画像与 seatQuality 统一枚举；引入 institutionNetBuy 明细
- SSE/Chunk 流式输出；typedText 由流驱动替代打字机模拟
- 数据新鲜度与一致性标识全面落地；缓存与去重优化
- 审计与合规体系：留痕、限流、权限

---

附录：字段字典（对齐 src/types/index.ts）

- EmotionPhase：'ice' | 'recovery' | 'ferment' | 'peak' | 'diverge' | 'decline'
- EmotionPhaseData：id/name/color/bgColor/features/strategy/position
- MarketData：limitUpCount/limitDownCount/brokenBoardRate/premiumRate/advanceRate1to2/advanceRate2to3/maxHeight
- ThemeAnalysis：score/mainTheme/limitUpCount/ladderStructure/midCapStarted
- StockCharacter：score/yearlyLimitUpCount/maxConsecutiveBoards/repairRate/avgPremium/marketCap
- TechnicalSignal：score/sealRatio/sealTime/turnoverRate/pattern
- FundVerification：score/dragonTigerList/institutionNetBuy/seatQuality/relayExpectation
- FourDimensionAnalysis：theme/character/technical/fund/totalScore
- BuyStrategy：level/name/scenario/conditions[]/operation/position/status
- SellStrategy：level/name/conditions[]/operation/status
- PositionConfig：totalPosition/suggestedRange/leaderPosition/followerPosition/cashPosition/riskLevel
- ChecklistStep/ChecklistItem：id/title/duration/items[] / id/title/completed
- RiskRule：id/title/enabled/triggered；RiskLimit：type/current/limit/percentage
- AIAnalysis：status/emotionPhase/emotionDay/recommendedThemes[]/targetStock{name/code/boards/type}/suggestion/confidence
- LadderLevel/LadderStock：level/stocks[]；code/name/boards/theme/change/volume

备注
- 所有接口建议统一返回 meta：{ snapshotTs: string(ISO), source: string, version: string, stale: boolean }。
- 环境变量：VITE_API_BASE、VITE_API_TIMEOUT；后端需提供对应配置（如 API 网关地址、SSE 心跳与超时）。
