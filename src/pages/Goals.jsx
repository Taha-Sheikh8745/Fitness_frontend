import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, TrendingUp, Calendar, Plus, Trash2, CheckCircle2, AlertCircle, Loader2, ArrowRight, Sparkles, Crown, X } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const Goals = () => {
  const { user } = useAuth();
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiGoals, setAiGoals] = useState(null);
  const [showAIModal, setShowAIModal] = useState(false);
  
  const [formData, setFormData] = useState({
    type: 'Weight',
    targetValue: '',
    currentValue: '',
    deadline: '',
    category: 'General'
  });

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchAIGoals = async () => {
    try {
      setAiLoading(true);
      const { data } = await api.get('/ai/goals');
      setAiGoals(data.data);
      setShowAIModal(true);
    } catch (err) {
      toast.error('AI Strategy Advisor is busy. Try again later.');
    } finally {
      setAiLoading(false);
    }
  };

  const fetchGoals = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/goals');
      setGoals(data.data);
    } catch (error) {
      toast.error('Failed to load goals');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/goals', formData);
      setGoals([...goals, data.data]);
      setShowForm(false);
      setFormData({ type: 'Weight', targetValue: '', currentValue: '', deadline: '', category: 'General' });
      toast.success('Strategy goal initialized!');
    } catch (error) {
      toast.error('Failed to create goal');
    }
  };

  const deleteGoal = async (id) => {
    try {
      await api.delete(`/goals/${id}`);
      setGoals(goals.filter(g => g._id !== id));
      toast.success('Goal terminated');
    } catch (error) {
      toast.error('Failed to delete goal');
    }
  };

  const calculateProgress = (goal) => {
    const isLoss = goal.type === 'Weight' || goal.type === 'BodyFat'; // Usually loss for goals
    // Simplistic: (start - current) / (start - target) 
    // But we don't store start value. Let's use currentValue / targetValue for now or just 0-100 linear
    const progress = (goal.currentValue / goal.targetValue) * 100;
    return Math.min(100, Math.max(0, Math.round(progress)));
  };

  const getDayDiff = (deadline) => {
    const diff = new Date(deadline) - new Date();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Target className="text-accent w-8 h-8"/> Objective Roadmap
          </h1>
          <p className="text-textMuted tracking-tight uppercase text-xs font-bold">Configure and monitor high-level fitness milestones.</p>
        </div>
        <div className="flex gap-4">
          {user?.subscription?.plan === 'ELITE' ? (
              <button 
                onClick={fetchAIGoals}
                disabled={aiLoading}
                className="group relative px-6 h-12 flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-xl font-bold text-white transition-all shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_30px_rgba(168,85,247,0.5)] overflow-hidden"
              >
                 <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                 {aiLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                 AI Strategic Advisor
              </button>
          ) : (
            <div className="relative group">
               <button className="px-6 h-12 flex items-center gap-2 bg-slate-800 text-gray-500 rounded-xl font-bold cursor-not-allowed border border-white/5 opacity-50">
                  <Sparkles className="w-5 h-5" /> AI Advisor
               </button>
               <div className="absolute inset-0 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Link to="/subscription" className="w-full h-full block" title="Upgrade to ELITE" />
               </div>
            </div>
          )}
          <button 
            onClick={() => setShowForm(!showForm)}
            className="btn-primary px-6 h-12 flex items-center gap-2"
          >
            {showForm ? 'Cancel Config' : <><Plus className="w-5 h-5"/> New Objective</>}
          </button>
        </div>
      </div>

      {/* AI AI Recommendations Modal */}
      <AnimatePresence>
        {showAIModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-slate-900 border border-purple-500/30 rounded-3xl p-8 max-w-2xl w-full shadow-[0_0_50px_rgba(168,85,247,0.2)] relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-indigo-500"></div>
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500/10 rounded-lg border border-purple-500/20">
                    <Crown className="w-6 h-6 text-purple-400" />
                  </div>
                  <h3 className="text-2xl font-black text-white tracking-tight italic">Elite AI Strategy</h3>
                </div>
                <button onClick={() => setShowAIModal(false)} className="text-gray-500 hover:text-white transition">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                {(aiGoals?.goals || []).map((goal, i) => (
                  <motion.div 
                    initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: i * 0.1 }}
                    key={i} className="flex gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-purple-500/20 transition-colors"
                  >
                    <div className="text-purple-400 font-black text-lg">0{i+1}</div>
                    <p className="text-gray-300 font-medium leading-relaxed">{goal}</p>
                  </motion.div>
                ))}
              </div>

              <div className="mt-10 flex justify-end">
                <button onClick={() => setShowAIModal(false)} className="px-8 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition text-sm">Close Protocol</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-12"
          >
            <div className="glass-card p-8 bg-slate-900/50">
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Objective Type</label>
                  <select 
                    className="glass-input w-full bg-[#0A2740]" 
                    value={formData.type} 
                    onChange={e => setFormData({...formData, type: e.target.value})}
                  >
                    <option value="Weight">Body Weight</option>
                    <option value="BodyFat">Body Fat %</option>
                    <option value="Strength">Strength (Max Lift)</option>
                  </select>
                </div>
                {formData.type === 'Strength' && (
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Exercise Name</label>
                    <input 
                       type="text" required placeholder="e.g. Bench Press" className="glass-input w-full"
                       value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}
                    />
                  </div>
                )}
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Target Value</label>
                  <input 
                    type="number" required step="0.1" className="glass-input w-full" 
                    value={formData.targetValue} onChange={e => setFormData({...formData, targetValue: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Current Start Value</label>
                  <input 
                    type="number" required step="0.1" className="glass-input w-full" 
                    value={formData.currentValue} onChange={e => setFormData({...formData, currentValue: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Deadline Protocol</label>
                  <input 
                    type="date" required className="glass-input w-full" 
                    value={formData.deadline} onChange={e => setFormData({...formData, deadline: e.target.value})}
                  />
                </div>
                <div className="md:col-span-3 flex justify-end">
                   <button type="submit" className="btn-primary px-10 py-3">Establish Goal</button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 grayscale opacity-50">
           <Loader2 className="w-10 h-10 animate-spin text-accent mb-4" />
           <p className="font-mono text-xs uppercase">Polling objective indices...</p>
        </div>
      ) : goals.length === 0 ? (
        <div className="text-center py-20 glass-card bg-transparent border-dashed border-2 border-white/5">
          <Target className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-textMuted">No strategic objectives detected in current cycle.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {goals.map((goal) => (
            <div key={goal._id} className="glass-card p-8 flex flex-col hover:border-accent/30 transition-colors">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold text-accent uppercase tracking-widest">{goal.type}</span>
                    {goal.status === 'Achieved' && <CheckCircle2 className="w-4 h-4 text-green-400" />}
                  </div>
                  <h3 className="text-xl font-bold text-white">{goal.type === 'Strength' ? goal.category : `${goal.type} Optimization`}</h3>
                </div>
                <button onClick={() => deleteGoal(goal._id)} className="text-gray-600 hover:text-red-400 p-2">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 mb-8">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-textMuted">Progress</span>
                  <span className="text-white font-bold">{calculateProgress(goal)}%</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${calculateProgress(goal)}%` }}
                    className="h-full bg-accent shadow-[0_0_10px_rgba(0,230,255,0.5)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="bg-black/20 p-3 rounded-xl">
                  <span className="text-[10px] block text-textMuted uppercase mb-1">Current</span>
                  <p className="font-bold text-white text-lg">{goal.currentValue}</p>
                </div>
                <div className="flex items-center justify-center text-gray-700">
                  <ArrowRight className="w-5 h-5" />
                </div>
                <div className="bg-accent/10 p-3 rounded-xl border border-accent/20">
                  <span className="text-[10px] block text-accent uppercase mb-1">Target</span>
                  <p className="font-bold text-accent text-lg">{goal.targetValue}</p>
                </div>
              </div>

              <div className="mt-auto pt-6 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-textMuted">
                  <Calendar className="w-4 h-4" />
                  <span>Due in {getDayDiff(goal.deadline)} days</span>
                </div>
                {getDayDiff(goal.deadline) < 7 && goal.status !== 'Achieved' && (
                  <div className="flex items-center gap-1 text-[10px] text-orange-400 font-bold uppercase animate-pulse">
                    <AlertCircle className="w-3 h-3" /> Critical Timeline
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Goals;
