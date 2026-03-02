
import React, { useState } from 'react';

interface SetupFormProps {
    onSubmit: (context: string) => void;
    isLoading: boolean;
}

const SetupForm: React.FC<SetupFormProps> = ({ onSubmit, isLoading }) => {
    const [formData, setFormData] = useState({
        title: '',
        objective: '',
        stakeholders: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const combinedContext = `
# PROJETO: ${formData.title}
## OBJETIVO E DOR:
${formData.objective}
## STAKEHOLDERS E USUÁRIOS-CHAVE:
${formData.stakeholders}
        `.trim();
        onSubmit(combinedContext);
    };

    const isInvalid = !formData.title || !formData.objective || !formData.stakeholders;

    return (
        <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
            <div className="space-y-4">
                <div className="relative group">
                    <label className="block text-xs font-bold text-orange-400 uppercase tracking-wider mb-2 ml-1">
                        Título Provisório do Projeto
                    </label>
                    <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        placeholder="Ex: Novo App de Logística"
                        className="w-full p-4 bg-zinc-900/80 border border-white/10 rounded-xl focus:ring-2 focus:ring-orange-500/50 outline-none text-gray-100 placeholder-gray-600 transition"
                        disabled={isLoading}
                    />
                </div>

                <div className="relative group">
                    <label className="block text-xs font-bold text-orange-400 uppercase tracking-wider mb-2 ml-1">
                        Qual o Objetivo do Projeto? (qual dor ele vai sanar)
                    </label>
                    <textarea
                        name="objective"
                        value={formData.objective}
                        onChange={handleChange}
                        placeholder="Descreva o problema principal..."
                        rows={3}
                        className="w-full p-4 bg-zinc-900/80 border border-white/10 rounded-xl focus:ring-2 focus:ring-orange-500/50 outline-none text-gray-100 placeholder-gray-600 transition resize-none"
                        disabled={isLoading}
                    />
                </div>

                <div className="relative group">
                    <label className="block text-xs font-bold text-orange-400 uppercase tracking-wider mb-2 ml-1">
                        Quem são os usuários-chave? (quem são os stakeholders)
                    </label>
                    <textarea
                        name="stakeholders"
                        value={formData.stakeholders}
                        onChange={handleChange}
                        placeholder="Ex: Gestores de frotas, motoristas..."
                        rows={2}
                        className="w-full p-4 bg-zinc-900/80 border border-white/10 rounded-xl focus:ring-2 focus:ring-orange-500/50 outline-none text-gray-100 placeholder-gray-600 transition resize-none"
                        disabled={isLoading}
                    />
                </div>
            </div>

            <button
                type="submit"
                disabled={isLoading || isInvalid}
                className="w-full flex justify-center py-4 px-4 border border-transparent rounded-xl shadow-lg text-sm font-bold text-white bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-[1.01]"
            >
                {isLoading ? 'Configurando...' : 'Finalizar Setup Inicial'}
            </button>
        </form>
    );
};

export default SetupForm;
