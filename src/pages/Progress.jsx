import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer
} from 'recharts';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
  Plus, Trash2, TrendingUp, TrendingDown, Activity, Save, AlertCircle, Scale, Target, Calendar, Edit2
} from 'lucide-react';
import DateFilter from '../components/common/DateFilter';
import PredictiveChart from '../components/analytics/PredictiveChart';
import { useAuth } from '../context/AuthContext';

const Progress = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editId, setEditId] = useState(null);
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });

  // Form State
  const initialForm = {
    date: new Date().toISOString().split('T')[0],
    weight: '', bodyFatPercentage: '',
    chest: '', waist: '', arms: '', legs: '', shoulders: '', biceps: '', notes: ''
  };
  const [formData, setFormData] = useState(initialForm);

  useEffect(() => {
    if (dateRange.startDate && dateRange.endDate) {
       fetchProgressLogs();
    }
  }, [dateRange]);

  const fetchProgressLogs = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/progress?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`);
      setLogs(res.data.data);
    } catch (err) {
      toast.error('Failed to load progress data');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const triggerEdit = (log) => {
      setEditId(log._id);
      setFormData({
          date: new Date(log.date).toISOString().split('T')[0],
          weight: log.weight || '',
          bodyFatPercentage: log.bodyFatPercentage || '',
          chest: log.measurements?.chest || '',
          waist: log.measurements?.waist || '',
          arms: log.measurements?.arms || '',
          legs: log.measurements?.legs || '',
          shoulders: log.measurements?.shoulders || '',
          biceps: log.measurements?.biceps || '',
          notes: log.notes || ''
      });
      setShowAddForm(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const cancelForm = () => {
      setShowAddForm(false);
      setEditId(null);
      setFormData(initialForm);
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.weight || isNaN(formData.weight) || formData.weight <= 0) {
      toast.error('Please enter a valid weight'); return;
    }

    try {
      setSubmitting(true);
      const payload = {
        weight: Number(formData.weight),
        bodyFatPercentage: formData.bodyFatPercentage ? Number(formData.bodyFatPercentage) : undefined,
        date: formData.date,
        measurements: {
            chest: formData.chest ? Number(formData.chest) : undefined,
            waist: formData.waist ? Number(formData.waist) : undefined,
            arms: formData.arms ? Number(formData.arms) : undefined,
            legs: formData.legs ? Number(formData.legs) : undefined,
            shoulders: formData.shoulders ? Number(formData.shoulders) : undefined,
            biceps: formData.biceps ? Number(formData.biceps) : undefined,
        },
        notes: formData.notes
      };

      if (editId) {
          await api.put(`/progress/${editId}`, payload);
          toast.success('Progress updated!');
      } else {
          await api.post('/progress', payload);
          toast.success('Progress logged successfully!');
      }
      
      cancelForm();
      fetchProgressLogs();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save progress');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/progress/${id}`);
      toast.success('Entry deleted');
      fetchProgressLogs();
    } catch (err) {
      toast.error('Failed to delete entry');
    }
  };

  const { stats, chartData } = useMemo(() => {
    if (!logs || logs.length === 0) return { stats: null, chartData: [] };
    const sortedLogs = [...logs].sort((a, b) => new Date(a.date) - new Date(b.date));
    const firstLog = sortedLogs[0];
    const lastLog = sortedLogs[sortedLogs.length - 1];

    const weightChange = (lastLog.weight - firstLog.weight).toFixed(1);
    
    const logsWithBf = sortedLogs.filter(l => l.bodyFatPercentage != null);
    let bfChange = 0;
    if (logsWithBf.length >= 2) {
      bfChange = (logsWithBf[logsWithBf.length - 1].bodyFatPercentage - logsWithBf[0].bodyFatPercentage).toFixed(1);
    }

    const s = {
      startWeight: firstLog.weight,
      currentWeight: lastLog.weight,
      totalChange: weightChange,
      latestBodyFat: lastLog.bodyFatPercentage || '--',
      bodyFatChange: bfChange || 0
    };

    const cData = sortedLogs.map(log => ({
      ...log,
      displayDate: new Date(log.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    }));

    return { stats: s, chartData: cData };
  }, [logs]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#021B32]/95 border border-[#00E6FF]/30 p-4 rounded-xl shadow-[0_0_15px_rgba(0,230,255,0.2)] backdrop-blur-md">
          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-white font-bold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]" style={{ backgroundColor: entry.color, color: entry.color }}></span>
              {entry.name}: <span style={{ color: entry.color }}>{entry.value}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
              <Activity className="w-8 h-8 text-accent"/> Progress Tracker
          </h1>
          <p className="text-gray-400">Track and view your bodily changes over time.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
            <DateFilter onFilterChange={setDateRange} />
            <button onClick={() => !showAddForm ? setShowAddForm(true) : cancelForm()} className="btn-primary w-full sm:w-auto flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(0,230,255,0.3)]">
                {showAddForm ? 'Cancel Form' : <><Plus className="w-5 h-5" /> Log Progress</>}
            </button>
        </div>
      </div>

      <AnimatePresence>
        {showAddForm && (
          <motion.div initial={{ opacity: 0, height: 0, y: -20 }} animate={{ opacity: 1, height: 'auto', y: 0 }} exit={{ opacity: 0, height: 0, y: -20, overflow: 'hidden' }} transition={{ duration: 0.3 }} className="mb-8 relative z-20">
            <div className="glass-card p-6 md:p-8 bg-slate-900 border border-accent/20">
              <h2 className="text-xl font-bold text-white mb-5 border-b border-white/5 pb-4">{editId ? 'Edit Progress Entry' : 'New Progress Entry'}</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4 bg-[#0A2740]/50 p-5 rounded-2xl border border-white/5 shadow-inner">
                    <h3 className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-2 border-b border-white/5 pb-2">Core Metrics</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-gray-400 mb-1 block font-bold">Date <span className="text-red-400">*</span></label>
                            <input type="date" name="date" required value={formData.date} onChange={handleChange} className="glass-input w-full p-2.5 text-sm cursor-pointer" />
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 mb-1 block font-bold">Weight (kg) <span className="text-red-400">*</span></label>
                            <input type="number" step="0.1" name="weight" required value={formData.weight} onChange={handleChange} className="glass-input w-full p-2.5 text-sm" />
                        </div>
                        <div className="col-span-2">
                            <label className="text-xs text-gray-400 mb-1 block font-bold">Body Fat (%) <span className="font-normal italic tracking-wide">(Optional)</span></label>
                            <input type="number" step="0.1" name="bodyFatPercentage" value={formData.bodyFatPercentage} onChange={handleChange} className="glass-input w-full p-2.5 text-sm" />
                        </div>
                    </div>
                  </div>

                  <div className="space-y-4 bg-[#0A2740]/50 p-5 rounded-2xl border border-white/5 shadow-inner">
                    <h3 className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-2 border-b border-white/5 pb-2">Body Measurements (cm) <span className="font-normal italic tracking-wide">(Optional)</span></h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                        <div><label className="text-[10px] text-gray-400 block mb-0.5">Chest</label><input type="number" step="0.1" name="chest" value={formData.chest} onChange={handleChange} className="glass-input w-full py-1.5 px-3" /></div>
                        <div><label className="text-[10px] text-gray-400 block mb-0.5">Waist</label><input type="number" step="0.1" name="waist" value={formData.waist} onChange={handleChange} className="glass-input w-full py-1.5 px-3" /></div>
                        <div><label className="text-[10px] text-gray-400 block mb-0.5">Arms</label><input type="number" step="0.1" name="arms" value={formData.arms} onChange={handleChange} className="glass-input w-full py-1.5 px-3" /></div>
                        <div><label className="text-[10px] text-gray-400 block mb-0.5">Legs</label><input type="number" step="0.1" name="legs" value={formData.legs} onChange={handleChange} className="glass-input w-full py-1.5 px-3" /></div>
                        <div><label className="text-[10px] text-gray-400 block mb-0.5">Shoulders</label><input type="number" step="0.1" name="shoulders" value={formData.shoulders} onChange={handleChange} className="glass-input w-full py-1.5 px-3" /></div>
                        <div><label className="text-[10px] text-gray-400 block mb-0.5">Biceps</label><input type="number" step="0.1" name="biceps" value={formData.biceps} onChange={handleChange} className="glass-input w-full py-1.5 px-3" /></div>
                    </div>
                  </div>
                </div>
                
                <div>
                    <label className="text-xs text-gray-400 font-bold tracking-widest uppercase mb-1 block">Notes <span className="font-normal normal-case">(Optional)</span></label>
                    <textarea name="notes" placeholder="..." value={formData.notes} onChange={handleChange} className="glass-input w-full p-3 h-16 resize-none text-sm"></textarea>
                </div>

                <div className="flex justify-end pt-3">
                    <button type="submit" disabled={submitting} className="btn-primary w-full md:w-auto px-10 py-3 uppercase tracking-widest text-xs font-black">
                        {submitting ? 'Saving...' : (editId ? 'Save Changes' : 'Log Progress')}
                    </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!loading && logs.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card flex flex-col items-center justify-center py-20 text-center border-dashed border-white/5 border-[3px]">
            <TrendingUp className="w-16 h-16 text-gray-600 mb-4 opacity-50" />
            <h3 className="text-3xl font-black text-gray-400 mb-2">No Entries Found</h3>
            <p className="text-gray-500 mb-6 font-medium">No progress records found for the selected dates.</p>
        </motion.div>
      ) : stats && (
        <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="glass-card p-6 border-l-4 border-blue-500"><p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Current Weight</p><h3 className="text-3xl font-black text-white">{stats.currentWeight} <span className="text-xs text-gray-500 ml-1">kg</span></h3></div>
                <div className="glass-card p-6 border-l-4 border-slate-600"><p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Starting Weight</p><h3 className="text-3xl font-black text-white">{stats.startWeight} <span className="text-xs text-gray-500 ml-1">kg</span></h3></div>
                <div className="glass-card p-6 border-l-4 border-accent">
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Net Change</p>
                    <div className="flex items-center gap-3">
                        <h3 className="text-3xl font-black text-white">{Math.abs(stats.totalChange)} <span className="text-xs text-gray-500 ml-1">kg</span></h3>
                        {stats.totalChange < 0 ? <span className="flex items-center text-[10px] font-bold text-green-400 bg-green-500/10 px-2 py-1 rounded"><TrendingDown className="w-3 h-3 mr-1"/> Loss</span> : stats.totalChange > 0 ? <span className="flex items-center text-[10px] font-bold text-red-400 bg-red-500/10 px-2 py-1 rounded"><TrendingUp className="w-3 h-3 mr-1"/> Gained</span> : null}
                    </div>
                </div>
                <div className="glass-card p-6 border-l-4 border-purple-500">
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Current Body Fat</p>
                    <div className="flex items-center gap-3">
                        <h3 className="text-3xl font-black text-white">{stats.latestBodyFat}{stats.latestBodyFat !== '--' && '%'}</h3>
                        {stats.bodyFatChange < 0 ? <span className="text-[10px] font-bold text-green-400 bg-green-500/10 px-2 py-1 rounded">{Math.abs(stats.bodyFatChange)}%</span> : stats.bodyFatChange > 0 ? <span className="text-[10px] font-bold text-red-400 bg-red-500/10 px-2 py-1 rounded">+{stats.bodyFatChange}%</span> : null}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="glass-card p-6 h-[400px] flex flex-col relative overflow-hidden">
                    <h3 className="text-lg font-bold text-white mb-6 z-10 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-accent"/> Weight Trend</h3>
                    <div className="flex-1 w-full relative z-10">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <filter id="glow1" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="4" result="blur" /><feComposite in="SourceGraphic" in2="blur" operator="over" /></filter>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis dataKey="displayDate" stroke="#64748b" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} dy={10} />
                                <YAxis stroke="#64748b" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} domain={['dataMin - 2', 'auto']} dx={-10} />
                                <RechartsTooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)' }} />
                                <Line type="monotone" name="Weight (kg)" dataKey="weight" stroke="#00E6FF" strokeWidth={3} dot={{ r: 4, fill: '#0A2740', stroke: '#00E6FF' }} activeDot={{ r: 6, fill: '#00E6FF', filter: 'url(#glow1)' }} filter="url(#glow1)" animationDuration={1000} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="glass-card p-6 h-[400px] flex flex-col relative overflow-hidden">
                    <h3 className="text-lg font-bold text-white mb-6 z-10 flex items-center gap-2"><Target className="w-5 h-5 text-purple-400"/> Body Fat Trend</h3>
                    {chartData.some(d => d.bodyFatPercentage != null) ? (
                        <div className="flex-1 w-full relative z-10">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorBf" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#a855f7" stopOpacity={0.4}/><stop offset="95%" stopColor="#a855f7" stopOpacity={0}/></linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                    <XAxis dataKey="displayDate" stroke="#64748b" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} dy={10} />
                                    <YAxis stroke="#64748b" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} domain={['dataMin - 1', 'auto']} dx={-10} />
                                    <RechartsTooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)' }} />
                                    <Area type="monotone" name="Body Fat %" dataKey="bodyFatPercentage" stroke="#a855f7" strokeWidth={3} fillOpacity={1} fill="url(#colorBf)" connectNulls animationDuration={1000} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-500 font-mono tracking-widest"><AlertCircle className="w-8 h-8 opacity-20 mb-2"/> NO DATA FOUND</div>
                    )}
                </div>
            </div>

            {/* Predictive Analytics */}
            <div className="mt-8">
                <PredictiveChart userId={user._id} />
            </div>

            <div className="glass-card overflow-hidden border-none shadow-xl bg-[#0A2740]/90">
                <div className="p-5 border-b border-white/5 flex items-center justify-between">
                    <h2 className="text-sm font-bold tracking-widest uppercase text-gray-400">History Log</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left whitespace-nowrap">
                        <thead>
                            <tr className="bg-black/30 text-[10px] font-black text-gray-500 uppercase tracking-widest">
                                <th className="p-4 rounded-tl-xl">Date</th>
                                <th className="p-4">Weight</th>
                                <th className="p-4">Body Fat</th>
                                <th className="p-4">Notes</th>
                                <th className="p-4 text-right rounded-tr-xl">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            <AnimatePresence>
                                {[...logs].sort((a,b) => new Date(b.date) - new Date(a.date)).map((log) => (
                                    <motion.tr key={log._id} initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="border-b border-white/5 hover:bg-white/5 group transition">
                                        <td className="p-4 text-sm font-bold text-gray-300">{new Date(log.date).toLocaleDateString(undefined, {year:'numeric', month:'short', day:'numeric'})}</td>
                                        <td className="p-4 text-sm text-accent font-black">{log.weight} <span className="text-[10px] text-gray-600">kg</span></td>
                                        <td className="p-4 text-sm font-bold">{log.bodyFatPercentage ? <span className="text-purple-400">{log.bodyFatPercentage}%</span> : <span className="text-gray-700">--</span>}</td>
                                        <td className="p-4 text-xs text-gray-500 max-w-[200px] truncate">{log.notes || '--'}</td>
                                        <td className="p-4 text-right flex items-center justify-end gap-2">
                                            <button onClick={() => triggerEdit(log)} className="p-2 text-gray-500 hover:text-accent hover:bg-accent/10 rounded transition opacity-0 group-hover:opacity-100"><Edit2 className="w-4 h-4"/></button>
                                            <button onClick={() => handleDelete(log._id)} className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded transition opacity-0 group-hover:opacity-100"><Trash2 className="w-4 h-4"/></button>
                                        </td>
                                    </motion.tr>
                                ))}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>
            </div>
        </>
      )}
    </div>
  );
};
export default Progress;
