import React, { useState } from 'react';
import { Shield, Lock, Mail, AlertCircle, LogIn } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useConfig } from '../context/ConfigContext';

const AdminLogin = ({ onLoginSuccess }) => {
    const { config } = useConfig();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState(null);

    const nombreNovio = config?.novios?.novio?.nombre || 'Simón';
    const nombreNovia = config?.novios?.novia?.nombre || 'Emma';

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email.trim() || !password) return;

        setLoading(true);
        setErrorMsg(null);

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email.trim(),
                password,
            });

            if (error) {
                if (error.message?.toLowerCase().includes('invalid login credentials')) {
                    setErrorMsg('Correo o contraseña incorrectos.');
                } else {
                    setErrorMsg(error.message || 'No se pudo iniciar sesión.');
                }
                return;
            }

            if (data?.session && onLoginSuccess) {
                onLoginSuccess(data.session);
            }
        } catch (err) {
            setErrorMsg(err?.message || 'Error de conexión al iniciar sesión.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-body text-gray-800">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 max-w-sm w-full p-7">
                <div className="text-center mb-6">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
                        <Shield size={24} />
                    </div>
                    <h1 className="text-lg font-bold text-gray-900">Panel de Administración</h1>
                    <p className="text-xs text-gray-500 mt-1">
                        Boda {nombreNovio} &amp; {nombreNovia} — Acceso solo para los novios
                    </p>
                </div>

                {errorMsg && (
                    <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
                        <AlertCircle size={15} className="shrink-0 mt-0.5" />
                        <span>{errorMsg}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
                            Correo electrónico
                        </label>
                        <div className="relative">
                            <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="novios@ejemplo.com"
                                autoComplete="email"
                                required
                                className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:border-primary focus:outline-none"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
                            Contraseña
                        </label>
                        <div className="relative">
                            <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                autoComplete="current-password"
                                required
                                className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:border-primary focus:outline-none"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2.5 rounded-lg bg-primary hover:bg-secondary text-white font-bold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                    >
                        <LogIn size={16} />
                        {loading ? 'Ingresando...' : 'Iniciar sesión'}
                    </button>
                </form>

                <div className="mt-5 pt-4 border-t border-gray-100 text-center">
                    <a href="/" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
                        ← Volver a la invitación
                    </a>
                </div>
            </div>
        </div>
    );
};

export default AdminLogin;
