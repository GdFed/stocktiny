import { useState, useEffect, useRef } from 'react';
import { useRiskRules } from '@/hooks/api/useRiskRules';
import { Shield, XCircle, AlertTriangle, TrendingDown, Ban } from 'lucide-react';
// Progress component imported for future use

interface RiskLimit {
  type: 'daily' | 'weekly' | 'monthly';
  label: string;
  current: number;
  limit: number;
}

export function RiskControl() {
  const [isVisible, setIsVisible] = useState(false);
  const { data: rules } = useRiskRules();
  const rulesList = rules ?? [];
  const sectionRef = useRef<HTMLElement>(null);

  const riskLimits: RiskLimit[] = [
    { type: 'daily', label: '单日回撤', current: -2.5, limit: -5 },
    { type: 'weekly', label: '单周回撤', current: -5, limit: -10 },
    { type: 'monthly', label: '单月回撤', current: -8, limit: -20 }
  ];

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

  // 计算风险进度百分比
  const getRiskPercentage = (current: number, limit: number): number => {
    return Math.min(Math.abs(current / limit) * 100, 100);
  };

  // 获取风险颜色
  const getRiskColor = (percentage: number): string => {
    if (percentage < 50) return '#00c800';
    if (percentage < 80) return '#ffb800';
    return '#ff2d2d';
  };

  return (
    <section ref={sectionRef} className="py-8">
      <div className="grid lg:grid-cols-2 gap-6">
        {/* 绝对禁止清单 */}
        <div
          className={`bg-gradient-card rounded-2xl p-6 border border-white/10 transition-all duration-500 ${
            isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'
          }`}
        >
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-[#ff2d2d]/20 flex items-center justify-center">
              <Ban className="w-5 h-5 text-[#ff2d2d]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">绝对禁止清单</h2>
              <p className="text-xs text-white/50">触碰即违规，严格执行</p>
            </div>
          </div>

          {/* 禁止规则列表 */}
          <div className="space-y-2">
            {rulesList.map((rule, index) => (
              <div
                key={rule.id}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-all duration-500 ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                } ${
                  rule.triggered
                    ? 'bg-[#ff2d2d]/10 border-[#ff2d2d]/30'
                    : 'bg-white/5 border-white/5 hover:border-white/10'
                }`}
                style={{ transitionDelay: `${100 + index * 50}ms` }}
              >
                <XCircle
                  className={`w-5 h-5 flex-shrink-0 ${
                    rule.triggered ? 'text-[#ff2d2d]' : 'text-white/30'
                  }`}
                />
                <span
                  className={`text-sm ${
                    rule.triggered ? 'text-[#ff2d2d]' : 'text-white/70'
                  }`}
                >
                  {rule.title}
                </span>
                {rule.triggered && (
                  <span className="ml-auto px-2 py-0.5 rounded text-xs bg-[#ff2d2d] text-white">
                    已触发
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* 警告提示 */}
          <div className="mt-4 p-3 rounded-lg bg-[#ff2d2d]/5 border border-[#ff2d2d]/20">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-[#ff2d2d] flex-shrink-0 mt-0.5" />
              <p className="text-xs text-white/70">
                以上规则为生存底线，任何情况下都不可违反。一旦触发，立即停止交易并复盘。
              </p>
            </div>
          </div>
        </div>

        {/* 生存底线监控 */}
        <div
          className={`bg-gradient-card rounded-2xl p-6 border border-white/10 transition-all duration-500 ${
            isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
          }`}
          style={{ transitionDelay: '150ms' }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-[#ffb800]/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-[#ffb800]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">生存底线监控</h2>
              <p className="text-xs text-white/50">回撤控制，保命底线</p>
            </div>
          </div>

          {/* 回撤监控 */}
          <div className="space-y-5">
            {riskLimits.map((limit, index) => {
              const percentage = getRiskPercentage(limit.current, limit.limit);
              const color = getRiskColor(percentage);
              const isWarning = percentage >= 80;

              return (
                <div
                  key={limit.type}
                  className={`transition-all duration-500 ${
                    isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                  }`}
                  style={{ transitionDelay: `${200 + index * 100}ms` }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <TrendingDown className="w-4 h-4 text-white/50" />
                      <span className="text-sm text-white/70">{limit.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className="text-sm font-bold font-mono"
                        style={{ color }}
                      >
                        {limit.current}%
                      </span>
                      <span className="text-xs text-white/30">
                        / {limit.limit}%
                      </span>
                    </div>
                  </div>

                  <div className="relative h-3 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="absolute left-0 top-0 h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: color,
                        boxShadow: isWarning ? `0 0 10px ${color}` : 'none'
                      }}
                    />
                    {/* 警戒线标记 */}
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-white/30"
                      style={{ left: '80%' }}
                    />
                  </div>

                  <div className="flex justify-between mt-1">
                    <span className="text-xs text-white/30">0%</span>
                    <span className="text-xs text-white/30">警戒线 80%</span>
                    <span className="text-xs text-white/30">{limit.limit}%</span>
                  </div>

                  {isWarning && (
                    <div className="mt-2 p-2 rounded bg-[#ff2d2d]/10 border border-[#ff2d2d]/30">
                      <p className="text-xs text-[#ff2d2d]">
                        警告：接近{limit.label}上限，建议立即减仓或停止交易
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* 总览 */}
          <div
            className={`mt-6 p-4 rounded-xl bg-white/5 border border-white/10 transition-all duration-500 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
            style={{ transitionDelay: '500ms' }}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/70">当前风险状态</span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#00c800]" />
                <span className="text-sm font-medium text-[#00c800]">正常</span>
              </div>
            </div>
            <p className="text-xs text-white/50 mt-2">
              所有风险指标均在安全范围内，可正常交易。请继续保持纪律。
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
