
import React, { useState } from 'react';
import { ArtifactType } from '../types';

interface InputFormProps {
    artifactType: ArtifactType;
    onSubmit: (context: string) => void;
    isLoading: boolean;
}

const placeholders: { [key in ArtifactType]: string } = {
    [ArtifactType.InitialSetup]: '',
    [ArtifactType.LoadKnowledgeBase]: '',
    [ArtifactType.Observation]: 'Cole aqui suas anotações ou transcrições de observações...',
    [ArtifactType.InterviewQuestions]: 'Descreva o problema ou o contexto para o qual você precisa de perguntas de entrevista...',
    [ArtifactType.SummarizeInterview]: 'Cole aqui a transcrição completa da entrevista para ser resumida...',
    [ArtifactType.Personas]: 'Forneça o máximo de contexto sobre seu usuário-alvo: dados demográficos, comportamentos, necessidades, etc.',
    [ArtifactType.AgentModel]: 'Descreva os papéis e atores do sistema para gerar o Modelo de Agentes CommonKADS...',
    [ArtifactType.KnowledgeInventory]: 'Liste os ativos de conhecimento necessários ou o contexto para gerar o Inventário do Conhecimento (CommonKADS)...',
    [ArtifactType.KnowledgeBase]: 'Sintetize a ontologia, regras e modelos de raciocínio para a base de conhecimento do protótipo...',
    [ArtifactType.EmpathyMap]: 'Descreva a situação e o usuário para o qual o mapa de empatia será criado...',
    [ArtifactType.MOTables]: 'Descreva o contexto organizacional, os problemas e oportunidades identificados para gerar o Modelo Organizacional (CommonKADS)...',
    [ArtifactType.UserJourney]: 'Descreva o objetivo do usuário e o cenário para mapear a Jornada do Usuário (Gibbons, 2018)...',
    [ArtifactType.HypothesisGeneration]: 'Descreva o problema ou oportunidade principal para gerarmos as hipóteses de funcionalidades...',
    [ArtifactType.FunctionalRequirements]: 'Confirme se deseja usar as hipóteses geradas anteriormente ou adicione mais detalhes para os Requisitos Funcionais...',
    [ArtifactType.TaskModel]: 'Confirme se deseja usar as hipóteses geradas anteriormente ou adicione mais contexto para gerar o Modelo de Tarefas (CommonKADS MT1)...',
    [ArtifactType.UserFlows]: 'Descreva a tarefa ou funcionalidade para a qual o fluxo de usuário será desenhado...',
    [ArtifactType.TestCases]: 'Confirme se deseja gerar casos de teste com base nos requisitos funcionais anteriores or adicione detalhes extras...',
    [ArtifactType.MonitoringPlan]: 'Descreva os papéis de mentoria ou o contexto para a transferência de conhecimento entre especialistas e iniciantes...',
};

const InputForm: React.FC<InputFormProps> = ({ artifactType, onSubmit, isLoading }) => {
    const [text, setText] = useState('');
    const [fileContent, setFileContent] = useState('');
    const [fileName, setFileName] = useState('');

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setFileName(file.name);
        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result as string;
            setFileContent(content);
        };
        reader.readAsText(file);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!text && !fileContent) return;
        const combinedContext = `${text}\n\n${fileContent ? `--- Conteúdo do arquivo: ${fileName} ---\n${fileContent}` : ''}`;
        onSubmit(combinedContext.trim());
    };

    const canUploadFile = artifactType === ArtifactType.Observation || artifactType === ArtifactType.SummarizeInterview;

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <div className="relative group">
                <label htmlFor="context-input" className="block text-sm font-medium text-gray-300 mb-2 ml-1">
                    Forneça o contexto necessário:
                </label>
                <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg opacity-20 group-hover:opacity-40 transition duration-500 blur"></div>
                <textarea
                    id="context-input"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder={placeholders[artifactType]}
                    rows={8}
                    className="relative w-full p-4 bg-zinc-900/80 backdrop-blur-sm border border-white/10 rounded-lg focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition text-gray-100 placeholder-gray-500 shadow-inner"
                    disabled={isLoading}
                />
            </div>

            {canUploadFile && (
                 <div className="p-4 rounded-lg bg-zinc-800/30 border border-white/5 border-dashed">
                    <label htmlFor="file-upload" className="block text-sm font-medium text-gray-400 mb-2">
                        Ou envie um arquivo de transcrição (.txt):
                    </label>
                    <input 
                        type="file" 
                        id="file-upload"
                        onChange={handleFileChange} 
                        accept=".txt,text/plain"
                        className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-600/80 file:text-white hover:file:bg-orange-600 file:transition-colors cursor-pointer"
                        disabled={isLoading}
                    />
                    {fileName && <p className="text-xs text-green-400 mt-2 flex items-center"><span className="mr-1">✓</span> Arquivo carregado: {fileName}</p>}
                </div>
            )}
            
            <button
                type="submit"
                disabled={isLoading || (!text && !fileContent)}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg shadow-orange-900/30 text-sm font-bold text-white bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:from-zinc-700 disabled:to-zinc-800 disabled:text-gray-500 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-[1.02]"
            >
                {isLoading ? 'Gerando...' : 'Gerar Artefato'}
            </button>
        </form>
    );
};

export default InputForm;
