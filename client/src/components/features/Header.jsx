import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Logo } from '../ui/Logo';

const Header = () => {
    const navigate = useNavigate();
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navLinks = [
        { label: 'Comment ça marche', path: '/comment-ca-marche' },
        { label: 'Chercher un prestataire', href: '#demande' },
        { label: 'Mentions légales', href: '#legal' },
    ];

    return (
        <header
            className={cn(
                "fixed top-0 left-0 w-full z-50 transition-all duration-500",
                scrolled
                    ? "bg-white/80 backdrop-blur-xl border-b border-navy-100/50 py-3 shadow-sm"
                    : "bg-transparent py-5"
            )}
        >
            <div className="container mx-auto px-6 lg:px-12 flex items-center justify-between">

                <Logo className="h-9 cursor-pointer" onClick={() => navigate('/')} />

                {/* Desktop Nav */}
                <nav className="hidden lg:flex items-center gap-10">
                    {navLinks.map((link) => (
                        link.path ? (
                            <button
                                key={link.label}
                                onClick={() => navigate(link.path)}
                                className="text-sm font-semibold text-navy-600 hover:text-accent-600 transition-colors"
                            >
                                {link.label}
                            </button>
                        ) : (
                            <a
                                key={link.label}
                                href={link.href}
                                className="text-sm font-semibold text-navy-600 hover:text-accent-600 transition-colors"
                            >
                                {link.label}
                            </a>
                        )
                    ))}
                </nav>

                {/* CTA Desktop */}
                <div className="hidden lg:flex items-center gap-6">
                    <button
                        onClick={() => navigate('/pro/login')}
                        className="text-sm font-bold text-navy-700 hover:text-accent-600 transition-colors"
                    >
                        Connexion
                    </button>
                    <Button
                        size="sm"
                        className="rounded-xl px-6 h-10 font-bold"
                        onClick={() => navigate('/pro')}
                    >
                        Espace Expert
                    </Button>
                </div>

                {/* Mobile Toggle */}
                <button
                    className="lg:hidden p-2.5 rounded-xl bg-white/80 border border-navy-100 text-navy-900 shadow-sm"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                    {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full left-0 w-full bg-white/95 backdrop-blur-2xl border-b border-navy-100 p-8 shadow-xl lg:hidden flex flex-col gap-6"
                    >
                        {navLinks.map((link) => (
                            link.path ? (
                                <button
                                    key={link.label}
                                    onClick={() => {
                                        navigate(link.path);
                                        setMobileMenuOpen(false);
                                    }}
                                    className="text-xl font-bold text-navy-950 text-left"
                                >
                                    {link.label}
                                </button>
                            ) : (
                                <a
                                    key={link.label}
                                    href={link.href}
                                    className="text-xl font-bold text-navy-950"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    {link.label}
                                </a>
                            )
                        ))}
                        <div className="flex flex-col gap-4 pt-6 border-t border-navy-50">
                            <Button
                                variant="outline"
                                className="w-full h-14 rounded-2xl text-lg font-bold"
                                onClick={() => {
                                    navigate('/pro/login');
                                    setMobileMenuOpen(false);
                                }}
                            >
                                Connexion Expert
                            </Button>
                            <Button
                                className="w-full h-14 rounded-2xl text-lg font-bold"
                                onClick={() => {
                                    navigate('/pro');
                                    setMobileMenuOpen(false);
                                }}
                            >
                                Rejoindre le Réseau
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
};

export { Header };
