import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import { ShieldCheck, RefreshCw, Mail } from 'lucide-react';
import toast from 'react-hot-toast';

const VerifyOTP = () => {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [success, setSuccess] = useState(false);

  const { verifyOTP, resendOTP } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const email = location.state?.email;

  useEffect(() => {
    if (!email) {
      navigate('/login');
    }
  }, [email, navigate]);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (otp.length !== 6) {
      setError('Verification code must be 6 digits');
      return;
    }

    setError('');
    setLoading(true);
    
    try {
      await verifyOTP(email, otp);
      setSuccess(true);
      toast.success('Account verified successfully!');
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError('');
    try {
      const res = await resendOTP(email);
      toast.success(res?.message || 'Verification code sent to your email!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend code');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-bg-dark">
      <div className="absolute top-[20%] left-[20%] w-96 h-96 bg-accent/20 rounded-full blur-[100px]" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass p-8 w-full max-w-md relative z-10 text-center"
      >
        <div className="flex justify-center mb-6">
          <div className="bg-accent/10 p-4 rounded-full border border-accent/20">
            <ShieldCheck className="w-10 h-10 text-accent" />
          </div>
        </div>
        
        <h2 className="text-3xl font-bold mb-2 text-white">Verify Email</h2>
        <p className="text-gray-400 mb-6 text-sm">
          We sent a 6-digit verification code to <br/>
          <span className="text-accent font-semibold text-base">{email}</span>
        </p>

        <div className="mb-6 p-3 rounded-xl bg-accent/5 border border-accent/20 flex items-center gap-3 text-left">
          <Mail className="w-5 h-5 text-accent flex-shrink-0" />
          <p className="text-xs text-gray-300">
            Please check your email inbox and enter the 6-digit code below.
          </p>
        </div>

        {error && <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg mb-6 text-sm">{error}</div>}
        {success && <div className="bg-green-500/10 border border-green-500/50 text-green-400 p-3 rounded-lg mb-6 text-sm">Verification successful! Redirecting to login...</div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          <input 
            type="text" 
            placeholder="000000" 
            maxLength={6}
            className="glass-input text-center text-2xl tracking-widest font-mono text-white"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
            required
            autoFocus
          />

          <button 
            type="submit" 
            className="btn-primary w-full py-3.5 font-bold"
            disabled={loading || success}
          >
            {loading ? 'Verifying...' : 'Verify Code'}
          </button>
        </form>

        <div className="mt-6 flex justify-center">
          <button 
            onClick={handleResend}
            disabled={resending}
            className="text-sm text-gray-400 hover:text-accent flex items-center gap-1.5 transition"
          >
            <RefreshCw className={`w-4 h-4 ${resending ? 'animate-spin' : ''}`} />
            {resending ? 'Sending Code...' : 'Resend Verification Code'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default VerifyOTP;
