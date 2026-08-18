import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Flame, Droplets, Bed, Footprints, Plus, Minus, Lock, Loader2, 
  Sparkles, Activity, Sun, Moon, Book, Dumbbell, Coffee, 
  CheckCircle, Brain, Heart, Zap, X, Save, Edit2
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const iconMap = {
  Activity, Sun, Moon, Book, Dumbbell, Coffee, Droplets, Footprints, Flame, CheckCircle, Brain, Heart, Zap
};

const colorOptions = [
  'text-blue-400', 'text-orange-400', 'text-purple-400', 'text-green-400', 
  'text-red-400', 'text-yellow-400', 'text-cyan-400', 'text-pink-400'
];

const Habits = () => {
  const { user } = useAuth();
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingHabits, setEditingHabits] = useState({});

  const [newHabit, setNewHabit] = useState({
    name: '', unit: '', targetValue: 0, icon: 'Activity', color: 'text-blue-400', category: 'General', frequency: 'Daily'
  });

  const isPremium = user?.subscription?.plan !== 'FREE';

  useEffect(() => {
    if (isPremium) fetchHabits();
    else setLoading(false);
  }, [isPremium]);

  const fetchHabits = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/habits');
      setHabits(data.data || []);
    } catch (error) {
      toast.error('Failed to load daily habits');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveHabit = async (habitData) => {
    try {
      const { data } = await api.post('/habits', habitData);
      
      setHabits(prev => {
        const exists = prev.find(h => h.name === data.data.name);
        if (exists) {
          return prev.map(h => h.name === data.data.name ? data.data : h);
        }
        return [...prev, data.data];
      });
      
      return data.data;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not sync habit data');
      throw error;
    }
  };

  const createCustomHabit = async (e) => {
    e.preventDefault();
    if (!newHabit.name || newHabit.targetValue <= 0) {
      toast.error('Please provide a valid name and target > 0');
      return;
    }
    
    try {
      const payload = {
        ...newHabit,
        completedValue: 0
      };
      await handleSaveHabit(payload);
      toast.success('Habit protocol activated!');
      setShowAddModal(false);
      setNewHabit({ name: '', unit: '', targetValue: 0, icon: 'Activity', color: 'text-blue-400', category: 'General', frequency: 'Daily' });
    } catch (err) {}
  };

  const updateHabitQuick = async (habit, newCompletedValue) => {
    const updatedValue = Math.max(0, newCompletedValue);
    try {
      await handleSaveHabit({ ...habit, completedValue: updatedValue });
    } catch (err) {}
  };

  const handleInlineEditSave = async (habitId, currentHabitData) => {
    const editData = editingHabits[habitId];
    if (!editData) return;
    
    try {
      await handleSaveHabit({
        ...currentHabitData,
        targetValue: Number(editData.targetValue),
        completedValue: Number(editData.completedValue)
      });
      setEditingHabits(prev => {
        const next = {...prev};
        delete next[habitId];
        return next;
      });
      toast.success('Habit updated');
    } catch (err) {}
  };

  const toggleEditMode = (habit) => {
    if (editingHabits[habit._id]) {
      const next = {...editingHabits};
      delete next[habit._id];
      setEditingHabits(next);
    } else {
      setEditingHabits(prev => ({
        ...prev,
        [habit._id]: { targetValue: habit.targetValue, completedValue: habit.completedValue }
      }));
    }
  };

  const CircularProgress = ({ value, target, colorClass }) => {
    const percentage = target > 0 ? Math.min(100, Math.round((value / target) * 100)) : 0;
    const radius = 70;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;

    return (
      <div className="relative flex items-center justify-center w-40 h-40">
        <svg className="w-full h-full transform -rotate-90">
          <circle cx="80" cy="80" r={radius} stroke="currentColor" strokeWidth="10" fill="transparent" className="text-white/5" />
          <circle cx="80" cy="80" r={radius} stroke="currentColor" strokeWidth="10" fill="transparent" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className={`${colorClass.replace('text-', 'text-')} transition-all duration-700 ease-out`} />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="text-2xl font-black text-white">{percentage}%</span>
          <span className="text-[10px] text-textMuted uppercase font-bold tracking-widest">Progress</span>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 text-accent animate-spin" />
        <p className="text-textMuted animate-pulse font-mono px-4 text-center">ACCESSING DAILY HABIT PROTOCOLS...</p>
      </div>
    );
  }

  if (!isPremium) {
    return (
      <div className="max-w-4xl mx-auto mt-20 text-center px-4">
        <div className="glass-card p-12 relative overflow-hidden bg-gradient-to-br from-[#0B1521] to-[#0A2740]">
          <div className="absolute -top-10 -left-10 opacity-5"><Flame className="w-80 h-80"/></div>
          <Sparkles className="w-16 h-16 text-accent mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-white mb-4">Habit Rings are Premium</h1>
          <p className="text-textMuted text-lg mb-8 max-w-lg mx-auto">
            Track custom habits, daily routines, and optimize your biological performance with full AI integration.
          </p>
          <Link to="/subscription" className="btn-primary inline-flex items-center gap-2 px-8 py-4 text-lg">
            Unlock Habits <Lock className="w-5 h-5" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Flame className="text-accent w-8 h-8"/> Dynamic Habit Protocols
          </h1>
          <p className="text-textMuted">Maintain consistency to optimize biological performance.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="btn-primary flex items-center gap-2 h-12 px-6 bg-accent text-dark font-bold hover:bg-cyan-300 transition-all"
        >
          <Plus className="w-5 h-5" /> New Custom Habit
        </button>
      </div>

      {habits.length === 0 ? (
        <div className="glass-card p-12 text-center flex flex-col items-center border-dashed border-2 border-white/10">
          <Activity className="w-16 h-16 text-gray-500 mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">No Active Protocols</h2>
          <p className="text-textMuted max-w-md mx-auto mb-8">You haven't set up any daily habits yet. Create your first habit to start tracking your consistency.</p>
          <button onClick={() => setShowAddModal(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-5 h-5"/> Add First Habit
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {habits.map((habit, index) => {
            const IconComponent = iconMap[habit.icon] || Activity;
            const isEditing = !!editingHabits[habit._id];
            const editData = editingHabits[habit._id];

            return (
              <motion.div
                key={habit._id || habit.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="glass-card p-8 flex flex-col items-center relative group"
              >
                <button 
                  onClick={() => toggleEditMode(habit)}
                  className="absolute top-4 right-4 p-2 bg-white/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/10"
                >
                  {isEditing ? <X className="w-4 h-4 text-gray-400" /> : <Edit2 className="w-4 h-4 text-gray-400" />}
                </button>

                <div className="flex items-center justify-between w-full mb-8">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-black/20 ${habit.color}`}>
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white">{habit.name}</h3>
                      <span className="text-[10px] text-gray-500 uppercase tracking-widest">{habit.category}</span>
                    </div>
                  </div>
                  {!isEditing && <span className="text-xs text-textMuted font-mono">Target: {habit.targetValue} {habit.unit}</span>}
                </div>

                <CircularProgress value={isEditing ? editData.completedValue : habit.completedValue} target={isEditing ? editData.targetValue : habit.targetValue} colorClass={habit.color} />

                <div className="mt-8 flex flex-col w-full bg-black/20 p-4 rounded-2xl border border-white/5 gap-3">
                  {isEditing ? (
                    <div className="flex flex-col gap-3">
                       <div className="flex items-center justify-between gap-2">
                          <label className="text-xs text-gray-400 uppercase font-bold w-20">Target</label>
                          <input 
                            type="number" 
                            value={editData.targetValue}
                            onChange={(e) => setEditingHabits({...editingHabits, [habit._id]: {...editData, targetValue: e.target.value}})}
                            className="bg-slate-800 border border-white/10 rounded px-2 py-1 text-white text-sm flex-1 focus:border-accent outline-none"
                            min="0"
                          />
                       </div>
                       <div className="flex items-center justify-between gap-2">
                          <label className="text-xs text-gray-400 uppercase font-bold w-20">Done</label>
                          <input 
                            type="number" 
                            value={editData.completedValue}
                            onChange={(e) => setEditingHabits({...editingHabits, [habit._id]: {...editData, completedValue: e.target.value}})}
                            className="bg-slate-800 border border-white/10 rounded px-2 py-1 text-white text-sm flex-1 focus:border-accent outline-none"
                            min="0"
                          />
                       </div>
                       <button onClick={() => handleInlineEditSave(habit._id, habit)} className="w-full mt-2 bg-accent text-dark font-bold text-sm py-2 rounded-lg flex justify-center items-center gap-2">
                         <Save className="w-4 h-4" /> Save
                       </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between w-full">
                      <button 
                        onClick={() => updateHabitQuick(habit, habit.completedValue - (habit.targetValue >= 1000 ? 500 : habit.targetValue >= 100 ? 10 : 1))}
                        className="p-2 hover:bg-white/5 rounded-lg text-gray-500 hover:text-white transition-colors"
                        disabled={habit.completedValue <= 0}
                      >
                        <Minus className="w-5 h-5" />
                      </button>
                      
                      <div className="text-center">
                        <span className="text-xl font-black text-white">{habit.completedValue}</span>
                        <span className="text-[10px] block text-textMuted uppercase">{habit.unit}</span>
                      </div>

                      <button 
                        onClick={() => updateHabitQuick(habit, habit.completedValue + (habit.targetValue >= 1000 ? 500 : habit.targetValue >= 100 ? 10 : 1))}
                        className="p-2 hover:bg-white/5 rounded-lg text-gray-500 hover:text-white transition-colors"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Add Habit Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
             <motion.div 
               initial={{ scale: 0.95, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               exit={{ scale: 0.95, opacity: 0 }}
               className="bg-slate-800 border border-white/10 p-6 md:p-8 rounded-2xl max-w-lg w-full shadow-2xl overflow-y-auto max-h-[90vh]"
             >
               <div className="flex justify-between items-center mb-6">
                 <h2 className="text-2xl font-bold text-white flex items-center gap-2"><Sparkles className="w-6 h-6 text-accent"/> Create Protocol</h2>
                 <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-white transition-colors"><X className="w-6 h-6"/></button>
               </div>
               
               <form onSubmit={createCustomHabit} className="space-y-4">
                 <div>
                   <label className="block text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Habit Name</label>
                   <input type="text" value={newHabit.name} onChange={e => setNewHabit({...newHabit, name: e.target.value})} className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-3 focus:border-accent outline-none" placeholder="e.g., Sunlight, Reading, Meditation" required />
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4">
                   <div>
                     <label className="block text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Target Value</label>
                     <input type="number" min="0" step="0.1" value={newHabit.targetValue} onChange={e => setNewHabit({...newHabit, targetValue: Number(e.target.value)})} className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-3 focus:border-accent outline-none" required />
                   </div>
                   <div>
                     <label className="block text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Unit</label>
                     <input type="text" value={newHabit.unit} onChange={e => setNewHabit({...newHabit, unit: e.target.value})} className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-3 focus:border-accent outline-none" placeholder="mins, ml, pages" />
                   </div>
                 </div>

                 <div>
                   <label className="block text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">Category</label>
                   <select value={newHabit.category} onChange={e => setNewHabit({...newHabit, category: e.target.value})} className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-3 focus:border-accent outline-none appearance-none">
                     <option value="Health">Health</option>
                     <option value="Productivity">Productivity</option>
                     <option value="Mindfulness">Mindfulness</option>
                     <option value="Learning">Learning</option>
                     <option value="General">General</option>
                   </select>
                 </div>

                 <div>
                   <label className="block text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">Icon</label>
                   <div className="flex flex-wrap gap-2">
                     {Object.keys(iconMap).map(iconName => {
                       const IconComp = iconMap[iconName];
                       return (
                         <button key={iconName} type="button" onClick={() => setNewHabit({...newHabit, icon: iconName})} className={`p-3 rounded-xl border transition-all ${newHabit.icon === iconName ? 'bg-accent/20 border-accent text-accent' : 'bg-slate-900 border-slate-700 text-gray-400 hover:border-gray-500'}`}>
                           <IconComp className="w-5 h-5" />
                         </button>
                       )
                     })}
                   </div>
                 </div>

                 <div>
                   <label className="block text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">Color</label>
                   <div className="flex flex-wrap gap-2">
                     {colorOptions.map(color => (
                       <button key={color} type="button" onClick={() => setNewHabit({...newHabit, color})} className={`w-8 h-8 rounded-full border-2 transition-all ${newHabit.color === color ? 'border-white scale-110' : 'border-transparent'} ${color.replace('text-', 'bg-').replace('-400', '-500')}`} />
                     ))}
                   </div>
                 </div>

                 <button type="submit" className="w-full btn-primary py-4 mt-6 text-lg">Activate Protocol</button>
               </form>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Habits;
