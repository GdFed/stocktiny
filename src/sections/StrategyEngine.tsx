import { useState, useEffect, useRef } from 'react';
import { buyStrategies, sellStrategies } from '@/data/strategyData';
import { ArrowUpCircle, ArrowDownCircle, CheckCircle2, AlertCircle, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface StrategyCardProps {
  level: number;
  name: string;
  scenario?: string;
  conditions: string[];
  operation: string;
  position?: string;
  status: string;
  type: 'buy' | 'sell';
  delay: number;
  isVisible: boolean;
}

function StrategyCard({
  level,
  name,
  scenario,
  conditions,
  operation,
  position,
  status,
  type,
  delay,
  isVisible
}: StrategyCardProps) {
  const [expanded, setExpanded] = useState(status === 'executable' || status === 'triggered');
  
  const statusConfig = {
    pending: { color: '#6b7280', bgColor: 'rgba(107, 114, 128, 0.15)', label: '待触发' },
    executable: { color: '#a855f7', bgColor: 'rgba(168, 85, 247, 0.15)', label: '可执行' },
    triggered: { color: '#ff2d2d', bgColor: 'rgba(255, 45, 45, 0.15)', label: '已触发' },
    executed: { color: '#00c800', bgColor: 'rgba(0, 200, 0, 0.15)', label: '已执行' },
    expired: { color: '#6b7280', bgColor: 'rgba(107, 114, 128, 0.15)', label: '已过期' }
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
  const isActive = status === 'executable' || status === 'triggered';

  return (
    <div
      className={`rounded-xl border transition-all duration-500 ${
        isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
      } ${isActive ? 'border-[#a855f7] glow-purple' : 'border-white/10 hover:border-white/20'}`}
      style={{
        backgroundColor: isActive ? 'rgba(168, 85, 247, 0.05)' : '#141414',
        transitionDelay: `${delay}ms`
      }}
    >
      {/* Header */}
      <div
        className="p-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
              style={{
                backgroundColor: type === 'buy' ? 'rgba(168, 85, 247, 0.2)' : 'rgba(255, 45, 45, 0.2)',
                color: type === 'buy' ? '#a855f7' : '#ff2d2d'
              }}
            >
              {level}
            </div>
            <div>
              <h4 className="text-sm font-medium text-white">{name}</h4>
              {scenario && (
                <p className="text-xs text-white/50 mt-0.5">{scenario}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {position && (
              <span className="text-sm font-mono text-white/70">{position}</span>
            )}
            <Badge
              variant="outline"
              className="text-xs"
              style={{
                borderColor: config.color,
                color: config.color,
                backgroundColor: config.bgColor
              }}
            >
              {config.label}
            </Badge>
          </div>
        </div>
      </div>

      {/* Content */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-white/5 pt-3">
          <div className="space-y-3">
            <div>
              <p className="text-xs text-white/50 mb-2">触发条件</p>
              <ul className="space-y-1.5">
                {conditions.map((condition, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-white/30 mt-0.5 flex-shrink-0" />
                    <span className="text-xs text-white/70">{condition}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="flex items-center justify-between pt-2">
              <div>
                <p className="text-xs text-white/50 mb-1">操作策略</p>
                <p className="text-sm text-white/80">{operation}</p>
              </div>
              {isActive && (
                <Button
                  size="sm"
                  className="gap-1.5"
                  style={{
                    backgroundColor: type === 'buy' ? '#a855f7' : '#ff2d2d'
                  }}
                >
                  <Play className="w-3.5 h-3.5" />
                  执行
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function StrategyEngine() {
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

  return (
    <section ref={sectionRef} className="py-8">
      <div className="grid lg:grid-cols-2 gap-6">
        {/* 买入策略 */}
        <div
          className={`transition-all duration-500 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-[#a855f7]/20 flex items-center justify-center">
              <ArrowUpCircle className="w-5 h-5 text-[#a855f7]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">买入策略</h2>
              <p className="text-xs text-white/50">三档买入法</p>
            </div>
          </div>

          <div className="space-y-3">
            {buyStrategies.map((strategy, index) => (
              <StrategyCard
                key={strategy.level}
                level={strategy.level}
                name={strategy.name}
                scenario={strategy.scenario}
                conditions={strategy.conditions}
                operation={strategy.operation}
                position={strategy.position}
                status={strategy.status}
                type="buy"
                delay={index * 100}
                isVisible={isVisible}
              />
            ))}
          </div>
        </div>

        {/* 卖出策略 */}
        <div
          className={`transition-all duration-500 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
          style={{ transitionDelay: '150ms' }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-[#ff2d2d]/20 flex items-center justify-center">
              <ArrowDownCircle className="w-5 h-5 text-[#ff2d2d]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">卖出策略</h2>
              <p className="text-xs text-white/50">三阶离场法</p>
            </div>
          </div>

          <div className="space-y-3">
            {sellStrategies.map((strategy, index) => (
              <StrategyCard
                key={strategy.level}
                level={strategy.level}
                name={strategy.name}
                conditions={strategy.conditions}
                operation={strategy.operation}
                status={strategy.status}
                type="sell"
                delay={index * 100 + 150}
                isVisible={isVisible}
              />
            ))}
          </div>

          {/* 止损纪律提示 */}
          <div
            className={`mt-4 p-4 rounded-xl border border-[#ff2d2d]/30 bg-[#ff2d2d]/5 transition-all duration-500 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
            style={{ transitionDelay: '450ms' }}
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-[#ff2d2d] flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-[#ff2d2d] mb-1">止损纪律</h4>
                <ul className="space-y-1">
                  <li className="text-xs text-white/70">
                    单笔亏损控制在 <span className="text-[#ff2d2d] font-mono">-7%</span> 以内
                  </li>
                  <li className="text-xs text-white/70">
                    当日回撤控制在总资金 <span className="text-[#ff2d2d] font-mono">-3%</span> 以内
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
