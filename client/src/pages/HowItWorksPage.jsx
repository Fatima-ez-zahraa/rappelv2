import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    ShieldCheck,
    User,
    Briefcase,
    CheckCircle2,
    Phone,
    Clock,
    Search,
    FileCheck,
    ArrowRight,
    Zap,
    Lock,
    Users
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Header } from '../components/features/Header';
import { useNavigate } from 'react-router-dom';

const HowItWorksPage = () => {
    const navigate = useNavigate();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    const particulierSteps = [
        {
            icon: <Search className="text-accent-600" size={24} />,
            title: "1. Besoin & Qualification",
            description: "Sélectionnez votre catégorie de service et remplissez un formulaire simplifié décrivant votre projet ou votre panne."
        },
        {
            icon: <Clock className="text-amber-600" size={24} />,
            title: "2. Paramétrage de disponibilité",
            description: "Indiquez vos créneaux de disponibilité idéaux pour être rappelé sans être dérangé à des moments inopportuns."
        },
        {
            icon: <FileCheck className="text-brand-600" size={24} />,
            title: "3. Consentement (Opt-in)",
            description: "Validez votre demande avec un consentement explicite, autorisant nos experts partenaires à vous contacter légalement."
        },
        {
            icon: <CheckCircle2 className="text-accent-600" size={24} />,
            title: "4. Suivi simplifié",
            description: "Recevez une confirmation instantanée et attendez l'appel de l'expert, sans multiplier les recherches de votre côté."
        }
    ];

    const proSteps = [
        {
            icon: <Zap className="text-brand-600" size={24} />,
            title: "1. Consultation des opportunités",
            description: "Accédez à un flux de demandes géolocalisées et segmentées. Visualisez le besoin client avant toute décision."
        },
        {
            icon: <Lock className="text-navy-600" size={24} />,
            title: "2. Preuve de consentement",
            description: "Débloquez les coordonnées et recevez un certificat de consentement horodaté, votre bouclier juridique conforme à la loi 2026."
        },
        {
            icon: <Phone className="text-accent-600" size={24} />,
            title: "3. Prise de contact efficace",
            description: "Rappelez le prospect sur son créneau idéal. Un prospect qui vous attend offre un taux de conversion bien supérieur."
        }
    ];

    return (
        <div className="min-h-screen bg-[#D3D3D3] overflow-x-hidden">
            <Header />

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 px-6 lg:px-12 bg-transparent overflow-hidden">
                <div className="absolute top-0 right-0 w-1/3 h-full bg-accent-50/30 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-1/4 h-1/2 bg-brand-50/20 blur-3xl rounded-full translate-y-1/2 -translate-x-1/2" />

                <div className="container mx-auto relative z-10 text-center max-w-4xl">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-navy-50 text-navy-700 text-sm font-bold mb-6 border border-navy-100">

                        </div>
                        <h1 className="text-5xl lg:text-6xl font-display font-bold text-navy-950 tracking-tight leading-tight mb-6">
                            Mise en relation de <span className="text-accent-600">confiance</span>
                        </h1>
                        <p className="text-xl text-navy-700 font-medium leading-relaxed mb-10">
                            Rappelez-moi redéfinit le contact direct. Alors que le démarchage intrusif s'arrête, nous créons le pont légal et respectueux entre vos besoins et les experts qualifiés.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Particuliers Section */}
            <section className="py-24 px-6 lg:px-12 relative">
                <div className="container mx-auto">
                    <div className="flex flex-col lg:flex-row items-center gap-16">
                        <motion.div
                            className="lg:w-1/2"
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            variants={containerVariants}
                        >
                            <div className="flex items-center gap-3 text-accent-600 font-bold mb-4">
                                <User className="p-1 bg-accent-100 rounded-lg" size={28} />
                                <span className="uppercase tracking-widest text-sm">Le Parcours Particulier</span>
                            </div>
                            <h2 className="text-4xl font-bold text-navy-950 mb-8 leading-tight">
                                Reprenez le contrôle sur vos <span className="bg-gradient-to-r from-accent-600 to-accent-400 bg-clip-text text-transparent">communications</span>
                            </h2>

                            <div className="space-y-8">
                                {particulierSteps.map((step, index) => (
                                    <motion.div key={index} variants={itemVariants} className="flex gap-5 group">
                                        <div className="shrink-0 w-12 h-12 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center group-hover:shadow-md transition-all duration-300">
                                            {step.icon}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-navy-950 mb-1">{step.title}</h3>
                                            <p className="text-navy-600 font-medium leading-relaxed">{step.description}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>

                        <motion.div
                            className="lg:w-1/2 relative"
                            initial={{ opacity: 0, x: 50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                        >
                            <div className="relative p-8 rounded-3xl bg-white shadow-2xl border border-slate-100">
                                <div className="absolute -top-6 -right-6 w-24 h-24 bg-accent-500 rounded-full flex items-center justify-center text-white shadow-xl animate-bounce-slow">
                                    <span className="font-black text-xs uppercase tracking-tighter">100% Gratuit</span>
                                </div>
                                <div className="space-y-6">
                                    <div className="h-4 w-1/3 bg-slate-100 rounded-full" />
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="h-20 bg-accent-50 rounded-2xl border border-accent-100" />
                                        <div className="h-20 bg-brand-50 rounded-2xl border border-brand-100" />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Professionals Section */}
            <section className="py-24 px-6 lg:px-12 bg-navy-950 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-1/2 h-full bg-brand-500/10 blur-[120px] rounded-full translate-x-1/3" />

                <div className="container mx-auto relative z-10">
                    <div className="flex flex-col lg:flex-row-reverse items-center gap-16">
                        <motion.div
                            className="lg:w-1/2"
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            variants={containerVariants}
                        >
                            <div className="flex items-center gap-3 text-brand-400 font-bold mb-4">
                                <Briefcase className="p-1 bg-brand-900 rounded-lg text-brand-400" size={28} />
                                <span className="uppercase tracking-widest text-sm">Le Parcours Professionnel</span>
                            </div>
                            <h2 className="text-4xl font-bold mb-8 leading-tight">
                                Transformez votre <span className="text-brand-400">prospection</span> en service client
                            </h2>

                            <div className="space-y-8">
                                {proSteps.map((step, index) => (
                                    <motion.div key={index} variants={itemVariants} className="flex gap-5 group">
                                        <div className="shrink-0 w-12 h-12 rounded-2xl bg-navy-900 border border-navy-800 shadow-sm flex items-center justify-center group-hover:border-brand-500/50 transition-all duration-300">
                                            {step.icon}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-white mb-1">{step.title}</h3>
                                            <p className="text-navy-300 font-medium leading-relaxed">{step.description}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>

                    </div>
                </div>
            </section>

            {/* Benefits Grid */}
            <section className="py-24 px-6 lg:px-12 relative">
                <div className="container mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-navy-950 mb-4">Pourquoi choisir Rappelez-moi ?</h2>
                        <p className="text-navy-600 font-medium max-w-2xl mx-auto">Une solution gagnant-gagnant qui place le respect et l'efficacité au cœur de l'échange.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Benefits Particuliers */}
                        <motion.div
                            className="p-10 rounded-3xl bg-white/50 backdrop-blur-sm border border-white/20 hover:shadow-xl transition-all duration-500"
                            whileHover={{ y: -5 }}
                        >
                            <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-6">
                                <Users className="text-accent-600" />
                            </div>
                            <h3 className="text-2xl font-bold text-navy-950 mb-4 text-center">Pour vous, Particulier</h3>
                            <ul className="space-y-4">
                                <li className="flex items-start gap-3 text-navy-700 font-medium">
                                    <CheckCircle2 className="text-accent-500 mt-1 shrink-0" size={18} />
                                    <span>Fin des appels intrusifs et indésirables</span>
                                </li>
                                <li className="flex items-start gap-3 text-navy-700 font-medium">
                                    <CheckCircle2 className="text-accent-500 mt-1 shrink-0" size={18} />
                                    <span>Gain de temps : plus besoin de chercher pendant des heures</span>
                                </li>
                                <li className="flex items-start gap-3 text-navy-700 font-medium">
                                    <CheckCircle2 className="text-accent-500 mt-1 shrink-0" size={18} />
                                    <span>Sécurité totale contre les arnaques téléphoniques</span>
                                </li>
                                <li className="flex items-start gap-3 text-navy-700 font-medium">
                                    <CheckCircle2 className="text-accent-500 mt-1 shrink-0" size={18} />
                                    <span>Service 100% gratuit et sans engagement</span>
                                </li>
                            </ul>
                        </motion.div>

                        {/* Benefits Professionals */}
                        <motion.div
                            className="p-10 rounded-3xl bg-white/50 backdrop-blur-sm border border-white/20 hover:shadow-xl transition-all duration-500"
                            whileHover={{ y: -5 }}
                        >
                            <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-6">
                                <Briefcase className="text-brand-600" />
                            </div>
                            <h3 className="text-2xl font-bold text-navy-950 mb-4 text-center">Pour vous, Professionnel</h3>
                            <ul className="space-y-4">
                                <li className="flex items-start gap-3 text-navy-700 font-medium">
                                    <CheckCircle2 className="text-brand-500 mt-1 shrink-0" size={18} />
                                    <span>Bouclier juridique complet face à la loi 2026</span>
                                </li>
                                <li className="flex items-start gap-3 text-navy-700 font-medium">
                                    <CheckCircle2 className="text-brand-500 mt-1 shrink-0" size={18} />
                                    <span>Prospection sur "prospects chauds" uniquement</span>
                                </li>
                                <li className="flex items-start gap-3 text-navy-700 font-medium">
                                    <CheckCircle2 className="text-brand-500 mt-1 shrink-0" size={18} />
                                    <span>Taux de conversion supérieur : le client vous attend</span>
                                </li>
                                <li className="flex items-start gap-3 text-navy-700 font-medium">
                                    <CheckCircle2 className="text-brand-500 mt-1 shrink-0" size={18} />
                                    <span>Valorisation de votre image de marque respectueuse</span>
                                </li>
                            </ul>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 px-6 lg:px-12 relative">
                <div className="container mx-auto">
                    <div className="p-12 lg:p-20 rounded-[40px] bg-gradient-to-br from-navy-900 to-navy-950 text-white text-center relative overflow-hidden shadow-2xl">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-accent-500/10 blur-[100px]" />
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-500/10 blur-[100px]" />

                        <div className="relative z-10 max-w-2xl mx-auto">
                            <h2 className="text-4xl lg:text-5xl font-bold mb-8 tracking-tight">Prêt à changer votre façon de communiquer ?</h2>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                                <Button
                                    size="lg"
                                    className="w-full sm:w-auto px-10 h-16 rounded-2xl text-lg font-bold bg-accent-500 hover:bg-accent-600 text-white border-none"
                                    onClick={() => navigate('/')}
                                >
                                    Faire une demande <ArrowRight className="ml-2" />
                                </Button>
                                <Button
                                    size="lg"
                                    variant="outline"
                                    className="w-full sm:w-auto px-10 h-16 rounded-2xl text-lg font-bold border-navy-700 text-white hover:bg-navy-800"
                                    onClick={() => navigate('/pro')}
                                >
                                    Espace Professionnel
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default HowItWorksPage;
