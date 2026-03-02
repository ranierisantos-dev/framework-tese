
import React, { useState } from 'react';
import { UploadIcon } from './Icons';

interface KnowledgeUploadProps {
    onUpload: (file: File) => void;
    isLoading: boolean;
}

const KnowledgeUpload: React.FC<KnowledgeUploadProps> = ({ onUpload, isLoading }) => {
    const [dragActive, setDragActive] = useState(false);

    const handleFile = (file: File) => {
        if (file && file.name.endsWith('.json')) {
            onUpload(file);
        } else {
            alert("Por favor, selecione um arquivo .json válido.");
        }
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    };

    return (
        <div 
            className={`
                relative flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-2xl transition-all duration-300
                ${dragActive ? 'border-orange-500 bg-orange-500/10' : 'border-white/10 bg-zinc-900/40 hover:border-white/20'}
                ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
        >
            <input
                type="file"
                id="knowledge-upload"
                accept=".json"
                onChange={handleChange}
                disabled={isLoading}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            
            <div className="p-4 bg-orange-500/20 rounded-full text-orange-400 mb-4 animate-bounce">
                <UploadIcon />
            </div>
            
            <p className="text-gray-200 font-bold mb-1">Carregar Base de Conhecimento</p>
            <p className="text-gray-500 text-sm">Arraste seu arquivo .json ou clique aqui</p>
            
            {isLoading && (
                <div className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm flex items-center justify-center rounded-2xl">
                    <span className="text-orange-400 font-bold animate-pulse">Processando dados...</span>
                </div>
            )}
        </div>
    );
};

export default KnowledgeUpload;
