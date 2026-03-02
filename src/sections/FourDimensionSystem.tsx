import { useState, useEffect, useRef } from 'react';
import { mockFourDimensionData } from '@/data/strategyData';
import { TrendingUp, History, BarChart3, Wallet, ChevronDown, ChevronUp } from 'lucide-react';
// Progress component imported for future use

interface DimensionCardProps {
  title: string;
  icon: React.ReactNode;
  score: number;
  color: string;
  children: React.ReactNode;
  delay: number;
  isVisible: boolean;
}

function DimensionCard({ title, icon, score, color, children, delay, isVisible }: DimensionCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        const interval = setInterval(() => {
          setDisplayScore(prev => {
            if (prev >= score) {
              clearInterval(interval);
              return score;
            }
            return prev + 1;
          });
        }, 15);
        return () => clearInterval(interval);
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [isVisible, score, delay]);

  return (
    <div
      className={`bg-[#141414] rounded-xl border border-white/10 overflow-hidden transition-all duration-500 hover:border-white/20 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {/* Header */}
      <div
        className="p-4 cursor-pointer transition-colors hover:bg-white/5"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${color}20` }}
            >
              {icon}
            </div>
            <div>
              <h3 className="text-sm font-medium text-white">{title}</h3>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-16 h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{ width: `${displayScore}%`, backgroundColor: color }}
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="text-2xl font-bold font-mono"
              style={{ color }}
            >
              {displayScore}
            </span>
            <span className="text-sm text-white/30">/100</span>
            {expanded ? (
              <ChevronUp className="w-4 h-4 text-white/50" />
            ) : (
              <ChevronDown className="w-4 h-4 text-white/50" />
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div
        className={`overflow-hidden transition-all duration-300 ${
          expanded ? 'max-h-96' : 'max-h-0'
        }`}
      >
        <div className="p-4 pt-0 border-t border-white/5">
          {children}
        </div>
      </div>
    </div>
  );
}

export function FourDimensionSystem() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const { theme, character, technical, fund, totalScore } = mockFourDimensionData;

  return (
    <section ref={sectionRef} className="py-8">
      {/* Header */}
      <div
        className={`flex items-center justify-between mb-6 transition-all duration-500 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-purple flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">四维选股系统</h2>
            <p className="text-sm text-white/50">题材 / 股性 / 技术 / 资金</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-white/50">综合评分</span>
          <span className="text-3xl font-bold text-gradient-purple font-mono">
            {totalScore}
          </span>
        </div>
      </div>

      {/* Four Dimension Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 题材强度 */}
        <DimensionCard
          title="题材强度"
          icon={<TrendingUp className="w-5 h-5 text-[#ff2d2d]" />}
          score={theme.score}
          color="#ff2d2d"
          delay={0}
          isVisible={isVisible}
        >
          <div className="space-y-3 pt-3">
            <div className="flex justify-between">
              <span className="text-xs text-white/50">主线题材</span>
              <span className="text-sm text-white font-medium">{theme.mainTheme}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-white/50">涨停家数</span>
              <span className="text-sm text-[#ff2d2d] font-mono">{theme.limitUpCount}家</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-white/50">梯队结构</span>
              <span className="text-sm text-white font-medium">{theme.ladderStructure}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-white/50">中军启动</span>
              <span className={`text-sm font-medium ${theme.midCapStarted ? 'text-[#00c800]' : 'text-[#ff2d2d]'}`}>
                {theme.midCapStarted ? '已启动' : '未启动'}
              </span>
            </div>
          </div>
        </DimensionCard>

        {/* 股性评分 */}
        <DimensionCard
          title="股性评分"
          icon={<History className="w-5 h-5 text-[#a855f7]" />}
          score={character.score}
          color="#a855f7"
          delay={100}
          isVisible={isVisible}
        >
          <div className="space-y-3 pt-3">
            <div className="flex justify-between">
              <span className="text-xs text-white/50">近一年连板</span>
              <span className="text-sm text-white font-mono">{character.yearlyLimitUpCount}次</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-white/50">历史最高</span>
              <span className="text-sm text-[#a855f7] font-mono">{character.maxConsecutiveBoards}连板</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-white/50">炸板修复率</span>
              <span className="text-sm text-white font-mono">{character.repairRate}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-white/50">次日溢价</span>
              <span className="text-sm text-[#00c800] font-mono">+{character.avgPremium}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-white/50">流通市值</span>
              <span className="text-sm text-white font-mono">{character.marketCap}</span>
            </div>
          </div>
        </DimensionCard>

        {/* 技术信号 */}
        <DimensionCard
          title="技术信号"
          icon={<BarChart3 className="w-5 h-5 text-[#00d4ff]" />}
          score={technical.score}
          color="#00d4ff"
          delay={200}
          isVisible={isVisible}
        >
          <div className="space-y-3 pt-3">
            <div className="flex justify-between">
              <span className="text-xs text-white/50">封单比</span>
              <span className="text-sm text-[#00d4ff] font-mono">{technical.sealRatio}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-white/50">封板时间</span>
              <span className="text-sm text-white font-mono">{technical.sealTime}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-white/50">换手率</span>
              <span className="text-sm text-white font-mono">{technical.turnoverRate}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-white/50">分时形态</span>
              <span className="text-sm text-white font-medium">{technical.pattern}</span>
            </div>
          </div>
        </DimensionCard>

        {/* 资金验证 */}
        <DimensionCard
          title="资金验证"
          icon={<Wallet className="w-5 h-5 text-[#ffb800]" />}
          score={fund.score}
          color="#ffb800"
          delay={300}
          isVisible={isVisible}
        >
          <div className="space-y-3 pt-3">
            <div className="flex justify-between">
              <span className="text-xs text-white/50">龙虎榜</span>
              <span className="text-sm text-white font-medium">{fund.dragonTigerList}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-white/50">机构净买</span>
              <span className="text-sm text-[#00c800] font-mono">+{fund.institutionNetBuy}万</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-white/50">席位质量</span>
              <span className="text-sm text-[#ffb800] font-medium">{fund.seatQuality}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-white/50">接力预期</span>
              <span className="text-sm text-[#00c800] font-medium">{fund.relayExpectation}</span>
            </div>
          </div>
        </DimensionCard>
      </div>
    </section>
  );
}
