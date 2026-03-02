import type { EmotionPhaseData, BuyStrategy, SellStrategy, ChecklistStep, RiskRule } from '@/types';

// 情绪周期六阶段数据
export const emotionPhases: EmotionPhaseData[] = [
  {
    id: 'ice',
    name: '冰点期',
    color: '#00d4ff',
    bgColor: 'rgba(0, 212, 255, 0.15)',
    features: '涨停数<30，连板高度≤3，炸板率>40%',
    strategy: '空仓观望，只试错首板',
    position: '<20%'
  },
  {
    id: 'recovery',
    name: '复苏期',
    color: '#00c8c8',
    bgColor: 'rgba(0, 200, 200, 0.15)',
    features: '出现地天板/反包，跌停数减少',
    strategy: '试错新题材首板，1进2',
    position: '20-40%'
  },
  {
    id: 'ferment',
    name: '发酵期',
    color: '#a855f7',
    bgColor: 'rgba(168, 85, 247, 0.15)',
    features: '主线明确，梯队完整（4321），中军启动',
    strategy: '重仓主线龙头，做1进2、2进3',
    position: '60-80%'
  },
  {
    id: 'peak',
    name: '高潮期',
    color: '#ff2d2d',
    bgColor: 'rgba(255, 45, 45, 0.15)',
    features: '满屏涨停，连板高度>7，后排补涨',
    strategy: '持有龙头，不做后排，准备撤退',
    position: '逐步减仓'
  },
  {
    id: 'diverge',
    name: '分歧期',
    color: '#ffb800',
    bgColor: 'rgba(255, 184, 0, 0.15)',
    features: '龙头炸板，天地板出现，板块分化',
    strategy: '只去弱留强，不做新开仓',
    position: '<30%'
  },
  {
    id: 'decline',
    name: '退潮期',
    color: '#6b7280',
    bgColor: 'rgba(107, 114, 128, 0.15)',
    features: 'A杀普遍，核按钮，连续跌停',
    strategy: '绝对空仓，等待冰点',
    position: '0%'
  }
];

// 买入策略
export const buyStrategies: BuyStrategy[] = [
  {
    level: 1,
    name: '预判性买入',
    scenario: '发酵期早期，确认新主线',
    conditions: [
      '板块内已有2家一字板（强度确认）',
      '标的为板块内中军或历史龙头',
      '竞价高开3-5%，量能匹配'
    ],
    operation: '竞价直接挂涨停价买入（9:25前委托）',
    position: '20%',
    status: 'pending'
  },
  {
    level: 2,
    name: '确认性买入',
    scenario: '发酵期明确，龙头已现',
    conditions: [
      '龙头已3连板以上',
      '标的为同题材1进2或2进3',
      '分时突破日内高点，量能持续'
    ],
    operation: '打板买入（回封瞬间确认）',
    position: '40%',
    status: 'executable'
  },
  {
    level: 3,
    name: '套利性买入',
    scenario: '高潮期，龙头已高，做补涨',
    conditions: [
      '同题材低位首板（<3板）',
      '价格低于10元（散户偏好）',
      '流通市值<30亿（易拉升）'
    ],
    operation: '首板炸板回封或次日竞价弱转强',
    position: '20%',
    status: 'pending'
  }
];

// 卖出策略
export const sellStrategies: SellStrategy[] = [
  {
    level: 1,
    name: '主动止盈',
    conditions: [
      '连板高度达到市场前3',
      '次日竞价封单<昨日50%（强度衰减）',
      '同题材出现跌停（板块退潮信号）'
    ],
    operation: '集合竞价挂涨停价卖出50%',
    status: 'pending'
  },
  {
    level: 2,
    name: '被动止盈',
    conditions: [
      '开盘未涨停且跌破分时均线',
      '30分钟内未回封',
      '板块内跟风股批量炸板'
    ],
    operation: '反弹至均价线附近清仓',
    status: 'pending'
  },
  {
    level: 3,
    name: '止损纪律',
    conditions: [
      '打板当日炸板且收盘未回封 → 次日集合竞价直接核按钮',
      '买入后次日低开>3% → 开盘立即止损',
      '连板中断且收阴线 → 无论盈亏次日离场'
    ],
    operation: '单笔亏损控制在-7%以内',
    status: 'pending'
  }
];

// 复盘Checklist
export const checklistSteps: ChecklistStep[] = [
  {
    id: 1,
    title: '数据扫描',
    duration: '5分钟',
    items: [
      { id: '1-1', title: '涨停总数、连板数、炸板率记录', completed: true },
      { id: '1-2', title: '跌停家数、天地板数量记录', completed: true },
      { id: '1-3', title: '昨日涨停今日表现（溢价率）', completed: false }
    ]
  },
  {
    id: 2,
    title: '梯队梳理',
    duration: '10分钟',
    items: [
      { id: '2-1', title: '画出连板天梯（最高板至首板）', completed: true },
      { id: '2-2', title: '标注各梯队所属题材', completed: false },
      { id: '2-3', title: '识别总龙头、板块龙头、空间龙头', completed: false }
    ]
  },
  {
    id: 3,
    title: '龙虎榜分析',
    duration: '10分钟',
    items: [
      { id: '3-1', title: '查看3连板以上个股席位', completed: false },
      { id: '3-2', title: '标记机构买入、顶级游资介入标的', completed: false },
      { id: '3-3', title: '识别散户霸榜、对倒出货标的', completed: false }
    ]
  },
  {
    id: 4,
    title: '次日预案',
    duration: '5分钟',
    items: [
      { id: '4-1', title: '确定情绪周期阶段', completed: false },
      { id: '4-2', title: '列出目标股及买入条件（价格、量能）', completed: false },
      { id: '4-3', title: '设定持仓股卖点触发条件', completed: false }
    ]
  }
];

