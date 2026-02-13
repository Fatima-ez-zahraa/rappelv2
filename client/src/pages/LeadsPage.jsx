import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import {
    Search,
    Filter,
    MoreHorizontal,
    Phone,
    Mail,
    MapPin,
    Calendar,
    CheckCircle,
    User,
    Loader2,
    Edit
} from 'lucide-react';
import { cn } from '../lib/utils';
import { api } from '../lib/api';

const LeadsPage = () => {
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, pending, processed
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [newLead, setNewLead] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        sector: '',
        need: '',
        budget: ''
    });
    const [submitting, setSubmitting] = useState(false);
    const [selectedLead, setSelectedLead] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [editing, setEditing] = useState(false);
    const [editedLead, setEditedLead] = useState(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchLeads();
    }, []);

    const fetchLeads = async () => {
        try {
            setLoading(true);
            const data = await api.leads.fetchAll();
            setLeads(data || []);
        } catch (error) {
            console.error('Error fetching leads:', error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAddLead = async (e) => {
        e.preventDefault();
        try {
            setSubmitting(true);
            await api.leads.createManual(newLead);
            setShowModal(false);
            setNewLead({ name: '', email: '', phone: '', address: '', sector: '', need: '', budget: '' });
            fetchLeads();
        } catch (error) {
            alert(error.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleCall = async (lead) => {
        // Update status to 'contacted' or just refresh activity
        try {
            // Check if status is still pending, then update to mark as being handled
            if (lead.status === 'pending') {
                await api.leads.update(lead.id, { status: 'processed' });
                fetchLeads();
            }
            window.location.href = `tel:${lead.phone}`;
        } catch (error) {
            console.error('Error updating lead status on call:', error);
            window.location.href = `tel:${lead.phone}`;
        }
    };

    const handleStatusUpdate = async (leadId, newStatus) => {
        try {
            setUpdating(true);
            await api.leads.update(leadId, { status: newStatus });
            if (selectedLead && selectedLead.id === leadId) {
                setSelectedLead({ ...selectedLead, status: newStatus });
            }
            fetchLeads();
        } catch (error) {
            alert(`Erreur: ${error.message}`);
        } finally {
            setUpdating(false);
        }
    };

    const openDetails = (lead) => {
        setSelectedLead(lead);
        setShowDetailsModal(true);
    };

    const startEditing = () => {
        setEditedLead({ ...selectedLead });
        setEditing(true);
    };

    const cancelEditing = () => {
        // Check if there are unsaved changes
        const hasChanges = JSON.stringify(editedLead) !== JSON.stringify(selectedLead);
        if (hasChanges) {
            const confirmCancel = window.confirm('Vous avez des modifications non sauvegardées. Voulez-vous vraiment annuler ?');
            if (!confirmCancel) return;
        }
        setEditedLead(null);
        setEditing(false);
    };

    const handleSaveEdit = async () => {
        // Basic validation
        if (!editedLead.name?.trim()) {
            alert('Le nom est obligatoire.');
            return;
        }
        if (!editedLead.email?.trim()) {
            alert('L\'email est obligatoire.');
            return;
        }
        if (!editedLead.phone?.trim()) {
            alert('Le téléphone est obligatoire.');
            return;
        }

        try {
            setSaving(true);
            await api.leads.update(selectedLead.id, editedLead);
            setSelectedLead(editedLead);
            setEditing(false);
            setEditedLead(null);
            fetchLeads();
            // Success feedback
            alert('Les détails du lead ont été mis à jour avec succès.');
        } catch (error) {
            alert(`Erreur lors de la mise à jour: ${error.message}`);
        } finally {
            setSaving(false);
        }
    };

    const filteredLeads = leads.filter(lead => {
        const matchesFilter = filter === 'all' || lead.status === filter;
        const matchesSearch = (lead.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (lead.email?.toLowerCase() || '').includes(searchTerm.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-navy-950">Mes Leads</h1>
                    <p className="text-navy-800 font-bold">Gérez vos contacts et opportunités d'affaires</p>
                </div>
                <div className="flex gap-3">
                    <Button
                        onClick={() => setShowModal(true)}
                        className="bg-navy-900 text-white hover:bg-navy-800 shadow-premium"
                    >
                        <User className="mr-2 h-4 w-4" /> Ajouter un lead manuel
                    </Button>
                </div>
            </div>

            {/* Filters & Search */}
            <Card className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Rechercher un lead..."
                            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent-500 placeholder:text-slate-400 font-medium"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <div className="flex gap-2 w-full md:w-auto overflow-x-auto">
                    <Button
                        size="sm"
                        variant={filter === 'all' ? 'primary' : 'outline'}
                        onClick={() => setFilter('all')}
                    >
                        Tous
                    </Button>
                    <Button
                        size="sm"
                        variant={filter === 'pending' ? 'primary' : 'outline'}
                        className={filter === 'pending' ? 'bg-amber-500 hover:bg-amber-600 border-amber-500' : ''}
                        onClick={() => setFilter('pending')}
                    >
                        En attente
                    </Button>
                    <Button
                        size="sm"
                        variant={filter === 'processed' ? 'primary' : 'outline'}
                        className={filter === 'processed' ? 'bg-accent-500 hover:bg-accent-600 border-accent-500 text-white' : ''}
                        onClick={() => setFilter('processed')}
                    >
                        Traités
                    </Button>
                </div>
            </Card>

            {/* Leads List */}
            <div className="space-y-4">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 text-accent-500 animate-spin mb-4" />
                        <p className="text-navy-700 font-bold text-sm">Chargement des leads...</p>
                    </div>
                ) : filteredLeads.length > 0 ? (
                    filteredLeads.map((lead, index) => (
                        <motion.div
                            key={lead.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            <Card className="p-0 overflow-hidden hover:shadow-lg transition-shadow border border-slate-100">
                                <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">

                                    {/* Avatar & Name */}
                                    <div className="md:col-span-3 flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-brand-50 flex items-center justify-center text-brand-600 font-bold text-lg border border-brand-100 shadow-sm">
                                            {lead.avatar || lead.name?.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-navy-950 text-lg">{lead.name}</h3>
                                            <p className="text-sm text-navy-700 font-bold">{lead.time || 'Récemment'}</p>
                                        </div>
                                    </div>

                                    {/* Contact Info */}
                                    <div className="md:col-span-3 space-y-1">
                                        <div className="flex items-center gap-2 text-sm text-navy-800 font-medium">
                                            <Phone size={14} className="text-navy-400" /> {lead.phone}
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-navy-800 font-medium">
                                            <Mail size={14} className="text-navy-400" /> {lead.email}
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-navy-800 font-medium">
                                            <MapPin size={14} className="text-navy-400" /> {lead.address}
                                        </div>
                                    </div>

                                    {/* Project Details */}
                                    <div className="md:col-span-3">
                                        <span className="inline-block px-3 py-1 bg-accent-50 text-accent-700 rounded-full text-xs font-bold mb-2 uppercase tracking-wide">
                                            {lead.need}
                                        </span>
                                        <p className="text-xs text-navy-700 font-bold">Budget: <span className="font-black text-navy-950">{lead.budget}</span></p>
                                    </div>

                                    {/* Actions & Status */}
                                    <div className="md:col-span-3 flex flex-col md:items-end gap-2">
                                        <div className={cn(
                                            "px-3 py-1 rounded-full text-xs font-medium border text-center w-full md:w-auto",
                                            lead.status === 'pending'
                                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                                : "bg-emerald-50 text-emerald-700 border-emerald-200"
                                        )}>
                                            {lead.call_status || lead.status}
                                        </div>
                                        <div className="flex gap-2 w-full md:w-auto">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="flex-1 md:flex-none"
                                                onClick={() => openDetails(lead)}
                                            >
                                                Détails
                                            </Button>
                                            <Button
                                                size="sm"
                                                className="flex-1 md:flex-none bg-accent-500 hover:bg-accent-600 text-white shadow-sm"
                                                onClick={() => handleCall(lead)}
                                            >
                                                <Phone className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>

                                </div>
                            </Card>
                        </motion.div>
                    ))
                ) : (
                    <div className="text-center py-20 bg-white/50 rounded-3xl border border-dashed border-slate-300">
                        <p className="text-navy-700 font-bold">Aucun lead trouvé.</p>
                    </div>
                )}
            </div>
            {/* Manual Lead Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-900/60 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
                    >
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-navy-900">Ajouter un Lead Manuel</h2>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                                <MoreHorizontal size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleAddLead} className="p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    label="Nom Complet"
                                    required
                                    placeholder="ex: Jean Dupont"
                                    value={newLead.name}
                                    onChange={e => setNewLead({ ...newLead, name: e.target.value })}
                                />
                                <Input
                                    label="Email"
                                    type="email"
                                    required
                                    placeholder="jean@gmail.com"
                                    value={newLead.email}
                                    onChange={e => setNewLead({ ...newLead, email: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    label="Téléphone"
                                    required
                                    placeholder="0612345678"
                                    value={newLead.phone}
                                    onChange={e => setNewLead({ ...newLead, phone: e.target.value })}
                                />
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-slate-700">Secteur</label>
                                    <select
                                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500 font-medium"
                                        required
                                        value={newLead.sector}
                                        onChange={e => setNewLead({ ...newLead, sector: e.target.value })}
                                    >
                                        <option value="">Sélectionner...</option>
                                        <option value="assurance">Assurance</option>
                                        <option value="renovation">Rénovation</option>
                                        <option value="energie">Énergie</option>
                                        <option value="finance">Finance</option>
                                        <option value="garage">Garage</option>
                                        <option value="telecom">Télécoms</option>
                                    </select>
                                </div>
                            </div>
                            <Input
                                label="Adresse / Ville"
                                placeholder="ex: Paris 75001"
                                value={newLead.address}
                                onChange={e => setNewLead({ ...newLead, address: e.target.value })}
                            />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    label="Besoin principal"
                                    placeholder="ex: Assurance Auto"
                                    value={newLead.need}
                                    onChange={e => setNewLead({ ...newLead, need: e.target.value })}
                                />
                                <Input
                                    label="Budget Approx."
                                    placeholder="ex: 1500"
                                    value={newLead.budget}
                                    onChange={e => setNewLead({ ...newLead, budget: e.target.value })}
                                />
                            </div>
                            <div className="pt-4 flex gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => setShowModal(false)}
                                >
                                    Annuler
                                </Button>
                                <Button
                                    type="submit"
                                    className="flex-1 bg-accent-500 hover:bg-accent-600 text-white font-bold"
                                    disabled={submitting}
                                >
                                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Créer le Lead'}
                                </Button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
            {/* Lead Details Modal */}
            {showDetailsModal && selectedLead && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-900/60 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden"
                    >
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <div>
                                <h2 className="text-xl font-bold text-navy-900">{selectedLead.name}</h2>
                                <p className="text-sm text-slate-500">Détails du prospect</p>
                            </div>
                            <div className="flex items-center gap-2">
                                {!editing && (
                                    <button
                                        onClick={startEditing}
                                        className="text-slate-400 hover:text-slate-600 p-2 hover:bg-white rounded-lg transition-colors"
                                        title="Modifier les détails"
                                    >
                                        <Edit size={20} />
                                    </button>
                                )}
                                <button onClick={() => setShowDetailsModal(false)} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-white rounded-lg transition-colors">
                                    <MoreHorizontal size={20} />
                                </button>
                            </div>
                        </div>

                        <div className="p-8 grid md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Informations de contact</h3>
                                    <div className="space-y-3">
                                        {editing ? (
                                            <>
                                                <Input
                                                    label="Téléphone"
                                                    value={editedLead.phone}
                                                    onChange={e => setEditedLead({ ...editedLead, phone: e.target.value })}
                                                />
                                                <Input
                                                    label="Email"
                                                    type="email"
                                                    value={editedLead.email}
                                                    onChange={e => setEditedLead({ ...editedLead, email: e.target.value })}
                                                />
                                                <Input
                                                    label="Adresse"
                                                    value={editedLead.address}
                                                    onChange={e => setEditedLead({ ...editedLead, address: e.target.value })}
                                                />
                                            </>
                                        ) : (
                                            <>
                                                <div className="flex items-center gap-3 text-slate-700">
                                                    <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center text-brand-600">
                                                        <Phone size={16} />
                                                    </div>
                                                    <span>{selectedLead.phone}</span>
                                                </div>
                                                <div className="flex items-center gap-3 text-slate-700">
                                                    <div className="w-8 h-8 rounded-lg bg-accent-50 flex items-center justify-center text-accent-600">
                                                        <Mail size={16} />
                                                    </div>
                                                    <span>{selectedLead.email}</span>
                                                </div>
                                                <div className="flex items-center gap-3 text-slate-700">
                                                    <div className="w-8 h-8 rounded-lg bg-neutral-50 flex items-center justify-center text-neutral-600">
                                                        <MapPin size={16} />
                                                    </div>
                                                    <span>{selectedLead.address}</span>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Statut actuel</h3>
                                    <div className="flex items-center justify-between">
                                        <div className={cn(
                                            "px-3 py-1 rounded-full text-xs font-bold border",
                                            selectedLead.status === 'pending'
                                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                                : "bg-emerald-50 text-emerald-700 border-emerald-200"
                                        )}>
                                            {selectedLead.status === 'pending' ? 'En attente' : 'Traité'}
                                        </div>
                                        {selectedLead.status === 'pending' && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="text-xs py-1"
                                                onClick={() => handleStatusUpdate(selectedLead.id, 'processed')}
                                                disabled={updating}
                                            >
                                                Marquer comme traité
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Besoin & Projet</h3>
                                    <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100">
                                        {editing ? (
                                            <>
                                                <Input
                                                    label="Besoin principal"
                                                    value={editedLead.need}
                                                    onChange={e => setEditedLead({ ...editedLead, need: e.target.value })}
                                                />
                                                <div className="space-y-1">
                                                    <label className="text-sm font-medium text-indigo-700">Secteur</label>
                                                    <select
                                                        className="w-full rounded-lg border border-brand-100 bg-brand-50/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500 font-medium"
                                                        value={editedLead.sector}
                                                        onChange={e => setEditedLead({ ...editedLead, sector: e.target.value })}
                                                    >
                                                        <option value="">Sélectionner...</option>
                                                        <option value="assurance">Assurance</option>
                                                        <option value="renovation">Rénovation</option>
                                                        <option value="energie">Énergie</option>
                                                        <option value="finance">Finance</option>
                                                        <option value="garage">Garage</option>
                                                        <option value="telecom">Télécoms</option>
                                                    </select>
                                                </div>
                                                <Input
                                                    label="Budget estimé"
                                                    value={editedLead.budget}
                                                    onChange={e => setEditedLead({ ...editedLead, budget: e.target.value })}
                                                />
                                            </>
                                        ) : (
                                            <>
                                                <p className="text-indigo-900 font-semibold mb-1">{selectedLead.need}</p>
                                                <div className="flex items-center gap-2 text-sm text-indigo-600/80 mb-3">
                                                    <span className="capitalize">{selectedLead.sector}</span>
                                                </div>
                                                <div className="flex justify-between items-center pt-3 border-t border-indigo-100">
                                                    <span className="text-xs text-indigo-700/60 italic">Budget estimé</span>
                                                    <span className="font-bold text-indigo-900">{selectedLead.budget}</span>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    {editing ? (
                                        <>
                                            <Button
                                                onClick={handleSaveEdit}
                                                className="w-full bg-green-600 hover:bg-green-700 text-white py-6"
                                                disabled={saving}
                                            >
                                                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                                Enregistrer les modifications
                                            </Button>
                                            <Button
                                                variant="outline"
                                                className="w-full"
                                                onClick={cancelEditing}
                                                disabled={saving}
                                            >
                                                Annuler
                                            </Button>
                                        </>
                                    ) : (
                                        <>
                                            <Button
                                                onClick={() => handleCall(selectedLead)}
                                                className="w-full bg-accent-500 hover:bg-accent-600 text-white py-6 shadow-premium font-bold"
                                            >
                                                <Phone className="mr-2 h-5 w-5" /> Appeler maintenant
                                            </Button>
                                            <Button
                                                variant="outline"
                                                className="w-full"
                                                onClick={() => setShowDetailsModal(false)}
                                            >
                                                Fermer
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default LeadsPage;
