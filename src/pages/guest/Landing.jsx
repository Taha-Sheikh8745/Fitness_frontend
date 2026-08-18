import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Dumbbell, 
  Sparkles, 
  Apple, 
  TrendingUp, 
  Shield, 
  Zap, 
  ArrowRight, 
  CheckCircle2,
  Play
} from 'lucide-react';

const Landing = () => {
  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  const features = [
    {
      title: "AI Personal Coach",
      description: "Adaptive training plans that evolve with your performance metrics in real-time.",
      icon: Sparkles,
      color: "text-blue-400"
    },
    {
      title: "Hyper-Tracking",
      description: "Log every set, rep, and calorie with a precision interface designed for speed.",
      icon: Dumbbell,
      color: "text-accent"
    },
    {
      title: "Macro Precision",
      description: "Deep nutritional analytics with automated macro-nutrient breakdown.",
      icon: Apple,
      color: "text-emerald-400"
    },
    {
      title: "Predictive Growth",
      description: "Visualize your future self with data-driven progress forecasting.",
      icon: TrendingUp,
      color: "text-purple-400"
    }
  ];

  return (
    <div className="min-h-screen bg-brand-gradient text-white overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 backdrop-blur-lg border-b border-white/5 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
              <Zap className="text-dark w-5 h-5 fill-current" />
            </div>
            <span className="text-xl font-bold tracking-tighter">FITFORGE</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-textMuted">
            <a href="#features" className="hover:text-accent transition-colors">Features</a>
            <a href="#vision" className="hover:text-accent transition-colors">Vision</a>
            <a href="#pricing" className="hover:text-accent transition-colors">Pricing</a>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm font-medium hover:text-accent transition-colors">Sign In</Link>
            <Link to="/register" className="bg-accent text-dark px-5 py-2 rounded-full text-sm font-bold hover:scale-105 transition-transform">
              Join The Forge
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-accent/10 blur-[120px] rounded-full -z-10"></div>
        
        <div className="max-w-7xl mx-auto text-center">

          <motion.h1 
            {...fadeIn}
            className="text-5xl md:text-8xl font-black tracking-tighter mb-6 leading-[0.9]"
          >
            FORGE YOUR <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-accent to-blue-400">ELITE PHYSICALITY.</span>
          </motion.h1>

          <motion.p 
            {...fadeIn}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-textMuted max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Stop guessing. Start tracking with the world's most precise fitness intelligence platform. Designed for those who demand elite results.
          </motion.p>

          <motion.div 
            {...fadeIn}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link to="/register" className="group bg-accent text-dark px-10 py-4 rounded-full font-black text-lg flex items-center gap-2 hover:shadow-[0_0_30px_rgba(0,230,255,0.4)] transition-all">
              START YOUR JOURNEY
              <ArrowRight className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <button className="flex items-center gap-3 px-8 py-4 bg-white/5 border border-white/10 rounded-full font-bold hover:bg-white/10 transition-all">
              <div className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center">
                <Play className="w-3 h-3 fill-current" />
              </div>
              Watch Demo
            </button>
          </motion.div>

          {/* Hero Image Mockup */}
          <motion.div 
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.6 }}
            className="mt-20 relative px-4"
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-accent/20 to-blue-500/20 blur-xl opacity-50"></div>
            <img 
              src="/fitforge_dashboard_mockup_1776783530129.png" 
              alt="FitForge Dashboard Mockup" 
              className="rounded-3xl border border-white/10 shadow-2xl relative z-10 mx-auto max-w-5xl w-full"
            />
          </motion.div>
        </div>
      </section>

      {/* The Problem Section */}
      <section id="vision" className="py-24 px-6 bg-black/20">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-3xl md:text-5xl font-black mb-8 leading-tight">
              THE CHAOS OF <br />
              <span className="text-red-500/80">GUESSWORK.</span>
            </h2>
            <div className="space-y-6">
              {[
                "Scattered data across 5 different apps.",
                "Plateaus caused by lack of structural insight.",
                "Nutrition plans that don't adapt to your training.",
                "No clear vision of your progress trajectory."
              ].map((text, i) => (
                <div key={i} className="flex gap-4 items-start">
                  <div className="mt-1 w-5 h-5 bg-red-500/20 rounded flex items-center justify-center flex-shrink-0 text-red-500">
                    <span className="font-bold text-xs">×</span>
                  </div>
                  <p className="text-textMuted font-medium">{text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="glass p-10 border-accent/20 relative">
            <div className="absolute -top-6 -right-6 w-20 h-20 bg-accent/20 rounded-full blur-2xl"></div>
            <h2 className="text-3xl md:text-5xl font-black mb-8 leading-tight">
              THE PRECISION OF <br />
              <span className="text-accent">THE FORGE.</span>
            </h2>
            <div className="space-y-6">
              {[
                "Unified ecosystem for every metric.",
                "AI-driven insights to break every plateau.",
                "Synchronized heatmaps of your performance.",
                "Visual roadmaps to your dream physique."
              ].map((text, i) => (
                <div key={i} className="flex gap-4 items-start">
                  <CheckCircle2 className="mt-1 w-5 h-5 text-accent flex-shrink-0" />
                  <p className="text-white font-medium">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-7xl mx-auto text-center mb-16">
          <p className="text-accent font-black tracking-widest text-xs uppercase mb-4">Elite Capabilities</p>
          <h2 className="text-4xl md:text-6xl font-black italic">ENGINEERED FOR PERFORMANCE.</h2>
        </div>

        <div className="max-w-7xl mx-auto grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, i) => (
            <motion.div 
              key={feature.title}
              whileHover={{ y: -10 }}
              className="glass p-8 group hover:bg-white/[0.08] transition-all"
            >
              <div className={`p-3 rounded-2xl bg-white/5 w-fit mb-6 group-hover:scale-110 transition-transform ${feature.color}`}>
                <feature.icon className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
              <p className="text-textMuted text-sm leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-32 px-6 relative overflow-hidden">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-5xl md:text-8xl font-black mb-10 tracking-tighter">
            READY TO <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-accent to-blue-400 italic">TRANSCEND?</span>
          </h2>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link to="/register" className="inline-block bg-white text-blue-400  px-12 py-5 rounded-full font-black text-xl hover:bg-accent hover:text-white  hover:shadow-[0_0_40px_rgba(0,230,255,0.6)] transition-all">
              FORGE YOUR ACCOUNT NOW
            </Link>
          </motion.div>
          <p className="mt-8 text-textMuted font-medium">Join 10,000+ athletes forging their best selves.</p>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-accent to-transparent opacity-30"></div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/5 text-center">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <Zap className="text-accent w-5 h-5 fill-current" />
            <span className="font-bold tracking-tighter">FITFORGE AI</span>
          </div>
          
          <div className="flex gap-8 text-xs font-bold text-textMuted uppercase tracking-widest">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">API Docs</a>
          </div>

          <p className="text-xs text-textMuted">© 2026 FitForge AI. Built for the relentless.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
