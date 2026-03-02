// 情绪周期类型
export type EmotionPhase = 
  | 'ice'      // 冰点期
  | 'recovery' // 复苏期
  | 'ferment'  // 发酵期
  | 'peak'     // 高潮期
  | 'diverge'  // 分歧期
  | 'decline'; // 退潮期

export interface EmotionPhaseData {
  id: EmotionPhase;
  name: string;
  color: string;
  bgColor: string;
  features: string;
  strategy: string;
  position: string;
}

// 市场数据
export interface MarketData {
  limitUpCount: number;
  limitDownCount: number;
  brokenBoardRate: number;
  premiumRate: number;
  advanceRate1to2: number;
  advanceRate2to3: number;
  maxHeight: number;
}

// 四维选股
export interface ThemeAnalysis {
  score: number;
  mainTheme: string;
  limitUpCount: number;
  ladderStructure: string;
  midCapStarted: boolean;
}

export interface StockCharacter {
  score: number;
  yearlyLimitUpCount: number;
  maxConsecutiveBoards: number;
  repairRate: number;
  avgPremium: number;
  marketCap: string;
}

export interface TechnicalSignal {
  score: number;
  sealRatio: number;
  sealTime: string;
  turnoverRate: number;
  pattern: string;
}

export interface FundVerification {
  score: number;
  dragonTigerList: string;
  institutionNetBuy: number;
  seatQuality: string;
  relayExpectation: string;
}

export interface FourDimensionAnalysis {
  theme: ThemeAnalysis;
  character: StockCharacter;
  technical: TechnicalSignal;
  fund: FundVerification;
  totalScore: number;
}

// 买卖点策略
export interface BuyStrategy {
  level: 1 | 2 | 3;
  name: string;
  scenario: string;
  conditions: string[];
  operation: string;
  position: string;
  status: 'pending' | 'executable' | 'executed' | 'expired';
}

export interface SellStrategy {
  level: 1 | 2 | 3;
  name: string;
  conditions: string[];
  operation: string;
  status: 'pending' | 'triggered' | 'executed';
}

// 仓位管理
export interface PositionConfig {
  totalPosition: number;
  suggestedRange: [number, number];
  leaderPosition: number;
  followerPosition: number;
  cashPosition: number;
  riskLevel: 'low' | 'medium' | 'high';
}

// 复盘Checklist
export interface ChecklistItem {
  id: string;
  title: string;
  completed: boolean;
}

export interface ChecklistStep {
  id: number;
  title: string;
  duration: string;
  items: ChecklistItem[];
}

// 风险控制
export interface RiskRule {
  id: string;
  title: string;
  enabled: boolean;
  triggered: boolean;
}

export interface RiskLimit {
  type: 'daily' | 'weekly' | 'monthly';
  current: number;
  limit: number;
  percentage: number;
}

// AI分析
export interface AIAnalysis {
  status: 'analyzing' | 'completed' | 'error';
  emotionPhase: EmotionPhase;
  emotionDay: number;
  recommendedThemes: string[];
  targetStock: {
    name: string;
    code: string;
    boards: number;
    type: string;
  };
  suggestion: string;
  confidence: number;
}

// 连板天梯
export interface LadderStock {
  code: string;
  name: string;
  boards: number;
  theme: string;
  change: number;
  volume: number;
}

export interface LadderLevel {
  level: number;
  stocks: LadderStock[];
}
