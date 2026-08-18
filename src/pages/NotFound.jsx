import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft, Ghost } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="h-screen w-full bg-brand-gradient flex items-center justify-center px-6 overflow-hidden relative">
      {/* Background Decorative Elements */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/5 rounded-full blur-[120px] -z-0"></div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full text-center relative z-10"
      >
        <motion.div
           animate={{ 
            y: [0, -15, 0],
            rotate: [0, 5, -5, 0]
           }}
           transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
           className="inline-block mb-8"
        >
          <div className="w-24 h-24 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-center backdrop-blur-xl shadow-2xl">
            <Ghost className="w-12 h-12 text-accent animate-pulse" />
          </div>
        </motion.div>

        <h1 className="text-8xl font-black text-white mb-2 tracking-tighter">404</h1>
        <h2 className="text-2xl font-bold text-accent mb-6 uppercase tracking-widest italic">Lost in the Forge?</h2>
        
        <p className="text-textMuted mb-10 leading-relaxed transition-all">
          We couldn't find the page you're looking for. It might have been deleted, moved, or never existed in this realm.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4">
            <Link 
                to="/" 
                className="w-full btn-primary flex items-center justify-center gap-2 group"
            >
                <Home className="w-4 h-4" /> 
                Go To Safety
            </Link>
            
            <button 
                onClick={() => window.history.back()}
                className="w-full btn-secondary flex items-center justify-center gap-2 group"
            >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> 
                Head Back
            </button>
        </div>

        <div className="mt-12 pt-12 border-t border-white/5">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">FitForge Intelligence System</p>
        </div>
      </motion.div>
    </div>
  );
};

export default NotFound;
