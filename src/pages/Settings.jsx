import { useState } from 'react';
import { motion } from 'framer-motion';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const Settings = () => {
  const { user } = useAuth();
  const [theme, setTheme] = useState(user?.preferences?.theme || 'dark');
  const [units, setUnits] = useState(user?.preferences?.units || 'lbs');
  const [notificationsEnabled, setNotificationsEnabled] = useState(user?.preferences?.notificationsEnabled ?? true);

  const handleSave = async () => {
    try {
      await api.put('/users/profile', {
        preferences: { theme, units, notificationsEnabled },
      });
      toast.success('Preferences saved successfully!');
    } catch (err) {
      toast.error('Failed to save settings');
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto space-y-6">
      <div className="glass-card p-8">
        <h2 className="text-3xl font-extrabold text-white mb-8">Settings & Preferences</h2>
        
        <div className="space-y-8">
          <div className="flex items-center justify-between border-b border-white/10 pb-6">
            <div>
              <h3 className="text-xl font-bold text-white">App Theme</h3>
              <p className="text-gray-400 text-sm mt-1">Choose your preferred visual mode.</p>
            </div>
            <select value={theme} onChange={(e) => setTheme(e.target.value)} className="bg-slate-900/80 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-accent transition">
              <option value="dark">Dark</option>
              <option value="light">Light (Coming Soon)</option>
            </select>
          </div>

          <div className="flex items-center justify-between border-b border-white/10 pb-6">
            <div>
              <h3 className="text-xl font-bold text-white">Measurement Units</h3>
              <p className="text-gray-400 text-sm mt-1">Preferred unit for weight logs.</p>
            </div>
            <select value={units} onChange={(e) => setUnits(e.target.value)} className="bg-slate-900/80 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-accent transition">
              <option value="lbs">Pounds (lbs)</option>
              <option value="kg">Kilograms (kg)</option>
            </select>
          </div>

          <div className="flex items-center justify-between pb-6">
            <div>
              <h3 className="text-xl font-bold text-white">Email Notifications</h3>
              <p className="text-gray-400 text-sm mt-1">Receive email alerts for reminders and goals.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={notificationsEnabled} onChange={(e) => setNotificationsEnabled(e.target.checked)} />
              <div className="w-14 h-7 bg-slate-800 rounded-full peer border border-white/5 peer-checked:after:translate-x-full peer-checked:bg-accent/80 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all"></div>
            </label>
          </div>
          
          <div className="pt-4">
            <button onClick={handleSave} className="btn-primary w-full py-4 text-lg">Save Changes</button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
export default Settings;
