import { useState, useEffect, useRef } from 'react';
import { mockLadderData } from '@/data/strategyData';
import { Trophy, Flame, ChevronRight } from 'lucide-react';

export function LadderBoard() {
  const [isVisible, setIsVisible] = useState(false);
  const [selectedStock, setSelectedStock] = useState<string | null>(null);
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

  // 获取主题颜色
  const getThemeColor = (theme: string): string => {
    const colors: Record<string, string> = {
      '人工智能': '#a855f7',
      '机器人': '#00d4ff',
      '新能源': '#00c800',
      '白酒': '#ff2d2d',
      '5G': '#ffb800',
      '面板': '#6b7280',
      '消费': '#f472b6',
      '医药': '#22d3ee',
      '安防': '#fbbf24',
      '家电': '#a78bfa',
      '银行': '#94a3b8'
    };
    return colors[theme] || '#6b7280';
  };

  return (
    <section ref={sectionRef} className="py-8">
      <div className="bg-gradient-card rounded-2xl p-6 border border-white/10">
        {/* Header */}
        <div
          className={`flex items-center justify-between mb-6 transition-all duration-500 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-purple flex items-center justify-center">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">连板天梯</h2>
              <p className="text-sm text-white/50">实时涨停梯队</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-[#ff2d2d]" />
            <span className="text-sm text-white/70">最高</span>
            <span className="text-lg font-bold text-[#ff2d2d] font-mono">
              {mockLadderData[0]?.level || 0}连板
            </span>
          </div>
        </div>

        {/* 天梯 */}
        <div className="space-y-3">
          {mockLadderData.map((levelData, levelIndex) => (
            <div
              key={levelData.level}
              className={`flex items-center gap-4 transition-all duration-500 ${
                isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'
              }`}
              style={{ transitionDelay: `${levelIndex * 100}ms` }}
            >
              {/* 连板数 */}
              <div
                className="w-14 h-14 rounded-xl flex flex-col items-center justify-center flex-shrink-0"
                style={{
                  background: levelIndex === 0
                    ? 'linear-gradient(135deg, #ff2d2d, #ff6b35)'
                    : levelIndex === 1
                    ? 'linear-gradient(135deg, #a855f7, #ff6b35)'
                    : levelIndex === 2
                    ? 'linear-gradient(135deg, #00d4ff, #a855f7)'
                    : 'rgba(255,255,255,0.05)'
                }}
              >
                <span className="text-xl font-bold text-white font-mono">
                  {levelData.level}
                </span>
                <span className="text-[10px] text-white/70">连板</span>
              </div>

              {/* 股票列表 */}
              <div className="flex-1 flex flex-wrap gap-2">
                {levelData.stocks.map((stock) => {
                  const themeColor = getThemeColor(stock.theme);
                  const isSelected = selectedStock === stock.code;

                  return (
                    <button
                      key={stock.code}
                      onClick={() => setSelectedStock(isSelected ? null : stock.code)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
                        isSelected
                          ? 'border-[#a855f7] bg-[#a855f7]/10'
                          : 'border-white/10 bg-white/5 hover:border-white/20'
                      }`}
                    >
                      <div className="text-left">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-medium text-white">
                            {stock.name}
                          </span>
                          <span className="text-xs text-white/40 font-mono">
                            {stock.code}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span
                            className="text-[10px] px-1 py-0.5 rounded"
                            style={{
                              backgroundColor: `${themeColor}20`,
                              color: themeColor
                            }}
                          >
                            {stock.theme}
                          </span>
                          <span className="text-[10px] text-[#ff2d2d] font-mono">
                            +{stock.change.toFixed(2)}%
                          </span>
                        </div>
                      </div>
                      <ChevronRight
                        className={`w-4 h-4 text-white/30 transition-transform ${
                          isSelected ? 'rotate-90' : ''
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* 图例 */}
        <div
          className={`mt-6 pt-4 border-t border-white/10 flex flex-wrap gap-4 transition-all duration-500 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
          style={{ transitionDelay: '600ms' }}
        >
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-gradient-to-br from-[#ff2d2d] to-[#ff6b35]" />
            <span className="text-xs text-white/50">总龙头</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-gradient-to-br from-[#a855f7] to-[#ff6b35]" />
            <span className="text-xs text-white/50">空间龙</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-gradient-to-br from-[#00d4ff] to-[#a855f7]" />
            <span className="text-xs text-white/50">板块龙</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-white/10" />
            <span className="text-xs text-white/50">跟风股</span>
          </div>
        </div>
      </div>
    </section>
  );
}
