import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuth } from '../context/useAuth';
import { api } from '../lib/api';
import { User, Building2, Shield, CreditCard, Loader2, CheckCircle } from 'lucide-react';

const SettingsPage = () => {
    const { user: authUser, refreshUser } = useAuth();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const data = await api.auth.getProfile();
                setProfile(data.user || data);
            } catch (error) {
                console.error('Error fetching profile:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const handleChange = (field, value) => {
        setProfile(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            // Send only editable fields or everything
            const { id, email, role, subscription_status, created_at, updated_at, ...editableData } = profile;
            await api.auth.updateProfile(editableData);
            await refreshUser();
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
        } catch (error) {
            alert("Erreur lors de la mise à jour du profil.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-accent-500 animate-spin mb-4" />
                <p className="text-slate-500">Chargement de votre profil...</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-navy-900">Paramètres</h1>
                    <p className="text-slate-500">Gérez vos informations et votre abonnement</p>
                </div>
                <Button
                    onClick={handleSave}
                    isLoading={saving}
                    className="bg-accent-500 text-white hover:bg-accent-600 shadow-premium font-bold"
                >
                    Enregistrer les modifications
                </Button>
            </header>

            {showSuccess && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl flex items-center justify-center animate-fade-in">
                    <CheckCircle className="mr-2 h-4 w-4" /> Profil mis à jour avec succès !
                </div>
            )}

            <div className="grid md:grid-cols-3 gap-8">
                {/* Personal Info */}
                <div className="md:col-span-2 space-y-6">
                    <Card className="p-6">
                        <div className="flex items-center gap-3 mb-6 pb-4 border-b">
                            <User className="text-brand-600" size={24} />
                            <h2 className="text-xl font-bold text-navy-900">Informations Personnelles</h2>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <Input label="Prénom" value={profile?.first_name || ''} onChange={e => handleChange('first_name', e.target.value)} />
                            <Input label="Nom" value={profile?.last_name || ''} onChange={e => handleChange('last_name', e.target.value)} />
                            <Input label="Email" value={profile?.email || ''} className="col-span-2 opacity-50" readOnly />
                            <Input label="Téléphone" value={profile?.phone || ''} className="col-span-2" onChange={e => handleChange('phone', e.target.value)} />
                        </div>
                    </Card>

                    <Card className="p-6">
                        <div className="flex items-center gap-3 mb-6 pb-4 border-b">
                            <Building2 className="text-brand-600" size={24} />
                            <h2 className="text-xl font-bold text-navy-900">Informations Entreprise</h2>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <Input label="Raison Sociale" value={profile?.company_name || ''} className="col-span-2" onChange={e => handleChange('company_name', e.target.value)} />
                            <Input label="SIRET" value={profile?.siret || ''} onChange={e => handleChange('siret', e.target.value)} />
                            <Input label="Forme Juridique" value={profile?.legal_form?.toUpperCase() || ''} onChange={e => handleChange('legal_form', e.target.value)} />
                            <Input label="Adresse" value={profile?.address || ''} className="col-span-2" onChange={e => handleChange('address', e.target.value)} />
                            <div className="grid grid-cols-2 gap-4 col-span-2">
                                <Input label="Code Postal" value={profile?.zip || ''} onChange={e => handleChange('zip', e.target.value)} />
                                <Input label="Ville" value={profile?.city || ''} onChange={e => handleChange('city', e.target.value)} />
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Account Status / Plan */}
                <div className="space-y-6">
                    <Card className="p-6 bg-navy-900 text-white border-none overflow-hidden relative">
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-4 text-white/80">
                                <Shield size={20} />
                                <h2 className="font-bold">Statut du Compte</h2>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-navy-300 text-xs uppercase font-bold tracking-wider mb-1">Rôle</p>
                                    <p className="text-lg font-semibold capitalize">{profile?.role}</p>
                                </div>
                                <div>
                                    <p className="text-navy-300 text-xs uppercase font-bold tracking-wider mb-1">Abonnement</p>
                                    <div className="flex items-center gap-2">
                                        <span className={`w-2 h-2 rounded-full ${profile?.subscription_status === 'active' ? 'bg-accent-400' : 'bg-slate-400'}`} />
                                        <p className="text-lg font-semibold">{profile?.subscription_status === 'active' ? 'Professionnel' : 'Inactif'}</p>
                                    </div>
                                </div>
                                {profile?.subscription_status !== 'active' && (
                                    <Button
                                        onClick={() => window.location.href = '/pro/pricing'}
                                        className="w-full bg-white text-navy-900 hover:bg-slate-100 mt-2"
                                    >
                                        Passer en Pro
                                    </Button>
                                )}
                            </div>
                        </div>
                        <div className="absolute -bottom-4 -right-4 opacity-10">
                            <Shield size={120} />
                        </div>
                    </Card>

                    <Card className="p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <CreditCard className="text-accent-600" size={20} />
                            <h2 className="font-bold text-navy-900">Paiement</h2>
                        </div>
                        <p className="text-sm text-slate-500 mb-4">Gérez vos factures et vos moyens de paiement.</p>
                        <Button
                            onClick={() => alert('Portail de paiement en développement - Contactez le support pour gérer vos factures')}
                            variant="outline"
                            className="w-full"
                        >
                            Accéder au portail
                        </Button>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;
