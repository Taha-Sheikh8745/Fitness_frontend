import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LifeBuoy, Search, Filter, MessageSquare, Clock, CheckCircle, AlertCircle, Eye, CornerDownRight, Trash2 } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const AdminSupport = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedTicket, setSelectedTicket] = useState(null);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/support');
      setTickets(res.data.data);
    } catch (e) {
      toast.error('Failed to retrieve support documentation');
      // Mock data for UI demo
      setTickets([
          { _id: '1', subject: 'Account Access Issue', message: 'I cannot reset my password after 3 attempts.', status: 'Pending', user: { name: 'Alex Johnson', email: 'alex@example.com' }, createdAt: new Date() },
          { _id: '2', subject: 'Workout Sync Error', message: 'My Apple Watch data is not syncing properly with the app.', status: 'Resolved', user: { name: 'Sarah Miller', email: 'sarah@example.com' }, createdAt: new Date() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/admin/support/${id}`, { status });
      toast.success(`Ticket marked as ${status}`);
      fetchTickets();
      if (selectedTicket?._id === id) setSelectedTicket({ ...selectedTicket, status });
    } catch (e) {
      toast.error('Protocol update failed');
    }
  };

  const filteredTickets = tickets.filter(ticket => {
      const matchesSearch = ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (ticket.user?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'All' || ticket.status === statusFilter;
      return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-4 uppercase italic">
            <LifeBuoy className="w-8 h-8 text-orange-400" /> Support Desk
          </h1>
          <p className="text-gray-500 font-bold text-[10px] uppercase tracking-[0.2em] mt-1">Operational Interface for User Inquiries and Resolution Protocols.</p>
        </div>
        <div className="flex gap-2 bg-[#07111a] p-1 rounded-xl border border-white/5">
            {['All', 'Pending', 'Resolved'].map(s => (
                <button 
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase transition-all ${
                        statusFilter === s ? 'bg-orange-500 text-white' : 'text-gray-500 hover:text-white'
                    }`}
                >
                    {s}
                </button>
            ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Ticket List */}
        <div className="lg:col-span-2 space-y-4">
            <div className="relative mb-6">
                <Search className="absolute left-4 top-3 w-5 h-5 text-gray-500" />
                <input 
                    type="text" 
                    placeholder="Search by subject or user identity..."
                    className="w-full bg-[#07111a] border border-white/5 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-orange-500/50"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="space-y-4 max-h-[700px] overflow-y-auto pr-2 custom-scrollbar">
                {loading ? (
                    <div className="text-center py-20 text-gray-500 font-black uppercase tracking-widest animate-pulse">Synchronizing Tickets...</div>
                ) : filteredTickets.length === 0 ? (
                    <div className="glass-card p-12 text-center text-gray-500 italic">No tickets found matching current parameters.</div>
                ) : (
                    filteredTickets.map(ticket => (
                        <motion.div 
                            key={ticket._id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            onClick={() => setSelectedTicket(ticket)}
                            className={`glass-card p-5 cursor-pointer border-l-4 transition-all hover:bg-white/5 ${
                                selectedTicket?._id === ticket._id ? 'border-orange-500 bg-white/5' : 
                                ticket.status === 'Resolved' ? 'border-green-500/30' : 'border-slate-700'
                            }`}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-bold text-white text-lg leading-tight">{ticket.subject}</h3>
                                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                                    ticket.status === 'Pending' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-green-500/10 text-green-500'
                                }`}>
                                    {ticket.status}
                                </span>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                                <div className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> {new Date(ticket.createdAt).toLocaleDateString()}
                                </div>
                                <div className="flex items-center gap-1 font-bold">
                                    <MessageSquare className="w-3 h-3" /> {ticket.user?.name}
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </div>

        {/* Ticket Detail */}
        <div className="lg:col-span-1">
            <AnimatePresence mode="wait">
                {selectedTicket ? (
                    <motion.div 
                        key={selectedTicket._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="glass-card p-8 sticky top-6 border border-white/5"
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-orange-400 font-black">
                                {selectedTicket.user?.name.substring(0,2).toUpperCase()}
                            </div>
                            <div>
                                <h4 className="font-black text-white uppercase italic">{selectedTicket.user?.name}</h4>
                                <p className="text-xs text-gray-500">{selectedTicket.user?.email}</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-2">Issue Description</label>
                                <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5 text-gray-300 text-sm leading-relaxed italic">
                                    "{selectedTicket.message}"
                                </div>
                            </div>


                        </div>
                    </motion.div>
                ) : (
                    <div className="glass-card p-12 text-center border-dashed border-2 border-white/5 flex flex-col items-center justify-center h-full min-h-[400px]">
                        <Eye className="w-12 h-12 text-gray-700 mb-4" />
                        <h4 className="text-gray-500 font-bold uppercase text-xs tracking-[0.3em]">No Selection</h4>
                        <p className="text-[10px] text-gray-600 mt-2">Select a communication record from the left panel to inspect details and resolve protocol.</p>
                    </div>
                )}
            </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default AdminSupport;
