import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import api from '../services/api';
import { Dumbbell, Flame, TrendingUp, TrendingDown, Download, Plus, Zap, FileSpreadsheet, Apple, Scale, Lock, Crown, Activity, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import DateFilter from '../components/common/DateFilter';
import LockedFeature from '../components/common/LockedFeature';

const Dashboard = () => {
  const { user, refreshUser } = useAuth();
  const [searchParams] = useSearchParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reminders, setReminders] = useState([]);
  const [habits, setHabits] = useState([]);
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });

  useEffect(() => {
    if (dateRange.startDate && dateRange.endDate) {
      fetchDashboardData();
    }
  }, [dateRange]);

  useEffect(() => {
    fetchReminders();
    if (user?.subscription?.plan !== 'FREE') {
      fetchHabits();
    }
    
    // Refresh profile if returning from Stripe checkout
    if (searchParams.get('session_id')) {
      handlePostCheckout();
    }
  }, []);

  const handlePostCheckout = async () => {
    try {
      const sessionId = searchParams.get('session_id');
      const planLabels = { PRO: 'Pro', ELITE: 'Elite' };
      let updatedPlan = 'FREE';

      // Step 1: Try direct verification via backend (bypasses webhook timing)
      try {
        const verifyRes = await api.post('/payments/verify-session', { sessionId });
        if (verifyRes.data?.success && verifyRes.data?.plan) {
          updatedPlan = verifyRes.data.plan;
        }
      } catch (verifyErr) {
        console.warn('Direct verify failed, falling back to polling:', verifyErr.message);
      }

      // Step 2: Refresh user profile to sync frontend state
      await refreshUser();

      // Step 3: If direct verify didn't get the plan, poll for webhook completion
      if (updatedPlan === 'FREE') {
        const maxAttempts = 4;
        const delayMs = 2000;
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
          await new Promise(resolve => setTimeout(resolve, delayMs));
          const result = await refreshUser();
          const plan = result?.data?.subscription?.plan || result?.subscription?.plan;
          if (plan && plan !== 'FREE') {
            updatedPlan = plan;
            break;
          }
        }
      }

      // Step 4: Also refresh habits if now premium
      if (updatedPlan !== 'FREE') {
        fetchHabits();
      }

      if (updatedPlan !== 'FREE') {
        toast.success(`Subscription verified! Welcome to the ${planLabels[updatedPlan] || updatedPlan} plan. 🎉`, { duration: 5000 });
      } else {
        toast.success('Payment received! Your subscription is being activated — features will unlock shortly.', { duration: 6000 });
      }
    } catch (err) {
      console.error('Post-checkout sync failed', err);
      toast.error('Could not verify subscription status. Please refresh the page.');
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/dashboard?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`);
      setData(res.data.data);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchReminders = async () => {
     try {
       const res = await api.get('/reminders');
       if (res.data.data) {
         setReminders(res.data.data.filter(r => r.status === 'Pending').slice(0, 3));
       }
     } catch (err) {}
  };

  const fetchHabits = async () => {
    try {
      const res = await api.get('/habits');
      setHabits(res.data.data || []);
    } catch (err) {}
  };

  const handleExportPDF = async () => {}; 
  const handleExportCSV = async () => {};

  const renderTrend = (trendObj) => {
      if (!trendObj) return null;
      const { percentageChange, direction } = trendObj;
      if (direction === 'up') {
          return <span className="flex items-center text-xs font-bold text-accent bg-accent/10 px-2 py-0.5 rounded-md border border-accent/20"><TrendingUp className="w-3 h-3 mr-1"/> +{percentageChange}%</span>;
      }
      if (direction === 'down') {
          return <span className="flex items-center text-xs font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded-md border border-green-500/20"><TrendingDown className="w-3 h-3 mr-1"/> {percentageChange}%</span>;
      }
      return <span className="flex items-center text-xs font-bold text-gray-500 bg-gray-500/10 px-2 py-0.5 rounded-md border border-gray-500/20">— 0%</span>;
  }

  const { summary, charts } = data || {};
  const PIE_COLORS = ['#00E6FF', '#0284c7', '#3b82f6', '#a855f7'];

  const macros = charts?.workoutCategoryFreq?.map(item => ({ name: item._id, value: item.count })) || [];
  const recentNutrition = charts?.recentNutrition?.map(item => ({ date: item._id, volume: item.totalCalories })) || [];
  const weightProgress = charts?.weightProgress?.map(item => ({ 
      date: new Date(item.date).toLocaleDateString(undefined, {month:'short', day:'numeric'}), 
      weight: item.weight 
  })) || [];
  
  const streakDays = Math.floor(Math.random() * 5) + 2; 

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-7xl mx-auto">
      {/* Hero Section */}
      <div className="relative glass-card border-none p-8 md:p-12 mb-8 items-center bg-gradient-to-br from-[#021B32] via-[#0A2740] to-slate-900 shadow-2xl z-20">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-accent/20 rounded-full blur-3xl mix-blend-screen -z-10"></div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center z-10 relative">
          <div className="flex-1 mb-6 md:mb-0">
            <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-3 leading-tight tracking-tight">
              Dashboard Overview, <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-blue-400">{user?.name?.split(' ')[0]}</span>.
            </h1>
            <p className="text-gray-300 text-lg max-w-xl font-medium">
              Monitor your metrics precisely. Every kilogram, every calorie, aggressively tracked across your selected timeline.
            </p>
          </div>
          <div className="flex gap-4 items-center">
            <div className={`hidden md:flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-black uppercase tracking-widest ${
              user?.subscription?.plan === 'ELITE' ? 'bg-purple-500/15 border-purple-500/30 text-purple-400' :
              user?.subscription?.plan === 'PRO' ? 'bg-accent/15 border-accent/30 text-accent' :
              'bg-gray-500/10 border-gray-500/20 text-gray-400'
            }`}>
              {user?.subscription?.plan === 'ELITE' ? <Crown className="w-4 h-4" /> : user?.subscription?.plan === 'PRO' ? <Zap className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
              {user?.subscription?.plan || 'FREE'}
            </div>
            <DateFilter onFilterChange={setDateRange} />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="animate-pulse grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => <div key={i} className="h-32 bg-slate-800 rounded-2xl"></div>)}
        </div>
      ) : (
        <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <motion.div whileHover={{ scale: 1.02 }} className="glass-card flex items-center p-6 border-accent/30 border-t-accent shadow-lg shadow-accent/5">
                <div className="p-4 bg-accent/10 rounded-xl mr-5 border border-accent/20">
                    <Dumbbell className="h-7 w-7 text-accent" />
                </div>
                <div className="flex-1">
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Workouts</p>
                    <div className="flex items-end gap-3 mt-1">
                        <h3 className="text-3xl font-black text-white">{summary?.metrics?.workouts?.value || 0}</h3>
                        {renderTrend(summary?.metrics?.workouts?.trend)}
                    </div>
                </div>
                </motion.div>
                
                <motion.div whileHover={{ scale: 1.02 }} className="glass-card flex items-center p-6 border-orange-500/30 border-t-orange-500 shadow-lg shadow-orange-500/5">
                <div className="p-4 bg-orange-500/10 rounded-xl mr-5 border border-orange-500/20">
                    <Flame className="h-7 w-7 text-orange-500" />
                </div>
                <div className="flex-1 overflow-hidden">
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Calories Recorded</p>
                    <div className="flex items-end gap-3 mt-1">
                        <h3 className="text-3xl font-black text-white">{summary?.metrics?.calories?.value || 0}</h3>
                        {renderTrend(summary?.metrics?.calories?.trend)}
                    </div>
                    {summary?.metrics?.macros && (
                        <div className="flex gap-2 mt-2 pt-2 border-t border-white/5 w-full flex-wrap">
                           <span className="text-[10px] text-blue-400 font-bold bg-blue-500/10 px-1.5 py-0.5 rounded">P: {summary.metrics.macros.protein}g</span>
                           <span className="text-[10px] text-orange-300 font-bold bg-orange-500/10 px-1.5 py-0.5 rounded">C: {summary.metrics.macros.carbs}g</span>
                           <span className="text-[10px] text-red-400 font-bold bg-red-500/10 px-1.5 py-0.5 rounded">F: {summary.metrics.macros.fats}g</span>
                        </div>
                    )}
                </div>
                </motion.div>

                <motion.div whileHover={{ scale: 1.02 }} className="glass-card flex items-center p-6 border-green-500/30 border-t-green-500 shadow-lg shadow-green-500/5">
                <div className="p-4 bg-green-500/10 rounded-xl mr-5 border border-green-500/20">
                    <Scale className="h-7 w-7 text-green-500" />
                </div>
                <div className="flex-1">
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Weight Change (kg)</p>
                    <div className="flex items-end gap-3 mt-1">
                        <h3 className="text-3xl font-black text-white">
                            {summary?.currentWeight || 0} <span className="text-[10px] text-gray-500 align-top tracking-widest">kg</span>
                        </h3>
                        {renderTrend(summary?.metrics?.weightChange?.trend)}
                    </div>
                </div>
                </motion.div>
            </div>

            {/* Daily Habits Overview */}
            {user?.subscription?.plan !== 'FREE' && habits.length > 0 && (
              <div className="glass-card p-6 mt-8">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Activity className="w-5 h-5 text-accent" /> Daily Habits Overview
                  </h3>
                  <Link to="/habits" className="text-xs text-accent hover:underline">Manage Habits</Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {habits.slice(0, 4).map(habit => {
                     const percentage = habit.targetValue > 0 ? Math.min(100, Math.round((habit.completedValue / habit.targetValue) * 100)) : 0;
                     return (
                       <div key={habit._id} className="bg-slate-900/50 rounded-xl p-4 border border-white/5">
                         <div className="flex justify-between items-center mb-2">
                           <span className="text-sm font-bold text-white">{habit.name}</span>
                           <span className="text-xs text-gray-400">{percentage}%</span>
                         </div>
                         <div className="w-full bg-slate-800 rounded-full h-2 mb-2 overflow-hidden">
                           <div className={`h-2 rounded-full ${percentage >= 100 ? 'bg-green-500' : 'bg-accent'}`} style={{ width: `${percentage}%` }}></div>
                         </div>
                         <div className="text-[10px] text-gray-500 flex justify-between uppercase">
                           <span>{habit.completedValue} {habit.unit}</span>
                           <span>Target: {habit.targetValue} {habit.unit}</span>
                         </div>
                       </div>
                     )
                  })}
                </div>
              </div>
            )}

            {/* Primary Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
                {/* Weight Progress */}
                <div className="glass-card p-6 h-[400px] flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <Scale className="w-5 h-5 text-green-500" /> Weight Dynamics
                        </h3>
                        <Link to="/progress" className="text-xs text-accent hover:underline">View Roadmap</Link>
                    </div>
                    <div className="flex-1">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={weightProgress}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                                <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} domain={['dataMin - 1', 'dataMax + 1']} />
                                <RechartsTooltip contentStyle={{ backgroundColor: '#0A2740', border: 'none', borderRadius: '12px', color: '#fff' }} />
                                <Line type="monotone" dataKey="weight" stroke="#00E6FF" strokeWidth={3} dot={{ fill: '#00E6FF', r: 4 }} activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Nutrition Volume */}
                <div className="glass-card p-6 h-[400px] flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <Flame className="w-5 h-5 text-orange-500" /> Caloric Intake
                        </h3>
                        <Link to="/nutrition" className="text-xs text-accent hover:underline">Log Intake</Link>
                    </div>
                    <div className="flex-1">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={recentNutrition}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                                <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                                <RechartsTooltip cursor={{ fill: '#ffffff05' }} contentStyle={{ backgroundColor: '#0A2740', border: 'none', borderRadius: '12px' }} />
                                <Bar dataKey="volume" fill="url(#colorCal)" radius={[4, 4, 0, 0]} />
                                <defs>
                                    <linearGradient id="colorCal" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor="#fb923c" stopOpacity={0.2}/>
                                    </linearGradient>
                                </defs>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Premium Analytics Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
                
                {/* AI Insights (PRO/ELITE) */}
                <div className="lg:col-span-1">
                    {user?.subscription?.plan === 'FREE' ? (
                        <LockedFeature requiredPlan="PRO" title="AI Intelligence">
                            <div className="glass-card p-6 h-[400px] bg-slate-900/40"></div>
                        </LockedFeature>
                    ) : (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-6 h-[400px] flex flex-col border-accent/20 bg-gradient-to-br from-[#021B32] to-[#0A2740]">
                            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                                <Zap className="w-5 h-5 text-accent" /> AI Insights
                            </h3>
                            <div className="space-y-4 overflow-y-auto pr-2">
                                {(data?.insights || ["Initiate more logs for biological analysis."]).map((insight, i) => (
                                    <div key={i} className="p-3 bg-white/5 rounded-xl border border-white/5 text-sm text-gray-300 leading-relaxed italic">
                                        "{insight}"
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* Muscle Group Distribution (ELITE) */}
                <div className="lg:col-span-1">
                    {user?.subscription?.plan !== 'ELITE' ? (
                        <LockedFeature requiredPlan="ELITE" title="Biometric Distribution">
                            <div className="glass-card p-6 h-[400px] bg-slate-900/40"></div>
                        </LockedFeature>
                    ) : (
                        <div className="glass-card p-6 h-[400px] flex flex-col">
                            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                                <Dumbbell className="w-5 h-5 text-purple-400" /> Muscle Target Map
                            </h3>
                            <div className="flex-1">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={macros} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                            {macros.map((entry, index) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                                        </Pie>
                                        <RechartsTooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}
                </div>

                {/* Calorie-Weight Correlation (ELITE) */}
                <div className="lg:col-span-1">
                    {user?.subscription?.plan !== 'ELITE' ? (
                        <LockedFeature requiredPlan="ELITE" title="Metric Correlation">
                            <div className="glass-card p-6 h-[400px] bg-slate-900/40"></div>
                        </LockedFeature>
                    ) : (
                        <div className="glass-card p-6 h-[400px] flex flex-col">
                            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-accent" /> Efficiency Correlation
                            </h3>
                            <div className="flex-1">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={charts?.correlation || []}>
                                         <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                                         <XAxis dataKey="date" hide />
                                         <YAxis yAxisId="left" stroke="#f97316" fontSize={10} />
                                         <YAxis yAxisId="right" orientation="right" stroke="#00E6FF" fontSize={10} />
                                         <RechartsTooltip contentStyle={{ backgroundColor: '#0A2740' }} />
                                         <Line yAxisId="left" type="monotone" dataKey="calories" stroke="#f97316" dot={false} />
                                         <Line yAxisId="right" type="monotone" dataKey="weight" stroke="#00E6FF" dot={false} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                            <p className="text-[10px] text-center text-gray-500 mt-2 uppercase font-mono">Calorie vs Weight Coupling</p>
                        </div>
                    )}
                </div>

                {/* Heatmap (ELITE) - Row Span? Or just another card */}
                <div className="lg:col-span-3">
                     {user?.subscription?.plan !== 'ELITE' ? (
                         <div className="hidden"></div>
                     ) : (
                         <div className="glass-card p-6 mt-6">
                            <h3 className="text-sm font-bold text-white mb-6 uppercase tracking-widest flex items-center gap-2 text-gray-400">
                                <Activity className="w-4 h-4" /> Intensity History
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {charts?.heatmap?.map((day, i) => (
                                    <div 
                                        key={i} 
                                        title={`${day._id}: ${day.count} activations`}
                                        className={`w-4 h-4 rounded-sm ${day.count > 0 ? 'bg-accent shadow-[0_0_10px_rgba(0,230,255,0.3)]' : 'bg-white/5'}`}
                                    />
                                ))}
                            </div>
                         </div>
                     )}
                </div>
            </div>
        </>
      )}
    </motion.div>
  );
};

export default Dashboard;
