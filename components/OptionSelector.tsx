
import React from 'react';
import { ArtifactType } from '../types';
import {
    EyeIcon, MicIcon, UserCircleIcon, 
    DocumentTextIcon, ClipboardListIcon, ArrowsRightLeftIcon, 
    HeartIcon, PuzzlePieceIcon, LightBulbIcon, SwatchIcon, UsersIcon, LockClosedIcon, MapIcon, BeakerIcon, ListCheckIcon, DocumentCheckIcon, MiniBrainIcon, ArchiveIcon, BrainIcon, QuestionMarkIcon,
    CogIcon, UploadIcon
} from './Icons';

interface OptionSelectorProps {
    onSelect: (type: ArtifactType) => void;
    completedArtifacts: ArtifactType[];
}

const categories = [
    {
        name: 'Configurações',
        icon: <CogIcon />,
        theme: {
            text: 'text-zinc-300',
            bgIcon: 'bg-zinc-500/20',
            textIcon: 'text-zinc-200',
            border: 'border-zinc-500/10',
            hoverBorder: 'hover:border-zinc-500/40',
            bgGradient: 'from-zinc-500/10 to-zinc-900/5',
            hoverBg: 'hover:from-zinc-500/20 hover:to-zinc-900/10',
            focusRing: 'focus:ring-zinc-500'
        },
        options: [
            { type: ArtifactType.InitialSetup, icon: <CogIcon />, label: 'Setup Inicial' },
            { type: ArtifactType.LoadKnowledgeBase, icon: <UploadIcon />, label: 'Carregar Base de Conhecimento' },
        ]
    },
    {
        name: 'Empatia',
        icon: <HeartIcon />,
        theme: {
            text: 'text-rose-300',
            bgIcon: 'bg-rose-500/20',
            textIcon: 'text-rose-200',
            border: 'border-rose-500/10',
            hoverBorder: 'hover:border-rose-500/40',
            bgGradient: 'from-rose-500/10 to-rose-900/5',
            hoverBg: 'hover:from-rose-500/20 hover:to-rose-900/10',
            focusRing: 'focus:ring-rose-500'
        },
        options: [
            { type: ArtifactType.Observation, icon: <EyeIcon />, label: 'Resumir Observação' },
            { type: ArtifactType.InterviewQuestions, icon: <MicIcon />, label: 'Gerar Perguntas' },
            { type: ArtifactType.SummarizeInterview, icon: <DocumentTextIcon />, label: 'Resumir Entrevista' },
            { type: ArtifactType.MOTables, icon: <ClipboardListIcon />, label: 'Modelo Organizacional' },
        ]
    },
    {
        name: 'Definição',
        icon: <PuzzlePieceIcon />,
        theme: {
            text: 'text-sky-300',
            bgIcon: 'bg-sky-500/20',
            textIcon: 'text-sky-200',
            border: 'border-sky-500/10',
            hoverBorder: 'hover:border-sky-500/40',
            bgGradient: 'from-sky-500/10 to-rose-900/5',
            hoverBg: 'hover:from-sky-500/20 hover:to-sky-900/10',
            focusRing: 'focus:ring-sky-500'
        },
        options: [
            { type: ArtifactType.Personas, icon: <UserCircleIcon />, label: 'Criar Personas' },
            { type: ArtifactType.EmpathyMap, icon: <HeartIcon />, label: 'Mapa de Empatia' },
            { type: ArtifactType.AgentModel, icon: <UsersIcon />, label: 'Modelo de Agentes' },
            { type: ArtifactType.KnowledgeInventory, icon: <ArchiveIcon />, label: 'Inventário do Conhecimento' },
        ]
    },
    {
        name: 'Ideação',
        icon: <LightBulbIcon />,
        theme: {
            text: 'text-amber-300',
            bgIcon: 'bg-amber-500/20',
            textIcon: 'text-amber-200',
            border: 'border-amber-500/10',
            hoverBorder: 'hover:border-amber-500/40',
            bgGradient: 'from-amber-500/10 to-amber-900/5',
            hoverBg: 'hover:from-amber-500/20 hover:to-amber-900/10',
            focusRing: 'focus:ring-amber-500'
        },
        options: [
            { type: ArtifactType.UserJourney, icon: <MapIcon />, label: 'Jornada do Usuário' },
            { type: ArtifactType.HypothesisGeneration, icon: <QuestionMarkIcon />, label: 'Geração de Hipóteses' },
            { type: ArtifactType.FunctionalRequirements, icon: <DocumentCheckIcon />, label: 'Requisitos Funcionais' },
            { type: ArtifactType.TaskModel, icon: <ListCheckIcon />, label: 'Modelo de Tarefas' },
            { type: ArtifactType.UserFlows, icon: <ArrowsRightLeftIcon />, label: 'Fluxos de Usuário' },
        ]
    },
    {
        name: 'Prototipação',
        icon: <SwatchIcon />,
        theme: {
            text: 'text-violet-300',
            bgIcon: 'bg-violet-500/20',
            textIcon: 'text-violet-200',
            border: 'border-violet-500/10',
            hoverBorder: 'hover:border-violet-500/40',
            bgGradient: 'from-violet-500/10 to-violet-900/5',
            hoverBg: 'hover:from-violet-500/20 hover:to-violet-900/10',
            focusRing: 'focus:ring-violet-500'
        },
        options: [
             { type: ArtifactType.KnowledgeBase, icon: <BrainIcon />, label: 'Base de Conhecimento' },
        ]
    },
    {
        name: 'Testes',
        icon: <BeakerIcon />,
        theme: {
            text: 'text-emerald-300',
            bgIcon: 'bg-emerald-500/20',
            textIcon: 'text-emerald-200',
            border: 'border-emerald-500/10',
            hoverBorder: 'hover:border-emerald-500/40',
            bgGradient: 'from-emerald-500/10 to-emerald-900/5',
            hoverBg: 'hover:from-emerald-500/20 hover:to-emerald-900/10',
            focusRing: 'focus:ring-emerald-500'
        },
        options: [
             { type: ArtifactType.TestCases, icon: <DocumentCheckIcon />, label: 'Casos de Testes' },
             { type: ArtifactType.MonitoringPlan, icon: <ClipboardListIcon />, label: 'Plano Mentor/Mentorado' },
        ]
    }
];

