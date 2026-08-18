import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import { Dumbbell, Mail, Lock, LogIn } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';
import toast from 'react-hot-toast';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(formData.email, formData.password);
      toast.success('Logged in successfully!');
      navigate('/dashboard');
    } catch (error) {
      if (error.response?.data?.requireVerification) {
        toast.error('Account not verified. Check email for OTP.');
        navigate('/verify-otp', { state: { email: formData.email } });
      } else {
        toast.error(error.response?.data?.message || 'Login failed');
      }
    }
  };

  const handleGoogleSuccess = async (tokenResponse) => {
    try {
      await googleLogin(tokenResponse.credential || tokenResponse.access_token);
      toast.success('Logged in via Google!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Google Auth Failed');
    }
  };

  const gLogin = useGoogleLogin({
    onSuccess: handleGoogleSuccess,
    onError: () => toast.error('Google Login Error')
  });

  return (
    <div className="min-h-screen bg-bg-dark flex">
      {/* Left Form Side */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md"
        >
          <div className="flex items-center gap-3 justify-center mb-8">
            <Dumbbell className="text-accent h-10 w-10" />
            <h1 className="text-3xl font-bold tracking-wider text-white">FITFORGE AI</h1>
          </div>

          <div className="glass p-8 rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent to-transparent"></div>
            <h2 className="text-2xl font-bold mb-6 text-white text-center">Welcome Back</h2>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="glass-input p-0 flex items-center group transition-all duration-300 focus-within:ring-2 focus-within:ring-accent/50">
                <div className="pl-4 pr-3 flex items-center justify-center border-r border-white/5">
                  <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-accent transition-colors" />
                </div>
                <input
                  type="email"
                  name="email"
                  placeholder="Email Address"
                  className="w-full bg-transparent py-3.5 px-4 text-white placeholder-textMuted focus:outline-none"
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="glass-input p-0 flex items-center group transition-all duration-300 focus-within:ring-2 focus-within:ring-accent/50">
                <div className="pl-4 pr-3 flex items-center justify-center border-r border-white/5">
                  <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-accent transition-colors" />
                </div>
                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  className="w-full bg-transparent py-3.5 px-4 text-white placeholder-textMuted focus:outline-none"
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="flex justify-end text-sm">
                <Link to="/forgot-password" className="text-accent hover:text-white transition">Forgot Password?</Link>
              </div>

              <button type="submit" className="w-full btn-primary flex items-center justify-center gap-2">
                <LogIn className="h-5 w-5" /> Sign In
              </button>
            </form>

            <div className="mt-6 flex items-center justify-between">
              <span className="w-1/5 border-b border-gray-600 lg:w-1/4"></span>
              <span className="text-xs text-center text-gray-400 uppercase">Or continue with</span>
              <span className="w-1/5 border-b border-gray-600 lg:w-1/4"></span>
            </div>

            <button 
              onClick={() => gLogin()}
              className="mt-4 w-full glass-input flex items-center justify-center gap-2 hover:bg-white/10 transition"
            >
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="h-5 w-5" alt="Google" />
              Google
            </button>

            <p className="mt-8 text-center text-sm text-gray-400">
              Don't have an account? <Link to="/register" className="text-accent font-bold hover:underline">Sign up</Link>
            </p>
          </div>
        </motion.div>
      </div>

      {/* Right Image Side */}
      <div className="hidden lg:block lg:w-1/2 relative bg-bg-dark">
        <div className="absolute inset-0 bg-brand-gradient opacity-80 z-10"></div>
        <img src="/auth-bg.png" alt="Fitness" className="absolute inset-0 object-cover w-full h-full mix-blend-overlay" />
        <div className="absolute bottom-20 left-12 z-20 max-w-lg">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-5xl font-bold text-white mb-4 leading-tight"
          >
            Shatter Your Limits.
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-lg text-gray-300"
          >
            Log in to continue tracking your progress, analyzing your metrics, and forging your ultimate physique with AI precision.
          </motion.p>
        </div>
      </div>
    </div>
  );
};

export default Login;
