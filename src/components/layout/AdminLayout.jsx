import { useState } from 'react';
import AdminSidebar from './AdminSidebar';
import Header from './Header';
import { motion, AnimatePresence } from 'framer-motion';

const AdminLayout = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex bg-[#050B10] min-h-screen text-gray-100 selection:bg-purple-500/30">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-64 flex-shrink-0">
        <AdminSidebar className="fixed w-64 h-full" />
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md z-40 lg:hidden"
            />
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
              className="fixed inset-y-0 left-0 z-50 w-64 bg-[#07111a] shadow-2xl lg:hidden"
            >
              <AdminSidebar onNavClick={() => setIsMobileMenuOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen relative overflow-x-hidden w-full">
        {/* Background Accents - More aggressive for Admin */}
        <div className="hidden lg:block absolute top-[10%] right-[5%] w-[600px] h-[600px] bg-purple-600/5 rounded-full blur-[150px] pointer-events-none animate-pulse" />
        <div className="hidden lg:block absolute bottom-[0%] left-[-5%] w-[400px] h-[400px] bg-indigo-600/5 rounded-full blur-[120px] pointer-events-none" />

        <Header onMenuClick={() => setIsMobileMenuOpen(true)} isAdmin={true} />
        
        <main className="flex-1 px-4 md:px-8 pb-12 z-10 w-full pt-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                {children}
            </motion.div>
        </main>
        
        {/* Admin Footer / Status Bar */}
        <footer className="border-t border-white/5 px-8 py-3 bg-[#07111a]/50 backdrop-blur-xl flex justify-between items-center z-10">
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
                    <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">API: Operational</span>
                </div>
                <div className="w-px h-3 bg-white/10" />
                <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Uptime: 99.9%</span>
            </div>
            <div className="text-[10px] text-gray-600 font-mono">
                SECURE ACCESS LAYER V2.0 // {new Date().getFullYear()}
            </div>
        </footer>
      </div>
    </div>
  );
};

export default AdminLayout;