const OptionSelector: React.FC<OptionSelectorProps> = ({ onSelect, completedArtifacts }) => {

    const getDependencyStatus = (type: ArtifactType) => {
        // Se o artefato já foi concluído (ou carregado via JSON), ele deve estar sempre habilitado
        if (completedArtifacts.includes(type)) {
            return { disabled: false };
        }

        // Configurações e ferramentas básicas sempre habilitadas
        if (type === ArtifactType.InitialSetup || type === ArtifactType.LoadKnowledgeBase || 
            type === ArtifactType.Observation || type === ArtifactType.InterviewQuestions || 
            type === ArtifactType.SummarizeInterview || type === ArtifactType.Personas || 
            type === ArtifactType.EmpathyMap || type === ArtifactType.UserJourney || 
            type === ArtifactType.HypothesisGeneration) {
            return { disabled: false };
        }

        if (type === ArtifactType.MOTables) {
            const isCompleted = completedArtifacts.includes(ArtifactType.Observation) || 
                               completedArtifacts.includes(ArtifactType.SummarizeInterview) ||
                               completedArtifacts.includes(ArtifactType.KnowledgeBase);
            return { disabled: !isCompleted };
        }
        if (type === ArtifactType.AgentModel || type === ArtifactType.KnowledgeInventory) {
            const isCompleted = completedArtifacts.includes(ArtifactType.Personas) || 
                               completedArtifacts.includes(ArtifactType.KnowledgeBase);
            return { disabled: !isCompleted };
        }
        if (type === ArtifactType.TaskModel || type === ArtifactType.FunctionalRequirements || type === ArtifactType.UserFlows) {
            const isCompleted = completedArtifacts.includes(ArtifactType.HypothesisGeneration) || 
                               completedArtifacts.includes(ArtifactType.KnowledgeBase);
            return { disabled: !isCompleted };
        }
        if (type === ArtifactType.KnowledgeBase) {
             const isCompleted = completedArtifacts.includes(ArtifactType.HypothesisGeneration) || 
                                completedArtifacts.includes(ArtifactType.FunctionalRequirements);
             return { disabled: !isCompleted };
        }
        if (type === ArtifactType.TestCases) {
             const isCompleted = completedArtifacts.includes(ArtifactType.FunctionalRequirements) || 
                                completedArtifacts.includes(ArtifactType.KnowledgeBase);
             return { disabled: !isCompleted };
        }
        if (type === ArtifactType.MonitoringPlan) {
             const isCompleted = completedArtifacts.includes(ArtifactType.KnowledgeBase) || 
                                completedArtifacts.includes(ArtifactType.FunctionalRequirements);
             return { disabled: !isCompleted };
        }
        return { disabled: false };
    };

    const hasKnowledgeBrainIcon = (type: ArtifactType) => {
        return [
            ArtifactType.MOTables, 
            ArtifactType.AgentModel, 
            ArtifactType.TaskModel, 
            ArtifactType.KnowledgeInventory,
            ArtifactType.KnowledgeBase,
            ArtifactType.MonitoringPlan,
        ].includes(type);
    };

    return (
        <div className="space-y-10">
            {categories.map(category => (
                <div key={category.name} className="animate-fade-in-up">
                    <h3 className={`flex items-center text-sm font-bold mb-4 ${category.theme.text} tracking-wider uppercase ml-1`}>
                        <span className={`mr-2 p-1.5 rounded-lg ${category.theme.bgIcon} shadow-[0_0_10px_rgba(0,0,0,0.2)]`}>{category.icon}</span>
                        {category.name}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {category.options.map(option => {
                            const { disabled } = getDependencyStatus(option.type);
                            const brainIcon = hasKnowledgeBrainIcon(option.type);

                            return (
                                <button
                                    key={option.type}
                                    onClick={() => !disabled && onSelect(option.type)}
                                    disabled={disabled}
                                    className={`
                                        group relative flex items-center text-left p-5 rounded-2xl 
                                        backdrop-blur-sm border transition-all duration-300
                                        ${disabled 
                                            ? 'bg-zinc-800/40 border-white/10 opacity-70 cursor-not-allowed grayscale' 
                                            : `bg-gradient-to-br ${category.theme.bgGradient} ${category.theme.border} ${category.theme.hoverBorder} ${category.theme.hoverBg} focus:outline-none focus:ring-2 ${category.theme.focusRing} transform hover:-translate-y-1 hover:shadow-xl`
                                        }
                                    `}
                                >
                                    <div className={`
                                        mr-4 p-3 rounded-xl transition-all duration-300 shadow-inner relative
                                        ${disabled ? 'bg-zinc-700/50 text-gray-400' : `${category.theme.bgIcon} ${category.theme.textIcon} group-hover:scale-110 group-hover:shadow-[0_0_15px_rgba(255,255,255,0.1)]`}
                                    `}>
                                        {option.icon}
                                        {disabled && (
                                            <div className="absolute -top-1 -right-1 bg-zinc-800 rounded-full p-0.5 border border-white/10 shadow-sm text-gray-400">
                                                <LockClosedIcon />
                                            </div>
                                        )}
                                    </div>

                                    {brainIcon && (
                                        <div className={`absolute top-4 right-4 text-white ${disabled ? 'opacity-40' : 'animate-pulse'}`}>
                                            <MiniBrainIcon />
                                        </div>
                                    )}

                                    <div>
                                        <span className={`font-semibold text-sm block ${disabled ? 'text-gray-400' : 'text-gray-100 group-hover:text-white transition-colors'}`}>
                                            {option.label}
                                        </span>
                                    </div>
                                    {!disabled && (
                                        <div className="absolute inset-0 rounded-2xl bg-white/0 group-hover:bg-white/5 transition-colors duration-300 pointer-events-none"></div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default OptionSelector;
