
import React, { useState, useRef } from 'react';
import { IndentIcon, OutdentIcon } from './Icons';

interface ArtifactEditorProps {
    title: string;
    initialContent: string;
    onSave: (newContent: string) => void;
    saveLabel?: string;
}

const ArtifactEditor: React.FC<ArtifactEditorProps> = ({ title, initialContent, onSave, saveLabel = "Salvar e Gerar Artefatos" }) => {
    const [content, setContent] = useState(initialContent);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleIndent = (e: React.MouseEvent | React.KeyboardEvent) => {
        e.preventDefault();
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const value = textarea.value;

        const startLineIndex = value.lastIndexOf('\n', start - 1) + 1;
        const endLineIndex = value.indexOf('\n', end);
        const actualEnd = endLineIndex === -1 ? value.length : endLineIndex;

        const selectedText = value.substring(startLineIndex, actualEnd);
        const lines = selectedText.split('\n');

        const indentedLines = lines.map(line => '    ' + line);
        const newText = indentedLines.join('\n');

        const newValue = value.substring(0, startLineIndex) + newText + value.substring(actualEnd);
        
        setContent(newValue);

        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + 4, end + (lines.length * 4));
        }, 0);
    };

    const handleOutdent = (e: React.MouseEvent | React.KeyboardEvent) => {
        e.preventDefault();
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const value = textarea.value;

        const startLineIndex = value.lastIndexOf('\n', start - 1) + 1;
        const endLineIndex = value.indexOf('\n', end);
        const actualEnd = endLineIndex === -1 ? value.length : endLineIndex;

        const selectedText = value.substring(startLineIndex, actualEnd);
        const lines = selectedText.split('\n');

        let removedChars = 0;
        const outdentedLines = lines.map(line => {
            if (line.startsWith('\t')) {
                removedChars += 1;
                return line.substring(1);
            } else if (line.startsWith('    ')) {
                removedChars += 4;
                return line.substring(4);
            } else if (line.startsWith('   ')) {
                removedChars += 3;
                return line.substring(3);
            } else if (line.startsWith('  ')) {
                removedChars += 2;
                return line.substring(2);
            } else if (line.startsWith(' ')) {
                removedChars += 1;
                return line.substring(1);
            }
            return line;
        });

        const newText = outdentedLines.join('\n');
        const newValue = value.substring(0, startLineIndex) + newText + value.substring(actualEnd);

        setContent(newValue);

        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(Math.max(startLineIndex, start - 4), Math.max(startLineIndex, end - removedChars));
        }, 0);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Tab') {
            if (e.shiftKey) {
                handleOutdent(e);
            } else {
                handleIndent(e);
            }
        }
    };

    return (
        <div className="flex flex-col space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="text-xs font-bold text-orange-400 uppercase tracking-wider ml-1 mb-1">
                Editor de {title}
            </div>
            
            <div className="bg-zinc-900/80 backdrop-blur-sm rounded-xl border border-white/10 shadow-xl overflow-hidden flex flex-col">
                <div className="flex items-center gap-2 px-4 py-2 border-b border-white/5 bg-zinc-800/50">
                    <button 
                        onClick={handleOutdent}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                        title="Diminuir Recuo (Shift+Tab)"
                    >
                        <OutdentIcon />
                    </button>
                    <button 
                        onClick={handleIndent}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                        title="Aumentar Recuo (Tab)"
                    >
                        <IndentIcon />
                    </button>
                    <div className="w-px h-5 bg-white/10 mx-2"></div>
                    <span className="text-xs text-gray-500">
                        Edite o conteúdo abaixo livremente.
                    </span>
                </div>

                <textarea
                    ref={textareaRef}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="w-full h-96 p-5 bg-transparent text-gray-200 font-mono text-sm resize-y focus:outline-none"
                    spellCheck={false}
                />
            </div>

            <button
                onClick={() => onSave(content)}
                className="w-full py-3 px-4 rounded-xl font-bold text-white bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 shadow-lg shadow-orange-900/20 transition-all duration-300 transform hover:scale-[1.01]"
            >
                {saveLabel}
            </button>
        </div>
    );
};

export default ArtifactEditor;
