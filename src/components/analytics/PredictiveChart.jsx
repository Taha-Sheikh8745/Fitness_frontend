import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Sparkles, Loader2, AlertCircle } from 'lucide-react';
import api from '../../services/api';

const PredictiveChart = ({ userId }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPrediction = async () => {
      try {
        const { data } = await api.get('/analytics/predict-weight');
        setData(data.data);
      } catch (err) {
        console.error('Failed to fetch prediction');
      } finally {
        setLoading(false);
      }
    };
    fetchPrediction();
  }, [userId]);

  if (loading) {
    return (
      <div className="glass-card p-12 flex flex-col items-center justify-center gap-4 h-[400px]">
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
        <p className="text-gray-400 font-mono text-xs uppercase tracking-widest">Running Regression Analysis...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="glass-card p-12 flex flex-col items-center justify-center gap-4 h-[400px] border-dashed border-white/5">
        <AlertCircle className="w-12 h-12 text-gray-700" />
        <p className="text-gray-500 font-medium text-center max-w-sm">
          Not enough historical data to generate a biological trend. Keep logging for 5+ days!
        </p>
      </div>
    );
  }

  // Combine current trend with predictions for visualization
  const chartPoints = data.predictions.map(p => ({
    date: new Date(p.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    weight: p.weight,
    type: 'Predicted'
  }));

  return (
    <div className="glass-card p-6 h-[400px] flex flex-col bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900/20 border-purple-500/10">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" /> AI Weight Forecast
          </h3>
          <p className="text-[10px] text-gray-500 font-mono uppercase mt-1">Next 7-Day Trend Projection</p>
        </div>
        <div className="text-right">
          <span className={`text-xs font-bold px-2 py-1 rounded ${data.dailyTrend < 0 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
            {data.dailyTrend > 0 ? '+' : ''}{data.dailyTrend} kg / day
          </span>
        </div>
      </div>

      <div className="flex-1 w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartPoints} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
             <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
             <XAxis dataKey="date" stroke="#64748b" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} dy={10} />
             <YAxis stroke="#64748b" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} domain={['dataMin - 1', 'dataMax + 1']} dx={-10} />
             <RechartsTooltip 
                contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderColor: '#a855f7', borderRadius: '12px' }}
                itemStyle={{ color: '#a855f7', fontWeight: 'bold' }}
             />
             <Line 
                type="monotone" 
                dataKey="weight" 
                stroke="#a855f7" 
                strokeWidth={3} 
                strokeDasharray="5 5"
                dot={{ r: 4, fill: '#0F172A', stroke: '#a855f7' }}
                animationDuration={2000}
             />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      <p className="text-[10px] text-center text-gray-500 mt-4 leading-relaxed max-w-md mx-auto">
        Forecast based on linear regression of last 30 days. Biological factors (water retention, muscle growth) may cause variance.
      </p>
    </div>
  );
};

export default PredictiveChart;
