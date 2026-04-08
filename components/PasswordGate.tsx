
import React, { useState, useEffect } from 'react';
import { LockClosedIcon } from './Icons';

interface PasswordGateProps {
    onAuthenticated: () => void;
}

const PasswordGate: React.FC<PasswordGateProps> = ({ onAuthenticated }) => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === 'PPGEGC2026' || password === 'ppgegc2026') {
            localStorage.setItem('app_authenticated', 'true');
            onAuthenticated();
        } else {
            setError(true);
            setPassword('');
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950 p-4">
            <div className="w-full max-w-md bg-zinc-900 border border-white/10 rounded-3xl p-8 shadow-2xl">
                <div className="flex flex-col items-center text-center space-y-6">
                    <div className="w-16 h-16 bg-orange-500/10 rounded-2xl flex items-center justify-center text-orange-500 border border-orange-500/20">
                        <LockClosedIcon />
                    </div>
                    
                    <div>
                        <h2 className="text-2xl font-bold text-white">Acesso Restrito</h2>
                        <p className="text-gray-400 mt-2">Por favor, insira a senha para acessar o sistema.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="w-full space-y-4">
                        <div className="relative">
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    setError(false);
                                }}
                                placeholder="Digite a senha..."
                                className={`w-full bg-zinc-800 border ${error ? 'border-rose-500' : 'border-white/10'} rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all`}
                                autoFocus
                            />
                            {error && (
                                <p className="text-rose-500 text-xs mt-2 text-left ml-1">Senha incorreta. Tente novamente.</p>
                            )}
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-orange-900/20"
                        >
                            Entrar no Sistema
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default PasswordGate;
