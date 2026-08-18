import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Loader2, Apple, Dumbbell, Info, RefreshCw,
  Lock, Droplets, Activity, HeartPulse, AlertTriangle,
  UserCircle, CheckCircle2, Ruler, Crown, Zap, Target
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const AICoach = () => {
  const { user } = useAuth();
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [usage, setUsage] = useState(null);
  const [errorState, setErrorState] = useState(null); // 'requiresProfile' | 'aiError' | null

  const currentPlan = user?.subscription?.plan || 'FREE';
  const isPremium = currentPlan !== 'FREE';
  const isElite = currentPlan === 'ELITE';

  // Check if profile metrics are sufficiently filled
  const profileData = user?.profileData;
  const hasRequiredMetrics = !!(
    profileData?.age &&
    profileData?.weight &&
    profileData?.height &&
    profileData?.goal
  );

  useEffect(() => {
    if (isPremium) {
      if (hasRequiredMetrics) {
        fetchPlan();
      } else {
        setLoading(false);
        setErrorState('requiresProfile');
      }
    } else {
      setLoading(false);
    }
  }, [isPremium, hasRequiredMetrics]);

  const fetchPlan = async () => {
    try {
      setLoading(true);
      setErrorState(null);
      const { data } = await api.get('/ai/coach');
      if (data.success && data.data) {
        setPlan(data.data);
        if (data.usage) setUsage(data.usage);
      }
    } catch (error) {
      const status = error.response?.status;
      const msg = error.response?.data?.message;

      if (status === 400 && error.response?.data?.requiresProfile) {
        setErrorState('requiresProfile');
      } else if (status === 429) {
        toast.error(msg || 'Daily AI limit reached. Try again tomorrow.');
      } else if (status !== 403) {
        setErrorState('aiError');
        toast.error(msg || 'AI Coach is temporarily unavailable.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!hasRequiredMetrics) {
      toast.error('Complete your Health Metrics in Profile first!');
      window.location.href = '/profile?tab=metrics&edit=true';
      return;
    }

    try {
      setGenerating(true);
      setErrorState(null);
      toast.loading('AI Coach is generating your personalised protocol...', { id: 'ai-gen' });
      const { data } = await api.get('/ai/coach');
      if (data.success && data.data) {
        setPlan(data.data);
        if (data.usage) setUsage(data.usage);
        toast.success(
          data.cached ? 'Strategy loaded from cache.' : '✅ New AI protocol generated!',
          { id: 'ai-gen' }
        );
      }
    } catch (error) {
      const status = error.response?.status;
      const msg = error.response?.data?.message;
      if (status === 400 && error.response?.data?.requiresProfile) {
        setErrorState('requiresProfile');
        toast.error('Complete your Health Metrics in Profile first!', { id: 'ai-gen' });
      } else if (status === 429) {
        toast.error(msg || 'Daily AI limit reached.', { id: 'ai-gen' });
      } else {
        toast.error(msg || 'AI Generation failed. Please try again.', { id: 'ai-gen' });
      }
    } finally {
      setGenerating(false);
    }
  };

  // ─── Loading State ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 text-accent animate-spin" />
        <p className="text-textMuted animate-pulse font-mono uppercase tracking-widest text-sm">
          Synchronizing AI Node...
        </p>
      </div>
    );
  }

  // ─── Not Premium — Upgrade Wall ──────────────────────────────────────────
  if (!isPremium) {
    return (
      <div className="max-w-4xl mx-auto mt-20 text-center px-4">
        <div className="glass-card p-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Lock className="w-64 h-64" />
          </div>
          <Sparkles className="w-16 h-16 text-accent mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-white mb-4">AI Coach is Locked</h1>
          <p className="text-textMuted text-lg mb-8 max-w-lg mx-auto">
            Get personalized meal plans, weekly workout structures, daily habit setups, and
            expert recommendations — all powered by Google Gemini AI.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/subscription"
              className="btn-primary inline-flex items-center gap-2 px-8 py-4 text-lg"
            >
              <Zap className="w-5 h-5" /> Upgrade to PRO
            </Link>
            <Link
              to="/subscription"
              className="inline-flex items-center gap-2 px-8 py-4 text-lg rounded-xl border border-purple-500/40 text-purple-400 hover:bg-purple-500/10 transition-all"
            >
              <Crown className="w-5 h-5" /> Go ELITE
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ─── Requires Profile Completion ─────────────────────────────────────────
  if (errorState === 'requiresProfile') {
    const filled = {
      age: !!profileData?.age,
      weight: !!profileData?.weight,
      height: !!profileData?.height,
      goal: !!profileData?.goal,
      activityLevel: !!profileData?.activityLevel,
      workoutExperience: !!profileData?.workoutExperience,
    };

    return (
      <div className="max-w-2xl mx-auto mt-16 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-10 text-center border border-orange-500/20"
        >
          <div className="w-16 h-16 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mx-auto mb-6">
            <UserCircle className="w-8 h-8 text-orange-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Health Metrics Required</h1>
          <p className="text-textMuted mb-8 leading-relaxed">
            The AI Coach needs your health data to generate a personalized plan.
            Fill in the fields below in your Profile to activate AI coaching.
          </p>

          <div className="grid grid-cols-2 gap-3 mb-8 text-left">
            {Object.entries(filled).map(([key, done]) => (
              <div
                key={key}
                className={`flex items-center gap-3 p-3 rounded-xl border text-sm font-medium capitalize ${
                  done
                    ? 'bg-green-500/10 border-green-500/20 text-green-400'
                    : 'bg-red-500/5 border-red-500/20 text-red-400'
                }`}
              >
                <CheckCircle2 className={`w-4 h-4 shrink-0 ${done ? 'text-green-400' : 'text-gray-600'}`} />
                {key === 'activityLevel' ? 'Activity Level' :
                 key === 'workoutExperience' ? 'Workout Experience' : key}
              </div>
            ))}
          </div>

          <Link
            to="/profile?tab=metrics&edit=true"
            className="btn-primary inline-flex items-center gap-2 px-8 py-4 text-base"
          >
            <UserCircle className="w-5 h-5" /> Complete Health Metrics →
          </Link>
        </motion.div>
      </div>
    );
  }

  // ─── Premium Plan Header ──────────────────────────────────────────────────
  const planBadge = isElite
    ? { icon: Crown, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20', label: 'ELITE' }
    : { icon: Zap, color: 'text-accent', bg: 'bg-accent/10 border-accent/20', label: 'PRO' };
  const PlanIcon = planBadge.icon;

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Sparkles className="text-accent w-8 h-8" /> AI Strategic Coach
            </h1>
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-black uppercase tracking-widest ${planBadge.bg} ${planBadge.color}`}>
              <PlanIcon className="w-3 h-3" /> {planBadge.label}
            </div>
          </div>
          <p className="text-textMuted font-mono text-sm uppercase tracking-wider">
            Comprehensive health plan generated from your metrics
            {user?.profileData?.goal && (
              <span className="ml-2 text-accent">· Goal: {user.profileData.goal}</span>
            )}
          </p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <button
            onClick={handleGenerate}
            disabled={generating}
            id="ai-generate-btn"
            className="btn-primary flex items-center gap-2 h-12 px-6 bg-accent text-dark font-bold hover:bg-cyan-300 transition-all disabled:opacity-60"
          >
            {generating ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
            {plan ? 'Re-Sync AI Plan' : 'Generate AI Plan'}
          </button>
          {usage && (
            <p className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">
              Usage: {usage.current}/{usage.limit} today
            </p>
          )}
        </div>
      </div>

      {/* Metrics Context Banner */}
      <div className="flex flex-wrap gap-3 mb-8">
        {[
          { label: 'Age', val: profileData?.age, unit: 'yrs' },
          { label: 'Weight', val: profileData?.weight, unit: 'kg' },
          { label: 'Height', val: profileData?.height, unit: 'cm' },
          { label: 'Goal', val: profileData?.goal },
          { label: 'Activity', val: profileData?.activityLevel },
          { label: 'Experience', val: profileData?.workoutExperience },
        ].map(({ label, val, unit }) => val && (
          <div key={label} className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs">
            <span className="text-gray-500 font-bold uppercase tracking-widest">{label}:</span>
            <span className="text-white font-bold">{val}{unit ? ` ${unit}` : ''}</span>
          </div>
        ))}
        <Link
          to="/profile?tab=metrics&edit=true"
          className="flex items-center gap-1 text-xs text-accent hover:underline px-2 py-1.5"
        >
          <Ruler className="w-3 h-3" /> Edit Metrics
        </Link>
      </div>

      {/* AI Error State */}
      {errorState === 'aiError' && !plan && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-card p-10 text-center border border-red-500/20 mb-8"
        >
          <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-white mb-2">AI Generation Failed</h2>
          <p className="text-textMuted mb-6 text-sm">
            The AI service encountered an issue. This is usually temporary.
          </p>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="btn-primary px-8 py-3"
          >
            {generating ? 'Retrying...' : 'Try Again'}
          </button>
        </motion.div>
      )}

      {/* Empty State — metrics filled but no plan generated yet */}
      {!plan && !errorState && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-card p-20 text-center flex flex-col items-center border-dashed border-2 border-white/10"
        >
          <Info className="w-12 h-12 text-gray-500 mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Ready to Generate Your Plan</h2>
          <p className="text-textMuted max-w-md mb-8">
            Your health metrics are set. Click <strong className="text-accent">Generate AI Plan</strong> above
            to receive your personalised workout + nutrition protocol, powered by Google Gemini.
          </p>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="btn-primary flex items-center gap-2 px-10 py-4 text-base"
          >
            {generating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
            {generating ? 'Generating...' : 'Generate AI Plan'}
          </button>
        </motion.div>
      )}

      {/* AI Plan Grid */}
      <AnimatePresence>
        {plan && (
          <motion.div
            key="plan-grid"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-8"
          >
            {/* ── Nutrition ────────────────────────────────────────── */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 }}
              className="glass-card p-6 bg-gradient-to-br from-[#021B32] to-[#0A2740] border border-white/5 flex flex-col"
            >
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                <Apple className="text-orange-400" /> Nutritional Protocol
              </h3>
              <div className="space-y-4 flex-1">
                {[
                  { label: 'Morning Refuel', val: plan.nutrition?.breakfast },
                  { label: 'Mid-Day Meal', val: plan.nutrition?.lunch },
                  { label: 'Evening Recovery', val: plan.nutrition?.dinner },
                ].map((meal, i) => (
                  <div key={i} className="bg-black/20 p-4 rounded-xl border border-white/5">
                    <span className="text-[10px] font-bold text-orange-400 uppercase tracking-widest">
                      {meal.label}
                    </span>
                    <p className="text-gray-300 mt-1 leading-relaxed text-sm">
                      {meal.val || (
                        <span className="text-gray-600 italic">No recommendation generated.</span>
                      )}
                    </p>
                  </div>
                ))}

                <div className="bg-orange-500/5 p-4 rounded-xl border border-orange-500/10">
                  <span className="text-[10px] font-bold text-orange-400 uppercase tracking-widest">
                    Recommended Snacks
                  </span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {(plan.nutrition?.snacks || []).length > 0 ? (
                      plan.nutrition.snacks.map((s, i) => (
                        <span
                          key={i}
                          className="text-gray-300 text-xs flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10"
                        >
                          <div className="w-1.5 h-1.5 bg-orange-400 rounded-full shadow-[0_0_5px_rgba(251,146,60,0.5)]" />
                          {s}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-600 text-xs italic">No snacks suggested.</span>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* ── Workout ──────────────────────────────────────────── */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-card p-6 border border-white/5 flex flex-col"
            >
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                <Dumbbell className="text-blue-400" /> Strategic Training Cycle
              </h3>
              <div className="space-y-3 flex-1">
                {(plan.workout?.weeklyStructure || []).length > 0 ? (
                  plan.workout.weeklyStructure.map((day, i) => (
                    <div
                      key={i}
                      className="flex gap-4 items-center bg-white/5 p-3 rounded-xl hover:bg-white/10 transition-colors group"
                    >
                      <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-[10px] font-black text-blue-400 shrink-0 group-hover:bg-blue-500/20">
                        D{i + 1}
                      </div>
                      <p className="text-gray-300 text-xs font-medium leading-normal">{day}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-600 italic text-sm text-center py-8">No workout schedule generated.</p>
                )}
              </div>

              {plan.workout?.keyExercises?.length > 0 && (
                <div className="mt-6 bg-blue-500/5 p-4 rounded-xl border border-blue-500/10">
                  <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest block mb-3">
                    Focus Exercises
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {plan.workout.keyExercises.map((ex, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 bg-blue-500/10 text-blue-300 text-[10px] font-black uppercase rounded-full border border-blue-500/20"
                      >
                        {ex}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>

            {/* ── Habits ──────────────────────────────────────────── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="glass-card p-6 border border-white/5"
            >
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                <Activity className="text-purple-400" /> AI Suggested Habits
              </h3>
              <div className="space-y-3">
                {(plan.habits || []).length > 0 ? (
                  plan.habits.map((habit, i) => (
                    <div key={i} className="bg-purple-500/5 p-4 rounded-xl border border-purple-500/10">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-sm font-bold text-white">{habit.name}</span>
                        <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded uppercase font-bold shrink-0 ml-2">
                          {habit.target}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400">{habit.reason}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-600 italic text-sm text-center py-8">No habits generated.</p>
                )}
              </div>
              <Link
                to="/habits"
                className="block mt-4 text-center text-xs text-purple-400 hover:text-purple-300 font-bold uppercase tracking-widest border border-purple-500/20 rounded-lg py-3 hover:bg-purple-500/10 transition-colors"
              >
                Manage Your Habits Setup →
              </Link>
            </motion.div>

            {/* ── Wellness ─────────────────────────────────────────── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-card p-6 border border-white/5 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 opacity-5">
                <HeartPulse className="w-32 h-32 text-accent" />
              </div>
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3 relative z-10">
                <Droplets className="text-accent" /> Daily Wellness
              </h3>

              <div className="grid grid-cols-2 gap-4 mb-6 relative z-10">
                <div className="bg-accent/5 p-4 rounded-xl border border-accent/10">
                  <span className="text-[10px] font-bold text-accent uppercase tracking-widest block mb-1">
                    Hydration
                  </span>
                  <p className="text-lg font-black text-white">
                    {plan.wellness?.waterTarget || '—'}
                  </p>
                </div>
                <div className="bg-accent/5 p-4 rounded-xl border border-accent/10">
                  <span className="text-[10px] font-bold text-accent uppercase tracking-widest block mb-1">
                    Sleep Goal
                  </span>
                  <p className="text-lg font-black text-white">
                    {plan.wellness?.sleepTarget || '—'}
                  </p>
                </div>
              </div>

              {plan.wellness?.productivityTip && (
                <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5 relative z-10">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">
                    Productivity Insight
                  </span>
                  <p className="text-sm text-gray-300 italic">"{plan.wellness.productivityTip}"</p>
                </div>
              )}

              <div className="mt-6 flex items-center gap-3 text-[10px] font-mono uppercase tracking-widest text-accent relative z-10">
                <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                Status: AI Synced &amp; Ready · {currentPlan} Plan
              </div>
            </motion.div>

            {/* ── ELITE: Goal Advisor CTA ──────────────────────────── */}
            {isElite && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="lg:col-span-2 glass-card p-6 border border-purple-500/20 bg-gradient-to-r from-purple-900/20 to-indigo-900/20"
              >
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-purple-500/20 border border-purple-500/30">
                      <Target className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">AI Goal Advisor</h3>
                      <p className="text-sm text-textMuted">
                        Get 3 AI-personalised fitness goals based on your current metrics and progress.
                      </p>
                    </div>
                  </div>
                  <GoalAdvisorButton profileData={profileData} />
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Inline sub-component for ELITE Goal Advisor
const GoalAdvisorButton = ({ profileData }) => {
  const [loading, setLoading] = useState(false);
  const [goals, setGoals] = useState(null);

  const fetchGoals = async () => {
    try {
      setLoading(true);
      toast.loading('Generating goal recommendations...', { id: 'ai-goals' });
      const { data } = await api.get('/ai/goals');
      if (data.success) {
        setGoals(data.data.goals || []);
        toast.success('AI goals generated!', { id: 'ai-goals' });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Goal generation failed.', { id: 'ai-goals' });
    } finally {
      setLoading(false);
    }
  };

  if (goals) {
    return (
      <div className="w-full mt-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
          {goals.map((g, i) => (
            <div key={i} className="bg-purple-500/10 p-4 rounded-xl border border-purple-500/20">
              <h4 className="text-sm font-bold text-purple-300 mb-1">{g.title}</h4>
              <p className="text-xs text-gray-400 mb-2">{g.description}</p>
              <div className="flex gap-2 flex-wrap">
                {g.timeframe && (
                  <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded font-bold">
                    {g.timeframe}
                  </span>
                )}
                {g.metric && (
                  <span className="text-[10px] bg-white/5 text-gray-400 px-2 py-0.5 rounded">
                    {g.metric}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={fetchGoals}
      disabled={loading}
      className="shrink-0 px-6 py-3 rounded-xl border border-purple-500/40 text-purple-400 font-bold text-sm hover:bg-purple-500/10 transition-all disabled:opacity-50 flex items-center gap-2"
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Crown className="w-4 h-4" />}
      {loading ? 'Generating...' : 'Get AI Goals'}
    </button>
  );
};

export default AICoach;
