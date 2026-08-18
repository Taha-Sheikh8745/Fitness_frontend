import { useState } from 'react';
import { motion } from 'framer-motion';
import api from '../services/api';
import toast from 'react-hot-toast';

const Support = () => {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/support', { subject, message });
      toast.success('Support ticket submitted successfully!');
      setSubject('');
      setMessage('');
    } catch (err) {
      toast.error('Failed to submit ticket');
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto space-y-6">
      <div className="glass-card p-8">
        <h2 className="text-3xl font-extrabold text-white mb-2">Get Support</h2>
        <p className="text-gray-400 mb-8">Having issues or need help? Reach out to our team.</p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col gap-2">
            <label className="text-gray-300 font-medium tracking-wide">Subject</label>
            <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} required className="w-full bg-slate-900/50 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-accent transition focus:shadow-[0_0_15px_rgba(0,230,255,0.2)]" placeholder="E.g. Issue logging workout" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-gray-300 font-medium tracking-wide">Message</label>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} required rows="6" className="w-full bg-slate-900/50 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-accent transition focus:shadow-[0_0_15px_rgba(0,230,255,0.2)]" placeholder="Describe your issue in detail..."></textarea>
          </div>
          <button type="submit" className="btn-primary w-full py-4 text-lg">Submit Ticket</button>
        </form>
      </div>
    </motion.div>
  );
};
export default Support;
