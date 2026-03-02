import React, { useState } from 'react';
import { ArtifactType } from '../types';

interface AdditionalInfoFormProps {
    artifactType: ArtifactType;
    onSubmit: (additionalContext: string) => void;
    isLoading: boolean;
    customLabel?: string;
}

const AdditionalInfoForm: React.FC<AdditionalInfoFormProps> = ({ artifactType, onSubmit, isLoading, customLabel }) => {
    const [text, setText] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(text.trim());
    };

    const defaultLabel = "Vou usar todo o contexto que geramos até agora. Se desejar, adicione mais alguma informação ou ajuste (opcional):";

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
             <div className="relative group">
                <label htmlFor="additional-context-input" className="block text-sm font-medium text-gray-300 mb-2 ml-1">
                    {customLabel || defaultLabel}
                </label>
                <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg opacity-20 group-hover:opacity-40 transition duration-500 blur"></div>
                <textarea
                    id="additional-context-input"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder={`Digite aqui...`}
                    rows={6}
                    className="relative w-full p-4 bg-zinc-900/80 backdrop-blur-sm border border-white/10 rounded-lg focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition text-gray-100 placeholder-gray-500 shadow-inner"
                    disabled={isLoading}
                />
            </div>
            
            <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg shadow-orange-900/30 text-sm font-bold text-white bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:from-zinc-700 disabled:to-zinc-800 disabled:text-gray-500 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-[1.02]"
            >
                {isLoading ? 'Gerando...' : `Gerar ${artifactType}`}
            </button>
        </form>
    );
};

export default AdditionalInfoForm;