import { motion } from 'framer-motion';

const Loader = ({ message = "FORGING INTELLIGENCE...", fullScreen = true }) => {
  const containerClasses = fullScreen 
    ? "fixed inset-0 z-[9999] bg-[#020D1A]/90 backdrop-blur-xl flex flex-col items-center justify-center overflow-hidden" 
    : "w-full min-h-[400px] flex flex-col items-center justify-center p-12 overflow-hidden relative";

  return (
    <div className={containerClasses}>
      {/* Background Ambient Glow */}
      <div className="absolute w-[500px] h-[500px] bg-accent/5 rounded-full blur-[120px] animate-pulse" />
      
      <div className="relative flex flex-col items-center justify-center">
        {/* Multidimensional Geometric Core */}
        <div className="relative w-24 h-24 flex items-center justify-center">
          
          {/* Outer Orbital Ring 1 */}
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 border-[1px] border-dashed border-accent/20 rounded-full"
          />

          {/* Outer Orbital Ring 2 */}
          <motion.div 
            animate={{ rotate: -360 }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
            className="absolute inset-2 border-[1px] border-accent/10 rounded-full"
          >
             {/* Orbital Bit */}
             <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-accent rounded-full shadow-[0_0_10px_#00E6FF]" />
          </motion.div>

          {/* Hexagonal Frame */}
          <motion.div
            animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 90, 180, 270, 360]
            }}
            transition={{ 
                scale: { duration: 2, repeat: Infinity, ease: "easeInOut" },
                rotate: { duration: 20, repeat: Infinity, ease: "linear" }
            }}
            className="w-16 h-16 border-2 border-accent/40 rounded-xl relative flex items-center justify-center bg-accent/5 backdrop-blur-sm"
          >
             {/* Interior Crosshairs */}
             <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-[1px] h-full bg-accent/20 absolute" />
                <div className="w-full h-[1px] bg-accent/20 absolute" />
             </div>

             {/* Central Pulse Bit */}
             <motion.div 
                animate={{ 
                    opacity: [0.2, 1, 0.2],
                    scale: [0.8, 1.2, 0.8]
                }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="w-4 h-4 bg-accent rounded-sm shadow-[0_0_20px_#00E6FF]"
             />
          </motion.div>

          {/* High-speed Inner Orbitals */}
          {[0, 120, 240].map((deg, i) => (
            <motion.div
                key={i}
                className="absolute inset-0"
                initial={{ rotate: deg }}
                animate={{ rotate: deg + 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
                <div className="w-1 h-1 bg-accent/60 rounded-full absolute -top-1 left-1/2 -translate-x-1/2" />
            </motion.div>
          ))}
        </div>

        {/* Loading Meta-Data */}
        <div className="mt-16 text-center space-y-4">
            <div className="relative inline-block">
                <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-accent text-[11px] font-black uppercase tracking-[0.6em] whitespace-nowrap pl-[0.6em]"
                >
                    {message}
                </motion.p>
                {/* Underline Progress Animation */}
                <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute -bottom-2 left-0 h-[1px] bg-gradient-to-r from-transparent via-accent to-transparent"
                />
            </div>

            <div className="flex items-center justify-center gap-6">
                <div className="h-[1px] w-8 bg-white/5" />
                <p className="text-[9px] font-mono text-gray-600 uppercase tracking-widest">
                    Protocol: <span className="text-gray-400">Secure_Forge_v2.4</span>
                </p>
                <div className="h-[1px] w-8 bg-white/5" />
            </div>
        </div>
      </div>
    </div>
  );
};

export default Loader;
