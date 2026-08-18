import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Apple, Plus, Trash2, Search, Filter, Edit2, Zap, Flame, Target } from 'lucide-react';
import DateFilter from '../components/common/DateFilter';

const Nutrition = () => {
  const [nutrition, setNutrition] = useState([]);
  const [stats, setStats] = useState({ totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFats: 0 });
  const [loading, setLoading] = useState(true);
  
  // UI States
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);

  // Filters
  const [searchParams] = useSearchParams();
  const initSearch = searchParams.get('search') || '';
  const [search, setSearch] = useState(initSearch);
  const [filterType, setFilterType] = useState('');
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });

  // Form State
  const initialForm = { mealType: 'Breakfast', foodName: '', calories: '', protein: '', carbs: '', fats: '', date: new Date().toISOString().split('T')[0] };
  const [formData, setFormData] = useState(initialForm);

  useEffect(() => {
    setSearch(searchParams.get('search') || '');
  }, [searchParams]);

  useEffect(() => {
    if (dateRange.startDate && dateRange.endDate) {
        const timer = setTimeout(() => {
          fetchNutrition();
        }, 500); 
        return () => clearTimeout(timer);
    }
  }, [search, filterType, dateRange]);

  const fetchNutrition = async () => {
    try {
      setLoading(true);
      let query = `/nutrition?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}&`;
      if (search) query += `search=${encodeURIComponent(search)}&`;
      if (filterType) query += `mealType=${encodeURIComponent(filterType)}&`;
      
      const { data } = await api.get(query);
      setNutrition(data.data);
      if (data.stats) setStats(data.stats);
    } catch (e) {
      toast.error('Failed to load nutrition data');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const triggerEdit = (item) => {
    setEditId(item._id);
    setFormData({
        mealType: item.mealType,
        foodName: item.foodName,
        calories: item.calories || '',
        protein: item.protein || '',
        carbs: item.carbs || '',
        fats: item.fats || '',
        date: new Date(item.date).toISOString().split('T')[0]
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditId(null);
    setFormData(initialForm);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      toast.loading(editId ? 'Updating log...' : 'Logging nutrition...', { id: 'nutri' });
      const payload = {
          ...formData,
          calories: Number(formData.calories),
          protein: Number(formData.protein),
          carbs: Number(formData.carbs),
          fats: Number(formData.fats),
      };

      if (editId) {
          await api.put(`/nutrition/${editId}`, payload);
          toast.success('Food log updated!', { id: 'nutri' });
      } else {
          await api.post('/nutrition', payload);
          toast.success('Food logged successfully!', { id: 'nutri' });
      }
      
      cancelForm();
      fetchNutrition();
    } catch (e) {
      toast.error('Could not commit log', { id: 'nutri' });
    }
  };

  const deleteNutrition = async (id) => {
    try {
      await api.delete(`/nutrition/${id}`);
      toast.success('Record deleted');
      fetchNutrition();
    } catch (e) {
      toast.error('Failed to delete');
    }
  };

  const macroData = [
    { name: 'Protein (g)', value: stats.totalProtein, color: '#3b82f6' },
    { name: 'Carbs (g)', value: stats.totalCarbs, color: '#f59e0b' },
    { name: 'Fats (g)', value: stats.totalFats, color: '#ef4444' }
  ].filter(item => item.value > 0);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#0A2740] border border-white/10 p-3 rounded-xl shadow-2xl">
          <p className="text-white font-bold text-sm flex items-center gap-2">
             <span className="w-2 h-2 rounded-full" style={{ backgroundColor: data.color }}></span>
             {data.name}: <span style={{ color: data.color }}>{data.value.toFixed(1)}g</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header & Date Filter */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
             <Apple className="text-accent w-8 h-8"/> Nutrition Console
          </h1>
          <p className="text-gray-400">Manage dietary intake and metabolic aggregates.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-900/50 p-3 rounded-2xl border border-white/5 w-full lg:w-auto">
            <div className="flex flex-col px-4 border-r border-white/10">
               <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest text-center">Net Calories</span>
               <span className="text-2xl font-black text-white flex items-center justify-center gap-1">
                   {stats.totalCalories.toLocaleString()} <span className="text-orange-500 text-sm"><Flame className="w-4 h-4"/></span>
               </span>
            </div>
            <DateFilter onFilterChange={setDateRange} />
        </div>
      </div>

      {loading ? (
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-pulse">
               <div className="h-64 bg-slate-800 rounded-3xl lg:col-span-1"></div>
               <div className="h-64 bg-slate-800 rounded-3xl lg:col-span-2"></div>
           </div>
      ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Macro Aggregation Chart Card */}
              <div className="glass-card p-6 bg-gradient-to-br from-[#021B32] to-[#0A2740] border border-white/5 relative overflow-hidden flex flex-col justify-center items-center shadow-xl">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-3xl"></div>
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest absolute top-6 left-6">Macro Partition</h3>
                  
                  {macroData.length > 0 ? (
                      <div className="w-full h-48 mt-8">
                          <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                  <Pie data={macroData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                                      {macroData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                                  </Pie>
                                  <RechartsTooltip content={<CustomTooltip />} />
                              </PieChart>
                          </ResponsiveContainer>
                      </div>
                  ) : (
                      <div className="flex flex-col items-center justify-center h-48 opacity-50 mt-8">
                          <PieChart className="w-12 h-12 text-gray-500 mb-2" />
                          <p className="text-xs font-bold text-gray-500 tracking-wider">AWAITING CALORIC DATA</p>
                      </div>
                  )}

                  <div className="w-full grid grid-cols-3 gap-2 mt-4 text-center z-10 border-t border-white/5 pt-4">
                      <div>
                          <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Protein</p>
                          <p className="text-sm font-black text-blue-400">{stats.totalProtein.toFixed(1)}g</p>
                      </div>
                      <div>
                          <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Carbs</p>
                          <p className="text-sm font-black text-orange-400">{stats.totalCarbs.toFixed(1)}g</p>
                      </div>
                      <div>
                          <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Fats</p>
                          <p className="text-sm font-black text-red-400">{stats.totalFats.toFixed(1)}g</p>
                      </div>
                  </div>
              </div>

              {/* Tools & Input Trigger Card */}
              <div className="glass-card p-6 lg:col-span-2 border-none bg-slate-900 shadow-xl flex flex-col relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-5"><Zap className="w-64 h-64 rotate-12"/></div>
                  <h3 className="text-xl font-bold text-white mb-6 relative z-10">Intake Inventory</h3>
                  
                  <div className="flex flex-col sm:flex-row items-center gap-4 mb-6 relative z-10">
                    <div className="relative flex-1 w-full">
                        <Search className="w-5 h-5 absolute left-3 top-3 text-gray-500" />
                        <input type="text" placeholder="Search consumables..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full bg-black/40 border border-white/5 rounded-xl py-2 pl-10 pr-4 text-white focus:outline-none focus:border-accent transition text-sm" />
                    </div>
                    <div className="relative w-full sm:w-48">
                        <Filter className="w-5 h-5 absolute left-3 top-3 text-gray-500" />
                        <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="w-full bg-black/40 border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-white hover:border-white/10 transition appearance-none cursor-pointer text-sm">
                            <option value="">All Streams</option>
                            <option value="Breakfast">Breakfast</option>
                            <option value="Lunch">Lunch</option>
                            <option value="Dinner">Dinner</option>
                            <option value="Snack">Snack</option>
                        </select>
                    </div>
                  </div>

                  <button onClick={() => !showForm ? setShowForm(true) : cancelForm()} className={`w-full py-3.5 rounded-xl font-bold flex justify-center items-center gap-2 transition-all shadow-lg relative z-10 ${showForm ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-accent text-[#0A2740] hover:bg-cyan-300'}`}>
                    {showForm ? 'Abort Input sequence' : <><Plus className="w-5 h-5"/> Append Meal Record</>}
                  </button>
              </div>
          </div>
      )}

      {/* Embedded Form Generator */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0, y: -20 }} animate={{ opacity: 1, height: 'auto', y: 0 }} exit={{ opacity: 0, height: 0, y: -20 }} className="glass-card p-6 overflow-hidden relative">
            <h2 className="text-xl font-bold text-white mb-6 border-b border-white/10 pb-4">{editId ? 'Modify Consumption Log' : 'New Consumption Log'}</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                <div>
                  <label className="text-xs text-gray-400 font-bold uppercase tracking-widest block mb-1">Date</label>
                  <input type="date" required className="glass-input w-full py-2.5 text-sm" name="date" value={formData.date} onChange={handleChange} />
                </div>
                <div>
                  <label className="text-xs text-gray-400 font-bold uppercase tracking-widest block mb-1">Type</label>
                  <select name="mealType" className="glass-input w-full py-2.5 text-sm bg-slate-900" value={formData.mealType} onChange={handleChange}>
                    <option value="Breakfast">Breakfast</option>
                    <option value="Lunch">Lunch</option>
                    <option value="Dinner">Dinner</option>
                    <option value="Snack">Snack</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 font-bold uppercase tracking-widest block mb-1">Source Name</label>
                  <input type="text" name="foodName" placeholder="e.g. Grilled Chicken Salad" className="glass-input w-full py-2.5 text-sm" value={formData.foodName} onChange={handleChange} required />
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-black/20 p-4 rounded-2xl border border-white/5">
                <div>
                  <label className="text-xs text-orange-400 font-bold uppercase tracking-widest block mb-1">Calories</label>
                  <input type="number" name="calories" className="glass-input w-full py-2 text-center text-sm" value={formData.calories} onChange={handleChange} required />
                </div>
                <div>
                  <label className="text-xs text-blue-400 font-bold uppercase tracking-widest block mb-1">Protein (g)</label>
                  <input type="number" step="0.1" name="protein" className="glass-input w-full py-2 text-center text-sm" value={formData.protein} onChange={handleChange} required />
                </div>
                <div>
                  <label className="text-xs text-orange-300 font-bold uppercase tracking-widest block mb-1">Carbs (g)</label>
                  <input type="number" step="0.1" name="carbs" className="glass-input w-full py-2 text-center text-sm" value={formData.carbs} onChange={handleChange} required />
                </div>
                <div>
                  <label className="text-xs text-red-400 font-bold uppercase tracking-widest block mb-1">Fats (g)</label>
                  <input type="number" step="0.1" name="fats" className="glass-input w-full py-2 text-center text-sm" value={formData.fats} onChange={handleChange} required />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button type="submit" className="btn-primary px-8 py-2.5 flex items-center gap-2"><Target className="w-5 h-5"/> {editId ? 'Commit Changes' : 'Write Record'}</button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* History List */}
      <div className="space-y-3">
        {!loading && nutrition.length === 0 ? (
           <div className="glass-card flex flex-col items-center justify-center py-16 opacity-70 border-dashed border-2 border-white/10">
               <Apple className="w-12 h-12 text-gray-500 mb-4" />
               <p className="text-gray-400 font-medium">No metabolic records located in defined time horizon.</p>
           </div>
        ) : (
          nutrition.map((item) => (
            <motion.div whileHover={{ scale: 1.005 }} key={item._id} className="bg-[#0A2740]/80 p-5 rounded-2xl border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 group hover:border-[#00E6FF]/30 transition-colors shadow-lg">
                <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 hidden sm:flex items-center justify-center bg-slate-900 rounded-xl border border-white/5 text-xs font-black text-gray-400 uppercase">
                        {item.mealType.substring(0,3)}
                    </div>
                    <div>
                        <div className="flex items-center gap-3">
                            <h3 className="text-lg font-bold text-white leading-none">{item.foodName}</h3>
                            <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-gray-400 border border-white/5">{new Date(item.date).toLocaleDateString(undefined, { month:'short', day:'numeric'})}</span>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-xs font-bold font-mono">
                            <span className="text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded"><Flame className="w-3 h-3 inline mr-1 -mt-0.5"/>{item.calories}</span>
                            <span className="text-blue-400">P: {item.protein}g</span>
                            <span className="text-orange-300">C: {item.carbs}g</span>
                            <span className="text-red-400">F: {item.fats}g</span>
                        </div>
                    </div>
                </div>
                
                <div className="flex items-center gap-2 self-end md:self-auto w-full md:w-auto">
                    <button onClick={() => triggerEdit(item)} className="p-2.5 text-gray-500 hover:text-accent hover:bg-accent/10 rounded-xl transition flex-1 md:flex-none flex items-center justify-center">
                        <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => deleteNutrition(item._id)} className="p-2.5 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition flex-1 md:flex-none flex items-center justify-center">
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

export default Nutrition;
