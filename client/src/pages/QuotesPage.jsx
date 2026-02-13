import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import {
    Search,
    MoreHorizontal,
    FileText,
    Calendar,
    DollarSign,
    CheckCircle,
    XCircle,
    Clock,
    Plus,
    Loader2,
    X
} from 'lucide-react';
import { cn } from '../lib/utils';
import { api } from '../lib/api';

const getStatusColor = (status) => {
    switch (status) {
        case 'attente_client': return 'bg-amber-50 text-amber-700 border-amber-200';
        case 'traitement': return 'bg-brand-50 text-brand-700 border-brand-200';
        case 'modification': return 'bg-navy-50 text-navy-700 border-navy-200';
        case 'signe': return 'bg-accent-50 text-accent-700 border-accent-200';
        case 'refuse': return 'bg-red-50 text-red-700 border-red-100';
        default: return 'bg-slate-100 text-slate-700';
    }
};

const getStatusLabel = (status) => {
    switch (status) {
        case 'attente_client': return 'Attente retour';
        case 'traitement': return 'En traitement';
        case 'modification': return 'Modification';
        case 'signe': return 'Signé';
        case 'refuse': return 'Refusé';
        default: return status;
    }
};

const QuotesPage = () => {
    const [quotes, setQuotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit' | 'view'
    const [newQuote, setNewQuote] = useState({ client_name: '', project_name: '', amount: '', items_count: 1, status: 'attente_client' });
    const [editingQuoteId, setEditingQuoteId] = useState(null);
    const [showActionsMenu, setShowActionsMenu] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchQuotes();
    }, []);

    const fetchQuotes = async () => {
        try {
            setLoading(true);
            const data = await api.quotes.fetchAll();
            setQuotes(data || []);
        } catch (error) {
            console.error('Error fetching quotes:', error);
        } finally {
            setLoading(false);
        }
    };

    const openCreateModal = () => {
        setModalMode('create');
        setNewQuote({ client_name: '', project_name: '', amount: '', items_count: 1, status: 'attente_client' });
        setEditingQuoteId(null);
        setShowCreateModal(true);
    };

    const openEditModal = (quote) => {
        setModalMode('edit');
        setNewQuote({
            client_name: quote.client_name,
            project_name: quote.project_name,
            amount: quote.amount,
            items_count: quote.items_count,
            status: quote.status
        });
        setEditingQuoteId(quote.id);
        setShowCreateModal(true);
        setShowActionsMenu(null);
    };

    const openViewModal = (quote) => {
        setModalMode('view');
        setNewQuote({
            client_name: quote.client_name,
            project_name: quote.project_name,
            amount: quote.amount,
            items_count: quote.items_count,
            status: quote.status
        });
        setEditingQuoteId(quote.id);
        setShowCreateModal(true);
        setShowActionsMenu(null);
    };

    const handleDeleteQuote = async (id) => {
        if (!confirm("Êtes-vous sûr de vouloir supprimer ce devis ?")) return;
        try {
            await api.quotes.delete(id);
            fetchQuotes();
            setShowActionsMenu(null);
        } catch (error) {
            alert("Erreur lors de la suppression du devis.");
        }
    };

    const handleCreateQuote = async (e) => {
        e.preventDefault();
        try {
            if (modalMode === 'edit') {
                await api.quotes.update(editingQuoteId, newQuote);
            } else {
                await api.quotes.create(newQuote);
            }
            setShowCreateModal(false);
            setNewQuote({ client_name: '', project_name: '', amount: '', items_count: 1, status: 'attente_client' });
            fetchQuotes();
        } catch (error) {
            alert(`Erreur lors de la ${modalMode === 'edit' ? 'mise à jour' : 'création'} du devis.`);
        }
    };

    const filteredQuotes = (activeTab === 'all'
        ? quotes
        : quotes.filter(q => {
            if (activeTab === 'signe') return q.status === 'signe';
            if (activeTab === 'pending') return ['attente_client', 'traitement', 'modification'].includes(q.status);
            if (activeTab === 'lost') return q.status === 'refuse';
            return true;
        })).filter(q =>
            q.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            q.project_name?.toLowerCase().includes(searchTerm.toLowerCase())
        );

    const stats = {
        totalEnCours: quotes.filter(q => q.status !== 'signe' && q.status !== 'refuse').reduce((sum, q) => sum + parseFloat(q.amount), 0),
        countEnCours: quotes.filter(q => q.status !== 'signe' && q.status !== 'refuse').length,
        totalSigne: quotes.filter(q => q.status === 'signe').reduce((sum, q) => sum + parseFloat(q.amount), 0),
        refuseRate: quotes.length > 0 ? (quotes.filter(q => q.status === 'refuse').length / quotes.length) * 100 : 0
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-navy-950 tracking-tight">Mes Devis</h1>
                    <p className="text-navy-800 font-bold mt-1">Suivez et gérez vos propositions commerciales</p>
                </div>
                <Button onClick={openCreateModal} className="bg-navy-950 text-white hover:bg-navy-900 shadow-premium font-bold">
                    <Plus className="mr-2 h-4 w-4" /> Créer un devis
                </Button>
            </div>

            {/* Pipeline Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-5 border-l-4 border-l-amber-500">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-navy-700 text-sm font-bold">En cours</p>
                            <h3 className="text-2xl font-bold text-navy-950 mt-1">{stats.totalEnCours.toLocaleString()} €</h3>
                            <p className="text-xs text-amber-600 font-bold mt-1">{stats.countEnCours} devis en attente</p>
                        </div>
                        <div className="p-2 bg-amber-50 rounded-lg text-amber-600"><Clock size={20} /></div>
                    </div>
                </Card>
                <Card className="p-5 border-l-4 border-l-accent-500 shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-navy-700 text-sm font-bold">Signés (Total)</p>
                            <h3 className="text-2xl font-bold text-navy-950 mt-1">{stats.totalSigne.toLocaleString()} €</h3>
                            <p className="text-xs text-accent-600 font-black mt-1">Valeur totale actée</p>
                        </div>
                        <div className="p-2 bg-accent-50 rounded-lg text-accent-600"><CheckCircle size={20} /></div>
                    </div>
                </Card>
                <Card className="p-5 border-l-4 border-l-red-500">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-navy-700 text-sm font-bold">Taux de refus</p>
                            <h3 className="text-2xl font-bold text-navy-950 mt-1">{Math.round(stats.refuseRate)} %</h3>
                            <p className="text-xs text-navy-500 font-bold mt-1">Sur l'ensemble des devis</p>
                        </div>
                        <div className="p-2 bg-red-50 rounded-lg text-red-600"><XCircle size={20} /></div>
                    </div>
                </Card>
            </div>

            {/* List */}
            <Card className="p-0 overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex gap-2 p-1 bg-slate-100 rounded-lg">
                        {['all', 'pending', 'signe', 'lost'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={cn(
                                    "px-3 py-1.5 text-sm font-medium rounded-md transition-all",
                                    activeTab === tab ? "bg-white text-navy-900 shadow-sm" : "text-slate-500 hover:text-navy-700"
                                )}
                            >
                                {tab === 'all' && 'Tous'}
                                {tab === 'pending' && 'En cours'}
                                {tab === 'signe' && 'Signés'}
                                {tab === 'lost' && 'Perdus'}
                            </button>
                        ))}
                    </div>
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Rechercher un devis..."
                            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent-500 font-medium"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="divide-y divide-slate-100 min-h-[400px]">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <Loader2 className="w-8 h-8 text-accent-500 animate-spin mb-4" />
                            <p className="text-slate-500">Chargement de vos devis...</p>
                        </div>
                    ) : filteredQuotes.length > 0 ? (
                        filteredQuotes.map((quote) => (
                            <div key={quote.id} className="p-4 md:p-6 hover:bg-slate-50/50 transition-colors flex flex-col md:flex-row items-center gap-6">
                                <div className="flex items-center gap-4 flex-1 w-full">
                                    <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 font-bold shrink-0">
                                        <FileText size={20} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-navy-950 font-display">{quote.client_name}</h4>
                                        <p className="text-sm text-navy-700 font-semibold">{quote.project_name}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-8 w-full md:w-auto justify-between md:justify-end">
                                    <div className="text-right">
                                        <div className="font-black text-navy-950 text-lg">{parseFloat(quote.amount).toLocaleString()} €</div>
                                        <div className="text-xs text-navy-700 font-bold">{quote.items_count} prestations</div>
                                    </div>
                                    <div className="text-right hidden md:block">
                                        <div className="flex items-center gap-1 text-sm text-slate-600 mb-1">
                                            <Calendar size={14} /> {new Date(quote.created_at).toLocaleDateString()}
                                        </div>
                                        <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-medium border", getStatusColor(quote.status))}>
                                            {getStatusLabel(quote.status)}
                                        </span>
                                    </div>
                                    <div className="relative">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setShowActionsMenu(showActionsMenu === quote.id ? null : quote.id)}
                                        >
                                            <MoreHorizontal size={18} />
                                        </Button>
                                        {showActionsMenu === quote.id && (
                                            <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-slate-200 rounded-lg shadow-lg z-10">
                                                <button
                                                    onClick={() => openViewModal(quote)}
                                                    className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 flex items-center gap-2"
                                                >
                                                    Voir détails
                                                </button>
                                                <button
                                                    onClick={() => openEditModal(quote)}
                                                    className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 flex items-center gap-2"
                                                >
                                                    Modifier
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteQuote(quote.id)}
                                                    className="w-full text-left px-4 py-2 text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
                                                >
                                                    Supprimer
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4">
                                <FileText size={32} />
                            </div>
                            <p className="text-slate-500">Aucun devis trouvé.</p>
                            <Button variant="link" onClick={() => setShowCreateModal(true)} className="text-accent-600 font-bold">Créer votre premier devis</Button>
                        </div>
                    )}
                </div>
            </Card>

            {/* Create Quote Modal */}
            <AnimatePresence>
                {showCreateModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowCreateModal(false)}
                            className="absolute inset-0 bg-navy-900/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg relative z-10 overflow-hidden"
                        >
                            <div className="p-6 border-b flex justify-between items-center bg-slate-50">
                                <h2 className="text-xl font-bold text-navy-900">
                                    {modalMode === 'create' ? 'Nouveau Devis' : modalMode === 'edit' ? 'Modifier le Devis' : 'Détails du Devis'}
                                </h2>
                                <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-navy-900">
                                    <X size={20} />
                                </button>
                            </div>
                            <form onSubmit={handleCreateQuote} className="p-6 space-y-4">
                                <Input
                                    label="Nom du Client"
                                    placeholder="Mme Durand"
                                    required
                                    disabled={modalMode === 'view'}
                                    value={newQuote.client_name}
                                    onChange={e => setNewQuote({ ...newQuote, client_name: e.target.value })}
                                />
                                <Input
                                    label="Nom du Projet"
                                    placeholder="Rénovation Toiture"
                                    required
                                    disabled={modalMode === 'view'}
                                    value={newQuote.project_name}
                                    onChange={e => setNewQuote({ ...newQuote, project_name: e.target.value })}
                                />
                                <div className="grid grid-cols-2 gap-4">
                                    <Input
                                        label="Montant (€)"
                                        type="number"
                                        placeholder="1200"
                                        required
                                        disabled={modalMode === 'view'}
                                        value={newQuote.amount}
                                        onChange={e => setNewQuote({ ...newQuote, amount: e.target.value })}
                                    />
                                    <Input
                                        label="Nombre de prestations"
                                        type="number"
                                        placeholder="1"
                                        disabled={modalMode === 'view'}
                                        value={newQuote.items_count}
                                        onChange={e => setNewQuote({ ...newQuote, items_count: e.target.value })}
                                    />
                                </div>

                                {modalMode !== 'create' && (
                                    <div>
                                        <label className="block text-sm font-bold text-navy-900 mb-2">Statut</label>
                                        <select
                                            disabled={modalMode === 'view'}
                                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium disabled:opacity-70"
                                            value={newQuote.status}
                                            onChange={e => setNewQuote({ ...newQuote, status: e.target.value })}
                                        >
                                            <option value="attente_client">Attente retour</option>
                                            <option value="traitement">En traitement</option>
                                            <option value="modification">Modification</option>
                                            <option value="signe">Signé</option>
                                            <option value="refuse">Refusé</option>
                                        </select>
                                    </div>
                                )}

                                <div className="pt-4 flex gap-3">
                                    <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)} className="flex-1">
                                        {modalMode === 'view' ? 'Fermer' : 'Annuler'}
                                    </Button>
                                    {modalMode !== 'view' && (
                                        <Button type="submit" className="flex-1 bg-navy-950 text-white font-bold hover:bg-navy-900">
                                            {modalMode === 'create' ? 'Créer le devis' : 'Enregistrer'}
                                        </Button>
                                    )}
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default QuotesPage;
