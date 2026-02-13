import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/useAuth';
import { api } from '../../lib/api';
import { Button } from '../ui/Button';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import {
    Download,
    User,
    CheckCircle,
    DollarSign,
    Briefcase,
    Search,
    ArrowUpRight,
    Loader2,
    Zap,
    FileText
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useNavigate } from 'react-router-dom';

// --- MOCK DATA ---
const financialData = {
    weekly: Array.from({ length: 7 }, (_, i) => ({
        name: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'][i],
        revenue: Math.floor(Math.random() * 5000) + 2000,
        leads: Math.floor(Math.random() * 10) + 2
    })),
    monthly: Array.from({ length: 12 }, (_, i) => ({
        name: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'][i],
        revenue: Math.floor(Math.random() * 20000) + 15000,
        leads: Math.floor(Math.random() * 50) + 20
    })),
    annual: [
        { name: '2023', revenue: 850000 },
        { name: '2024', revenue: 980000 },
        { name: '2025', revenue: 1150000 },
    ]
};

const leadsData = [
    { id: 1, name: 'Jean Dupont', phone: '06 12 34 56 78', type: 'Rénovation', status: 'pending', time: '10 min', avatar: 'JD' },
    { id: 2, name: 'Sarah Martin', phone: '07 98 76 54 32', type: 'Isolation', status: 'pending', time: '2h', avatar: 'SM' },
    { id: 3, name: 'Lucas Bernard', phone: '06 55 44 33 22', type: 'Solaire', status: 'processed', time: '1j', avatar: 'LB' },
    { id: 4, name: 'Emma Petit', phone: '06 11 22 33 44', type: 'Pompe à Chaleur', status: 'processed', time: '2j', avatar: 'EP' },
];

const quotesData = [
    { id: 101, client: 'Mme Thomas', project: 'Rénovation Garage', amount: 12500, status: 'attente_client', date: '15 Jan' },
    { id: 102, client: 'Cabinet Lemoine', project: 'Isolation Bureaux', amount: 45000, status: 'traitement', date: '14 Jan' },
    { id: 103, client: 'Syndic Paix', project: 'Toiture', amount: 28000, status: 'modification', date: '12 Jan' },
];

const containerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.1 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 50 } }
};

const GlassCard = ({ children, className, ...props }) => (
    <div className={cn("glass-card rounded-2xl p-6 relative overflow-hidden", className)} {...props}>
        {children}
    </div>
);

