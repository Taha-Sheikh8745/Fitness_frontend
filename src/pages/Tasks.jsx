import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckSquare, Square, Plus, Trash2, Calendar, Loader2, Sparkles, Filter } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [taskInput, setTaskInput] = useState('');
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchTasks();
  }, [filterDate]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/tasks?date=${filterDate}`);
      setTasks(data.data);
    } catch (error) {
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!taskInput.trim()) return;

    try {
      const { data } = await api.post('/tasks', {
        title: taskInput,
        dueDate: filterDate,
        type: 'Manual'
      });
      setTasks([data.data, ...tasks]);
      setTaskInput('');
      toast.success('Task logged in registry');
    } catch (error) {
      toast.error('Failed to create task');
    }
  };

  const toggleTask = async (id) => {
    try {
      const { data } = await api.patch(`/tasks/${id}`);
      setTasks(tasks.map(t => t._id === id ? data.data : t));
    } catch (error) {
      toast.error('State synchronization failed');
    }
  };

  const deleteTask = async (id) => {
    try {
      await api.delete(`/tasks/${id}`);
      setTasks(tasks.filter(t => t._id !== id));
      toast.success('Task pruned from cycle');
    } catch (error) {
      toast.error('Failed to delete task');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-12">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <CheckSquare className="text-accent w-8 h-8"/> Daily Task Registry
          </h1>
          <p className="text-textMuted tracking-tight uppercase text-[10px] font-bold">Operational checklist for the current performance cycle.</p>
        </div>
        <div className="relative">
          <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-accent" />
          <input 
            type="date" 
            className="glass-input pl-10 pr-4 py-2 text-sm bg-slate-900 border-accent/20"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          />
        </div>
      </div>

      <form onSubmit={handleAddTask} className="mb-12 relative">
        <input 
          type="text" 
          placeholder="Enter new operational task..." 
          className="glass-input w-full py-4 pl-6 pr-32 text-lg focus:border-accent/50 transition-all font-medium"
          value={taskInput}
          onChange={(e) => setTaskInput(e.target.value)}
        />
        <button 
          type="submit" 
          className="absolute right-2 top-2 bottom-2 bg-accent text-dark px-6 rounded-xl font-bold hover:bg-cyan-300 transition-colors shadow-lg"
        >
          Add Task
        </button>
      </form>

      {loading ? (
         <div className="flex flex-col items-center justify-center py-20 grayscale opacity-50">
           <Loader2 className="w-10 h-10 animate-spin text-accent mb-4" />
           <p className="font-mono text-xs">Querying local task nodes...</p>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {tasks.map((task) => (
              <motion.div
                key={task._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className={`glass-card p-5 flex items-center justify-between group transition-all ${
                  task.completed ? 'opacity-50' : 'hover:border-accent/30'
                }`}
              >
                <div className="flex items-center gap-4 flex-1 cursor-pointer" onClick={() => toggleTask(task._id)}>
                  {task.completed ? (
                    <CheckSquare className="w-6 h-6 text-accent" />
                  ) : (
                    <Square className="w-6 h-6 text-gray-700 group-hover:text-accent transition-colors" />
                  )}
                  <div className="flex flex-col">
                    <span className={`text-white text-lg font-medium transition-all ${task.completed ? 'line-through text-textMuted' : ''}`}>
                      {task.title}
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                       <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                         task.type === 'AI' ? 'bg-accent/10 border-accent/30 text-accent' : 'bg-white/5 border-white/10 text-gray-500'
                       }`}>
                         {task.type}
                       </span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => deleteTask(task._id)}
                  className="p-2.5 text-gray-700 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>

          {tasks.length === 0 && (
            <div className="text-center py-20 glass-card bg-transparent border-dashed border-2 border-white/5">
              <Sparkles className="w-12 h-12 text-gray-800 mx-auto mb-4" />
              <p className="text-textMuted italic font-mono text-sm">Task registry is empty for this timeframe.</p>
            </div>
          )}
        </div>
      )}

      {tasks.length > 0 && !loading && (
        <div className="mt-12 p-6 glass-card bg-slate-900/50 flex justify-between items-center">
            <div className="text-sm font-bold text-gray-500 uppercase tracking-widest">
              Efficiency Level: <span className="text-accent">{Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100)}%</span>
            </div>
            <div className="text-xs text-textMuted">
              {tasks.filter(t => t.completed).length} of {tasks.length} tasks synced
            </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;
