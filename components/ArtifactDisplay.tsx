import React, { useEffect, useRef, useState } from 'react';
import { GeneratedArtifact } from '../types';
import { DocumentTextIcon } from './Icons';

declare global {
    interface Window {
        mermaid?: {
            run: (options: { nodes: Array<Element> }) => void;
        }
    }
}

interface ArtifactDisplayProps {
    artifact: GeneratedArtifact;
}

const ArtifactDisplay: React.FC<ArtifactDisplayProps> = ({ artifact }) => {
    const mermaidRef = useRef<HTMLDivElement>(null);
    const [renderError, setRenderError] = useState<string | null>(null);

    useEffect(() => {
        const renderMermaid = async () => {
             if (window.mermaid && mermaidRef.current) {
                const nodes = Array.from(mermaidRef.current.querySelectorAll('.mermaid')) as Element[];
                if (nodes.length > 0) {
                     nodes.forEach(node => node.removeAttribute('data-processed'));
                     try {
                        await window.mermaid.run({ nodes: nodes });
                        setRenderError(null);
                     } catch (err: any) {
                         console.error("Mermaid Render Error:", err);
                         setRenderError("Erro de sintaxe no diagrama gerado. Exibindo código fonte.");
                     }
                }
            }
        };
        const timeoutId = setTimeout(() => { renderMermaid(); }, 100);
        return () => clearTimeout(timeoutId);
    }, [artifact]);

    const downloadMermaidAsPng = (containerId: string, filename: string) => {
        const container = document.getElementById(containerId);
        if (!container) return;
        const svg = container.querySelector('svg');
        if (!svg) return;
        const viewBox = svg.getAttribute('viewBox');
        let sourceWidth = svg.getBoundingClientRect().width;
        let sourceHeight = svg.getBoundingClientRect().height;
        if (viewBox) {
            const parts = viewBox.split(/\s+|,/).filter(p => p.trim() !== '');
            if (parts.length === 4) { sourceWidth = parseFloat(parts[2]); sourceHeight = parseFloat(parts[3]); }
        }
        if (sourceWidth < 10) sourceWidth = 800;
        if (sourceHeight < 10) sourceHeight = 600;
        const serializer = new XMLSerializer();
        let source = serializer.serializeToString(svg);
        if (!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)) {
            source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
        }
        const img = new Image();
        const svgBlob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);
        img.onload = function () {
            const canvas = document.createElement('canvas');
            const scale = 4;
            const padding = 40;
            canvas.width = (sourceWidth + padding * 2) * scale;
            canvas.height = (sourceHeight + padding * 2) * scale;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.fillStyle = "#18181b";
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.scale(scale, scale);
                ctx.drawImage(img, padding, padding, sourceWidth, sourceHeight);
                const imgURI = canvas.toDataURL('image/png');
                const a = document.createElement('a');
                a.setAttribute('download', `${filename}.png`);
                a.setAttribute('href', imgURI);
                a.click();
            }
            URL.revokeObjectURL(url);
        };
        img.src = url;
    };

    const downloadJsonFile = (jsonText: string) => {
        try {
            const obj = JSON.parse(jsonText);
            const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `base_conhecimento_${Date.now()}.json`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (e) { alert("Erro ao formatar JSON para download."); }
    };

    const renderStyledText = (text: string) => {
        const lines = text.split('\n');
        return lines.map((line, i) => {
            // Títulos de Módulo em Laranja
            if (line.trim().startsWith('Módulo:') || line.trim().startsWith('MÓDULO:')) {
                return <div key={i} className="text-orange-500 font-bold text-lg mt-6 mb-2">{line}</div>;
            }
            
            // Requisitos em Negrito
            if (line.trim().startsWith('**Requisito') || line.trim().startsWith('Requisito #')) {
                const content = line.replace(/\*\*/g, '');
                return <div key={i} className="font-bold text-gray-100 mt-4 mb-1">{content}</div>;
            }

            return <div key={i} className="mb-1">{line}</div>;
        });
    };

    if (artifact.isJson) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-2 mb-2 border-b border-white/10 pb-4">
                    <span className="p-2 bg-amber-500/20 rounded-lg text-amber-300"><DocumentTextIcon /></span>
                    <h3 className="text-lg font-bold text-gray-100">Base de Conhecimento Estruturada</h3>
                </div>
                <div className="p-5 bg-zinc-900/40 rounded-xl border border-white/5 text-gray-300 text-sm leading-relaxed shadow-inner">
                    A Base de Conhecimento foi gerada com sucesso e contém todo o histórico do projeto consolidado.
                </div>
                <button onClick={() => downloadJsonFile(artifact.text)} className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl bg-amber-600 text-white hover:bg-amber-500 transition-all font-bold shadow-lg">Baixar .JSON</button>
            </div>
        );
    }

    if (artifact.multiArtifacts && artifact.multiArtifacts.length > 0) {
        return (
            <div ref={mermaidRef} className="space-y-12">
                {artifact.multiArtifacts.map((sub, index) => {
                    const uniqueId = `mermaid-multi-${index}-${Date.now()}`;
                    return (
                        <div key={index} className="flex flex-col bg-zinc-900/40 border border-white/5 rounded-2xl overflow-hidden shadow-lg">
                            <div className="bg-zinc-800/60 px-6 py-4 border-b border-white/5"><h4 className="text-gray-100 font-bold">{sub.title}</h4></div>
                            <div className="p-6 bg-[#0f0f11] flex justify-center w-full">
                                {sub.type === 'mermaid' ? (<div id={uniqueId} className="w-full flex justify-center"><pre className="mermaid bg-transparent text-center w-full">{sub.content}</pre></div>) : (<div className="whitespace-pre-wrap text-sm text-gray-300">{sub.content}</div>)}
                            </div>
                            {sub.type === 'mermaid' && (<div className="px-6 py-4 bg-zinc-800/40 border-t border-white/5 flex justify-end"><button onClick={() => downloadMermaidAsPng(uniqueId, sub.title.replace(/\s+/g, '_'))} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-600/20 text-sky-300 hover:bg-sky-600/30 border border-sky-500/30 transition-all text-sm font-medium">Baixar PNG</button></div>)}
                        </div>
                    );
                })}
            </div>
        );
    }

    if (artifact.isMermaid) {
        const uniqueId = `mermaid-single-${Date.now()}`;
        return (
            <div ref={mermaidRef}>
                <div id={uniqueId} className="bg-zinc-900/60 backdrop-blur-md p-6 rounded-xl border border-white/10 shadow-inner w-full flex justify-center mb-3"><pre className="mermaid text-center w-full">{artifact.text}</pre></div>
                <button onClick={() => downloadMermaidAsPng(uniqueId, 'diagrama')} className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-sky-600/20 text-sky-300 hover:bg-sky-600/30 border border-sky-500/30 transition-all">Baixar PNG</button>
            </div>
        );
    }
    
    if (artifact.imageUrl) {
         return (
            <div className="space-y-4">
                <div className="flex justify-center w-full"><div className="relative rounded-xl overflow-hidden shadow-2xl border-4 border-zinc-800/50 w-full max-w-sm"><img src={artifact.imageUrl} alt="Artefato Gerado" className="w-full h-full object-cover" /></div></div>
                 <div className="prose prose-invert prose-sm max-w-none bg-zinc-950/40 backdrop-blur-sm p-4 rounded-xl border border-white/5 shadow-inner opacity-80"><div className="whitespace-pre-wrap font-sans text-gray-300 leading-relaxed text-sm line-clamp-3">{artifact.text}</div></div>
            </div>
         )
    }

    return (
        <div className="space-y-3">
            <div className="text-xs font-bold text-orange-400 uppercase tracking-wider ml-1">Artefato Gerado</div>
            <div className="prose prose-invert prose-sm sm:prose-base max-w-none bg-zinc-950/40 backdrop-blur-sm p-6 rounded-2xl border border-white/5 shadow-inner relative overflow-hidden">
                <div className="whitespace-pre-wrap font-sans text-gray-200 leading-relaxed">
                    {renderStyledText(artifact.text)}
                </div>
            </div>
        </div>
    );
};

export default ArtifactDisplay;