// 风险控制规则
export const riskRules: RiskRule[] = [
  { id: '1', title: '禁止无题材纯技术涨停', enabled: true, triggered: false },
  { id: '2', title: '禁止一字板首开接力（T字板除外）', enabled: true, triggered: false },
  { id: '3', title: '禁止高位缩量加速（5板后一字板）', enabled: true, triggered: false },
  { id: '4', title: '禁止跌停板撬板', enabled: true, triggered: false },
  { id: '5', title: '禁止满仓单票（单票上限50%）', enabled: true, triggered: false },
  { id: '6', title: '禁止亏损加仓（摊低成本是陷阱）', enabled: true, triggered: false },
  { id: '7', title: '禁止盘后情绪化交易', enabled: true, triggered: false }
];

// 模拟市场数据
export const mockMarketData = {
  limitUpCount: 87,
  limitDownCount: 3,
  brokenBoardRate: 18.5,
  premiumRate: 4.2,
  advanceRate1to2: 68,
  advanceRate2to3: 52,
  maxHeight: 6
};

// 模拟四维分析数据
export const mockFourDimensionData = {
  theme: {
    score: 92,
    mainTheme: '人工智能',
    limitUpCount: 23,
    ladderStructure: '完整(654321)',
    midCapStarted: true
  },
  character: {
    score: 88,
    yearlyLimitUpCount: 8,
    maxConsecutiveBoards: 7,
    repairRate: 65,
    avgPremium: 4.2,
    marketCap: '35亿'
  },
  technical: {
    score: 85,
    sealRatio: 8.5,
    sealTime: '09:32',
    turnoverRate: 18,
    pattern: '直线拉升'
  },
  fund: {
    score: 90,
    dragonTigerList: '机构+游资',
    institutionNetBuy: 8500,
    seatQuality: '优秀',
    relayExpectation: '强'
  },
  totalScore: 89
};

// 模拟连板天梯数据
export const mockLadderData = [
  {
    level: 6,
    stocks: [
      { code: '000001', name: '平安科技', boards: 6, theme: '人工智能', change: 10.02, volume: 15.8 }
    ]
  },
  {
    level: 5,
    stocks: [
      { code: '000002', name: '万科智能', boards: 5, theme: '机器人', change: 9.98, volume: 12.3 }
    ]
  },
  {
    level: 4,
    stocks: [
      { code: '600519', name: '贵州茅台', boards: 4, theme: '白酒', change: 10.01, volume: 8.5 },
      { code: '000858', name: '五粮液', boards: 4, theme: '白酒', change: 9.95, volume: 9.2 }
    ]
  },
  {
    level: 3,
    stocks: [
      { code: '002230', name: '科大讯飞', boards: 3, theme: '人工智能', change: 10.00, volume: 22.1 },
      { code: '300024', name: '机器人', boards: 3, theme: '机器人', change: 9.89, volume: 18.6 },
      { code: '000063', name: '中兴通讯', boards: 3, theme: '5G', change: 10.03, volume: 14.2 }
    ]
  },
  {
    level: 2,
    stocks: [
      { code: '002594', name: '比亚迪', boards: 2, theme: '新能源', change: 9.99, volume: 25.3 },
      { code: '300750', name: '宁德时代', boards: 2, theme: '新能源', change: 10.01, volume: 19.8 },
      { code: '000725', name: '京东方A', boards: 2, theme: '面板', change: 9.92, volume: 11.5 },
      { code: '600887', name: '伊利股份', boards: 2, theme: '消费', change: 10.05, volume: 7.2 }
    ]
  },
  {
    level: 1,
    stocks: [
      { code: '000538', name: '云南白药', boards: 1, theme: '医药', change: 10.02, volume: 6.8 },
      { code: '600276', name: '恒瑞医药', boards: 1, theme: '医药', change: 9.97, volume: 8.1 },
      { code: '002415', name: '海康威视', boards: 1, theme: '安防', change: 10.00, volume: 13.4 },
      { code: '000333', name: '美的集团', boards: 1, theme: '家电', change: 9.88, volume: 5.6 },
      { code: '600000', name: '浦发银行', boards: 1, theme: '银行', change: 10.03, volume: 4.2 }
    ]
  }
];

// 模拟AI分析数据
export const mockAIAnalysis = {
  status: 'completed' as const,
  emotionPhase: 'ferment' as const,
  emotionDay: 3,
  recommendedThemes: ['人工智能', '机器人概念'],
  targetStock: {
    name: '平安科技',
    code: '000001',
    boards: 6,
    type: '总龙头'
  },
  suggestion: '明日竞价介入或打板确认',
  confidence: 87
};
