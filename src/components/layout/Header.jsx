import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Bell, User, Menu, Search, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';

const Header = ({ onMenuClick, isAdmin = false }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, [showNotifications]); // Refetch when opened

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      if (res.data && res.data.data) {
        setNotifications(res.data.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
    } catch (e) {
      console.error(e);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    toast(`Searching: ${searchQuery}`, { icon: '🔍' });
    if (isAdmin) {
        navigate(`/admin/users?query=${encodeURIComponent(searchQuery)}`);
        return;
    }

    const path = window.location.pathname;
    if (path === '/workouts' || path === '/nutrition') {
        navigate(`${path}?search=${encodeURIComponent(searchQuery)}`);
    } else {
        navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className={`h-20 flex items-center justify-between px-4 md:px-6 w-full z-30 rounded-none border-t-0 border-x-0 relative md:static ${isAdmin ? 'bg-[#07111a] border-b border-purple-500/10' : 'glass-card'}`}>
      <div className="flex items-center gap-4 flex-1">
        <button onClick={onMenuClick} className="lg:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition">
          <Menu className="w-6 h-6" />
        </button>

        <form onSubmit={handleSearch} className="hidden md:flex relative w-64 lg:w-96 group">
          <Search className={`w-5 h-5 absolute left-4 top-2.5 text-gray-400 transition-colors ${isAdmin ? 'group-focus-within:text-purple-400' : 'group-focus-within:text-accent'}`} />
          <input 
            type="text" 
            placeholder={isAdmin ? "System Intelligence Search..." : "Global Search (Workouts...)"} 
            className={`w-full bg-slate-900/60 border border-white/5 rounded-full py-2.5 pl-12 pr-4 text-white focus:outline-none transition-all shadow-inner ${isAdmin ? 'focus:border-purple-500/30' : 'focus:border-accent/50'}`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>
      </div>

      <div className="flex items-center gap-4 md:gap-7 relative">
        <div className="relative">
          <button onClick={() => setShowNotifications(!showNotifications)} className="p-2 text-gray-400 hover:text-white transition group focus:outline-none">
            <Bell className="w-6 h-6 group-hover:scale-110 transition-transform" />
            {unreadCount > 0 && <span className={`absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full border-2 animate-pulse ${isAdmin ? 'bg-purple-500 border-[#07111a]' : 'bg-red-500 border-[#0A2740]'}`}></span>}
          </button>
          
          {showNotifications && (
            <div className={`absolute right-0 mt-6 w-80 md:w-96 shadow-2xl border border-white/10 rounded-2xl overflow-hidden z-50 ${isAdmin ? 'bg-[#07111a]' : 'bg-[#021B32]'}`}>
              <div className="p-4 border-b border-white/10 flex justify-between items-center bg-slate-900/80 backdrop-blur-md relative z-10">
                <h4 className="font-bold text-white text-lg">Notifications</h4>
                <div className="flex items-center gap-3">
                    <span className={`text-xs font-bold px-2 py-1 rounded-md ${isAdmin ? 'bg-purple-500/20 text-purple-400' : 'bg-accent/20 text-accent'}`}>{unreadCount} New</span>
                    <button onClick={() => setShowNotifications(false)} className="text-gray-400 hover:text-white"><X className="w-4 h-4"/></button>
                </div>
              </div>
              <div className="max-h-80 overflow-y-auto bg-gradient-to-b from-transparent to-black/20">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center flex flex-col items-center">
                    <Bell className="w-10 h-10 text-gray-600 mb-3"/>
                    <p className="text-gray-400 text-sm">All caught up here!</p>
                  </div>
                ) : (
                  notifications.map(note => (
                    <div key={note._id} className={`p-4 border-b border-white/5 flex flex-col gap-2 transition hover:bg-white/5 ${note.read ? 'opacity-50' : 'bg-slate-800/40 relative'}`}>
                      {!note.read && <div className={`absolute left-0 top-0 w-1 h-full ${isAdmin ? 'bg-purple-500' : 'bg-accent'}`}></div>}
                      <p className="text-sm text-gray-200 leading-snug font-medium pl-1">{note.message}</p>
                      <div className="flex justify-between items-center mt-1 pl-1">
                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{new Date(note.createdAt).toLocaleString()}</span>
                        {!note.read && (
                          <button onClick={() => markAsRead(note._id)} className={`text-xs font-bold hover:text-white transition ${isAdmin ? 'text-purple-400' : 'text-accent'}`}>Mark read</button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
        
        <Link to="/profile" className="flex items-center gap-3 pl-4 md:pl-7 border-l border-white/10 hover:opacity-80 transition cursor-pointer group">
          <div className={`w-10 h-10 rounded-full border transition-colors flex items-center justify-center overflow-hidden ${isAdmin ? 'bg-purple-500/10 border-purple-500/30 group-hover:border-purple-500' : 'bg-accent/10 border-accent/30 group-hover:border-accent'}`}>
            {user?.avatar ? (
              <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User className={`w-5 h-5 ${isAdmin ? 'text-purple-400' : 'text-accent'}`} />
            )}
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-bold text-white">{user?.name}</p>
            {isAdmin ? (
              <p className="text-[10px] uppercase font-black tracking-widest mt-0.5 text-purple-400">System Admin</p>
            ) : (
              <p className="text-[10px] uppercase font-black tracking-widest mt-0.5 text-accent">Member</p>
            )}
          </div>
        </Link>
      </div>
    </header>
  );
};
export default Header;
