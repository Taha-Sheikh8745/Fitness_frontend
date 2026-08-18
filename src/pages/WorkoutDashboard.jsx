import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
  ResponsiveContainer, Legend, ReferenceLine
} from 'recharts';
import {
  Dumbbell, Flame, TrendingUp, TrendingDown, Scale, Target, Download,
  Activity, BarChart2, Calendar, Zap, Clock, Layers, Award, RefreshCw,
  ChevronRight, AlertCircle, CheckCircle2, Info
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import DateFilter from '../components/common/DateFilter';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ── Colour palette shared across charts ───────────────────────────────────
const COLORS = ['#00E6FF', '#3b82f6', '#a855f7', '#f97316', '#22c55e', '#ec4899', '#eab308', '#14b8a6'];
const TOOLTIP_STYLE = {
  contentStyle: { backgroundColor: '#0A2740', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' },
  itemStyle: { color: '#e2e8f0' },
  labelStyle: { color: '#94a3b8', fontWeight: 'bold', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }
};

// ── Small reusable components ──────────────────────────────────────────────
const KpiCard = ({ icon: Icon, label, value, sub, color = 'accent', trend }) => {
  const colorMap = {
    accent: { ring: 'border-accent/30', bg: 'bg-accent/10', text: 'text-accent', glow: 'shadow-accent/5' },
    orange: { ring: 'border-orange-500/30', bg: 'bg-orange-500/10', text: 'text-orange-400', glow: 'shadow-orange-500/5' },
    green:  { ring: 'border-green-500/30', bg: 'bg-green-500/10', text: 'text-green-400', glow: 'shadow-green-500/5' },
    purple: { ring: 'border-purple-500/30', bg: 'bg-purple-500/10', text: 'text-purple-400', glow: 'shadow-purple-500/5' },
    blue:   { ring: 'border-blue-500/30', bg: 'bg-blue-500/10', text: 'text-blue-400', glow: 'shadow-blue-500/5' },
    pink:   { ring: 'border-pink-500/30', bg: 'bg-pink-500/10', text: 'text-pink-400', glow: 'shadow-pink-500/5' },
  };
  const c = colorMap[color] || colorMap.accent;
  return (
    <motion.div whileHover={{ scale: 1.02 }} className={`glass-card p-5 flex items-center gap-4 border-t-2 ${c.ring} shadow-lg ${c.glow}`}>
      <div className={`p-3 rounded-xl ${c.bg} border ${c.ring} shrink-0`}><Icon className={`w-6 h-6 ${c.text}`} /></div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest truncate">{label}</p>
        <div className="flex items-end gap-2 mt-0.5">
          <span className="text-2xl font-black text-white leading-none">{value}</span>
          {trend != null && (
            trend > 0
              ? <span className="text-[10px] font-bold text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded flex items-center gap-0.5"><TrendingUp className="w-3 h-3"/>+{trend}</span>
              : trend < 0
              ? <span className="text-[10px] font-bold text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded flex items-center gap-0.5"><TrendingDown className="w-3 h-3"/>{trend}</span>
              : null
          )}
        </div>
        {sub && <p className="text-[10px] text-gray-500 mt-0.5">{sub}</p>}
      </div>
    </motion.div>
  );
};

const SectionTitle = ({ icon: Icon, title, subtitle, iconColor = 'text-accent' }) => (
  <div className="flex items-center gap-3 mb-5">
    <div className="p-2 rounded-lg bg-white/5 border border-white/10">
      <Icon className={`w-5 h-5 ${iconColor}`} />
    </div>
    <div>
      <h3 className="text-base font-bold text-white leading-none">{title}</h3>
      {subtitle && <p className="text-[10px] text-gray-500 mt-0.5">{subtitle}</p>}
    </div>
  </div>
);

const EmptyState = ({ message = 'No data available for this period' }) => (
  <div className="flex flex-col items-center justify-center h-full py-10 gap-3">
    <AlertCircle className="w-10 h-10 text-gray-700" />
    <p className="text-gray-500 text-sm text-center max-w-xs">{message}</p>
  </div>
);

const ChartCard = ({ children, className = '' }) => (
  <div className={`glass-card p-6 ${className}`}>{children}</div>
);

// ── PDF Generator ─────────────────────────────────────────────────────────
const generatePDF = (data, user, dateRange) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const margin = 14;
  let y = margin;

  const addPage = () => { doc.addPage(); y = margin; };
  const checkSpace = (needed = 20) => { if (y + needed > 275) addPage(); };

  // ── Header ────────────────────────────────────────────────────────────
  doc.setFillColor(2, 27, 50);
  doc.rect(0, 0, W, 38, 'F');
  doc.setFontSize(20); doc.setTextColor(0, 230, 255); doc.setFont('helvetica', 'bold');
  doc.text('FitForge AI', margin, 16);
  doc.setFontSize(9); doc.setTextColor(148, 163, 184); doc.setFont('helvetica', 'normal');
  doc.text('Comprehensive Workout & Progress Report', margin, 23);
  doc.setFontSize(8); doc.setTextColor(100, 116, 139);
  const periodStr = dateRange.startDate && dateRange.endDate
    ? `${new Date(dateRange.startDate).toLocaleDateString()} – ${new Date(dateRange.endDate).toLocaleDateString()}`
    : 'All time';
  doc.text(`Generated: ${new Date().toLocaleDateString()} | Athlete: ${user?.name || 'User'} | Period: ${periodStr}`, margin, 30);
  y = 46;

  const sectionHeader = (title, color = [0, 230, 255]) => {
    checkSpace(14);
    doc.setFillColor(...color);
    doc.rect(margin, y, W - margin * 2, 7, 'F');
    doc.setFontSize(9); doc.setTextColor(2, 27, 50); doc.setFont('helvetica', 'bold');
    doc.text(title.toUpperCase(), margin + 3, y + 5);
    y += 11;
  };

  const kv = (label, value, indent = margin) => {
    checkSpace(6);
    doc.setFontSize(8); doc.setTextColor(100, 116, 139); doc.setFont('helvetica', 'normal');
    doc.text(label, indent, y);
    doc.setTextColor(226, 232, 240); doc.setFont('helvetica', 'bold');
    doc.text(String(value), indent + 55, y);
    y += 5.5;
  };

  // ── 1. Workout Summary ───────────────────────────────────────────────
  const ws = data.workoutStats;
  sectionHeader('1. Workout Summary');
  const wCols = [
    { label: 'Total Workouts', value: ws.totalWorkouts },
    { label: 'Total Volume (kg)', value: ws.totalVolume.toLocaleString() },
    { label: 'Total Sets', value: ws.totalSets },
    { label: 'Total Reps', value: ws.totalReps },
    { label: 'Total Duration (min)', value: ws.totalDuration },
    { label: 'Avg Duration (min)', value: ws.avgDuration },
  ];
  wCols.forEach(c => kv(c.label, c.value));
  y += 2;

  // ── 2. Body Metrics ───────────────────────────────────────────────────
  if (data.weightStats) {
    sectionHeader('2. Body Metrics', [168, 85, 247]);
    const bm = data.weightStats;
    kv('Start Weight', `${bm.startWeight} kg`);
    kv('Current Weight', `${bm.currentWeight} kg`);
    kv('Weight Change', `${bm.weightChange > 0 ? '+' : ''}${bm.weightChange} kg`);
    if (bm.currentBodyFat != null) kv('Current Body Fat', `${bm.currentBodyFat}%`);
    if (bm.bodyFatChange != null) kv('Body Fat Change', `${bm.bodyFatChange > 0 ? '+' : ''}${bm.bodyFatChange}%`);
    const m = bm.measurements || {};
    if (Object.keys(m).length) {
      y += 2;
      doc.setFontSize(8); doc.setTextColor(100, 116, 139); doc.setFont('helvetica', 'bold');
      doc.text('Body Measurements (cm):', margin, y); y += 5;
      Object.entries(m).filter(([,v]) => v != null).forEach(([k, v]) => kv(`  ${k.charAt(0).toUpperCase() + k.slice(1)}`, `${v} cm`));
    }
    y += 2;
  }

  // ── 3. Nutrition Summary ──────────────────────────────────────────────
  if (data.nutritionSummary) {
    sectionHeader('3. Nutrition Summary', [249, 115, 22]);
    const ns = data.nutritionSummary;
    kv('Total Calories', `${ns.totalCalories.toLocaleString()} kcal`);
    kv('Avg Daily Calories', `${ns.avgCalories} kcal`);
    kv('Total Protein', `${ns.totalProtein} g`);
    kv('Avg Daily Protein', `${ns.avgProtein} g/day`);
    kv('Total Carbs', `${ns.totalCarbs} g`);
    kv('Total Fats', `${ns.totalFats} g`);
    y += 2;
  }

  // ── 4. Top Exercises Table ────────────────────────────────────────────
  if (data.topExercises?.length) {
    checkSpace(20);
    sectionHeader('4. Top Exercises', [34, 197, 94]);
    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['Exercise', 'Max Weight (kg)', 'Total Sets', 'Total Reps', 'Sessions']],
      body: data.topExercises.map(e => [e._id, e.maxWeight, e.totalSets, e.totalReps, e.sessions]),
      styles: { fontSize: 8, textColor: [226, 232, 240], fillColor: [10, 39, 64] },
      headStyles: { fillColor: [2, 27, 50], textColor: [0, 230, 255], fontStyle: 'bold', fontSize: 8 },
      alternateRowStyles: { fillColor: [15, 30, 50] },
      theme: 'grid',
      tableLineColor: [30, 60, 100], tableLineWidth: 0.1,
    });
    y = doc.lastAutoTable.finalY + 6;
  }

  // ── 5. Workout Category Breakdown ────────────────────────────────────
  if (data.categoryBreakdown?.length) {
    checkSpace(20);
    sectionHeader('5. Workout Categories', [59, 130, 246]);
    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['Category', 'Sessions', '% of Total']],
      body: data.categoryBreakdown.map(c => [
        c._id || 'Unknown', c.count,
        `${Math.round((c.count / ws.totalWorkouts) * 100)}%`
      ]),
      styles: { fontSize: 8, textColor: [226, 232, 240], fillColor: [10, 39, 64] },
      headStyles: { fillColor: [2, 27, 50], textColor: [0, 230, 255], fontStyle: 'bold', fontSize: 8 },
      alternateRowStyles: { fillColor: [15, 30, 50] },
      theme: 'grid',
      tableLineColor: [30, 60, 100], tableLineWidth: 0.1,
    });
    y = doc.lastAutoTable.finalY + 6;
  }

  // ── 6. Goals ─────────────────────────────────────────────────────────
  if (data.goalsProgress?.length) {
    checkSpace(20);
    sectionHeader('6. Goals Progress', [236, 72, 153]);
    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['Goal Type', 'Category', 'Target', 'Current', 'Status', 'Deadline']],
      body: data.goalsProgress.map(g => [
        g.type, g.category || '—', g.targetValue, g.currentValue, g.status,
        new Date(g.deadline).toLocaleDateString()
      ]),
      styles: { fontSize: 8, textColor: [226, 232, 240], fillColor: [10, 39, 64] },
      headStyles: { fillColor: [2, 27, 50], textColor: [0, 230, 255], fontStyle: 'bold', fontSize: 8 },
      alternateRowStyles: { fillColor: [15, 30, 50] },
      theme: 'grid',
      tableLineColor: [30, 60, 100], tableLineWidth: 0.1,
    });
    y = doc.lastAutoTable.finalY + 6;
  }

  // ── 7. AI Insights ────────────────────────────────────────────────────
  if (data.insights?.length) {
    checkSpace(14);
    sectionHeader('7. AI Insights & Recommendations', [0, 230, 255]);
    data.insights.forEach((insight, i) => {
      checkSpace(8);
      doc.setFontSize(8.5); doc.setTextColor(148, 163, 184); doc.setFont('helvetica', 'normal');
      const lines = doc.splitTextToSize(`${i + 1}. ${insight}`, W - margin * 2 - 4);
      doc.text(lines, margin + 2, y);
      y += lines.length * 5 + 2;
    });
    y += 2;
  }

  // ── 8. Weight Trend Table ─────────────────────────────────────────────
  if (data.weightTrend?.length) {
    checkSpace(20);
    sectionHeader('8. Weight Log', [100, 116, 139]);
    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['Date', 'Weight (kg)', 'Body Fat (%)']],
      body: data.weightTrend.map(l => [l.date, l.weight, l.bodyFat ?? '—']),
      styles: { fontSize: 7.5, textColor: [226, 232, 240], fillColor: [10, 39, 64] },
      headStyles: { fillColor: [2, 27, 50], textColor: [0, 230, 255], fontStyle: 'bold', fontSize: 8 },
      alternateRowStyles: { fillColor: [15, 30, 50] },
      theme: 'grid',
      tableLineColor: [30, 60, 100], tableLineWidth: 0.1,
    });
    y = doc.lastAutoTable.finalY + 6;
  }

  // ── Footer on every page ──────────────────────────────────────────────
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7); doc.setTextColor(71, 85, 105); doc.setFont('helvetica', 'normal');
    doc.text(`FitForge AI — Confidential | Page ${i} of ${totalPages}`, margin, 292);
    doc.text(`Generated ${new Date().toLocaleString()}`, W - margin, 292, { align: 'right' });
  }

  doc.save(`FitForge_Report_${new Date().toISOString().split('T')[0]}.pdf`);
};
