import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { 
  Users, Activity, Clock, ShieldAlert, Shield, CreditCard, Sparkles, LayoutDashboard, Search, Loader2, CheckCircle 
} from 'lucide-react';
import Loader from '../../components/common/Loader';
import api from '../../services/api';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
  const { user } = useAuth();
  
  // Initialize state from cache for instant load
  const [stats, setStats] = useState(() => {
    const cached = localStorage.getItem('admin_stats_cache');
    return cached ? JSON.parse(cached) : null;
  });
  const [loading, setLoading] = useState(!stats); // Only show loader if no cache exists

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch fresh data in the background
        await fetchAdminStats();
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);


  const fetchAdminStats = async () => {
    try {
      const res = await api.get('/admin/stats');
      setStats(res.data.data);
      localStorage.setItem('admin_stats_cache', JSON.stringify(res.data.data));
    } catch (error) {
      console.error('Failed to fetch admin stats');
    }
  };

  if (loading) {
    return <Loader message="Loading Admin Dashboard..." />;
  }

  const statCards = [
    { title: 'Total Money', value: stats?.monthlyRevenue || '$0', icon: CreditCard, color: 'text-green-400', border: 'border-green-500/30' },
    { title: 'Total Users', value: stats?.totalUsers || 0, icon: Users, color: 'text-blue-400', border: 'border-blue-500/30' },
    { title: 'AI Usage', value: stats?.aiRequestsToday || 0, icon: Sparkles, color: 'text-accent', border: 'border-accent/30' },
    { title: 'Help Tickets', value: stats?.pendingTickets || 0, icon: Activity, color: 'text-red-400', border: 'border-red-500/30' },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="space-y-8 max-w-7xl mx-auto p-2"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Shield className="text-red-500 w-8 h-8"/> Admin Dashboard
          </h1>
          <p className="text-textMuted font-mono text-xs uppercase tracking-widest mt-1">Overview</p>
        </div>
        
        <div className="flex items-center gap-4 bg-white/5 border border-white/10 p-2 pl-4 rounded-2xl">
            <div className="text-right">
                <p className="text-sm font-bold text-white leading-none">{user?.name || 'Admin'}</p>
                <p className="text-[10px] text-accent uppercase tracking-tighter mt-1">Full Access</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-accent/20 border border-accent/30 flex items-center justify-center text-accent font-black">
                {user?.name?.substring(0, 1) || 'A'}
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <motion.div 
            key={index}
            whileHover={{ scale: 1.02 }}
            className={`glass-card p-6 border-l-4 ${stat.border}`}
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">{stat.title}</p>
                <h3 className="text-3xl font-black text-white mt-2">{stat.value}</h3>
              </div>
              <div className={`p-3 bg-white/5 rounded-xl ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass-card p-8 border-white/5 min-h-[400px]">
          <h3 className="text-xl font-bold text-white mb-8 flex items-center gap-3">
            <Activity className="w-5 h-5 text-accent" /> User Activity
          </h3>
          <div className="h-[300px] w-full min-h-[300px]">
            <ResponsiveContainer width="99%" height="99%">
              <AreaChart data={stats?.userActivity}>
                <defs>
                   <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00E6FF" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#00E6FF" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#021B32', borderColor: 'rgba(0,230,255,0.2)', borderRadius: '12px' }}
                  itemStyle={{ color: '#00E6FF' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="active" 
                  stroke="#00E6FF" 
                  fillOpacity={1} 
                  fill="url(#colorActive)" 
                  strokeWidth={3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-8 border-white/5 bg-slate-900/20">
           <h3 className="text-xl font-bold text-white mb-8 flex items-center gap-3">
             <LayoutDashboard className="w-5 h-5 text-purple-400" /> User Plans
           </h3>
           <div className="space-y-6">
              {stats?.plansDistribution && Object.entries(stats.plansDistribution).map(([plan, count]) => {
                const total = stats.totalUsers || 1;
                const percentage = Math.round((count / total) * 100);
                return (
                  <div key={plan}>
                    <div className="flex justify-between items-center mb-2 text-xs">
                       <span className="font-bold text-gray-400 uppercase tracking-widest">{plan}</span>
                       <span className="text-textMuted">{count} users ({percentage}%)</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                       <div 
                         className={`h-full transition-all duration-1000 ${
                           plan === 'ELITE' ? 'bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]' : 
                           plan === 'PRO' ? 'bg-accent shadow-[0_0_10px_rgba(0,230,255,0.5)]' : 'bg-gray-600'
                         }`} 
                         style={{ width: `${percentage}%` }}
                       />
                    </div>
                  </div>
                );
              })}
           </div>
           <div className="mt-12 pt-6 border-t border-white/5">
                <div className="flex items-center justify-between text-[10px] uppercase font-black tracking-widest text-gray-500">
                    <span>New Subscription Growth</span>
                    <span className="text-green-400">{stats?.subscriptionGrowth || '+0%'}</span>
                </div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">

        <div className="glass-card p-8 border-white/5 relative overflow-hidden bg-black/20">
            <h3 className="text-xl font-bold text-white mb-8 flex items-center gap-3">
                <ShieldAlert className="w-5 h-5 text-red-500" /> System Logs
            </h3>
            <div className="space-y-5 font-mono text-xs max-h-[350px] overflow-y-auto custom-scrollbar pr-2">
                {stats?.systemLogs?.length === 0 ? (
                    <div className="text-center py-10">
                         <p className="text-gray-500 italic">No system events logged.</p>
                    </div>
                ) : (
                    stats?.systemLogs?.map((log, index) => (
                        <div key={log._id || index} className={`flex gap-4 ${
                            log.severity === 'CRITICAL' || log.severity === 'ERROR' ? 'text-red-400' :
                            log.severity === 'WARNING' ? 'text-yellow-400' :
                            log.category === 'AUTH' ? 'text-accent' :
                            log.category === 'PAYMENT' ? 'text-green-400' : 'text-textMuted'
                        }`}>
                            <span className="opacity-50 flex-shrink-0">[{new Date(log.createdAt).toLocaleTimeString()}]</span>
                            <span className="truncate">
                                <span className="font-bold">{log.category}_{log.event}:</span> {log.message}
                            </span>
                        </div>
                    ))
                )}
            </div>
            <div className="mt-12 pt-6 border-t border-white/5 flex justify-end">
                <Link to="/admin/audit" className="text-accent text-xs font-black uppercase tracking-widest hover:underline flex items-center gap-2 group">
                    View All Logs <Search className="w-4 h-4 group-hover:scale-125 transition-transform" />
                </Link>
            </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AdminDashboard;
