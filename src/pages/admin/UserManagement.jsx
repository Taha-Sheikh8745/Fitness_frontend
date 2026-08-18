import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, UserPlus, MoreVertical, Shield, User, Mail, Calendar, Trash2, Edit2, Ban } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Loader from '../../components/common/Loader';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('ALL');
  const [filterDate, setFilterDate] = useState('ALL'); // ALL, TODAY, WEEK, MONTH
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', email: '' });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/users');
      setUsers(res.data.data);
    } catch (error) {
      console.log("fetch user error", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = filterRole === 'ALL' || user.role === filterRole.toLowerCase();
    
    let matchesDate = true;
    if (filterDate !== 'ALL') {
        const joinedDate = new Date(user.createdAt);
        const now = new Date();
        if (filterDate === 'TODAY') {
            matchesDate = joinedDate.toDateString() === now.toDateString();
        } else if (filterDate === 'WEEK') {
            const weekAgo = new Date(now.setDate(now.getDate() - 7));
            matchesDate = joinedDate >= weekAgo;
        } else if (filterDate === 'MONTH') {
            const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
            matchesDate = joinedDate >= monthAgo;
        }
    }

    return matchesSearch && matchesRole && matchesDate;
  });

  const handleExport = () => {
    if (filteredUsers.length === 0) return toast.error('No data to export');
    
    const headers = ['ID', 'Name', 'Email', 'Role', 'Joined Date'];
    const rows = filteredUsers.map(u => [
        u._id,
        u.name,
        u.email,
        u.role.toUpperCase(),
        new Date(u.createdAt).toLocaleDateString()
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `FitForge_User_Registry_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('User Registry Exported Successfully');
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        const res = await api.delete(`/admin/users/${id}`);
        if (res.data.success) {
          toast.success('User removed from system registry');
          setUsers(users.filter(u => u._id !== id));
        }
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to delete user');
      }
    }
  };

  const handleUpdateRole = async (id, newRole) => {
    try {
      const res = await api.put(`/admin/users/${id}/role`, { role: newRole });
      if (res.data.success) {
        toast.success(`User access level elevated to ${newRole}`);
        setUsers(users.map(u => u._id === id ? { ...u, role: newRole } : u));
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Role update failed');
    }
  };

  const handleEditClick = (user) => {
    setEditingUser(user);
    setEditForm({ name: user.name, email: user.email });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.put(`/admin/users/${editingUser._id}`, editForm);
      if (res.data.success) {
        toast.success('Core user data updated');
        setUsers(users.map(u => u._id === editingUser._id ? { ...u, ...editForm } : u));
        setEditingUser(null);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Update failed');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="max-w-7xl mx-auto space-y-6"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">User Management</h1>
          <p className="text-gray-400 mt-1">Review, manage, and audit all platform participants.</p>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        {/* Table Header / Toolbar */}
        <div className="p-6 border-b border-white/5 flex flex-col md:flex-row gap-4 justify-between bg-white/5">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#0A2740] border border-white/10 rounded-xl py-2.5 pl-11 pr-4 text-white placeholder:text-gray-500 focus:outline-none focus:border-accent/50 transition-all font-medium"
            />
          </div>
          <div className="flex gap-2">
            <select 
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="px-4 py-2 bg-[#021B32] border border-white/10 rounded-lg text-white text-xs font-bold uppercase tracking-widest outline-none focus:border-accent/50"
            >
                <option value="ALL">All Roles</option>
                <option value="ADMIN">Admins</option>
                <option value="USER">Users</option>
            </select>

            <select 
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="px-4 py-2 bg-[#021B32] border border-white/10 rounded-lg text-white text-xs font-bold uppercase tracking-widest outline-none focus:border-accent/50"
            >
                <option value="ALL">All Time</option>
                <option value="TODAY">Today</option>
                <option value="WEEK">Last 7 Days</option>
                <option value="MONTH">Last 30 Days</option>
            </select>

            <button 
                onClick={handleExport}
                className="px-6 py-2 bg-accent/10 border border-accent/30 rounded-lg text-accent text-xs font-black uppercase tracking-widest hover:bg-accent/20 transition-all"
            >
                Export CSV
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 text-gray-400 text-xs font-bold uppercase tracking-widest border-b border-white/5">
                <th className="px-6 py-4 font-bold">User</th>
                <th className="px-6 py-4 font-bold">Role</th>
                <th className="px-6 py-4 font-bold">Joined Date</th>
                <th className="px-6 py-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                  <tr>
                    <td colSpan="4">
                      <Loader fullScreen={false} message="Crunching Registry Data..." />
                    </td>
                  </tr>
              ) : filteredUsers.length === 0 ? (
                  <tr><td colSpan="4" className="text-center py-20 text-gray-500">No users found match your search.</td></tr>
              ) : filteredUsers.map((user) => (
                <tr key={user._id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent font-bold">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-white font-semibold">{user.name}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1"><Mail className="w-3 h-3" /> {user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                      user.role === 'admin' 
                        ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' 
                        : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-400 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-600" />
                        {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleEditClick(user)}
                        className="p-2 hover:bg-white/10 text-white rounded-lg transition-colors border border-transparent hover:border-white/20" 
                        title="Edit Details"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleUpdateRole(user._id, user.role === 'admin' ? 'user' : 'admin')}
                        className="p-2 hover:bg-accent/10 text-accent rounded-lg transition-colors border border-transparent hover:border-accent/20" 
                        title={`Toggle Role: ${user.role === 'admin' ? 'User' : 'Admin'}`}
                      >
                        <Shield className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(user._id)}
                        className="p-2 hover:bg-red-500/10 text-red-400 rounded-lg transition-colors border border-transparent hover:border-red-500/20" 
                        title="Purge User"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass-card w-full max-w-md p-8 border-white/10"
          >
            <h2 className="text-2xl font-bold text-white mb-6">Edit System Node</h2>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Subject Name</label>
                <input 
                  type="text" 
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="glass-input"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Registry Email</label>
                <input 
                  type="email" 
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="glass-input"
                  required
                />
              </div>
              <div className="flex gap-4 mt-8">
                <button 
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="btn-secondary"
                >
                  Abort
                </button>
                <button 
                  type="submit"
                  className="btn-primary"
                >
                  Commit Changes
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default UserManagement;
