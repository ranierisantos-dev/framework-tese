import React, { useState } from 'react';
import { generateAndDownloadDocx, generateAndDownloadPdf } from '../services/documentService';
import { DocumentTextIcon } from './Icons';

interface DownloadOptionsProps {
    artifactName: string;
    content: string;
}

const DownloadOptions: React.FC<DownloadOptionsProps> = ({ artifactName, content }) => {
    const [isDownloading, setIsDownloading] = useState(false);

    const handleDownload = async (format: 'docx' | 'pdf') => {
        setIsDownloading(true);
        try {
            const appTitle = "Agentes de Engenharia do Conhecimento Centrados no Usuário";
            if (format === 'docx') {
                await generateAndDownloadDocx(appTitle, artifactName, content);
            } else {
                generateAndDownloadPdf(appTitle, artifactName, content);
            }
        } catch (e) {
            console.error(e);
            alert("Erro ao gerar documento.");
        } finally {
            setIsDownloading(false);
        }
    };

    // Icon for PDF (custom SVG)
    const PdfIcon = () => (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
        </svg>
    );

    return (
        <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <button
                onClick={() => handleDownload('docx')}
                disabled={isDownloading}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 rounded-lg transition-all duration-300 text-sm font-medium border border-blue-500/30 hover:border-blue-500/50 backdrop-blur-sm disabled:opacity-50"
            >
                <DocumentTextIcon />
                {isDownloading ? 'Gerando...' : 'Baixar .DOCX'}
            </button>
            <button
                onClick={() => handleDownload('pdf')}
                disabled={isDownloading}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-300 rounded-lg transition-all duration-300 text-sm font-medium border border-red-500/30 hover:border-red-500/50 backdrop-blur-sm disabled:opacity-50"
            >
                <PdfIcon />
                {isDownloading ? 'Gerando...' : 'Baixar .PDF'}
            </button>
        </div>
    );
};

export default DownloadOptions;