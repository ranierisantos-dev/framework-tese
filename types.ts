
import type { ReactNode } from 'react';

export enum ArtifactType {
  // Categoria: Configurações
  InitialSetup = 'Setup Inicial',
  LoadKnowledgeBase = 'Carregar Base de Conhecimento',

  // Categoria: Empatia
  Observation = 'Resumir Observação',
  InterviewQuestions = 'Gerar Perguntas de Entrevista',
  SummarizeInterview = 'Resumir Entrevista',
  MOTables = 'Modelo Organizacional',

  // Categoria: Definição
  Personas = 'Criar Personas',
  AgentModel = 'Gerar Modelo de Agentes',
  KnowledgeInventory = 'Inventário do Conhecimento',
  EmpathyMap = 'Gerar Mapa de Empatia',

  // Categoria: Ideação
  UserJourney = 'Jornada do Usuário',
  HypothesisGeneration = 'Geração de Hipóteses',
  FunctionalRequirements = 'Requisitos Funcionais',
  TaskModel = 'Modelo de Tarefas (MT1)',
  UserFlows = 'Desenhar Fluxos de Usuário',

  // Categoria: Prototipação
  KnowledgeBase = 'Base de Conhecimento',

  // Categoria: Testes
  TestCases = 'Casos de Testes',
  MonitoringPlan = 'Plano Mentor/Mentorado',
}

export interface Message {
  id: string;
  sender: 'bot' | 'user';
  content: ReactNode;
  isFullWidth?: boolean;
}

export interface SubArtifact {
    title: string;
    content: string; // The content (e.g., mermaid code)
    type: 'mermaid' | 'text' | 'image';
}

export interface GeneratedArtifact {
    text: string;
    imageUrl?: string;
    isMermaid?: boolean;
    isJson?: boolean;
    multiArtifacts?: SubArtifact[];
}
