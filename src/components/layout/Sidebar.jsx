import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Dumbbell, Apple, UserCircle, LogOut, TrendingUp, Settings, HelpCircle, Sparkles, CheckSquare, Target, Flame, BarChart3 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Sidebar = ({ onNavClick, className = '' }) => {
  const { user, logout } = useAuth();

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { name: 'Analytics', icon: BarChart3, path: '/analytics' },
    { name: 'AI Coach', icon: Sparkles, path: '/ai-coach' },
    { name: 'Workouts', icon: Dumbbell, path: '/workouts' },
    { name: 'Nutrition', icon: Apple, path: '/nutrition' },
    { name: 'Habits', icon: Flame, path: '/habits' },
    { name: 'Goals', icon: Target, path: '/goals' },
    { name: 'Tasks', icon: CheckSquare, path: '/tasks' },
    { name: 'Progress', icon: TrendingUp, path: '/progress' },
    { name: 'Profile', icon: UserCircle, path: '/profile' },
    { name: 'Settings', icon: Settings, path: '/settings' },
    { name: 'Support', icon: HelpCircle, path: '/support' },
  ];

  const adminNavItems = [
    { name: 'Admin Dashboard', icon: LayoutDashboard, path: '/admin' },
  ];

  return (
    <div className={`w-64 glass border-y-0 border-l-0 rounded-none h-full min-h-screen flex flex-col ${className}`}>
      <div className="p-6">
        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-accent to-blue-400">
          FitForge AI
        </h1>
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto">
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 px-4">Menu</p>
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            onClick={onNavClick}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-accent/20 text-accent border border-accent/20'
                  : 'text-textMuted hover:bg-white/5 hover:text-white'
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.name}</span>
          </NavLink>
        ))}

        {user?.role === 'admin' && (
          <div className="mt-6 pt-6 border-t border-white/5">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 px-4">Administration</p>
            {adminNavItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                end={item.path === '/admin'}
                onClick={onNavClick}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-purple-500/20 text-purple-400 border border-purple-500/20'
                      : 'text-textMuted hover:bg-white/5 hover:text-white'
                  }`
                }
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.name}</span>
              </NavLink>
            ))}
          </div>
        )}
      </nav>

      <div className="p-4">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-400/10 hover:text-red-300 w-full rounded-lg transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
