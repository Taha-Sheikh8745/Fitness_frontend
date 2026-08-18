import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, Search, Filter, Clock, User, Activity, Download } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Loader from '../../components/common/Loader';

const AdminAudit = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/logs');
      setLogs(res.data.data);
    } catch (e) {
      toast.error('Failed to access system audit vault');
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = (log.message?.toLowerCase() || '').includes(searchLower) ||
                         (log.event?.toLowerCase() || '').includes(searchLower) ||
                         (log.user?.name?.toLowerCase() || '').includes(searchLower);
    
    const matchesCategory = categoryFilter === 'ALL' || log.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  const handleExport = () => {
    const headers = ['Timestamp', 'Event', 'Category', 'Severity', 'Message', 'Performed By'];
    const rows = filteredLogs.map(l => [
        new Date(l.createdAt).toLocaleString(),
        l.event,
        l.category,
        l.severity,
        l.message.replace(/,/g, ';'), // Prevent CSV breaking
        l.user?.name || 'SYSTEM'
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `FitForge_Audit_Log_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Audit Registry Exported');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3 italic uppercase tracking-tighter">
            <ShieldAlert className="w-8 h-8 text-red-500" /> System Audit Registry
          </h1>
          <p className="text-gray-500 font-bold text-[10px] uppercase tracking-[0.2em] mt-1">Immutable Log of Administrative Actions and System Events.</p>
        </div>
        <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-6 py-2.5 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl font-bold transition-all"
        >
            <Download className="w-4 h-4" /> Export Audit Log
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="glass-card p-4 flex flex-col md:flex-row gap-4 items-center bg-black/20">
            <div className="relative flex-1 w-full">
                <Search className="absolute left-4 top-3 w-5 h-5 text-gray-500" />
                <input 
                    type="text" 
                    placeholder="Query by event, subject, or administrator..."
                    className="w-full bg-[#050B10] border border-white/5 rounded-xl py-2.5 pl-12 pr-4 text-white focus:outline-none focus:border-red-500/30 font-mono text-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <select 
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-[#050B10] border border-white/5 rounded-xl py-2.5 px-4 text-gray-400 text-xs font-black uppercase outline-none focus:border-red-500/30"
            >
                <option value="ALL">All Categories</option>
                <option value="AUTH">Auth Events</option>
                <option value="SECURITY">Security</option>
                <option value="SYSTEM">System</option>
                <option value="PAYMENT">Payments</option>
            </select>
            <button 
                onClick={fetchLogs}
                className="p-2.5 bg-white/5 text-gray-400 rounded-xl hover:text-white transition"
            >
                <Activity className="w-5 h-5" />
            </button>
      </div>

      {/* Audit Table */}
      <div className="glass-card overflow-hidden border-white/5">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#07111a] border-b border-white/5">
                <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-500 tracking-widest">Protocol / Event</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-500 tracking-widest">Category</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-500 tracking-widest">Severity</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-500 tracking-widest">Intel Payload</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-500 tracking-widest">Subject</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-500 tracking-widest text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono">
              {loading ? (
                <tr>
                   <td colSpan="6">
                     <Loader fullScreen={false} message="Decrypting Audit Trails..." />
                   </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                   <td colSpan="6" className="px-6 py-12 text-center text-gray-500 italic">Audit vault is empty or no results match criteria.</td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log._id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4">
                        <span className="text-white font-bold text-xs">{log.event}</span>
                    </td>
                    <td className="px-6 py-4">
                        <span className="text-[10px] text-gray-400 border border-white/10 px-2 py-0.5 rounded uppercase">
                            {log.category}
                        </span>
                    </td>
                    <td className="px-6 py-4">
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                            log.severity === 'CRITICAL' ? 'bg-red-500 text-white' :
                            log.severity === 'ERROR' ? 'bg-red-500/20 text-red-500' :
                            log.severity === 'WARNING' ? 'bg-yellow-500/20 text-yellow-500' :
                            'bg-green-500/20 text-green-500'
                        }`}>
                            {log.severity}
                        </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs text-gray-300 max-w-xs truncate" title={log.message}>{log.message}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <User className="w-3 h-3 text-gray-600" />
                        <span className="text-[10px] text-gray-400">{log.user?.name || 'SYSTEM'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                        <div className="flex flex-col items-end">
                            <p className="text-[10px] text-white leading-none">{new Date(log.createdAt).toLocaleDateString()}</p>
                            <p className="text-[9px] text-gray-600 mt-1 uppercase">{new Date(log.createdAt).toLocaleTimeString()}</p>
                        </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminAudit;
