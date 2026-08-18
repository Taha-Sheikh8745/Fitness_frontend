import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import { ShieldCheck, RefreshCw, Key } from 'lucide-react';
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
  const [currentDevOtp, setCurrentDevOtp] = useState(location.state?.devOtp || '');

  useEffect(() => {
    if (!email) {
      navigate('/login');
    }
  }, [email, navigate]);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (otp.length !== 6) {
      setError('OTP must be 6 digits');
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
      setError(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleAutoFill = () => {
    if (currentDevOtp) {
      setOtp(currentDevOtp);
      toast.success('OTP Auto-filled!');
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError('');
    try {
      const res = await resendOTP(email);
      if (res?.devOtp) {
        setCurrentDevOtp(res.devOtp);
      }
      toast.success(res?.message || 'New verification code generated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend OTP');
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
          <div className="bg-accent/10 p-4 rounded-full">
            <ShieldCheck className="w-10 h-10 text-accent" />
          </div>
        </div>
        
        <h2 className="text-3xl font-bold mb-2 text-white">Verify Email</h2>
        <p className="text-gray-400 mb-6">
          Verification code for <br/>
          <span className="text-white font-medium">{email}</span>
        </p>

        {currentDevOtp && (
          <div className="mb-6 p-4 rounded-xl bg-accent/10 border border-accent/30 text-left">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-accent font-semibold text-sm">
                <Key className="w-4 h-4" /> Your Verification Code:
              </div>
              <button 
                type="button"
                onClick={handleAutoFill}
                className="text-xs bg-accent text-black font-bold px-2.5 py-1 rounded hover:bg-accent/80 transition"
              >
                Auto-Fill
              </button>
            </div>
            <div className="text-2xl font-mono font-bold tracking-widest text-center text-white bg-black/40 py-2 rounded-lg border border-white/10">
              {currentDevOtp}
            </div>
          </div>
        )}

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
          />

          <button 
            type="submit" 
            className="btn-primary w-full"
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
            {resending ? 'Generating Code...' : 'Resend Verification Code'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default VerifyOTP;
