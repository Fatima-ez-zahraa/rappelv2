import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { Logo } from '../components/ui/Logo';
import { Check, ChevronRight, ChevronLeft, Building2, User, Hammer, ShieldCheck, ArrowLeft, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { api } from '../lib/api';

// Default fallback legal forms - moved outside component to avoid recreation
const DEFAULT_LEGAL_FORMS = [
    { code: '5710', libelle: 'SAS' },
    { code: '5720', libelle: 'SASU' },
    { code: '5499', libelle: 'SARL' },
    { code: '1000', libelle: 'EI' },
    { code: '5485', libelle: 'SA' },
    { code: '5305', libelle: 'EURL' },
    { code: '5510', libelle: 'SCA' },
    { code: '5530', libelle: 'SC' },
    { code: '5545', libelle: 'SCP' },
    { code: '6000', libelle: 'SCI' },
    { code: '6110', libelle: 'SELARL' },
    { code: '6120', libelle: 'SELAFA' },
    { code: '6130', libelle: 'SELAS' },
    { code: '5200', libelle: 'Micro-entreprise' },
    { code: '4510', libelle: 'GIE' },
    { code: '4540', libelle: 'GEIE' }
];

const steps = [
    { number: 1, title: 'Entreprise', icon: Building2 },
    { number: 2, title: 'Contact', icon: User },
    { number: 3, title: 'Activité', icon: Hammer },
];

const ProviderSignupWizard = () => {
    const navigate = useNavigate();
    const { signup } = useAuth();
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [siretLoading, setSiretLoading] = useState(false);
    const [legalForms, setLegalForms] = useState(DEFAULT_LEGAL_FORMS);
    const [formData, setFormData] = useState({
        // Step 1
        siret: '', siren: '', companyName: '', legalForm: '', creationYear: '', address: '', zip: '', city: '',
        // Step 2
        lastName: '', firstName: '', function: '', email: '', phone: '', password: '', confirmPassword: '',
        // Step 3
        sectors: [], description: '', zone: '', certifications: '',
    });

    // Fetch legal forms on mount
    useEffect(() => {
        const fetchLegalForms = async () => {
            try {
                const data = await api.company.getLegalForms();
                const apiForms = data.cj || [];

                // Merge with defaults, ensuring no duplicates based on code
                setLegalForms(prev => {
                    const combined = [...prev];
                    apiForms.forEach(apiForm => {
                        if (!combined.some(f => f.code === apiForm.code)) {
                            combined.push(apiForm);
                        }
                    });
                    // Sort alphabetically by libelle
                    return combined.sort((a, b) => a.libelle.localeCompare(b.libelle));
                });
            } catch (err) {
                console.error('Failed to fetch legal forms:', err);
                // Fallback is already DEFAULT_LEGAL_FORMS from initial state
            }
        };
        fetchLegalForms();
    }, []);

    // SIRET/SIREN lookup with debouncing
    useEffect(() => {
        const input = formData.siret?.replace(/\s/g, '');
        if (input && (input.length === 9 || input.length === 14)) {
            const timer = setTimeout(async () => {
                setSiretLoading(true);
                setError('');
                try {
                    const data = await api.company.lookupSiret(input);
                    // Auto-fill the form fields
                    setFormData(prev => ({
                        ...prev,
                        companyName: data.nomen_long || prev.companyName,
                        creationYear: data.dcren || prev.creationYear,
                        zip: data.codpos || prev.zip,
                        address: data.geo_adresse || prev.address,
                        city: data.ville || prev.city,
                        legalForm: data.cj || prev.legalForm,
                        siren: data.siren || prev.siren,
                        siret: data.siret || prev.siret
                    }));
                } catch (err) {
                    setError(err.message || 'Impossible de récupérer les informations de l\'entreprise');
                } finally {
                    setSiretLoading(false);
                }
            }, 800);
            return () => clearTimeout(timer);
        }
    }, [formData.siret]);

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (error) setError('');
    };

    const handleSectorToggle = (sector) => {
        setFormData(prev => {
            const sectors = prev.sectors.includes(sector)
                ? prev.sectors.filter(s => s !== sector)
                : [...prev.sectors, sector];
            return { ...prev, sectors };
        });
        if (error) setError('');
    };

    const validateStep = (step) => {
        const requiredFields = {
            1: ['siret', 'companyName', 'legalForm', 'creationYear', 'address', 'zip', 'city'],
            2: ['lastName', 'firstName', 'email', 'phone', 'password', 'confirmPassword'],
            3: ['description', 'zone']
        };

        const missing = requiredFields[step].filter(field => !formData[field] || (Array.isArray(formData[field]) && formData[field].length === 0));

        if (step === 2 && formData.password !== formData.confirmPassword) {
            setError("Les mots de passe ne correspondent pas.");
            return false;
        }

        if (step === 3 && formData.sectors.length === 0) {
            setError("Veuillez sélectionner au moins un secteur d'activité.");
            return false;
        }

        if (missing.length > 0) {
            setError("Veuillez remplir tous les champs obligatoires.");
            return false;
        }

        return true;
    };

    const nextStep = () => {
        if (validateStep(currentStep)) {
            setCurrentStep(prev => Math.min(prev + 1, 3));
            setError('');
        }
    };
    const prevStep = () => {
        setCurrentStep(prev => Math.max(prev - 1, 1));
        setError('');
    };

    const handleSubmit = async () => {
        if (!validateStep(3)) return;

        setLoading(true);
        setError('');
        try {
            await signup(formData);
            navigate('/pro/verify');
        } catch (err) {
            setError(err.message || "Une erreur est survenue lors de l'inscription.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-transparent flex items-center justify-center p-4 py-20 font-sans relative overflow-hidden">
            <button
                onClick={() => navigate('/pro')}
                className="absolute top-8 left-8 flex items-center gap-2 text-navy-500 hover:text-navy-900 font-bold transition-all z-20 group"
            >
                <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                Retour
            </button>

            {/* Background elements */}
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,_rgba(124,203,99,0.05),transparent_50%)]" />

            <Card className="w-full max-w-4xl min-h-[600px] flex flex-col shadow-2xl overflow-hidden border-white/60 bg-white/40 backdrop-blur-3xl rounded-[3rem] z-10">

                {/* Header / Progress Bar */}
                <div className="bg-white/50 border-b border-navy-100/50 p-8 md:p-10">
                    <Logo className="justify-center scale-110 mb-8" />
                    <div className="flex justify-between items-end mb-10">
                        <div className="space-y-1">
                            <h1 className="text-3xl font-display font-bold text-navy-950">Devenir Partenaire</h1>
                            <p className="text-navy-500 font-medium">Rejoignez le réseau leader de la mise en relation.</p>
                        </div>
                        <div className="text-sm font-bold text-navy-400 uppercase tracking-widest">Étape {currentStep} / {steps.length}</div>
                    </div>

                    {/* Stepper Visual */}
                    <div className="relative flex justify-between items-center px-4 md:px-20">
                        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-navy-100 -z-0 -translate-y-1/2" />
                        <div
                            className="absolute top-1/2 left-0 h-0.5 bg-accent-500 transition-all duration-700 ease-in-out -z-0 -translate-y-1/2"
                            style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
                        />

                        {steps.map((step) => (
                            <div key={step.number} className="relative z-10 flex flex-col items-center gap-3">
                                <motion.div
                                    animate={{
                                        scale: step.number === currentStep ? 1.1 : 1,
                                        backgroundColor: step.number <= currentStep ? '#7CCB63' : '#FFFFFF'
                                    }}
                                    className={cn(
                                        "w-12 h-12 rounded-2xl flex items-center justify-center font-bold transition-all duration-300 border-2 shadow-sm",
                                        step.number <= currentStep
                                            ? "text-white border-accent-500 shadow-accent-200"
                                            : "text-navy-300 border-navy-100"
                                    )}
                                >
                                    {step.number < currentStep ? <Check size={22} /> : <step.icon size={22} />}
                                </motion.div>
                                <span className={cn(
                                    "text-xs font-bold uppercase tracking-[0.15em] hidden md:block",
                                    step.number <= currentStep ? "text-accent-600" : "text-navy-300"
                                )}>
                                    {step.title}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 p-8 md:p-12 bg-transparent relative overflow-hidden">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentStep}
                            initial={{ x: 30, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -30, opacity: 0 }}
                            transition={{ duration: 0.4, ease: "easeOut" }}
                            className="h-full flex flex-col"
                        >
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="mb-8 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 font-bold"
                                >
                                    <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                                    {error}
                                </motion.div>
                            )}

                            {/* STEP 1: ENTREPRISE */}
                            {currentStep === 1 && (
                                <div className="space-y-8 max-w-2xl mx-auto w-full">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="relative">
                                            <Input
                                                label="SIRET ou SIREN"
                                                placeholder="14 ou 9 chiffres"
                                                value={formData.siret}
                                                onChange={(e) => handleChange('siret', e.target.value)}
                                                className="h-14 rounded-2xl"
                                            />
                                            {siretLoading && (
                                                <div className="absolute right-4 top-[42px] transform">
                                                    <Loader2 className="h-5 w-5 animate-spin text-accent-500" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <label className="text-sm font-bold text-navy-800 ml-1">Forme Juridique</label>
                                            <select
                                                className="flex h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-navy-900 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent transition-all shadow-sm"
                                                value={formData.legalForm}
                                                onChange={(e) => handleChange('legalForm', e.target.value)}
                                            >
                                                <option value="">Sélectionner...</option>
                                                {legalForms.map((form) => (
                                                    <option key={form.code} value={form.code}>
                                                        {form.libelle}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <Input label="Raison Sociale" placeholder="Nom de votre société" value={formData.companyName} onChange={(e) => handleChange('companyName', e.target.value)} className="h-14 rounded-2xl" />
                                    <div className="grid grid-cols-2 gap-6">
                                        <Input label="Année de création" placeholder="2020" type="number" value={formData.creationYear} onChange={(e) => handleChange('creationYear', e.target.value)} className="h-14 rounded-2xl" />
                                        <Input label="Code Postal" placeholder="75001" value={formData.zip} onChange={(e) => handleChange('zip', e.target.value)} className="h-14 rounded-2xl" />
                                    </div>
                                    <Input label="Adresse du siège" placeholder="123 Avenue de la République" value={formData.address} onChange={(e) => handleChange('address', e.target.value)} className="h-14 rounded-2xl" />
                                    <Input label="Ville" placeholder="Paris" value={formData.city} onChange={(e) => handleChange('city', e.target.value)} className="h-14 rounded-2xl" />
                                </div>
                            )}

                            {/* STEP 2: CONTACT & SECURITY */}
                            {currentStep === 2 && (
                                <div className="space-y-8 max-w-2xl mx-auto w-full">
                                    <div className="grid grid-cols-2 gap-6">
                                        <Input label="Nom" placeholder="Dupont" value={formData.lastName} onChange={(e) => handleChange('lastName', e.target.value)} className="h-14 rounded-2xl" />
                                        <Input label="Prénom" placeholder="Jean" value={formData.firstName} onChange={(e) => handleChange('firstName', e.target.value)} className="h-14 rounded-2xl" />
                                    </div>
                                    <Input label="Fonction" placeholder="Gérant" value={formData.function} onChange={(e) => handleChange('function', e.target.value)} className="h-14 rounded-2xl" />
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <Input type="email" label="Email Professionnel" placeholder="jean@entreprise.com" value={formData.email} onChange={(e) => handleChange('email', e.target.value)} className="h-14 rounded-2xl" />
                                        <Input type="tel" label="Téléphone Mobile" placeholder="06 12 34 56 78" value={formData.phone} onChange={(e) => handleChange('phone', e.target.value)} className="h-14 rounded-2xl" />
                                    </div>
                                    <div className="p-6 bg-accent-50/50 border border-accent-100 rounded-3xl space-y-6">
                                        <div className="flex items-center gap-3 text-accent-700 font-bold border-b border-accent-100 pb-4 uppercase tracking-widest text-xs">
                                            <ShieldCheck size={18} /> Sécurisez votre accès
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <Input type="password" label="Mot de passe" placeholder="••••••••" value={formData.password} onChange={(e) => handleChange('password', e.target.value)} className="h-14 rounded-2xl" />
                                            <Input type="password" label="Confirmer" placeholder="••••••••" value={formData.confirmPassword} onChange={(e) => handleChange('confirmPassword', e.target.value)} className="h-14 rounded-2xl" />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* STEP 3: ACTIVITY */}
                            {currentStep === 3 && (
                                <div className="space-y-8 max-w-2xl mx-auto w-full">
                                    <div className="space-y-4">
                                        <label className="text-sm font-bold text-navy-800 ml-1 uppercase tracking-widest">Secteurs d'activité</label>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                            {[
                                                { id: 'assurance', label: 'Assurance' },
                                                { id: 'renovation', label: 'Rénovation' },
                                                { id: 'energie', label: 'Énergie' },
                                                { id: 'finance', label: 'Finance' },
                                                { id: 'garage', label: 'Garage' },
                                                { id: 'telecom', label: 'Télécoms' }
                                            ].map(s => (
                                                <div
                                                    key={s.id}
                                                    onClick={() => handleSectorToggle(s.id)}
                                                    className={cn(
                                                        "cursor-pointer p-4 rounded-2xl border-2 text-sm font-bold transition-all flex items-center gap-3",
                                                        formData.sectors.includes(s.id)
                                                            ? "bg-accent-500 border-accent-500 text-white shadow-lg shadow-accent-200"
                                                            : "bg-white border-navy-50 text-navy-600 hover:border-accent-200"
                                                    )}
                                                >
                                                    <div className={cn("w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-colors", formData.sectors.includes(s.id) ? "border-white bg-white" : "border-navy-200 bg-white")}>
                                                        {formData.sectors.includes(s.id) && <Check className="text-accent-600 w-3 h-3 stroke-[4]" />}
                                                    </div>
                                                    {s.label}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-navy-800 ml-1 uppercase tracking-widest">Description des services</label>
                                        <textarea
                                            className="flex min-h-[120px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-navy-950 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent transition-all shadow-sm resize-none"
                                            placeholder="Décrivez brièvement vos services et votre expertise..."
                                            value={formData.description}
                                            onChange={(e) => handleChange('description', e.target.value)}
                                        />
                                    </div>

                                    <Input label="Zone d'intervention" placeholder="Départements ou Régions (ex: Île-de-France, 75, 92)" value={formData.zone} onChange={(e) => handleChange('zone', e.target.value)} className="h-14 rounded-2xl" />
                                    <Input label="Certifications / Agréments" placeholder="RGE, Qualibat, ORIAS..." value={formData.certifications} onChange={(e) => handleChange('certifications', e.target.value)} className="h-14 rounded-2xl" />
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Footer / Actions */}
                <div className="bg-white/50 border-t border-navy-100/50 p-8 flex justify-between items-center">
                    <Button
                        variant="ghost"
                        onClick={prevStep}
                        disabled={currentStep === 1 || loading}
                        className={cn("text-navy-500 font-bold", currentStep === 1 && "invisible")}
                    >
                        <ChevronLeft className="mr-2 w-5 h-5" /> Précédent
                    </Button>

                    <Button
                        onClick={currentStep < 3 ? nextStep : handleSubmit}
                        isLoading={loading}
                        showShine
                        className="bg-navy-900 hover:bg-navy-800 px-10 h-14 rounded-2xl font-bold shadow-premium"
                    >
                        {currentStep < 3 ? (
                            <>Continuer <ChevronRight className="ml-2 w-5 h-5" /></>
                        ) : (
                            <>Activer mon profil <Check className="ml-2 w-5 h-5" /></>
                        )}
                    </Button>
                </div>
            </Card >
        </div >
    );
};

export default ProviderSignupWizard;
