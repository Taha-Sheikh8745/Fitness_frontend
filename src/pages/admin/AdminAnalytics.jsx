import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, PieChart as PieIcon, Activity, Zap, Users, Target } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area, Legend 
} from 'recharts';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Loader from '../../components/common/Loader';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const AdminAnalytics = () => {
  const [data, setData] = useState(() => {
    const cached = localStorage.getItem('admin_analytics_cache');
    return cached ? JSON.parse(cached) : null;
  });
  const [loading, setLoading] = useState(!data);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const res = await api.get('/admin/analytics');
      setData(res.data.data);
      localStorage.setItem('admin_analytics_cache', JSON.stringify(res.data.data));
    } catch (e) {
      toast.error('Intelligence gathering failed');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !data) return <Loader message="Loading Analytics..." />;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-8">
        <div>
          <h1 className="text-4xl font-black text-white flex items-center gap-4 italic uppercase tracking-tight">
            <BarChart3 className="w-10 h-10 text-purple-500" /> Stats & Analytics
          </h1>
          <p className="text-gray-500 font-medium mt-1 uppercase text-xs tracking-[0.2em]">User trends and system data</p>
        </div>
        <div className="flex bg-[#07111a] p-1 rounded-xl border border-white/5">
            <button className="px-4 py-2 bg-purple-500 text-white rounded-lg text-xs font-black uppercase">Live</button>
            <button className="px-4 py-2 text-gray-500 text-xs font-black uppercase hover:text-white transition">History</button>
        </div>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Avg Protein', value: `${Math.round(data?.avgMacros?.avgProtein)}g`, icon: Zap, color: 'text-orange-400' },
          { label: 'Avg Carbs', value: `${Math.round(data?.avgMacros?.avgCarbs)}g`, icon: Target, color: 'text-blue-400' },
          { label: 'Avg Fats', value: `${Math.round(data?.avgMacros?.avgFats)}g`, icon: Activity, color: 'text-yellow-400' },
          { label: 'Activity Rate', value: `${data?.syncRate || '0.0'}%`, icon: Users, color: 'text-purple-400' },
        ].map((kpi, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card p-6 flex items-center justify-between group hover:border-purple-500/30 transition-all"
          >
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">{kpi.label}</p>
              <h3 className="text-2xl font-black text-white mt-1">{kpi.value}</h3>
            </div>
            <div className={`p-3 bg-white/5 rounded-xl ${kpi.color}`}>
              <kpi.icon className="w-5 h-5" />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* User Growth Chart */}
        <div className="glass-card p-8 min-h-[400px]">
          <h3 className="text-lg font-black text-white mb-8 flex items-center gap-3 uppercase tracking-wider">
            <TrendingUp className="w-5 h-5 text-green-400" /> User Growth (6m)
          </h3>
          <div className="h-[300px] w-full min-h-[300px]">
            <ResponsiveContainer width="99%" height="99%">
              <BarChart data={data?.userGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="month" stroke="#4b5563" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#4b5563" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                  contentStyle={{ backgroundColor: '#07111a', border: '1px solid rgba(168,85,247,0.2)', borderRadius: '12px' }}
                />
                <Bar dataKey="users" fill="#8B5CF6" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Workout Category Pie */}
        <div className="glass-card p-8 min-h-[400px]">
          <h3 className="text-lg font-black text-white mb-8 flex items-center gap-3 uppercase tracking-wider">
            <PieIcon className="w-5 h-5 text-blue-400" /> Workout Types
          </h3>
          <div className="h-[300px] w-full min-h-[300px]">
            <ResponsiveContainer width="99%" height="99%">
              <PieChart>
                <Pie
                  data={data?.workoutDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {data?.workoutDistribution?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                   contentStyle={{ backgroundColor: '#07111a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                />
                <Legend iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Activity Pulse - Area Chart */}
        <div className="lg:col-span-2 glass-card p-8 min-h-[450px]">
          <h3 className="text-lg font-black text-white mb-8 flex items-center gap-3 uppercase tracking-wider">
            <Activity className="w-5 h-5 text-purple-400" /> Daily Activity (7d)
          </h3>
          <div className="h-[350px] w-full min-h-[350px]">
            <ResponsiveContainer width="99%" height="99%">
              <AreaChart data={data?.activityPulse}>
                <defs>
                  <linearGradient id="adminPulse" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#A855F7" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#A855F7" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="day" stroke="#4b5563" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#4b5563" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#07111a', border: '1px solid rgba(168,85,247,0.2)', borderRadius: '12px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="sessions" 
                  stroke="#A855F7" 
                  fillOpacity={1} 
                  fill="url(#adminPulse)" 
                  strokeWidth={4}
                  dot={{ r: 4, fill: '#A855F7', strokeWidth: 2, stroke: '#07111a' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
