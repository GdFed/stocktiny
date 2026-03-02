import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Activity, Zap } from 'lucide-react';
import { emotionPhases } from '@/data/strategyData';
import type { EmotionPhase } from '@/types';

interface NavbarProps {
  currentPhase: EmotionPhase;
  limitUpCount: number;
  limitDownCount: number;
}

export function Navbar({ currentPhase, limitUpCount, limitDownCount }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [flashUp, setFlashUp] = useState(false);
  const [flashDown, setFlashDown] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 模拟数据更新闪烁效果
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        setFlashUp(true);
        setTimeout(() => setFlashUp(false), 500);
      }
      if (Math.random() > 0.8) {
        setFlashDown(true);
        setTimeout(() => setFlashDown(false), 500);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const phaseData = emotionPhases.find(p => p.id === currentPhase);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 h-16 transition-all duration-300 ${
        scrolled
          ? 'bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-white/10'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-[1440px] mx-auto h-full px-4 lg:px-8 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-purple flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">QuickTiny AI</h1>
            <p className="text-xs text-white/50">短线打板策略系统</p>
          </div>
        </div>

        {/* Market Status */}
        <div className="hidden md:flex items-center gap-6">
          {/* 情绪阶段 */}
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5">
            <Activity className="w-4 h-4" style={{ color: phaseData?.color }} />
            <span className="text-sm text-white/70">当前情绪:</span>
            <span
              className="text-sm font-semibold"
              style={{ color: phaseData?.color }}
            >
              {phaseData?.name}
            </span>
          </div>

          {/* 涨停数 */}
          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 transition-all ${
              flashUp ? 'animate-flash-red' : ''
            }`}
          >
            <TrendingUp className="w-4 h-4 text-[#ff2d2d]" />
            <span className="text-sm text-white/70">涨停:</span>
            <span className="text-sm font-bold text-[#ff2d2d] font-mono">
              {limitUpCount}家
            </span>
          </div>

          {/* 跌停数 */}
          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 transition-all ${
              flashDown ? 'animate-flash-green' : ''
            }`}
          >
            <TrendingDown className="w-4 h-4 text-[#00c800]" />
            <span className="text-sm text-white/70">跌停:</span>
            <span className="text-sm font-bold text-[#00c800] font-mono">
              {limitDownCount}家
            </span>
          </div>
        </div>

        {/* User Avatar */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-purple flex items-center justify-center">
            <span className="text-sm font-semibold text-white">Pro</span>
          </div>
        </div>
      </div>
    </nav>
  );
}
