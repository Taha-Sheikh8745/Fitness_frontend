import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Dumbbell, Plus, Trash2, Calendar, Clock, Search, Filter, Tag, Navigation, Target, Activity, Edit2 } from 'lucide-react';
import DateFilter from '../components/common/DateFilter';

const Workouts = () => {
  const [searchParams] = useSearchParams();
  const initSearch = searchParams.get('search') || '';

  const [workouts, setWorkouts] = useState([]);
  const [totalVolume, setTotalVolume] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // UI States
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);

  // Search & Filter state
  const [search, setSearch] = useState(initSearch);
  const [filterCategory, setFilterCategory] = useState('');
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });

  // Form State
  const initialForm = { date: new Date().toISOString().split('T')[0], category: 'Strength', duration: 60, tagInput: '', muscleGroup: 'Chest Day' };
  const [formData, setFormData] = useState(initialForm);
  const [tags, setTags] = useState([]);
  const [exercises, setExercises] = useState([{ name: '', sets: 3, reps: 10, weight: 0 }]);

  useEffect(() => {
    setSearch(searchParams.get('search') || '');
  }, [searchParams]);

  useEffect(() => {
    if (dateRange.startDate && dateRange.endDate) {
        const timer = setTimeout(() => {
        fetchWorkouts();
        }, 500); 
        return () => clearTimeout(timer);
    }
  }, [search, filterCategory, dateRange]);

  const fetchWorkouts = async () => {
    try {
      setLoading(true);
      let query = `/workouts?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}&`;
      if (search) query += `search=${encodeURIComponent(search)}&`;
      if (filterCategory) query += `category=${encodeURIComponent(filterCategory)}&`;
      
      const { data } = await api.get(query);
      setWorkouts(data.data);
      setTotalVolume(data.totalVolume || 0);
    } catch (e) {
      toast.error('Failed to load workouts');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTag = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = formData.tagInput.trim();
      if (val && !tags.includes(val)) {
        setTags([...tags, val]);
      }
      setFormData({ ...formData, tagInput: '' });
    }
  };
  
  const removeTag = (t) => {
      setTags(tags.filter(tag => tag !== t));
  }

  const handleExerciseChange = (index, field, value) => {
    const newExercises = [...exercises];
    newExercises[index][field] = value;
    setExercises(newExercises);
  };

  const addExerciseField = () => setExercises([...exercises, { name: '', sets: 3, reps: 10, weight: 0 }]);
  const removeExerciseField = (index) => {
    const newExercises = [...exercises];
    newExercises.splice(index, 1);
    setExercises(newExercises);
  };

  const triggerEdit = (workout) => {
      setEditId(workout._id);
      setFormData({
          category: workout.category || 'Strength',
          duration: workout.duration || 60,
          date: new Date(workout.date).toISOString().split('T')[0],
          tagInput: '',
          muscleGroup: workout.muscleGroup || 'Full Body'
      });
      setTags(workout.tags || []);
      setExercises(workout.exercises?.length > 0 ? workout.exercises : [{ name: '', sets: 3, reps: 10, weight: 0 }]);
      setShowForm(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelForm = () => {
      setShowForm(false);
      setEditId(null);
      setFormData(initialForm);
      setTags([]);
      setExercises([{ name: '', sets: 3, reps: 10, weight: 0 }]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      toast.loading(editId ? 'Updating workout...' : 'Logging workout...', { id: 'wt' });
      
      const payload = {
        date: formData.date,
        duration: Number(formData.duration),
        category: formData.category,
        muscleGroup: formData.muscleGroup,
        tags: tags,
        exercises: exercises.map(ex => ({
          ...ex, 
          sets: Number(ex.sets), 
          reps: Number(ex.reps), 
          weight: Number(ex.weight) 
        }))
      };

      if (editId) {
          await api.put(`/workouts/${editId}`, payload);
          toast.success('Workout updated!', { id: 'wt' });
      } else {
          await api.post('/workouts', payload);
          toast.success('Workout logged!', { id: 'wt' });
      }
      
      cancelForm();
      fetchWorkouts();
    } catch (e) {
      toast.error('Failed to log workout', { id: 'wt' });
    }
  };

  const deleteWorkout = async (id) => {
    try {
      await api.delete(`/workouts/${id}`);
      toast.success('Workout deleted');
      fetchWorkouts();
    } catch (e) {
      toast.error('Failed to delete');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="relative z-20 glass-card border-none p-6 md:p-10 mb-8 bg-gradient-to-br from-[#0A2740] to-slate-900 shadow-2xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white mb-2 flex items-center gap-3">
             <Dumbbell className="text-accent w-8 h-8"/> Workout Tracker
          </h1>
          <p className="text-gray-400 font-medium">Log your exercises and track your total volume lifted over time.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-900/50 p-3 rounded-2xl border border-white/5 w-full lg:w-auto">
            <div className="flex flex-col px-4 border-r border-white/10">
               <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest text-center">Total Volume Lifted</span>
               <span className="text-2xl font-black text-white flex items-center justify-center gap-1" title="Calculated as: Sets * Reps * Weight for all exercises in this time period.">
                   {totalVolume.toLocaleString()} <span className="text-accent text-sm">kg</span>
               </span>
            </div>
            <DateFilter onFilterChange={setDateRange} />
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto flex-1">
            <div className="relative flex-1 max-w-sm">
                <Search className="w-5 h-5 absolute left-3 top-3 text-gray-500" />
                <input 
                    type="text" 
                    placeholder="Search exercise..." 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-white focus:outline-none focus:border-accent transition"
                />
            </div>
            <div className="relative w-full sm:w-48">
                <Filter className="w-5 h-5 absolute left-3 top-3 text-gray-500" />
                <select 
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white hover:border-white/20 transition appearance-none cursor-pointer"
                >
                    <option value="">All Categories</option>
                    <option value="Strength">Strength</option>
                    <option value="Cardio">Cardio</option>
                    <option value="Flexibility">Flexibility</option>
                    <option value="HIIT">HIIT</option>
                </select>
            </div>
          </div>
          <button onClick={() => !showForm ? setShowForm(true) : cancelForm()} className="btn-primary w-full md:w-auto flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(0,230,255,0.2)]">
                {showForm ? 'Cancel Form' : <><Plus className="w-5 h-5" /> Log Workout</>}
          </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -20, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }} exit={{ opacity: 0, y: -20, height: 0 }} className="glass-card p-6 overflow-hidden mb-8 border border-accent/30 shadow-[0_0_30px_rgba(0,230,255,0.05)] bg-[#0A2740]/80">
            <h2 className="text-xl font-bold text-white mb-6 border-b border-white/10 pb-4">{editId ? 'Edit Workout' : 'New Workout'}</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div>
                  <label className="text-xs text-gray-400 font-bold tracking-widest uppercase mb-1 block">Date</label>
                  <input type="date" required className="glass-input w-full p-2.5 text-sm" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                </div>
                <div>
                  <label className="text-xs text-gray-400 font-bold tracking-widest uppercase mb-1 block">Workout Type</label>
                  <select className="glass-input text-dark w-full p-2.5 text-sm bg-slate-900" value={formData.muscleGroup} onChange={e => setFormData({...formData, muscleGroup: e.target.value})}>
                    <option value="Chest Day">Chest Day</option>
                    <option value="Back Day">Back Day</option>
                    <option value="Leg Day">Leg Day</option>
                    <option value="Shoulder Day">Shoulder Day</option>
                    <option value="Arm Day">Arm Day</option>
                    <option value="Full Body">Full Body</option>
                    <option value="Cardio">Cardio</option>
                    <option value="Core">Core / Abs</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 font-bold tracking-widest uppercase mb-1 block">Category</label>
                  <select className="glass-input text-dark w-full p-2.5 text-sm bg-slate-900" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                    <option value="Strength">Strength</option>
                    <option value="Cardio">Cardio</option>
                    <option value="Flexibility">Flexibility</option>
                    <option value="HIIT">HIIT</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 font-bold tracking-widest uppercase mb-1 block">Duration (min)</label>
                  <input type="number" className="glass-input w-full p-2.5 text-sm" value={formData.duration} onChange={e => setFormData({...formData, duration: e.target.value})} required />
                </div>
                <div>
                  <label className="text-xs text-gray-400 font-bold tracking-widest uppercase mb-1 block">Tags (Optional)</label>
                  <div className="relative">
                    <Tag className="w-4 h-4 absolute left-3 top-3.5 text-gray-500" />
                    <input type="text" className="glass-input w-full p-2.5 text-sm pl-9" placeholder="Press Enter..." value={formData.tagInput} onChange={e => setFormData({...formData, tagInput: e.target.value})} onKeyDown={handleAddTag} />
                  </div>
                </div>
              </div>
              
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2 border-t border-white/5">
                  {tags.map((t, idx) => (
                    <span key={idx} className="bg-accent/20 text-accent text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 border border-accent/20">
                      {t} <button type="button" onClick={() => removeTag(t)} className="hover:text-white">&times;</button>
                    </span>
                  ))}
                </div>
              )}

              <div className="space-y-4 pt-6 bg-slate-900/30 p-5 rounded-2xl border border-white/5">
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <h3 className="text-sm font-bold tracking-widest uppercase text-gray-400 flex items-center gap-2"><Activity className="w-4 h-4"/> Exercises</h3>
                  <button type="button" onClick={addExerciseField} className="text-xs font-bold px-3 py-1.5 rounded-lg bg-accent/10 text-accent border border-accent/20 hover:bg-accent hover:text-slate-900 transition flex items-center gap-1">
                    <Plus className="w-3 h-3"/> Add Exercise
                  </button>
                </div>
                
                {exercises.map((ex, i) => (
                  <div key={i} className="grid grid-cols-12 gap-3 items-center bg-white/5 p-3 rounded-xl border border-white/5">
                    <div className="col-span-12 md:col-span-5">
                      <input type="text" placeholder="Exercise Name" value={ex.name} onChange={e => handleExerciseChange(i, 'name', e.target.value)} required className="glass-input w-full py-2 text-sm" />
                    </div>
                    <div className="col-span-4 md:col-span-2 relative group">
                      <span className="absolute -top-3 left-3 text-[9px] bg-[#0A2740] px-1 text-accent font-bold hidden group-hover:block transition">Sets</span>
                      <input type="number" placeholder="Sets" value={ex.sets} onChange={e => handleExerciseChange(i, 'sets', e.target.value)} required className="glass-input w-full py-2 text-center text-sm" />
                    </div>
                    <div className="col-span-4 md:col-span-2 relative group">
                      <span className="absolute -top-3 left-3 text-[9px] bg-[#0A2740] px-1 text-accent font-bold hidden group-hover:block transition">Reps</span>
                      <input type="number" placeholder="Reps" value={ex.reps} onChange={e => handleExerciseChange(i, 'reps', e.target.value)} required className="glass-input w-full py-2 text-center text-sm" />
                    </div>
                    <div className="col-span-4 md:col-span-2 relative group">
                      <span className="absolute -top-3 left-3 text-[9px] bg-[#0A2740] px-1 text-accent font-bold hidden group-hover:block transition">Weight (kg)</span>
                      <input type="number" step="0.5" placeholder="kg" value={ex.weight} onChange={e => handleExerciseChange(i, 'weight', e.target.value)} required className="glass-input w-full py-2 text-center text-sm" />
                    </div>
                    <div className="col-span-12 md:col-span-1 flex justify-end">
                      {exercises.length > 1 && (
                        <button type="button" onClick={() => removeExerciseField(i)} className="p-2.5 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-4">
                  <button type="submit" className="w-full md:w-auto btn-primary py-3 px-8 text-sm font-bold flex justify-center items-center gap-2">
                    <Target className="w-5 h-5" /> {editId ? 'Save Changes' : 'Log Workout'}
                  </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-4">
        {loading ? (
          [...Array(3)].map((_, i) => <div key={i} className="glass-card animate-pulse h-32"></div>)
        ) : workouts.length === 0 ? (
          <div className="glass-card flex flex-col items-center justify-center py-20 text-center border-dashed border-white/10 border-2">
            <Navigation className="w-16 h-16 text-gray-600 mb-6 opacity-50" />
            <h3 className="text-2xl font-bold text-white mb-2">No Workouts Found</h3>
            <p className="text-gray-400 max-w-sm mb-6">No workouts were found for the selected dates or filters.</p>
            <button onClick={() => setShowForm(true)} className="btn-primary text-sm shadow-[0_0_20px_rgba(0,230,255,0.1)]">Log Your First Workout</button>
          </div>
        ) : (
          workouts.map(workout => (
            <motion.div whileHover={{ scale: 1.01 }} key={workout._id} className="glass-card flex flex-col md:flex-row md:items-center justify-between p-6 gap-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2"></div>
              
              <div className="flex items-start md:items-center gap-5">
                <div className="p-4 bg-[#0A2740] rounded-2xl border border-white/5 shadow-[0_0_15px_rgba(0,0,0,0.5)] flex flex-col items-center justify-center min-w-[80px]">
                  <Activity className="text-accent w-7 h-7 mb-1" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white uppercase tracking-tight">{workout.muscleGroup || 'Full Body'}</h3>
                  <div className="flex flex-wrap gap-4 text-xs font-bold text-gray-400 mt-2">
                    <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-gray-500" /> {new Date(workout.date).toLocaleDateString(undefined, {weekday:'short', month:'short', day:'numeric'})}</span>
                    <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-gray-500" /> {workout.duration || 60} min</span>
                    <span className="text-accent bg-accent/10 px-2 py-0.5 rounded-full text-[10px] uppercase font-black border border-accent/20">
                        {workout.category || 'STRENGTH'}
                    </span>
                  </div>
                  {workout.tags && workout.tags.length > 0 && (
                    <div className="flex gap-2 mt-3 flex-wrap">
                      {workout.tags.map(t => (
                        <span key={t} className="text-[10px] uppercase font-bold tracking-widest bg-accent/10 text-accent px-2.5 py-1 rounded border border-accent/20">{t}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex-1 lg:mx-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 xl:grid-cols-2 gap-2">
                  {workout.exercises?.map((e, idx) => (
                    <div key={idx} className="flex justify-between items-center text-[11px] font-bold bg-slate-900/80 text-gray-300 px-3 py-2 rounded-lg border border-white/5 shadow-inner">
                      <span className="truncate pr-2 uppercase tracking-wide text-gray-400">{e.name}</span>
                      <span className="text-accent shrink-0">{e.sets} <span className="text-gray-600">x</span> {e.reps} <span className="text-gray-600">@</span> {e.weight}kg</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-start md:justify-end gap-3 mt-4 md:mt-0 z-10 w-full md:w-auto border-t md:border-none pt-4 md:pt-0 border-white/5">
                <button onClick={() => triggerEdit(workout)} className="flex-1 md:flex-none p-3 bg-slate-900 text-gray-400 hover:text-accent hover:bg-accent/10 rounded-xl transition border border-white/5 hover:border-accent/20 flex items-center justify-center">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => deleteWorkout(workout._id)} className="flex-1 md:flex-none p-3 bg-slate-900 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition border border-white/5 hover:border-red-500/20 flex items-center justify-center">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};
export default Workouts;
