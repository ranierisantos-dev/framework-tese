
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ArtifactType, Message, GeneratedArtifact } from './types';
import { generateArtifact, suggestPersonasFromContext, refineArtifact } from './services/geminiService';
import OptionSelector from './components/OptionSelector';
import InputForm from './components/InputForm';
import ArtifactDisplay from './components/ArtifactDisplay';
import LoadingSpinner from './components/LoadingSpinner';
import ChatMessage from './components/ChatMessage';
import AdditionalInfoForm from './components/AdditionalInfoForm';
import DownloadOptions from './components/DownloadOptions';
import HypothesisEditor from './components/HypothesisEditor';
import ArtifactEditor from './components/ArtifactEditor';
import SetupForm from './components/SetupForm';
import KnowledgeUpload from './components/KnowledgeUpload';
import RefinementForm from './components/RefinementForm';
import PasswordGate from './components/PasswordGate';

const App: React.FC = () => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
        return localStorage.getItem('app_authenticated') === 'true';
    });
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [projectContext, setProjectContext] = useState<string>('');
    const [completedArtifacts, setCompletedArtifacts] = useState<ArtifactType[]>([]);
    const [currentArtifactType, setCurrentArtifactType] = useState<ArtifactType | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const handleOptionSelectRef = useRef<((type: ArtifactType) => void) | null>(null);

    const handleAgentModelTriggerRef = useRef<() => void>(null);
    const handleMOTablesTriggerRef = useRef<() => void>(null);
    const handleMainMenuTriggerRef = useRef<() => void>(null);
    const handleTaskModelTriggerRef = useRef<() => void>(null);
    const handleFunctionalRequirementsTriggerRef = useRef<() => void>(null);
    const handleHypothesisRefinementRef = useRef<((content: string) => void) | null>(null);
    const handleFunctionalRequirementsFinalizedRef = useRef<((content: string) => void) | null>(null);
    const handleTestCasesFinalizedRef = useRef<((content: string) => void) | null>(null);

    const stateRef = useRef({ projectContext, completedArtifacts, currentArtifactType });
    useEffect(() => {
        stateRef.current = { projectContext, completedArtifacts, currentArtifactType };
    });

    const addMessage = useCallback((sender: 'bot' | 'user', content: React.ReactNode, isFullWidth: boolean = false): string => {
        const id = `${Date.now()}-${Math.random()}`;
        setMessages(prev => [...prev, { id, sender, content, isFullWidth }]);
        return id;
    }, []);
    
    const updateMessage = useCallback((id: string, content: React.ReactNode, extra?: Partial<Message>) => {
        setMessages(prev => prev.map(m => m.id === id ? { ...m, content, ...extra } : m));
    }, []);

    const showMainMenu = useCallback((customText?: string, overrideArtifacts?: ArtifactType[]) => {
        addMessage('bot', 
            <>
                <p className="mb-4 text-gray-200">{customText || "O que você gostaria de fazer agora?"}</p>
                <OptionSelector 
                    onSelect={(type) => handleOptionSelectRef.current?.(type)} 
                    completedArtifacts={overrideArtifacts || stateRef.current.completedArtifacts} 
                />
            </>,
            true // Ativa largura total para o menu
        );
    }, [addMessage]);

    const initialBotMessage = useCallback(() => {
         addMessage('bot', 
            <>
                <p className="mb-4 text-gray-200">Olá! Sou seu assistente de UX em projetos de Engenharia do Conhecimento. Aqui estão todas as ferramentas disponíveis para iniciar seu projeto:</p>
                <OptionSelector 
                    onSelect={(type) => handleOptionSelectRef.current?.(type)} 
                    completedArtifacts={[]} 
                />
            </>,
            true // Ativa largura total para o menu inicial
        );
    }, [addMessage]);

    const hasInitialized = useRef(false);

    useEffect(() => {
       if (!hasInitialized.current) {
           initialBotMessage();
           hasInitialized.current = true;
       }
    }, [initialBotMessage]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleHypothesisFinalized = useCallback((finalContent: string) => {
        const artifactType = ArtifactType.HypothesisGeneration;
        setProjectContext(prev => {
            if (!prev.trim()) return `## ${artifactType} (FINAL)\n\n${finalContent}`;

            // Remove any previous hypothesis sections to ensure only the latest confirmed one is used
            const sections = prev.split('\n\n---\n\n');
            const filteredSections = sections.filter(section => 
                section.trim() !== '' &&
                !section.includes(`## ${artifactType}`) && 
                !section.includes('--- HIPÓTESES DEFINIDAS (FINAL) ---') &&
                !section.includes(`--- REFINAMENTO: ${artifactType} ---`)
            );
            
            const newSection = `## ${artifactType} (FINAL)\n\n${finalContent}`;
            return filteredSections.length > 0 
                ? `${filteredSections.join('\n\n---\n\n')}\n\n---\n\n${newSection}`
                : newSection;
        });
        addMessage('bot', 
            <>
                <p className="text-sm text-gray-400 mb-2">Hipóteses confirmadas. Deseja salvar este artefato?</p>
                <DownloadOptions artifactName={artifactType} content={finalContent} />
                <div className="flex flex-col gap-4 bg-zinc-900/40 backdrop-blur-md p-6 rounded-2xl border border-white/10 mt-6 shadow-xl">
                    <div>
                        <p className="mb-2 font-medium text-white">Próximos passos recomendados</p>
                        <p className="text-sm text-gray-400 mb-4 leading-relaxed">Agora que as funcionalidades foram definidas, podemos detalhar os Requisitos Funcionais ou o Modelo de Tarefas.</p>
                        <p className="font-semibold text-orange-400">O que deseja gerar agora?</p>
                    </div>
                    <div className="flex flex-wrap gap-3 mt-2">
                        <button onClick={() => handleFunctionalRequirementsTriggerRef.current?.()} className="px-6 py-2.5 bg-sky-600 text-white rounded-xl hover:bg-sky-500 transition-all font-medium border border-white/10 flex-1 sm:flex-none">Requisitos Funcionais</button>
                        <button onClick={() => handleTaskModelTriggerRef.current?.()} className="px-6 py-2.5 bg-orange-600 text-white rounded-xl hover:bg-orange-500 transition-all font-medium border border-white/10 flex-1 sm:flex-none">Modelo de Tarefas</button>
                        <button onClick={() => handleMainMenuTriggerRef.current?.()} className="px-6 py-2.5 bg-zinc-800 text-gray-300 rounded-xl hover:bg-zinc-700 transition-all flex-1 sm:flex-none border border-white/5">Menu principal</button>
                    </div>
                </div>
            </>
        );
    }, [addMessage]);

    useEffect(() => {
        handleHypothesisRefinementRef.current = handleHypothesisFinalized;
    }, [handleHypothesisFinalized]);

    const shouldShowRefinement = (type: ArtifactType) => {
        return ![
            ArtifactType.InitialSetup,
            ArtifactType.LoadKnowledgeBase,
            ArtifactType.HypothesisGeneration,
            ArtifactType.KnowledgeBase
        ].includes(type);
    };

    const handleRefine = useCallback(async (type: ArtifactType, currentContent: string, suggestions: string) => {
        setIsLoading(true);
        const loadingId = addMessage('bot', <LoadingSpinner />);
        try {
            const result = await refineArtifact(type, currentContent, suggestions);
            const textWithoutImages = result.text.replace(/!\[(.*?)\]\(data:image\/.*?;base64,.*?\)/g, '\n> [Imagem Gerada: $1]\n');
            
            if (type === ArtifactType.HypothesisGeneration || type === ArtifactType.FunctionalRequirements || type === ArtifactType.TestCases) {
                setProjectContext(prev => {
                    if (!prev.trim()) return `--- REFINAMENTO: ${type} ---\n${textWithoutImages}`;
                    const sections = prev.split('\n\n---\n\n');
                    const filteredSections = sections.filter(section => 
                        section.trim() !== '' &&
                        !section.includes(`## ${type}`) && 
                        !section.includes('--- HIPÓTESES DEFINIDAS (FINAL) ---') &&
                        !section.includes('--- REQUISITOS FUNCIONAIS (FINAL) ---') &&
                        !section.includes('--- CASOS DE TESTE (FINAL) ---') &&
                        !section.includes(`--- REFINAMENTO: ${type} ---`)
                    );
                    const newSection = `--- REFINAMENTO: ${type} ---\n${textWithoutImages}`;
                    return filteredSections.length > 0 
                        ? `${filteredSections.join('\n\n---\n\n')}\n\n---\n\n${newSection}`
                        : newSection;
                });
            } else {
                setProjectContext(prev => `${prev}\n\n--- REFINAMENTO: ${type} ---\n${textWithoutImages}`);
            }
            
            const isWide = type === ArtifactType.UserFlows || type === ArtifactType.KnowledgeBase;
            
            if (type === ArtifactType.FunctionalRequirements) {
                updateMessage(loadingId, 
                    <ArtifactEditor 
                        title={type} 
                        initialContent={result.text} 
                        onSave={(content) => handleFunctionalRequirementsFinalizedRef.current?.(content)} 
                    />, 
                    { isFullWidth: true }
                );
                setIsLoading(false);
                return;
            }

            if (type === ArtifactType.TestCases) {
                updateMessage(loadingId, 
                    <ArtifactEditor 
                        title={type} 
                        initialContent={result.text} 
                        onSave={(content) => handleTestCasesFinalizedRef.current?.(content)} 
                    />, 
                    { isFullWidth: true }
                );
                setIsLoading(false);
                return;
            }

            updateMessage(loadingId, <ArtifactDisplay artifact={result} />, { isFullWidth: isWide });
            
            const newCompletedArtifacts = [...stateRef.current.completedArtifacts];
            
            addMessage('bot', 
                <div className="space-y-4">
                    <p className="text-sm text-gray-400 mb-2">Artefato refinado. Deseja salvar este resultado ou alterar algo mais?</p>
                    <DownloadOptions artifactName={type} content={result.text} />
                    <RefinementForm 
                        onRefine={(s) => handleRefine(type, result.text, s)}
                        onAccept={() => {
                            if (type === ArtifactType.Personas) {
                                addMessage('bot', <div className="flex flex-col gap-4 bg-zinc-900/40 backdrop-blur-md p-6 rounded-2xl border border-white/10 mt-2 shadow-xl"><div><p className="mb-2 font-medium text-white">Personas refinadas com sucesso!</p><p className="font-semibold text-orange-400">Deseja gerar o Modelo de Agentes agora?</p></div><div className="flex flex-wrap gap-3 mt-2"><button onClick={() => handleAgentModelTriggerRef.current?.()} className="px-6 py-2.5 bg-orange-600 text-white rounded-xl font-medium border border-white/10 flex-1 sm:flex-none">Sim, gerar Modelo</button><button onClick={() => handleMainMenuTriggerRef.current?.()} className="px-6 py-2.5 bg-zinc-800 text-gray-300 rounded-xl flex-1 sm:flex-none border border-white/5">Voltar</button></div></div>);
                            } else if (type === ArtifactType.SummarizeInterview) {
                                addMessage('bot', <div className="flex flex-col gap-4 bg-zinc-900/40 backdrop-blur-md p-6 rounded-2xl border border-white/10 mt-2 shadow-xl"><div><p className="mb-2 font-medium text-white">Resumo refinado!</p><p className="font-semibold text-orange-400">Deseja criar as Tabelas MO agora?</p></div><div className="flex flex-wrap gap-3 mt-2"><button onClick={() => handleMOTablesTriggerRef.current?.()} className="px-6 py-2.5 bg-orange-600 text-white rounded-xl font-medium border border-white/10 flex-1 sm:flex-none">Sim, criar Tabelas MO</button><button onClick={() => handleMainMenuTriggerRef.current?.()} className="px-6 py-2.5 bg-zinc-800 text-gray-300 rounded-xl flex-1 sm:flex-none border border-white/5">Voltar</button></div></div>);
                            } else {
                                showMainMenu("Artefato finalizado. O que deseja fazer agora?");
                            }
                        }}
                        isLoading={false}
                    />
                </div>
            );
        } catch (error) {
            updateMessage(loadingId, <p className="text-rose-400">Erro ao refinar o artefato. Tente novamente.</p>);
        } finally {
            setIsLoading(false);
        }
    }, [addMessage, updateMessage, showMainMenu]);

    const handleFunctionalRequirementsFinalized = useCallback((finalContent: string) => {
        const artifactType = ArtifactType.FunctionalRequirements;
        setProjectContext(prev => {
            if (!prev.trim()) return `## ${artifactType} (FINAL)\n\n${finalContent}`;

            const sections = prev.split('\n\n---\n\n');
            const filteredSections = sections.filter(section => 
                section.trim() !== '' &&
                !section.includes(`## ${artifactType}`) && 
                !section.includes('--- REQUISITOS FUNCIONAIS (FINAL) ---') &&
                !section.includes(`--- REFINAMENTO: ${artifactType} ---`)
            );
            
            const newSection = `## ${artifactType} (FINAL)\n\n${finalContent}`;
            return filteredSections.length > 0 
                ? `${filteredSections.join('\n\n---\n\n')}\n\n---\n\n${newSection}`
                : newSection;
        });
        
        addMessage('bot', 
            <div className="space-y-4">
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 font-medium">
                    <span className="mr-2">✓</span> {artifactType} finalizados com sucesso!
                </div>
                <p className="text-sm text-gray-400">O conteúdo está pronto para download nos formatos abaixo:</p>
                <DownloadOptions artifactName={artifactType} content={finalContent} />
                
                <RefinementForm 
                    onRefine={(s) => handleRefine(artifactType, finalContent, s)}
                    onAccept={() => {
                        addMessage('bot', 
                            <div className="pt-4 border-t border-white/10">
                                <p className="mb-4 text-gray-200">O que você gostaria de fazer agora?</p>
                                <OptionSelector onSelect={(type) => handleOptionSelectRef.current?.(type)} completedArtifacts={stateRef.current.completedArtifacts} />
                            </div>
                        );
                    }}
                />
            </div>
        );
    }, [addMessage, handleRefine]);

    useEffect(() => {
        handleFunctionalRequirementsFinalizedRef.current = handleFunctionalRequirementsFinalized;
    }, [handleFunctionalRequirementsFinalized]);

    const handleTestCasesFinalized = useCallback((finalContent: string) => {
        const artifactType = ArtifactType.TestCases;
        setProjectContext(prev => {
            if (!prev.trim()) return `## ${artifactType} (FINAL)\n\n${finalContent}`;

            const sections = prev.split('\n\n---\n\n');
            const filteredSections = sections.filter(section => 
                section.trim() !== '' &&
                !section.includes(`## ${artifactType}`) && 
                !section.includes('--- CASOS DE TESTE (FINAL) ---') &&
                !section.includes(`--- REFINAMENTO: ${artifactType} ---`)
            );
            
            const newSection = `## ${artifactType} (FINAL)\n\n${finalContent}`;
            return filteredSections.length > 0 
                ? `${filteredSections.join('\n\n---\n\n')}\n\n---\n\n${newSection}`
                : newSection;
        });
        
        addMessage('bot', 
            <div className="space-y-4">
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 font-medium">
                    <span className="mr-2">✓</span> {artifactType} finalizados com sucesso!
                </div>
                <p className="text-sm text-gray-400">O conteúdo está pronto para download nos formatos abaixo:</p>
                <DownloadOptions artifactName={artifactType} content={finalContent} />
                
                <RefinementForm 
                    onRefine={(s) => handleRefine(artifactType, finalContent, s)}
                    onAccept={() => {
                        addMessage('bot', 
                            <div className="pt-4 border-t border-white/10">
                                <p className="mb-4 text-gray-200">O que você gostaria de fazer agora?</p>
                                <OptionSelector onSelect={(type) => handleOptionSelectRef.current?.(type)} completedArtifacts={stateRef.current.completedArtifacts} />
                            </div>
                        );
                    }}
                />
            </div>
        );
    }, [addMessage, handleRefine]);

    useEffect(() => {
        handleTestCasesFinalizedRef.current = handleTestCasesFinalized;
    }, [handleTestCasesFinalized]);

    const handleGeneration = useCallback(async (artifactType: ArtifactType, context: string, isPrimaryInput: boolean) => {
        setIsLoading(true);
        const loadingMessageId = addMessage('bot', <LoadingSpinner />);
        try {
            if (artifactType === ArtifactType.InitialSetup) {
                 setProjectContext(context);
                 updateMessage(loadingMessageId, <p className="text-emerald-400 font-medium">✓ Setup Inicial concluído com sucesso!</p>);
                 setCompletedArtifacts([ArtifactType.InitialSetup]);
                 showMainMenu("O setup foi registrado. Como deseja prosseguir?");
                 setIsLoading(false);
                 return;
            }

            const result: GeneratedArtifact = await generateArtifact(artifactType, context);
            const textWithoutImages = result.text.replace(/!\[(.*?)\]\(data:image\/.*?;base64,.*?\)/g, '\n> [Imagem Gerada: $1]\n');
            
            if (artifactType !== ArtifactType.HypothesisGeneration && 
                artifactType !== ArtifactType.FunctionalRequirements && 
                artifactType !== ArtifactType.TestCases) {
                if (isPrimaryInput) { setProjectContext(`## ${artifactType}\n\n${textWithoutImages}`); } 
                else { setProjectContext(prev => `${prev}\n\n---\n\n## ${artifactType}\n\n${textWithoutImages}`); }
            }
            
            const newCompletedArtifacts = [...stateRef.current.completedArtifacts, artifactType];
            setCompletedArtifacts(newCompletedArtifacts);

            if (artifactType === ArtifactType.HypothesisGeneration) { 
                updateMessage(loadingMessageId, <HypothesisEditor initialContent={result.text} onSave={(content) => handleHypothesisRefinementRef.current?.(content)} />, { isFullWidth: true }); 
                return; 
            }

            if (artifactType === ArtifactType.FunctionalRequirements) {
                updateMessage(loadingMessageId, 
                    <ArtifactEditor 
                        title={artifactType} 
                        initialContent={result.text} 
                        onSave={(content) => handleFunctionalRequirementsFinalizedRef.current?.(content)} 
                    />, 
                    { isFullWidth: true }
                );
                setIsLoading(false);
                return;
            }

            if (artifactType === ArtifactType.TestCases) {
                updateMessage(loadingMessageId, 
                    <ArtifactEditor 
                        title={artifactType} 
                        initialContent={result.text} 
                        onSave={(content) => handleTestCasesFinalizedRef.current?.(content)} 
                    />, 
                    { isFullWidth: true }
                );
                setIsLoading(false);
                return;
            }

            const isWideArtifact = artifactType === ArtifactType.UserFlows || artifactType === ArtifactType.KnowledgeBase;
            updateMessage(loadingMessageId, <ArtifactDisplay artifact={result} />, { isFullWidth: isWideArtifact });
            
            if (artifactType !== ArtifactType.UserFlows && artifactType !== ArtifactType.KnowledgeBase) { 
                addMessage('bot', <><p className="text-sm text-gray-400 mb-2">Deseja salvar este artefato?</p><DownloadOptions artifactName={artifactType} content={result.text} /></>); 
            }

            if (shouldShowRefinement(artifactType)) {
                addMessage('bot', 
                    <RefinementForm 
                        onRefine={(s) => handleRefine(artifactType, result.text, s)}
                        onAccept={() => {
                            if (artifactType === ArtifactType.Personas) {
                                addMessage('bot', <div className="flex flex-col gap-4 bg-zinc-900/40 backdrop-blur-md p-6 rounded-2xl border border-white/10 mt-2 shadow-xl"><div><p className="mb-2 font-medium text-white">Personas geradas com sucesso!</p><p className="font-semibold text-orange-400">Deseja gerar o Modelo de Agentes agora?</p></div><div className="flex flex-wrap gap-3 mt-2"><button onClick={() => handleAgentModelTriggerRef.current?.()} className="px-6 py-2.5 bg-orange-600 text-white rounded-xl font-medium border border-white/10 flex-1 sm:flex-none">Sim, gerar Modelo</button><button onClick={() => handleMainMenuTriggerRef.current?.()} className="px-6 py-2.5 bg-zinc-800 text-gray-300 rounded-xl flex-1 sm:flex-none border border-white/5">Voltar</button></div></div>);
                            } else if (artifactType === ArtifactType.SummarizeInterview) {
                                addMessage('bot', <div className="flex flex-col gap-4 bg-zinc-900/40 backdrop-blur-md p-6 rounded-2xl border border-white/10 mt-2 shadow-xl"><div><p className="mb-2 font-medium text-white">Resumo concluído!</p><p className="font-semibold text-orange-400">Deseja criar as Tabelas MO agora?</p></div><div className="flex flex-wrap gap-3 mt-2"><button onClick={() => handleMOTablesTriggerRef.current?.()} className="px-6 py-2.5 bg-orange-600 text-white rounded-xl font-medium border border-white/10 flex-1 sm:flex-none">Sim, criar Tabelas MO</button><button onClick={() => handleMainMenuTriggerRef.current?.()} className="px-6 py-2.5 bg-zinc-800 text-gray-300 rounded-xl flex-1 sm:flex-none border border-white/5">Voltar</button></div></div>);
                            } else {
                                addMessage('bot', <><p className="mb-4 text-gray-200">Excelente! O que você gostaria de fazer agora?</p><OptionSelector onSelect={(type) => handleOptionSelectRef.current?.(type)} completedArtifacts={newCompletedArtifacts} /></>);
                            }
                        }}
                    />
                );
            } else {
                if (artifactType === ArtifactType.Personas) {
                    addMessage('bot', <div className="flex flex-col gap-4 bg-zinc-900/40 backdrop-blur-md p-6 rounded-2xl border border-white/10 mt-2 shadow-xl"><div><p className="mb-2 font-medium text-white">Personas geradas com sucesso!</p><p className="font-semibold text-orange-400">Deseja gerar o Modelo de Agentes agora?</p></div><div className="flex flex-wrap gap-3 mt-2"><button onClick={() => handleAgentModelTriggerRef.current?.()} className="px-6 py-2.5 bg-orange-600 text-white rounded-xl font-medium border border-white/10 flex-1 sm:flex-none">Sim, gerar Modelo</button><button onClick={() => handleMainMenuTriggerRef.current?.()} className="px-6 py-2.5 bg-zinc-800 text-gray-300 rounded-xl flex-1 sm:flex-none border border-white/5">Voltar</button></div></div>);
                } else if (artifactType === ArtifactType.SummarizeInterview) {
                    addMessage('bot', <div className="flex flex-col gap-4 bg-zinc-900/40 backdrop-blur-md p-6 rounded-2xl border border-white/10 mt-2 shadow-xl"><div><p className="mb-2 font-medium text-white">Resumo concluído!</p><p className="font-semibold text-orange-400">Deseja criar as Tabelas MO agora?</p></div><div className="flex flex-wrap gap-3 mt-2"><button onClick={() => handleMOTablesTriggerRef.current?.()} className="px-6 py-2.5 bg-orange-600 text-white rounded-xl font-medium border border-white/10 flex-1 sm:flex-none">Sim, criar Tabelas MO</button><button onClick={() => handleMainMenuTriggerRef.current?.()} className="px-6 py-2.5 bg-zinc-800 text-gray-300 rounded-xl flex-1 sm:flex-none border border-white/5">Voltar</button></div></div>);
                } else { 
                    addMessage('bot', <><p className="mb-4 text-gray-200">Excelente! O que você gostaria de fazer agora?</p><OptionSelector onSelect={(type) => handleOptionSelectRef.current?.(type)} completedArtifacts={newCompletedArtifacts} /></>); 
                }
            }
        } catch (error) {
            updateMessage(loadingMessageId, <p className="text-rose-400">Ocorreu um erro ao gerar o artefato. Tente simplificar sua solicitação.</p>);
            showMainMenu("O que você gostaria de fazer agora?");
        } finally { setIsLoading(false); }
    }, [addMessage, updateMessage, showMainMenu, handleRefine]);

    useEffect(() => {
        handleAgentModelTriggerRef.current = () => { addMessage('user', "Gerar Modelo de Agentes"); handleGeneration(ArtifactType.AgentModel, stateRef.current.projectContext, false); };
        handleMOTablesTriggerRef.current = () => { addMessage('user', "Criar as Tabelas MO"); handleGeneration(ArtifactType.MOTables, stateRef.current.projectContext, false); };
        handleTaskModelTriggerRef.current = () => { addMessage('user', "Gerar Modelo de Tarefas (MT1)"); handleGeneration(ArtifactType.TaskModel, stateRef.current.projectContext, false); };
        handleFunctionalRequirementsTriggerRef.current = () => { addMessage('user', "Gerar Requisitos Funcionais"); handleGeneration(ArtifactType.FunctionalRequirements, stateRef.current.projectContext, false); };
        handleMainMenuTriggerRef.current = () => { addMessage('user', "Menu principal"); showMainMenu(); };
    }, [addMessage, handleGeneration, showMainMenu]);

    const handleLoadJson = useCallback((file: File) => {
        setIsLoading(true);
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = JSON.parse(e.target?.result as string);
                setProjectContext(JSON.stringify(content, null, 2));
                
                // Detectar artefatos presentes no JSON para habilitar os botões correspondentes
                const detectedArtifacts: ArtifactType[] = [ArtifactType.InitialSetup, ArtifactType.KnowledgeBase];
                
                const normalize = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
                
                const getAllKeys = (obj: any): string[] => {
                    let keys: string[] = [];
                    if (!obj || typeof obj !== 'object') return keys;
                    if (Array.isArray(obj)) {
                        obj.forEach(item => {
                            keys = keys.concat(getAllKeys(item));
                        });
                    } else {
                        Object.keys(obj).forEach(key => {
                            keys.push(key);
                            keys = keys.concat(getAllKeys(obj[key]));
                        });
                    }
                    return keys;
                };

                const rawKeys = getAllKeys(content);
                const normalizedKeys = rawKeys.map(k => normalize(k));
                
                const mapping: { [key: string]: ArtifactType } = {
                    'persona': ArtifactType.Personas,
                    'requisito': ArtifactType.FunctionalRequirements,
                    'requirement': ArtifactType.FunctionalRequirements,
                    'tarefa': ArtifactType.TaskModel,
                    'task': ArtifactType.TaskModel,
                    'agente': ArtifactType.AgentModel,
                    'agent': ArtifactType.AgentModel,
                    'observacao': ArtifactType.Observation,
                    'observation': ArtifactType.Observation,
                    'entrevista': ArtifactType.SummarizeInterview,
                    'interview': ArtifactType.SummarizeInterview,
                    'organizacional': ArtifactType.MOTables,
                    'organizational': ArtifactType.MOTables,
                    'inventario': ArtifactType.KnowledgeInventory,
                    'inventory': ArtifactType.KnowledgeInventory,
                    'empatia': ArtifactType.EmpathyMap,
                    'empathy': ArtifactType.EmpathyMap,
                    'jornada': ArtifactType.UserJourney,
                    'journey': ArtifactType.UserJourney,
                    'hipotese': ArtifactType.HypothesisGeneration,
                    'hypothesis': ArtifactType.HypothesisGeneration,
                    'fluxo': ArtifactType.UserFlows,
                    'flow': ArtifactType.UserFlows,
                    'base_de_conhecimento': ArtifactType.KnowledgeBase,
                    'knowledge_base': ArtifactType.KnowledgeBase,
                    'casos_de_teste': ArtifactType.TestCases,
                    'test_cases': ArtifactType.TestCases,
                    'plano_mentor': ArtifactType.MonitoringPlan,
                    'monitoring_plan': ArtifactType.MonitoringPlan,
                };

                for (const [key, type] of Object.entries(mapping)) {
                    const normalizedSearchKey = normalize(key);
                    if (normalizedKeys.some(k => k.includes(normalizedSearchKey))) {
                        if (!detectedArtifacts.includes(type)) {
                            detectedArtifacts.push(type);
                        }
                    }
                }
                
                // Também verificar se o nome exato do artefato (ou parte dele) está nas chaves
                Object.values(ArtifactType).forEach(type => {
                    const normType = normalize(type);
                    if (normalizedKeys.some(k => k === normType || k.includes(normType) || normType.includes(k))) {
                        if (!detectedArtifacts.includes(type)) {
                            detectedArtifacts.push(type);
                        }
                    }
                });

                setCompletedArtifacts(detectedArtifacts);
                stateRef.current.completedArtifacts = detectedArtifacts; // Atualização manual imediata para evitar race conditions
                addMessage('bot', <p className="text-emerald-400 font-medium">✓ Base de Conhecimento carregada com sucesso do arquivo: {file.name}</p>);
                showMainMenu("Dados restaurados. O que faremos agora?", detectedArtifacts);
            } catch (err) {
                addMessage('bot', <p className="text-rose-400">Erro ao processar o arquivo JSON. Certifique-se de que é um arquivo válido gerado pelo Agente UX.</p>);
                showMainMenu();
            } finally { setIsLoading(false); }
        };
        reader.readAsText(file);
    }, [addMessage, showMainMenu]);

    const handleInputSubmit = useCallback((context: string) => {
        const artifactType = stateRef.current.currentArtifactType;
        if (!artifactType) return;
        addMessage('user', <pre className="whitespace-pre-wrap font-sans text-gray-300">{context.substring(0, 300) + (context.length > 300 ? '...' : '')}</pre>);
        handleGeneration(artifactType, context, true);
    }, [addMessage, handleGeneration]);

    const handleAdditionalInfoSubmit = useCallback((additionalContext: string) => {
        const artifactType = stateRef.current.currentArtifactType;
        if (!artifactType) return;
        
        if (additionalContext) {
            addMessage('user', <pre className="whitespace-pre-wrap font-sans text-gray-300">{additionalContext.substring(0, 300) + (additionalContext.length > 300 ? '...' : '')}</pre>);
        } else {
            addMessage('user', "Continuando com o contexto acumulado.");
        }
        
        const currentCtx = stateRef.current.projectContext;
        const combined = additionalContext 
            ? `${currentCtx}\n\n--- Informação Adicional ---\n${additionalContext}`
            : currentCtx;
            
        handleGeneration(artifactType, combined, false);
    }, [addMessage, handleGeneration]);

    const handleOptionSelect = useCallback(async (type: ArtifactType) => {
        setCurrentArtifactType(type);
        addMessage('user', `Eu escolho: ${type}`);
        const { projectContext } = stateRef.current;

        if (type === ArtifactType.LoadKnowledgeBase) {
             addMessage('bot', <KnowledgeUpload onUpload={handleLoadJson} isLoading={isLoading} />);
             return;
        }

        if (type === ArtifactType.InitialSetup) {
             addMessage('bot', <SetupForm onSubmit={(ctx) => handleGeneration(type, ctx, true)} isLoading={isLoading} />);
             return;
        }

        if (type === ArtifactType.KnowledgeBase) {
            if (!projectContext) { addMessage('bot', <p className="text-amber-400">Inicie gerando outros artefatos primeiro.</p>); showMainMenu(); return; }
            handleGeneration(type, projectContext, false); return;
        }
        if (type === ArtifactType.Personas && projectContext) {
            setIsLoading(true);
            const loadingId = addMessage('bot', <LoadingSpinner />);
            try {
                const suggestions = await suggestPersonasFromContext(projectContext);
                updateMessage(loadingId, <p className="text-gray-200">{suggestions.length > 0 ? `Sugestões: **${suggestions.join(', ')}**` : "Crie personas baseadas nos dados gerais."}</p>);
                const handlePersonaSubmit = (input: string) => {
                    addMessage('user', input || "(Sem adicionar mais personas)");
                    const combined = `${stateRef.current.projectContext}\n\nSugestões: ${suggestions.join(', ')}\nAdicional: ${input}`;
                    handleGeneration(ArtifactType.Personas, combined, false);
                };
                addMessage('bot', <AdditionalInfoForm artifactType={type} onSubmit={handlePersonaSubmit} isLoading={false} customLabel="Deseja incluir mais alguma persona?" />);
            } catch (error) { addMessage('bot', <AdditionalInfoForm artifactType={type} onSubmit={handleAdditionalInfoSubmit} isLoading={false} />); } finally { setIsLoading(false); }
            return;
        }
        const customLabel = type === ArtifactType.Observation 
            ? "Cole aqui a transcrição das observações que você deseja resumir e armazenar." 
            : undefined;

        if (!projectContext) { addMessage('bot', <InputForm artifactType={type} onSubmit={(ctx) => handleInputSubmit(ctx)} isLoading={isLoading} customLabel={customLabel} />); }
        else { 
            addMessage('bot', <AdditionalInfoForm artifactType={type} onSubmit={handleAdditionalInfoSubmit} isLoading={isLoading} customLabel={customLabel} />); 
        }
    }, [isLoading, addMessage, handleGeneration, handleLoadJson, handleInputSubmit, handleAdditionalInfoSubmit, updateMessage, showMainMenu]);
    
    useEffect(() => { handleOptionSelectRef.current = handleOptionSelect; }, [handleOptionSelect]);

    return (
        <div className="flex flex-col h-screen text-[#EFEFEF] font-sans relative overflow-hidden">
            {!isAuthenticated && <PasswordGate onAuthenticated={() => setIsAuthenticated(true)} />}
            <div className="fixed inset-0 bg-zinc-950 -z-10"></div>
            <header className="fixed top-0 left-0 right-0 z-50 h-20 bg-zinc-900/95 backdrop-blur-xl border-b border-orange-500/30 shadow-lg">
                <div className="relative h-full flex items-center justify-center px-4">
                     <div className="flex flex-col items-center"><h1 className="text-xl font-bold text-white tracking-tight">Agentes de Engenharia do Conhecimento</h1><span className="text-xs font-medium text-orange-400 uppercase tracking-widest">Centrados no Usuário</span></div>
                </div>
            </header>
            <main className="flex-1 overflow-y-auto p-4 pt-28 pb-8 scroll-smooth"><div className="max-w-6xl mx-auto space-y-8">{messages.map((msg) => (<ChatMessage key={msg.id} sender={msg.sender} isFullWidth={msg.isFullWidth}>{msg.content}</ChatMessage>))}<div ref={messagesEndRef} /></div></main>
        </div>
    );
};

export default App;