const Dashboard = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [timeframe, setTimeframe] = useState('weekly');
    const [stats, setStats] = useState({
        totalLeads: 0,
        pendingLeads: 0,
        totalRevenue: 0,
        totalQuotes: 0,
        revenueGrowth: 0,
        weeklyData: [],
        monthlyData: [],
        annualData: []
    });
    const [recentLeads, setRecentLeads] = useState([]);
    const [recentQuotes, setRecentQuotes] = useState([]);
    const [recentActivity, setRecentActivity] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                const [statsData, fetchedLeads, fetchedQuotes, activityData] = await Promise.all([
                    api.stats.fetch(),
                    api.leads.fetchAll(),
                    api.quotes.fetchAll(),
                    api.activity.fetchAll()
                ]);
                setStats(statsData);
                setRecentLeads((fetchedLeads || []).slice(0, 4));
                setRecentQuotes((fetchedQuotes || []).slice(0, 3));
                setRecentActivity(activityData || []);
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, []);

    const handleExport = () => {
        const statsRow = [
            ['Statistiques de Performance'],
            ['Total Leads', stats.totalLeads],
            ['Leads en attente', stats.pendingLeads],
            ['Chiffre d\'Affaires', `${stats.totalRevenue} €`],
            ['Croissance', `${stats.revenueGrowth}%`],
            ['Total Devis', stats.totalQuotes],
            ['Taux de Conversion', `${conversionRate}%`],
            []
        ];

        const leadsHeader = [['Vos Leads Récents'], ['ID', 'Nom', 'Besoin', 'Date']];
        const leadsRows = recentLeads.map(l => [l.id, l.name, l.need, new Date(l.created_at).toLocaleDateString()]);

        const allData = [...statsRow, ...leadsHeader, ...leadsRows];

        const csvContent = "data:text/csv;charset=utf-8,"
            + allData.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `rappel_export_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const conversionRate = stats.totalLeads > 0
        ? Math.round((stats.totalQuotes / stats.totalLeads) * 100)
        : 0;

    const displayData = timeframe === 'monthly' ? stats.monthlyData :
        timeframe === 'annual' ? stats.annualData :
            stats.weeklyData;

    const isEmptyData = !displayData || displayData.length === 0 || displayData.every(d => d.revenue === 0);

    const sampleData = [
        { name: 'Jan', revenue: 4000 },
        { name: 'Fév', revenue: 3000 },
        { name: 'Mar', revenue: 5000 },
        { name: 'Avr', revenue: 2780 },
        { name: 'Mai', revenue: 1890 },
        { name: 'Juin', revenue: 2390 },
        { name: 'Juil', revenue: 3490 },
    ];

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-4" />
                <p className="text-navy-700 font-bold">Chargement de votre tableau de bord...</p>
            </div>
        );
    }

    return (
        <motion.div
            initial="hidden"
            animate="show"
            variants={containerVariants}
            className="space-y-6"
        >
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-4xl font-display font-bold text-navy-950 tracking-tight">
                        Bonjour, <span className="text-gradient">{user?.first_name || user?.email?.split('@')[0] || 'Expert'}</span>
                    </h1>
                    <p className="text-navy-800 mt-1 font-medium">Voici ce qui se passe aujourd'hui sur votre espace.</p>
                </div>
                <div className="flex gap-3">
                    <div className="relative hidden md:block group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400 group-focus-within:text-brand-500 transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Rechercher..."
                            className="pl-10 pr-4 py-2.5 bg-white/50 border border-white/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:bg-white transition-all w-64 shadow-sm backdrop-blur-sm"
                        />
                    </div>
                    <Button
                        onClick={handleExport}
                        className="bg-navy-900 text-white shadow-lg shadow-navy-900/20 hover:bg-navy-800 rounded-xl px-5"
                    >
                        <Download className="mr-2 h-4 w-4" /> Exporter
                    </Button>
                </div>
            </div>

            {/* Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-4 gap-6 auto-rows-min">

                {/* 1. Main Stats - Revenue (Col span 2) */}
                <motion.div variants={itemVariants} className="md:col-span-2">
                    <GlassCard className="h-full flex flex-col justify-between group">
                        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                            <DollarSign size={120} />
                        </div>
                        <div>
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-navy-800 font-black uppercase tracking-wider text-xs">Chiffre d'Affaires</span>
                                <span className={cn(
                                    "text-xs font-black px-2 py-1 rounded-lg border flex items-center gap-1",
                                    stats.revenueGrowth >= 0
                                        ? "bg-accent-50 text-accent-700 border-accent-200"
                                        : "bg-red-50 text-red-700 border-red-200"
                                )}>
                                    <ArrowUpRight size={12} className={stats.revenueGrowth < 0 ? "rotate-90" : ""} />
                                    {stats.revenueGrowth >= 0 ? '+' : ''}{stats.revenueGrowth}%
                                </span>
                            </div>
                            <h2 className="text-5xl font-black text-navy-950 mt-1">{(stats.totalRevenue || 0).toLocaleString()} €</h2>
                        </div>
                        <div className="h-[120px] w-full mt-4 -mx-2">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={displayData}>
                                    <defs>
                                        <linearGradient id="gradientRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <Area type="monotone" dataKey="revenue" stroke="#4F46E5" strokeWidth={3} fill="url(#gradientRevenue)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </GlassCard>
                </motion.div>

                {/* 2. Secondary Stats - Leads & Conversion */}
                <motion.div variants={itemVariants} className="md:col-span-1 space-y-6">
                    <GlassCard className="bg-gradient-to-br from-brand-900 to-brand-700 text-white border-none shadow-premium !opacity-100">
                        <div className="flex items-center gap-3 mb-3 text-white">
                            <User className="w-5 h-5 text-accent-400" /> <span className="text-sm font-black uppercase tracking-widest">Nouveaux Leads</span>
                        </div>
                        <div className="text-4xl font-black mb-1">{stats.totalLeads}</div>
                        <div className="text-[10px] text-brand-900 bg-accent-500 w-fit px-3 py-1 rounded-full font-black uppercase tracking-tighter shadow-glow">{stats.pendingLeads} à traiter</div>
                    </GlassCard>

                    <GlassCard className="!bg-white/80 border-2 border-accent-100">
                        <div className="flex items-center gap-3 mb-3 text-navy-900">
                            <CheckCircle className="w-5 h-5 text-brand-600" /> <span className="text-sm font-black uppercase tracking-widest">Conversion</span>
                        </div>
                        <div className="text-4xl font-black text-navy-950 mb-1">{conversionRate}%</div>
                        <div className="w-full bg-navy-50 h-2 rounded-full overflow-hidden">
                            <div className="bg-accent-500 h-full shadow-glow" style={{ width: `${conversionRate}%` }} />
                        </div>
                    </GlassCard>
                </motion.div>

                {/* 3. Action Card */}
                <motion.div variants={itemVariants} className="md:col-span-1">
                    <div className="h-full bg-brand-950 rounded-2xl p-6 flex flex-col justify-center items-center text-center border-2 border-accent-500/30 group hover:border-accent-500 transition-all duration-500 shadow-premium relative overflow-hidden">
                        <div className="absolute inset-0 bg-mesh opacity-20 mix-blend-overlay"></div>
                        <div className="relative z-10 w-full">
                            <div className="w-14 h-14 bg-accent-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow transform group-hover:scale-110 transition-transform">
                                <Briefcase className="text-navy-950" size={28} />
                            </div>
                            <h3 className="font-black text-2xl mb-2 text-white tracking-tight uppercase">Booster les ventes</h3>
                            <p className="text-white/90 font-bold text-xs mb-6 px-4 leading-relaxed">Accédez aux leads qualifiés de votre région immédiatement.</p>
                            <Button
                                size="lg"
                                className="bg-accent-500 text-brand-900 hover:bg-accent-400 w-full font-black uppercase text-xs tracking-widest shadow-premium py-6 rounded-xl border-none"
                                onClick={() => navigate('/pro/buy-leads')}
                            >
                                Acheter des Leads
                            </Button>
                        </div>
                    </div>
                </motion.div>

                {/* 4. Large Chart Section (Col span 3) */}
                <motion.div variants={itemVariants} className="md:col-span-3 lg:col-span-3">
                    <GlassCard className="min-h-[400px]">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-lg font-bold text-navy-950">Analyse Financière</h3>
                                <p className="text-sm text-navy-800 font-bold">Comparatif de vos revenus sur la période</p>
                            </div>
                            <div className="flex p-1 bg-slate-100/50 rounded-xl backdrop-blur-sm">
                                {['weekly', 'monthly', 'annual'].map((t) => (
                                    <button
                                        key={t}
                                        onClick={() => setTimeframe(t)}
                                        className={cn(
                                            "px-4 py-1.5 text-xs font-semibold rounded-lg transition-all",
                                            timeframe === t
                                                ? "bg-white text-brand-600 shadow-sm"
                                                : "text-navy-500 hover:text-navy-700"
                                        )}
                                    >
                                        {t.charAt(0).toUpperCase() + t.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="h-[300px] relative">
                            {isEmptyData && (
                                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/40 backdrop-blur-[2px] rounded-xl border-2 border-dashed border-navy-100 m-4">
                                    <div className="w-16 h-16 bg-navy-50 rounded-full flex items-center justify-center mb-4">
                                        <ArrowUpRight className="text-navy-300 w-8 h-8" />
                                    </div>
                                    <p className="text-navy-900 font-black uppercase tracking-tight text-lg">Analyse en attente</p>
                                    <p className="text-navy-700 font-bold text-xs max-w-[250px] text-center mt-2 leading-relaxed">
                                        Vos revenus apparaîtront ici dès que vous aurez généré vos premiers devis.
                                    </p>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="mt-6 border-navy-200 text-navy-900 font-bold hover:bg-navy-950 hover:text-white"
                                        onClick={() => navigate('/pro/leads')}
                                    >
                                        Démarrer mon activité
                                    </Button>
                                </div>
                            )}
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={isEmptyData ? sampleData : displayData} barSize={40}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: isEmptyData ? '#CBD5E1' : '#0E1648', fontSize: 12, fontWeight: 700 }}
                                        dy={10}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: isEmptyData ? '#CBD5E1' : '#0E1648', fontSize: 12, fontWeight: 700 }}
                                        tickFormatter={(value) => `${value / 1000}k`}
                                    />
                                    <Tooltip
                                        cursor={{ fill: '#f1f5f9' }}
                                        contentStyle={{
                                            backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                            borderRadius: '12px',
                                            border: 'none',
                                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                                        }}
                                        disabled={isEmptyData}
                                    />
                                    <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
                                        {(isEmptyData ? sampleData : displayData).map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={isEmptyData ? '#f1f5f9' : "url(#gradientRevenue)"}
                                                className={cn("transition-opacity", !isEmptyData && "hover:opacity-80")}
                                            />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </GlassCard>
                </motion.div>

                {/* 5. Side List - Recent Activity (Col span 1) */}
                <motion.div variants={itemVariants} className="md:col-span-1 space-y-6">
                    <GlassCard className="p-0 overflow-hidden">
                        <div className="p-4 border-b border-navy-100 bg-navy-50/50">
                            <h3 className="font-black text-navy-950 text-xs uppercase tracking-widest">Activité Récente</h3>
                        </div>
                        <div className="divide-y divide-navy-50">
                            {recentActivity.length > 0 ? recentActivity.map((act) => (
                                <div key={act.id} className="p-4 hover:bg-white/50 transition-colors cursor-pointer group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-50 flex items-center justify-center text-xs font-bold text-indigo-600">
                                            {act.type === 'lead' ? <User size={14} /> : <Briefcase size={14} />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-navy-950 truncate">{act.title}</p>
                                            <p className="text-xs text-navy-700 truncate">{act.subtitle}</p>
                                        </div>
                                        <span className="text-[10px] bg-navy-100 text-navy-800 font-bold px-1.5 py-0.5 rounded shrink-0">
                                            {new Date(act.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                                        </span>
                                    </div>
                                </div>
                            )) : (
                                <div className="p-12 text-center flex flex-col items-center">
                                    <div className="w-12 h-12 bg-navy-50 rounded-2xl flex items-center justify-center mb-4 text-navy-300">
                                        <Zap size={24} />
                                    </div>
                                    <p className="text-navy-900 font-black text-sm uppercase tracking-tighter">Tout est prêt !</p>
                                    <p className="text-navy-600 text-[10px] font-bold mt-1 max-w-[150px]">Vos futures activités apparaîtront ici.</p>
                                </div>
                            )}
                        </div>
                        <div className="p-3 border-t border-navy-50 text-center">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs text-brand-600 w-full hover:bg-brand-50"
                                onClick={() => navigate('/pro/leads')}
                            >
                                Voir tout
                            </Button>
                        </div>
                    </GlassCard>

                    <GlassCard className="p-4 border border-navy-100">
                        <h3 className="font-black text-navy-950 text-xs uppercase tracking-widest mb-4">Pipeline Devis</h3>
                        <div className="space-y-3">
                            {recentQuotes.length > 0 ? recentQuotes.map(quote => (
                                <div key={quote.id} className="flex justify-between items-center text-sm">
                                    <div className="min-w-0 flex-1 mr-2">
                                        <p className="font-bold text-navy-950 truncate">{quote.client_name}</p>
                                        <p className="text-xs text-navy-700">{parseFloat(quote.amount).toLocaleString()} €</p>
                                    </div>
                                    <div className={cn("w-2 h-2 rounded-full shrink-0",
                                        quote.status === 'signe' ? 'bg-emerald-500' :
                                            quote.status === 'traitement' ? 'bg-blue-500' : 'bg-amber-500'
                                    )} title={quote.status} />
                                </div>
                            )) : (
                                <div className="text-center py-8 flex flex-col items-center">
                                    <div className="w-10 h-10 bg-accent-50 rounded-xl flex items-center justify-center mb-3 text-accent-500">
                                        <FileText size={20} />
                                    </div>
                                    <p className="text-sm text-navy-950 font-black uppercase tracking-tighter">Pipeline vide</p>
                                    <p className="text-[10px] text-navy-700 font-bold mt-1 mb-4">Lancez votre premier devis.</p>
                                    <Button
                                        size="sm"
                                        className="w-full bg-brand-900 text-white text-[10px] py-2 rounded-lg font-black uppercase pointer-events-none opacity-50"
                                    >
                                        Nouveau Devis
                                    </Button>
                                </div>
                            )}
                        </div>
                    </GlassCard>
                </motion.div>

            </div>
        </motion.div>
    );
};

export default Dashboard;
