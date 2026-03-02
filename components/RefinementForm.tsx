
import React, { useState } from 'react';
import { Send } from './Icons';

interface RefinementFormProps {
    onRefine: (suggestions: string) => void;
    onAccept: () => void;
    isLoading?: boolean;
}

const RefinementForm: React.FC<RefinementFormProps> = ({ onRefine, onAccept, isLoading }) => {
    const [suggestions, setSuggestions] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (suggestions.trim()) {
            onRefine(suggestions);
            setSuggestions('');
        }
    };

    return (
        <div className="mt-6 p-6 bg-zinc-900/60 backdrop-blur-md rounded-2xl border border-white/10 shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="text-lg font-semibold text-white mb-2">O que achou do resultado?</h3>
            <p className="text-sm text-gray-400 mb-4">
                Você pode baixar o arquivo acima ou, se desejar, descreva abaixo o que gostaria de alterar ou melhorar neste artefato.
            </p>
            
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                    <textarea
                        value={suggestions}
                        onChange={(e) => setSuggestions(e.target.value)}
                        placeholder="Ex: 'Adicione mais detalhes sobre a persona X' ou 'Torne os requisitos mais técnicos'..."
                        className="w-full bg-zinc-950/50 border border-white/10 rounded-xl p-4 text-gray-200 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500/50 min-h-[100px] resize-none transition-all"
                        disabled={isLoading}
                    />
                </div>
                
                <div className="flex flex-wrap gap-3">
                    <button
                        type="submit"
                        disabled={isLoading || !suggestions.trim()}
                        className="flex-1 sm:flex-none px-6 py-2.5 bg-orange-600 hover:bg-orange-500 disabled:bg-zinc-800 disabled:text-gray-600 text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2 border border-white/10"
                    >
                        {isLoading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <Send className="w-4 h-4" />
                                Refinar Artefato
                            </>
                        )}
                    </button>
                    
                    <button
                        type="button"
                        onClick={onAccept}
                        disabled={isLoading}
                        className="flex-1 sm:flex-none px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-gray-300 rounded-xl font-medium transition-all border border-white/5"
                    >
                        Gostei, continuar
                    </button>
                </div>
            </form>
        </div>
    );
};

export default RefinementForm;
