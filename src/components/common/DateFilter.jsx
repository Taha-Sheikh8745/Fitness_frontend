import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar as CalendarIcon, ChevronDown } from 'lucide-react';

const options = [
  { label: 'Today', value: 'today' },
  { label: 'Yesterday', value: 'yesterday' },
  { label: 'This Week', value: 'week' },
  { label: 'This Month', value: 'month' },
  { label: 'This Year', value: 'year' },
  { label: 'Custom Range', value: 'custom' },
];

const DateFilter = ({ onFilterChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState('week');
  const [customRange, setCustomRange] = useState({ start: '', end: '' });
  const dropdownRef = useRef(null);

  useEffect(() => {
    handleSelect(selected, false);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (val, applyCustom = true) => {
    setSelected(val);
    
    if (val === 'custom' && !applyCustom) return;

    let startDate = new Date();
    let endDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    switch (val) {
      case 'today':
        break;
      case 'yesterday':
        startDate.setDate(startDate.getDate() - 1);
        endDate.setDate(endDate.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(startDate.getDate() - 6);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      case 'custom':
        if (!customRange.start || !customRange.end) return;
        startDate = new Date(customRange.start);
        endDate = new Date(customRange.end);
        startDate.setHours(0,0,0,0);
        endDate.setHours(23,59,59,999);
        break;
      default:
        break;
    }

    if (val !== 'custom') setIsOpen(false);
    onFilterChange({ startDate: startDate.toISOString(), endDate: endDate.toISOString() });
  };

  const handleCustomApply = () => {
    if (customRange.start && customRange.end) {
      handleSelect('custom');
      setIsOpen(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-[#021B32]/80 border border-[#00E6FF]/30 hover:border-[#00E6FF] text-white px-4 py-2.5 rounded-xl shadow-[0_0_10px_rgba(0,230,255,0.1)] transition-all font-medium text-sm w-48 justify-between"
      >
        <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-accent" />
            {options.find(o => o.value === selected)?.label}
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute right-0 mt-2 w-64 bg-[#0A2740]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50"
          >
            <div className="p-2 space-y-1">
              {options.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleSelect(opt.value)}
                  className={`w-full text-left px-4 py-2 rounded-xl transition-colors text-sm font-medium ${
                    selected === opt.value 
                      ? 'bg-accent/20 text-accent border border-accent/30' 
                      : 'text-gray-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {selected === 'custom' && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="p-4 border-t border-white/5 bg-slate-900/50">
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Start Date</label>
                    <input 
                        type="date" 
                        className="glass-input w-full text-sm py-1.5 px-3" 
                        value={customRange.start}
                        onChange={(e) => setCustomRange({...customRange, start: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">End Date</label>
                    <input 
                        type="date" 
                        className="glass-input w-full text-sm py-1.5 px-3" 
                        value={customRange.end}
                        onChange={(e) => setCustomRange({...customRange, end: e.target.value})}
                    />
                  </div>
                  <button 
                    onClick={handleCustomApply}
                    disabled={!customRange.start || !customRange.end}
                    className="w-full btn-primary py-1.5 text-sm mt-2 disabled:opacity-50"
                  >
                    Apply Range
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DateFilter;
