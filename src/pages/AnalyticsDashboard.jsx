import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
  Download, Calendar, TrendingUp, TrendingDown, Activity, Flame, Dumbbell,
  Target, Award, Clock, Zap, Scale, FileText, BarChart3, PieChartIcon, LineChartIcon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const AnalyticsDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  const COLORS = ['#00E6FF', '#0284c7', '#3b82f6', '#a855f7', '#f97316', '#22c55e', '#ef4444'];

  useEffect(() => {
    fetchAnalyticsData();
  }, [dateRange]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/analytics/report?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`);
      setData(res.data.data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const calculateMetrics = useMemo(() => {
    if (!data) return null;

    const workoutStats = data.workoutStats || {};
    const weightStats = data.weightStats || {};
    const nutritionSummary = data.nutritionSummary || {};
    const categoryBreakdown = data.categoryBreakdown || [];
    const freqByDow = data.freqByDow || [];

    // Workout Metrics from backend
    const totalWorkouts = workoutStats.totalWorkouts || 0;
    const totalDuration = workoutStats.totalDuration || 0;
    const avgDuration = workoutStats.avgDuration || 0;
    const totalCaloriesBurned = workoutStats.totalVolume || 0; // Using volume as proxy for calories burned
    
    // Workout frequency by category
    const categoryFreq = {};
    categoryBreakdown.forEach(cat => {
      categoryFreq[cat._id || 'Other'] = cat.count;
    });

    // Weekly workout pattern from backend
    const weeklyPattern = freqByDow;

    // Progress Metrics from backend
    const weightChange = weightStats.weightChange || 0;
    const currentWeight = weightStats.currentWeight || 0;

    // Nutrition Metrics from backend
    const totalCaloriesConsumed = nutritionSummary.totalCalories || 0;
    const avgDailyCalories = nutritionSummary.avgCalories || 0;
    
    const macroTotals = {
      protein: nutritionSummary.totalProtein || 0,
      carbs: nutritionSummary.totalCarbs || 0,
      fats: nutritionSummary.totalFats || 0
    };

    // Intensity Score (0-100)
    const intensityScore = totalWorkouts > 0 
      ? Math.min(100, Math.round((totalWorkouts * 5) + (totalDuration / 10) + (totalCaloriesBurned / 1000)))
      : 0;

    // Consistency Score (0-100) - based on workout frequency
    const totalDays = Math.ceil((new Date(dateRange.endDate) - new Date(dateRange.startDate)) / (1000 * 60 * 60 * 24)) || 1;
    const consistencyScore = totalDays > 0 ? Math.min(100, Math.round((totalWorkouts / totalDays) * 100)) : 0;

    return {
      totalWorkouts,
      totalDuration,
      avgDuration,
      totalCaloriesBurned,
      categoryFreq,
      weeklyPattern,
      weightChange,
      currentWeight,
      totalCaloriesConsumed,
      avgDailyCalories,
      macroTotals,
      intensityScore,
      consistencyScore,
      categoryBreakdown,
      weightStats,
      nutritionSummary
    };
  }, [data, dateRange]);

  const chartData = useMemo(() => {
    if (!data || !calculateMetrics) return {};

    const metrics = calculateMetrics;

    // Workout trend over time from backend
    const workoutTrend = (data.workoutVolume || []).map(item => ({
      date: new Date(item._id).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      duration: item.volume,
      calories: item.volume,
      count: item.count
    }));

    // Weight trend from backend
    const weightTrend = (data.weightTrend || []).map(item => ({
      date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      weight: item.weight
    }));

    // Category distribution from backend
    const categoryDistribution = (metrics.categoryBreakdown || []).map(cat => ({
      name: cat._id || 'Other',
      value: cat.count
    }));

    // Macro distribution
    const macroDistribution = [
      { name: 'Protein', value: metrics.macroTotals.protein },
      { name: 'Carbs', value: metrics.macroTotals.carbs },
      { name: 'Fats', value: metrics.macroTotals.fats }
    ];

    // Performance radar
    const performanceRadar = [
      { metric: 'Frequency', value: Math.min(100, metrics.totalWorkouts * 10) },
      { metric: 'Duration', value: Math.min(100, metrics.avgDuration * 2) },
      { metric: 'Intensity', value: metrics.intensityScore },
      { metric: 'Consistency', value: metrics.consistencyScore },
      { metric: 'Calorie Burn', value: Math.min(100, metrics.totalCaloriesBurned / 1000) },
      { metric: 'Nutrition', value: Math.min(100, metrics.avgDailyCalories / 20) }
    ];

    return {
      workoutTrend,
      weightTrend,
      categoryDistribution,
      macroDistribution,
      performanceRadar,
      weeklyPattern: metrics.weeklyPattern
    };
  }, [data, calculateMetrics]);

  const generateInsights = useMemo(() => {
    if (!calculateMetrics) return [];

    const metrics = calculateMetrics;
    const insights = [];

    // Workout frequency insight
    if (metrics.totalWorkouts === 0) {
      insights.push({
        type: 'warning',
        icon: <Dumbbell className="w-5 h-5" />,
        title: 'No Workouts Recorded',
        description: 'Start logging your workouts to track your fitness journey and see detailed analytics.'
      });
    } else if (metrics.totalWorkouts < 8) {
      insights.push({
        type: 'info',
        icon: <TrendingUp className="w-5 h-5" />,
        title: 'Building Momentum',
        description: `You've completed ${metrics.totalWorkouts} workouts. Aim for 3-4 workouts per week for optimal results.`
      });
    } else {
      insights.push({
        type: 'success',
        icon: <Award className="w-5 h-5" />,
        title: 'Great Consistency',
        description: `Excellent! You've completed ${metrics.totalWorkouts} workouts. Keep up the great work!`
      });
    }

    // Intensity insight
    if (metrics.intensityScore >= 70) {
      insights.push({
        type: 'success',
        icon: <Zap className="w-5 h-5" />,
        title: 'High Intensity',
        description: `Your workout intensity score is ${metrics.intensityScore}/100. You're pushing hard!`
      });
    } else if (metrics.intensityScore >= 40) {
      insights.push({
        type: 'info',
        icon: <Activity className="w-5 h-5" />,
        title: 'Moderate Intensity',
        description: `Your workout intensity score is ${metrics.intensityScore}/100. Consider increasing duration or intensity.`
      });
    }

    // Weight change insight
    if (metrics.weightChange !== 0) {
      const direction = metrics.weightChange > 0 ? 'gained' : 'lost';
      insights.push({
        type: metrics.weightChange > 0 ? 'info' : 'success',
        icon: <Scale className="w-5 h-5" />,
        title: 'Weight Progress',
        description: `You've ${direction} ${Math.abs(metrics.weightChange)}kg during this period.`
      });
    }

    // Consistency insight
    if (metrics.consistencyScore >= 70) {
      insights.push({
        type: 'success',
        icon: <Target className="w-5 h-5" />,
        title: 'Excellent Consistency',
        description: `Your consistency score is ${metrics.consistencyScore}%. You're maintaining a regular workout schedule.`
      });
    } else if (metrics.consistencyScore >= 40) {
      insights.push({
        type: 'info',
        icon: <Calendar className="w-5 h-5" />,
        title: 'Room for Improvement',
        description: `Your consistency score is ${metrics.consistencyScore}%. Try to maintain a more regular schedule.`
      });
    }

    // Nutrition insight
    if (metrics.avgDailyCalories > 0) {
      insights.push({
        type: 'info',
        icon: <Flame className="w-5 h-5" />,
        title: 'Calorie Tracking',
        description: `Average daily intake: ${metrics.avgDailyCalories} calories. Track nutrition to fuel your workouts effectively.`
      });
    }

    return insights;
  }, [calculateMetrics]);

  const handleExportPDF = () => {
    if (!calculateMetrics || !chartData) {
      toast.error('No data available to export');
      return;
    }

    const doc = new jsPDF();
    const metrics = calculateMetrics;
    const charts = chartData;

    // Title
    doc.setFontSize(24);
    doc.setTextColor(0, 230, 255);
    doc.text('Fitness Analytics Report', 20, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated for: ${user?.name || 'User'}`, 20, 28);
    doc.text(`Period: ${dateRange.startDate} to ${dateRange.endDate}`, 20, 34);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 40);

    // Summary Section
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text('Executive Summary', 20, 55);

    const summaryData = [
      ['Total Workouts', metrics.totalWorkouts.toString()],
      ['Total Duration', `${metrics.totalDuration} min`],
      ['Average Duration', `${metrics.avgDuration} min`],
      ['Calories Burned', metrics.totalCaloriesBurned.toString()],
      ['Current Weight', `${metrics.currentWeight} kg`],
      ['Weight Change', `${metrics.weightChange} kg`],
      ['Intensity Score', `${metrics.intensityScore}/100`],
      ['Consistency Score', `${metrics.consistencyScore}%`],
      ['Avg Daily Calories', metrics.avgDailyCalories.toString()]
    ];

    autoTable(doc, {
      startY: 60,
      head: [['Metric', 'Value']],
      body: summaryData,
      theme: 'grid',
      headStyles: { fillColor: [0, 230, 255] }
    });

    // Workout Breakdown
    doc.setFontSize(16);
    doc.text('Workout Breakdown by Category', 20, doc.lastAutoTable.finalY + 15);

    const categoryData = Object.entries(metrics.categoryFreq).map(([name, count]) => [name, count.toString()]);
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 20,
      head: [['Category', 'Workouts']],
      body: categoryData,
      theme: 'grid',
      headStyles: { fillColor: [0, 230, 255] }
    });

    // Weekly Pattern
    doc.setFontSize(16);
    doc.text('Weekly Workout Pattern', 20, doc.lastAutoTable.finalY + 15);

    const weeklyData = metrics.weeklyPattern.map(({ day, count }) => [day, count.toString()]);
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 20,
      head: [['Day', 'Workouts']],
      body: weeklyData,
      theme: 'grid',
      headStyles: { fillColor: [0, 230, 255] }
    });

    // Nutrition Summary
    doc.setFontSize(16);
    doc.text('Nutrition Summary', 20, doc.lastAutoTable.finalY + 15);

    const nutritionData = [
      ['Total Calories Consumed', metrics.totalCaloriesConsumed.toString()],
      ['Average Daily Calories', metrics.avgDailyCalories.toString()],
      ['Total Protein', `${metrics.macroTotals.protein}g`],
      ['Total Carbs', `${metrics.macroTotals.carbs}g`],
      ['Total Fats', `${metrics.macroTotals.fats}g`]
    ];

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 20,
      head: [['Metric', 'Value']],
      body: nutritionData,
      theme: 'grid',
      headStyles: { fillColor: [0, 230, 255] }
    });

    // Insights Section
    doc.setFontSize(16);
    doc.text('Key Insights', 20, doc.lastAutoTable.finalY + 15);

    let yPos = doc.lastAutoTable.finalY + 25;
    generateInsights.forEach((insight, index) => {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text(`${index + 1}. ${insight.title}`, 20, yPos);
      yPos += 7;
      
      doc.setFontSize(10);
      doc.setTextColor(80);
      doc.text(insight.description, 25, yPos);
      yPos += 10;
    });

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text('Generated by Fitness Tracker App', 20, 285);

    doc.save(`fitness-analytics-${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('PDF report downloaded successfully!');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-accent"></div>
      </div>
    );
  }

  const metrics = calculateMetrics;
  const charts = chartData;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="glass-card p-6 md:p-8 bg-gradient-to-br from-[#021B32] via-[#0A2740] to-slate-900">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-2">
              Analytics Dashboard
            </h1>
            <p className="text-gray-400">Comprehensive analysis of your fitness journey</p>
          </div>
          <div className="flex gap-3">
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              className="glass-input px-4 py-2 text-sm"
            />
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              className="glass-input px-4 py-2 text-sm"
            />
            <button
              onClick={handleExportPDF}
              className="btn-primary flex items-center gap-2 px-4 py-2"
            >
              <Download className="w-4 h-4" />
              Export PDF
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div whileHover={{ scale: 1.02 }} className="glass-card p-6 border-accent/30 border-t-accent">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-accent/10 rounded-xl">
              <Dumbbell className="w-6 h-6 text-accent" />
            </div>
            <span className="text-xs text-gray-400 font-bold uppercase">Total</span>
          </div>
          <h3 className="text-3xl font-black text-white">{metrics.totalWorkouts}</h3>
          <p className="text-sm text-gray-400 mt-1">Workouts Completed</p>
        </motion.div>

        <motion.div whileHover={{ scale: 1.02 }} className="glass-card p-6 border-orange-500/30 border-t-orange-500">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-500/10 rounded-xl">
              <Flame className="w-6 h-6 text-orange-500" />
            </div>
            <span className="text-xs text-gray-400 font-bold uppercase">Burned</span>
          </div>
          <h3 className="text-3xl font-black text-white">{metrics.totalCaloriesBurned}</h3>
          <p className="text-sm text-gray-400 mt-1">Total Calories</p>
        </motion.div>

        <motion.div whileHover={{ scale: 1.02 }} className="glass-card p-6 border-green-500/30 border-t-green-500">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-500/10 rounded-xl">
              <Clock className="w-6 h-6 text-green-500" />
            </div>
            <span className="text-xs text-gray-400 font-bold uppercase">Duration</span>
          </div>
          <h3 className="text-3xl font-black text-white">{metrics.totalDuration}</h3>
          <p className="text-sm text-gray-400 mt-1">Minutes Active</p>
        </motion.div>

        <motion.div whileHover={{ scale: 1.02 }} className="glass-card p-6 border-purple-500/30 border-t-purple-500">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-500/10 rounded-xl">
              <Target className="w-6 h-6 text-purple-500" />
            </div>
            <span className="text-xs text-gray-400 font-bold uppercase">Intensity</span>
          </div>
          <h3 className="text-3xl font-black text-white">{metrics.intensityScore}%</h3>
          <p className="text-sm text-gray-400 mt-1">Intensity Score</p>
        </motion.div>
      </div>

      {/* Score Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div whileHover={{ scale: 1.02 }} className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-accent" /> Consistency Score
            </h3>
            <span className="text-2xl font-black text-accent">{metrics.consistencyScore}%</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-3">
            <div 
              className="h-3 rounded-full bg-gradient-to-r from-accent to-blue-500 transition-all duration-500"
              style={{ width: `${metrics.consistencyScore}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-400 mt-3">
            {metrics.consistencyScore >= 70 ? 'Excellent consistency!' : metrics.consistencyScore >= 40 ? 'Good progress, keep it up!' : 'Room for improvement'}
          </p>
        </motion.div>

        <motion.div whileHover={{ scale: 1.02 }} className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Scale className="w-5 h-5 text-green-500" /> Weight Progress
            </h3>
            <span className={`text-2xl font-black ${metrics.weightChange > 0 ? 'text-red-400' : metrics.weightChange < 0 ? 'text-green-400' : 'text-gray-400'}`}>
              {metrics.weightChange > 0 ? '+' : ''}{metrics.weightChange} kg
            </span>
          </div>
          <p className="text-sm text-gray-400">
            Current weight: <span className="text-white font-bold">{metrics.currentWeight} kg</span>
          </p>
        </motion.div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Workout Trend */}
        <div className="glass-card p-6 h-[400px]">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <LineChartIcon className="w-5 h-5 text-accent" /> Workout Trend
          </h3>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={charts.workoutTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
              <RechartsTooltip contentStyle={{ backgroundColor: '#0A2740', border: 'none', borderRadius: '12px' }} />
              <Line type="monotone" dataKey="duration" stroke="#00E6FF" strokeWidth={3} name="Duration (min)" />
              <Line type="monotone" dataKey="calories" stroke="#f97316" strokeWidth={3} name="Calories" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Weight Trend */}
        <div className="glass-card p-6 h-[400px]">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <Scale className="w-5 h-5 text-green-500" /> Weight Progress
          </h3>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={charts.weightTrend}>
              <defs>
                <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
              <RechartsTooltip contentStyle={{ backgroundColor: '#0A2740', border: 'none', borderRadius: '12px' }} />
              <Area type="monotone" dataKey="weight" stroke="#22c55e" strokeWidth={3} fill="url(#colorWeight)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Distribution */}
        <div className="glass-card p-6 h-[400px]">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <PieChartIcon className="w-5 h-5 text-purple-400" /> Workout Categories
          </h3>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={charts.categoryDistribution}
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {charts.categoryDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <RechartsTooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Macro Distribution */}
        <div className="glass-card p-6 h-[400px]">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-500" /> Macro Distribution
          </h3>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={charts.macroDistribution}
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {charts.macroDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <RechartsTooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Performance Radar */}
        <div className="glass-card p-6 h-[400px]">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-accent" /> Performance Overview
          </h3>
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={charts.performanceRadar}>
              <PolarGrid stroke="#ffffff10" />
              <PolarAngleAxis dataKey="metric" tick={{ fill: '#64748b', fontSize: 10 }} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 8 }} />
              <Radar name="Score" dataKey="value" stroke="#00E6FF" fill="#00E6FF" fillOpacity={0.3} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Weekly Pattern */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-400" /> Weekly Workout Pattern
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={charts.weeklyPattern}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
            <XAxis dataKey="day" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
            <RechartsTooltip contentStyle={{ backgroundColor: '#0A2740', border: 'none', borderRadius: '12px' }} />
            <Bar dataKey="count" fill="url(#colorBar)" radius={[4, 4, 0, 0]} />
            <defs>
              <linearGradient id="colorBar" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00E6FF" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#00E6FF" stopOpacity={0.2}/>
              </linearGradient>
            </defs>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Insights Section */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
          <FileText className="w-5 h-5 text-accent" /> AI-Powered Insights
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {generateInsights.map((insight, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`p-4 rounded-xl border ${
                insight.type === 'success' ? 'bg-green-500/10 border-green-500/20' :
                insight.type === 'warning' ? 'bg-yellow-500/10 border-yellow-500/20' :
                'bg-blue-500/10 border-blue-500/20'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${
                  insight.type === 'success' ? 'bg-green-500/20 text-green-400' :
                  insight.type === 'warning' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-blue-500/20 text-blue-400'
                }`}>
                  {insight.icon}
                </div>
                <div>
                  <h4 className="font-bold text-white mb-1">{insight.title}</h4>
                  <p className="text-sm text-gray-400">{insight.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default AnalyticsDashboard;
