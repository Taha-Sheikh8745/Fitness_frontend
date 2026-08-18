import { Lock, Crown, Zap } from 'lucide-react';

const LockedFeature = ({ requiredPlan = 'PRO', title, children }) => {
  const getPlanIcon = () => {
    switch (requiredPlan) {
      case 'ELITE':
        return <Crown className="w-8 h-8 text-purple-400" />;
      case 'PRO':
        return <Zap className="w-8 h-8 text-accent" />;
      default:
        return <Lock className="w-8 h-8 text-gray-400" />;
    }
  };

  const getPlanColor = () => {
    switch (requiredPlan) {
      case 'ELITE':
        return 'purple';
      case 'PRO':
        return 'cyan';
      default:
        return 'gray';
    }
  };

  const planColor = getPlanColor();

  return (
    <div className="relative">
      {/* Overlay */}
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-10 rounded-2xl flex flex-col items-center justify-center p-6 border border-white/10">
        <div className="mb-4 p-4 bg-slate-800/50 rounded-full border border-white/5">
          {getPlanIcon()}
        </div>
        <h3 className="text-lg font-bold text-white mb-2 text-center">{title}</h3>
        <p className="text-sm text-gray-400 text-center mb-4">
          Upgrade to {requiredPlan} plan to unlock this feature
        </p>
        <button 
          className={`px-6 py-2 rounded-lg text-sm font-bold uppercase tracking-wider transition-all ${
            planColor === 'purple' 
              ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30 hover:bg-purple-500/30' 
              : planColor === 'cyan'
              ? 'bg-accent/20 text-accent border border-accent/30 hover:bg-accent/30'
              : 'bg-gray-500/20 text-gray-400 border border-gray-500/30 hover:bg-gray-500/30'
          }`}
        >
          Upgrade Now
        </button>
      </div>
      {/* Content underneath */}
      <div className="opacity-30 pointer-events-none">
        {children}
      </div>
    </div>
  );
};

export default LockedFeature;
