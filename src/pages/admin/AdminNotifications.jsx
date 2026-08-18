import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, Send, Users, User, ShieldAlert, CheckCircle, Clock, Trash2, Search, Filter } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Loader from '../../components/common/Loader';

const AdminNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDirectModal, setShowDirectModal] = useState(false);
  const [showGlobalModal, setShowGlobalModal] = useState(false);

  // Form states
  const [message, setMessage] = useState('');
  const [type, setType] = useState('System');
  const [selectedUser, setSelectedUser] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [notifRes, userRes] = await Promise.all([
        api.get('/admin/notifications'),
        api.get('/admin/users')
      ]);
      setNotifications(notifRes.data.data);
      setUsers(userRes.data.data.filter(u => u.role === 'user'));
    } catch (e) {
      toast.error('Failed to load notification master data');
    } finally {
      setLoading(false);
    }
  };

  const sendGlobal = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/notifications/global', { message, type });
      toast.success('Broadcast sent successfully!');
      setShowGlobalModal(false);
      setMessage('');
      fetchData();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Broadcast failed');
    }
  };

  const sendDirect = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/notifications/direct', { userId: selectedUser, message, type });
      toast.success('Direct notification delivered');
      setShowDirectModal(false);
      setMessage('');
      setSelectedUser('');
      fetchData();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Delivery failed');
    }
  };

  const filteredNotifications = notifications.filter(n => 
    n.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
    n.user?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Bell className="w-8 h-8 text-purple-400" /> Notification Engine
          </h1>
          <p className="text-gray-400 mt-1">Broadcast system alerts or dispatch targeted messages to users.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowGlobalModal(true)}
            className="flex items-center gap-2 px-6 py-2.5 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-bold transition-all shadow-lg shadow-purple-500/20"
          >
            <Users className="w-4 h-4" /> Global Broadcast
          </button>
          <button 
            onClick={() => setShowDirectModal(true)}
            className="flex items-center gap-2 px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white border border-white/5 rounded-xl font-bold transition-all"
          >
            <User className="w-4 h-4" /> Targeted Alert
          </button>
        </div>
      </div>

      {/* Stats / Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card p-6 border-l-4 border-purple-500">
              <p className="text-xs text-gray-500 uppercase font-black tracking-widest">Sent Today</p>
              <h3 className="text-3xl font-black text-white mt-1">12</h3>
          </div>
          <div className="glass-card p-6 border-l-4 border-blue-500">
              <p className="text-xs text-gray-500 uppercase font-black tracking-widest">Active Users</p>
              <h3 className="text-3xl font-black text-white mt-1">{users.length}</h3>
          </div>
          <div className="glass-card p-6 border-l-4 border-green-500">
              <p className="text-xs text-gray-500 uppercase font-black tracking-widest">Response Rate</p>
              <h3 className="text-3xl font-black text-white mt-1">84%</h3>
          </div>
      </div>

      {/* Search & Filter */}
      <div className="glass-card p-4 flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
                <Search className="absolute left-4 top-3 w-5 h-5 text-gray-500" />
                <input 
                    type="text" 
                    placeholder="Filter logs by user or message content..."
                    className="w-full bg-[#050B10] border border-white/5 rounded-xl py-2.5 pl-12 pr-4 text-white focus:outline-none focus:border-purple-500/50"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 text-gray-400 border border-white/5 rounded-xl hover:bg-white/5 transition">
                <Filter className="w-4 h-4" /> Recent First
            </button>
      </div>

      {/* Notification Logs */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#07111a] border-b border-white/5">
                <th className="px-6 py-4 text-xs font-black uppercase text-gray-500">Recipient</th>
                <th className="px-6 py-4 text-xs font-black uppercase text-gray-500">Origin/Sender</th>
                <th className="px-6 py-4 text-xs font-black uppercase text-gray-500">Alert Type</th>
                <th className="px-6 py-4 text-xs font-black uppercase text-gray-500">Payload Message</th>
                <th className="px-6 py-4 text-xs font-black uppercase text-gray-500 text-right">Dispatch Log</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                   <td colSpan="5">
                     <Loader fullScreen={false} message="Synchronizing Communication Protocol..." />
                   </td>
                </tr>
              ) : filteredNotifications.length === 0 ? (
                <tr>
                   <td colSpan="5" className="px-6 py-12 text-center text-gray-500">No communication history found matching criteria.</td>
                </tr>
              ) : (
                filteredNotifications.map((notif) => (
                  <tr key={notif._id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold text-gray-400 uppercase">
                          {notif.user?.name.substring(0,2)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white leading-none">{notif.user?.name}</p>
                          <p className="text-[10px] text-gray-500 mt-1">{notif.user?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${notif.sender ? 'bg-accent' : 'bg-orange-500'}`} />
                        <span className="text-[10px] font-black uppercase tracking-tighter text-white">
                            {notif.sender ? notif.sender.name : 'SYSTEM_CORE'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-black uppercase px-2 py-1 rounded border ${
                        notif.type === 'System' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                        notif.type === 'Goal' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                        'bg-blue-500/10 text-blue-400 border-blue-500/20'
                      }`}>
                        {notif.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-300 max-w-xs md:max-w-md truncate">{notif.message}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                        <div className="flex flex-col items-end">
                            <p className="text-[10px] text-gray-500 font-bold">{new Date(notif.createdAt).toLocaleDateString()}</p>
                            <p className="text-[9px] text-gray-600 uppercase font-black">{new Date(notif.createdAt).toLocaleTimeString()}</p>
                        </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Global Broadcast Modal */}
      {showGlobalModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass-card w-full max-w-lg p-8 relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-indigo-600" />
             <h3 className="text-2xl font-black text-white mb-2 flex items-center gap-3">
                <Users className="w-6 h-6 text-purple-400" /> Broadcast Dispatch
             </h3>
             <p className="text-sm text-gray-400 mb-6">This message will be sent to all {users.length} registered users immediately.</p>
             
             <form onSubmit={sendGlobal} className="space-y-4">
                <div>
                   <label className="text-xs font-black uppercase tracking-widest text-gray-500 mb-2 block">Alert Type</label>
                   <select 
                        className="w-full bg-[#050B10] border border-white/5 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-purple-500/50 appearance-none"
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                    >
                        <option value="System">System Update</option>
                        <option value="Goal">Motivational Goal</option>
                        <option value="Reminder">User Reminder</option>
                   </select>
                </div>
                <div>
                   <label className="text-xs font-black uppercase tracking-widest text-gray-500 mb-2 block">Message Payload</label>
                   <textarea 
                        rows="4"
                        className="w-full bg-[#050B10] border border-white/5 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-purple-500/50"
                        placeholder="Type system alert message here..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        required
                   />
                </div>
                <div className="flex gap-4 pt-4">
                    <button 
                        type="button"
                        onClick={() => setShowGlobalModal(false)}
                        className="flex-1 py-3 text-gray-400 font-bold hover:text-white transition"
                    >
                        Abort Mission
                    </button>
                    <button 
                        type="submit"
                        className="flex-1 py-3 bg-purple-500 text-white rounded-xl font-black uppercase tracking-widest hover:bg-purple-600 transition shadow-lg shadow-purple-500/20"
                    >
                        Launch Broadcast
                    </button>
                </div>
             </form>
          </motion.div>
        </div>
      )}

      {/* Targeted Alert Modal */}
      {showDirectModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass-card w-full max-w-lg p-8 relative overflow-hidden"
          >
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-cyan-500" />
             <h3 className="text-2xl font-black text-white mb-2 flex items-center gap-3">
                <User className="w-6 h-6 text-blue-400" /> Targeted Dispatch
             </h3>
             <p className="text-sm text-gray-400 mb-6">Select a specific recipient for this administrative alert.</p>
             
             <form onSubmit={sendDirect} className="space-y-4">
                <div>
                   <label className="text-xs font-black uppercase tracking-widest text-gray-500 mb-2 block">Target Recipient</label>
                   <select 
                        className="w-full bg-[#050B10] border border-white/5 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-blue-500/50"
                        value={selectedUser}
                        onChange={(e) => setSelectedUser(e.target.value)}
                        required
                    >
                        <option value="">Select User...</option>
                        {users.map(user => (
                            <option key={user._id} value={user._id}>{user.name} ({user.email})</option>
                        ))}
                   </select>
                </div>
                <div>
                   <label className="text-xs font-black uppercase tracking-widest text-gray-500 mb-2 block">Alert Type</label>
                   <select 
                        className="w-full bg-[#050B10] border border-white/5 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-blue-500/50 appearance-none"
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                    >
                        <option value="System">System Update</option>
                        <option value="Goal">Motivational Goal</option>
                        <option value="Reminder">User Reminder</option>
                   </select>
                </div>
                <div>
                   <label className="text-xs font-black uppercase tracking-widest text-gray-500 mb-2 block">Message Payload</label>
                   <textarea 
                        rows="4"
                        className="w-full bg-[#050B10] border border-white/5 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-blue-500/50"
                        placeholder="Type direct alert message here..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        required
                   />
                </div>
                <div className="flex gap-4 pt-4">
                    <button 
                        type="button"
                        onClick={() => setShowDirectModal(false)}
                        className="flex-1 py-3 text-gray-400 font-bold hover:text-white transition"
                    >
                        Cancel Dispatch
                    </button>
                    <button 
                        type="submit"
                        className="flex-1 py-3 bg-blue-500 text-white rounded-xl font-black uppercase tracking-widest hover:bg-blue-600 transition shadow-lg shadow-blue-500/20"
                    >
                        Deliver Notification
                    </button>
                </div>
             </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AdminNotifications;
