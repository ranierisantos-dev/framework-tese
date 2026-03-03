
import { GoogleGenAI, Type } from "@google/genai";
import { ArtifactType, GeneratedArtifact } from '../types';

const API_KEY = process.env.API_KEY || (import.meta as any).env?.VITE_GEMINI_API_KEY;
if (!API_KEY) {
    throw new Error("API_KEY environment variable not set. Please configure GEMINI_API_KEY on Vercel.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const FLASH_MODEL = "gemini-flash-latest";
const PRO_MODEL = "gemini-3.1-pro-preview";

const withRetry = async <T>(fn: () => Promise<T>, retries = 5, delay = 5000): Promise<T> => {
    try {
        return await fn();
    } catch (error: any) {
        const isRateLimit = error?.message?.includes('429') || error?.status === 429;
        const isBusy = error?.message?.includes('503') || error?.status === 503;
        
        if ((isRateLimit || isBusy) && retries > 0) {
            const reason = isRateLimit ? "Quota/Rate limit (429)" : "Model busy (503)";
            console.warn(`${reason}. Retrying in ${delay}ms... (${retries} attempts left)`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return withRetry(fn, retries - 1, delay * 1.5);
        }
        throw error;
    }
};

const safeParseJson = (jsonString: string): any => {
    const match = jsonString.match(/```(json)?\s*([\s\S]*?)\s*```/);
    let textToParse = jsonString.trim();

    if (match && match[2]) {
        textToParse = match[2];
    } else {
        const firstBrace = textToParse.indexOf('{');
        const lastBrace = textToParse.lastIndexOf('}');
        const firstBracket = textToParse.indexOf('[');
        const lastBracket = textToParse.lastIndexOf(']');

        if (firstBracket !== -1 && lastBracket !== -1 && (firstBrace === -1 || firstBracket < firstBrace)) {
             textToParse = textToParse.substring(firstBracket, lastBracket + 1);
        } else if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
            textToParse = textToParse.substring(firstBrace, lastBrace + 1);
        }
    }
    
    try {
        let parsed = JSON.parse(textToParse);
        if (typeof parsed === 'string') {
            parsed = JSON.parse(parsed);
        }
        return parsed;
    } catch (error) {
        console.error("Failed to parse JSON:", textToParse);
        return null;
    }
};

const cleanMermaidCode = (code: string): string => {
    if (!code) return '';
    let clean = code
        .replace(/```mermaid/gi, '')
        .replace(/```/g, '')
        .replace(/<br\s*\/?>/gi, '\\n')
        .replace(/<[^>]*>/g, '');
    clean = clean.trim();
    const lines = clean.split('\n');
    const keywords = ['graph', 'flowchart', 'sequenceDiagram', 'classDiagram', 'stateDiagram', 'stateDiagram-v2', 'erDiagram', 'gantt', 'pie', 'journey', 'mindmap', 'timeline'];
    let startLineIndex = -1;
    for (let i = 0; i < lines.length; i++) {
      const trimmedLine = lines[i].trim();
      if (keywords.some(kw => trimmedLine.startsWith(kw))) {
        startLineIndex = i;
        break;
      }
    }
    if (startLineIndex !== -1) {
      clean = lines.slice(startLineIndex).join('\n');
    } else if (clean.includes('-->') || clean.includes('---')) {
        clean = 'graph TD\n' + clean;
    }
    clean = clean.replace(/`/g, "'");
    return clean.trim();
};

export const suggestPersonasFromContext = async (context: string): Promise<string[]> => {
    const prompt = `Atue como um UX Researcher Sênior. Analise o contexto do projeto fornecido abaixo e identifique de 1 a 3 personas críticoas. Contexto: ${context}`;
    try {
        const response = await withRetry(() => ai.models.generateContent({
            model: FLASH_MODEL,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } }
            }
        }));
        const parsed = safeParseJson(response.text);
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) { 
        console.error("Error in suggestPersonasFromContext:", error);
        return []; 
    }
};

const getObservationSummary = async (context: string): Promise<GeneratedArtifact> => {
    const prompt = `Atue como um Especialista em UX Research Sênior. Crie um relatório de síntese estruturado em Markdown (Contexto, Comportamentos, Pontos de Dor, Gambiarras, Oportunidades). Contexto: ${context}`;
    try {
        const response = await withRetry(() => ai.models.generateContent({ model: FLASH_MODEL, contents: prompt }));
        return { text: response.text };
    } catch (error) {
        console.error("Error in getObservationSummary:", error);
        throw error;
    }
};

const getInterviewQuestions = async (context: string): Promise<GeneratedArtifact> => {
    const prompt = `Atue como um Especialista em UX Research. Crie um roteiro de entrevista semi-estruturado em Markdown. Contexto: ${context}`;
    try {
        const response = await withRetry(() => ai.models.generateContent({ model: FLASH_MODEL, contents: prompt }));
        return { text: response.text };
    } catch (error) {
        console.error("Error in getInterviewQuestions:", error);
        throw error;
    }
};

const getEmpathyMap = async (context: string): Promise<GeneratedArtifact> => {
    const identificationPrompt = `Identifique Personas no texto e retorne JSON list [{name, role}]. Contexto: ${context}`;
    let targets: { name: string; role: string }[] = [];
    try {
        const idResponse = await withRetry(() => ai.models.generateContent({
            model: FLASH_MODEL,
            contents: identificationPrompt,
            config: { responseMimeType: "application/json", responseSchema: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, role: { type: Type.STRING } } } } }
        }));
        const parsed = safeParseJson(idResponse.text);
        if (parsed) targets = parsed;
    } catch (e) {
        console.error("Error identifying personas for Empathy Map:", e);
    }
    if (targets.length === 0) targets.push({ name: "Usuário Típico", role: "Usuário Principal" });
    let fullMarkdown = "# Mapas de Empatia\n\n";
    let firstImageUrl: string | undefined = undefined;
    for (const target of targets) {
        const dataPrompt = `Crie um Mapa de Empatia detalhado (JSON: see, hear, thinkAndFeel, sayAndDo, pains, gains) para: ${target.name}. Contexto: ${context}`;
        let empathyData: any = {};
        try {
            const response = await withRetry(() => ai.models.generateContent({
                model: FLASH_MODEL,
                contents: dataPrompt,
                config: { responseMimeType: "application/json", responseSchema: { type: Type.OBJECT, properties: { see: { type: Type.ARRAY, items: { type: Type.STRING } }, hear: { type: Type.ARRAY, items: { type: Type.STRING } }, thinkAndFeel: { type: Type.ARRAY, items: { type: Type.STRING } }, sayAndDo: { type: Type.ARRAY, items: { type: Type.STRING } }, pains: { type: Type.ARRAY, items: { type: Type.STRING } }, gains: { type: Type.ARRAY, items: { type: Type.STRING } } } } }
            }));
            const parsed = safeParseJson(response.text);
            if (parsed) empathyData = parsed;
        } catch (error) { 
            console.error(`Error generating empathy data for ${target.name}:`, error);
            continue; 
        }
        const imagePrompt = `UX Empathy Map diagram for persona: "${target.name}". sticky notes, professional, 4k.`;
        let currentImageUrl: string | null = null;
        try {
            const imageResponse = await withRetry(() => ai.models.generateContent({ model: 'gemini-2.5-flash-image', contents: { parts: [{ text: imagePrompt }] } }));
            if (imageResponse.candidates?.[0].content.parts) {
                for (const part of imageResponse.candidates[0].content.parts) {
                    if (part.inlineData) { currentImageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`; if (!firstImageUrl) firstImageUrl = currentImageUrl; break; }
                }
            }
        } catch (e) {
            console.error(`Error generating image for ${target.name}:`, e);
        }
        fullMarkdown += `## Persona: ${target.name}\n${currentImageUrl ? `\n![Mapa de Empatia](${currentImageUrl})\n` : ""}\n### 1. VÊ\n${empathyData.see?.map((i: string) => `- ${i}`).join('\n')}\n### 2. OUVE\n${empathyData.hear?.map((i: string) => `- ${i}`).join('\n')}\n### 3. PENSA/SENTE\n${empathyData.thinkAndFeel?.map((i: string) => `- ${i}`).join('\n')}\n### 4. FALA/FAZ\n${empathyData.sayAndDo?.map((i: string) => `- ${i}`).join('\n')}\n### 5. DORES\n${empathyData.pains?.map((i: string) => `- ${i}`).join('\n')}\n### 6. GANHOS\n${empathyData.gains?.map((i: string) => `- ${i}`).join('\n')}\n---\n`;
    }
    return { text: fullMarkdown.trim(), imageUrl: firstImageUrl };
};

const generatePersonaImage = async (visualDescription: string): Promise<string | null> => {
    try {
        const response = await withRetry(() => ai.models.generateContent({ model: 'gemini-2.5-flash-image', contents: { parts: [{ text: `Professional portrait: ${visualDescription}. neutral blurred background.` }] } }));
        if (response.candidates?.[0].content.parts) {
            for (const part of response.candidates[0].content.parts) { if (part.inlineData) return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`; }
        }
        return null;
    } catch (e) { return null; }
};

const getPersona = async (context: string): Promise<GeneratedArtifact> => {
    const textPrompt = `Atue como um UX Strategist. GERE FICHAS DE PERSONAS em Markdown (Descrição Visual, Citação, Bio, Objetivos, Dores). Contexto: ${context}`;
    try {
        const response = await withRetry(() => ai.models.generateContent({ model: FLASH_MODEL, contents: textPrompt }));
        let generatedText = response.text;
        const personaBlocksRegex = /# (.*?)\n\n\*\*Descrição Visual:\*\* (.*?)(?=\n)/g;
        let match;
        let modifiedText = generatedText;
        const replacements = [];
        while ((match = personaBlocksRegex.exec(generatedText)) !== null) {
            const name = match[1].trim();
            const visualDescription = match[2].trim();
            const base64Image = await generatePersonaImage(visualDescription);
            if (base64Image) { replacements.push({ start: match.index, end: match.index + match[0].length, imageHtml: `# ${name}\n\n![${name}](${base64Image})\n` }); }
        }
        for (let i = replacements.length - 1; i >= 0; i--) { const rep = replacements[i]; modifiedText = modifiedText.substring(0, rep.start) + rep.imageHtml + modifiedText.substring(rep.end); }
        return { text: modifiedText };
    } catch (error) {
        console.error("Error in getPersona:", error);
        throw error;
    }
};

const getAgentModel = async (context: string): Promise<GeneratedArtifact> => {
    const prompt = `Atue como um Engenheiro do Conhecimento (CommonKADS). Gere o Modelo de Agentes (Papel, Envolvidos, Comunicação, Conhecimento, Competências, Responsabilidades). SEM NOMES PRÓPRIOS. Contexto: ${context}`;
    try {
        const response = await withRetry(() => ai.models.generateContent({ model: FLASH_MODEL, contents: prompt }));
        return { text: response.text };
    } catch (error) {
        console.error("Error in getAgentModel:", error);
        throw error;
    }
};

const getKnowledgeInventory = async (context: string): Promise<GeneratedArtifact> => {
    const prompt = `Atue como um Especialista em Engenharia e Gestão do Conhecimento Sênior. 
    Sua tarefa é gerar um Inventário do Conhecimento (Knowledge Inventory) detalhado utilizando o framework da APO Knowledge Management (Asian Productivity Organization).
    
    Analise TODO o contexto do projeto fornecido para identificar os ativos de conhecimento necessários (tanto conhecimentos Tácitos quanto Explícitos).
    
    Para cada conhecimento identificado, gere OBRIGATORIAMENTE o seguinte formato em Markdown:
    
    ## #X - [Título do conhecimento]
    **Tipo de Conhecimento:** [Tácito (experiência, intuição) ou Explícito (manuais, PDFs, bases de dados)]
    **Descrição:** [Um resumo detalhado do que se trata esse conhecimento]
    **Área Funcional:** [Departamento ou projeto ao qual pertence (Ex: RH, Engenharia, Vendas)]
    **Detentor do Conhecimento:** [Ator, persona ou setor detentor do conhecimento (Knowledge Holder)]
    **Nível de Criticidade:** [Alta, Média ou Baixa]
    **Nível de Disponibilidade:** [O conhecimento é fácil de encontrar ou está "escondido"?]
    **Necessidade Futura:** [A organização vai precisar mais ou menos desse conhecimento daqui a 2 anos?]
    **Risco de Perda:** [Existe risco de o especialista se aposentar ou sair da empresa em breve? Ou de os dados se tornarem obsoletos?]
    
    Regras Adicionais:
    1. Substitua "X" pela numeração sequencial (1, 2, 3...).
    2. NÃO use emojis.
    3. NÃO use tags HTML como <br>.
    4. Pule duas linhas entre cada bloco de conhecimento.
    
    Contexto do Projeto:
    ${context}`;
    
    try {
        const response = await withRetry(() => ai.models.generateContent({ 
            model: FLASH_MODEL, 
            contents: prompt 
        }));
        return { text: response.text };
    } catch (error) {
        console.error("Error in getKnowledgeInventory:", error);
        throw error;
    }
};

const getKnowledgeBase = async (context: string): Promise<GeneratedArtifact> => {
    const prompt = `Atue como um Engenheiro do Conhecimento Sênior. 
    Sua tarefa é organizar TODO o histórico do projeto fornecido no contexto em uma Base de Conhecimento Estruturada no formato JSON.
    
    Regras estritas:
    1. O resultado deve ser um objeto JSON único e bem formatado.
    2. Adicione ao INÍCIO do JSON o campo "instrucoes_geracao_ui" com o valor exato: "Gere as telas do sistema descrito neste arquivo Json, com o idioma em português/brasileiro (pt/BR)".
    3. Inclua seções para Personas, Requisitos, Tarefas, Modelo de Agentes, etc. (conforme disponível no contexto).
    4. NÃO inclua absolutamente nada relacionado com "Casos de Teste" nem com o "Plano Mentor/Mentorado".
    5. NÃO inclua imagens ou links de dados base64.
    6. Se houver diagramas de fluxo, extraia APENAS o código Mermaid puro.
    7. Sintetize informações redundantes mantendo a fidelidade técnica.
    
    Contexto do Projeto:
    ${context}`;

    try {
        const response = await withRetry(() => ai.models.generateContent({ 
            model: PRO_MODEL, 
            contents: prompt,
            config: {
                responseMimeType: "application/json"
            }
        }));

        return { text: response.text, isJson: true };
    } catch (error) {
        console.error("Error in getKnowledgeBase:", error);
        throw error;
    }
};

const getInterviewSummary = async (context: string): Promise<GeneratedArtifact> => {
    const prompt = `Atue como um UX Researcher. Resuma a entrevista em Markdown (Resumo, Insights, Necessidades, Citações). Contexto: ${context}`;
    try {
        const response = await withRetry(() => ai.models.generateContent({ model: FLASH_MODEL, contents: prompt }));
        return { text: response.text };
    } catch (error) {
        console.error("Error in getInterviewSummary:", error);
        throw error;
    }
};

const getMOTables = async (context: string): Promise<GeneratedArtifact> => {
    const prompt = `Atue como um Engenheiro do Conhecimento (CommonKADS). Gere tabelas MO1 e MO5 em Markdown (Problemas, Contexto, Fatores Externos, Soluções, Aplicabilidades, Riscos, Ações). Use NEGRITO nos títulos. Contexto: ${context}`;
    try {
        const response = await withRetry(() => ai.models.generateContent({ model: FLASH_MODEL, contents: prompt }));
        return { text: response.text };
    } catch (error) {
        console.error("Error in getMOTables:", error);
        throw error;
    }
};

const getUserJourney = async (context: string): Promise<GeneratedArtifact> => {
    const identificationPrompt = `Identifique Personas (JSON array {name, role}). Contexto: ${context}`;
    let targets: { name: string; role: string }[] = [];
    try {
        const idResponse = await withRetry(() => ai.models.generateContent({ model: FLASH_MODEL, contents: identificationPrompt, config: { responseMimeType: "application/json" } }));
        const parsed = safeParseJson(idResponse.text);
        if (parsed) targets = parsed;
    } catch (e) {
        console.error("Error identifying personas for User Journey:", e);
    }
    if (targets.length === 0) targets.push({ name: "Usuário Padrão", role: "Principal" });
    let fullMarkdown = "";
    for (const target of targets) {
        const prompt = `Crie Jornada do Usuário (Gibbons) para: ${target.name}. Contexto: ${context}`;
        try {
            const response = await withRetry(() => ai.models.generateContent({ model: FLASH_MODEL, contents: prompt }));
            fullMarkdown += `## Jornada: ${target.name}\n\n${response.text}\n\n---\n\n`;
        } catch (err) {
            console.error("Error in getUserJourney for target:", target.name, err);
        }
    }
    return { text: fullMarkdown };
};

const getHypotheses = async (context: string): Promise<GeneratedArtifact> => {
    const prompt = `Atue como um UX Architect e Designer de Interação Sênior. 
    Com base no contexto do projeto, crie uma Árvore de Funcionalidades (Geração de Hipóteses) organizada por módulos. 
    
    REGRAS ESTRITAS:
    1. NÃO inclua seções de "Dica para Visualização", "Nota", "Observação sobre formatação" ou qualquer instrução ou dica de como visualizar ou interpretar o conteúdo.
    2. Retorne apenas a estrutura hierárquica das funcionalidades em Markdown.
    3. Seja direto e objective, apresentando apenas as hipóteses de funcionalidades.
 
    Contexto: ${context}`;
    try {
        const response = await withRetry(() => ai.models.generateContent({ model: FLASH_MODEL, contents: prompt }));
        return { text: response.text };
    } catch (error) {
        console.error("Error in getHypotheses:", error);
        throw error;
    }
};

const getFunctionalRequirements = async (context: string): Promise<GeneratedArtifact> => {
    const prompt = `Atue como um Engenheiro de Software Sênior. Sua tarefa é gerar Requisitos Funcionais detalhados.
    
    REGRAS ESTRITAS DE FORMATAÇÃO:
    1. Organize o conteúdo por módulos. Cada título de módulo deve começar com a linha: "Módulo: [Nome do Módulo]" (sem negrito no Markdown).
    2. Para cada requisito, use the formato: **Requisito #X: [Título do Requisito]** (Onde X é o número sequencial). O número e o título devem estar em negrito.
    3. Logo após a descrição de cada requisito, você DEVE gerar obrigatoriamente os "Critérios de Aceitação" no formato: "Critérios de Aceitação: Dado que <situação>, quando <ação>, então <resultado esperado>."
    4. NÃO use negrito ou formatação especial na palavra "Critérios de Aceitação:".
    5. NÃO use emojis. NÃO use tags HTML.
    
    Contexto do Projeto:
    ${context}`;
    try {
        const response = await withRetry(() => ai.models.generateContent({ model: FLASH_MODEL, contents: prompt }));
        return { text: response.text };
    } catch (error) {
        console.error("Error in getFunctionalRequirements:", error);
        throw error;
    }
};

const getTaskModel = async (context: string): Promise<GeneratedArtifact> => {
    const prompt = `Crie o Modelo de Tarefas (CommonKADS MT1). Contexto: ${context}`;
    try {
        const response = await withRetry(() => ai.models.generateContent({ model: FLASH_MODEL, contents: prompt }));
        return { text: response.text };
    } catch (error) {
        console.error("Error in getTaskModel:", error);
        throw error;
    }
};

const getUserFlows = async (context: string): Promise<GeneratedArtifact> => {
    const prompt = `Identifique módulos e gere diagramas Mermaid (graph TD) em JSON [{title, code}]. Contexto: ${context}`;
    try {
        const response = await withRetry(() => ai.models.generateContent({
            model: FLASH_MODEL,
            contents: prompt,
            config: { responseMimeType: "application/json" }
        }));
        const parsed = safeParseJson(response.text);
        if (Array.isArray(parsed)) {
            const artifacts = parsed.map((item: any) => ({ title: item.title, content: cleanMermaidCode(item.code || ""), type: 'mermaid' as const }));
            return { text: "Fluxos gerados.", multiArtifacts: artifacts };
        }
    } catch (e) {
        console.error("Error in getUserFlows:", e);
    }
    return { text: "Erro ao gerar fluxos.", multiArtifacts: [] };
};

const getTestCases = async (context: string): Promise<GeneratedArtifact> => {
    const prompt = `Atue como um QA Engineer Sênior. Sua tarefa é transformar cada Requisito Funcional identificado no contexto em um Caso de Teste detalhado.

    Gere OBRIGATORIAMENTE um caso de teste para cada requisito, seguindo EXATAMENTE o seguinte template em Markdown:

    ## #X - [Título do Requisito]
    **Título/Descrição do Caso de Teste:** [Breve título ou resumo do propósito do caso de teste]
    **Pré-condições:** [Qualquer configuração ou condição que deve ser atendida antes da execução do teste]
    **Etapas de teste:** [Uma lista de ações ou instruções a serem seguidas durante o teste]
    **resultados esperados:** [O resultado esperado de cada etapa, baseado nos critérios de aceitação (Dado/Quando/Então)]
    **Resultados reais:** A ser preenchido durante execução
    **Pós-condições:** O estado do aplicativo após a execução do teste
    **Status (Aprovado/Reprovado):** Pendente
    **Observações:** [Quaisquer notas ou comentários adicionais relacionados à execução do caso de teste]
    **Dados de teste:** [Valores de entrada específicos usados ​​durante a execução do teste (se aplicável)]

    REGRAS ADICIONAIS:
    1. O título do Caso de Teste deve ser no formato: "#X - [Título do Requisito]" (Ex: #1 - Login do Usuário).
    2. NÃO use emojis. NÃO use tags HTML.
    3. Pule duas linhas entre cada caso de teste.
    4. Mantenha os nomes dos campos em negrito conforme the template.

    Contexto do Projeto:
    ${context}`;
    try {
        const response = await withRetry(() => ai.models.generateContent({ model: FLASH_MODEL, contents: prompt }));
        return { text: response.text };
    } catch (error) {
        console.error("Error in getTestCases:", error);
        throw error;
    }
};

const getMentorPlan = async (context: string): Promise<GeneratedArtifact> => {
    const prompt = `Atue como um Engenheiro do Conhecimento Sênior e Especialista em Treinamento Corporativo. Sua tarefa é criar o "Mentor / Mentee Scheme" do framework APO Knowledge Management.
    
    Analise TODO o contexto do projeto e identifique as personas. Para CADA persona, crie um plano individual de mentoria detalhando como os conhecimentos acerca do uso do novo sistema serão compartilhados.
    
    REGRAS ESTRITAS DE FORMATAÇÃO (Siga EXATAMENTE este template para cada persona):
    
    # Mentoria do Usuário [Nome da Persona]
    Mentor: [Especifique o profissional/papel que será o mentor desta persona, ex: Líder de Projeto, Analista Sênior, Desenvolvedor]
    Objetivos de Desenvolvimento: (O que o Mentorado deve aprender e o que o Mentor deve transferir em relação ao sistema?)
    Conhecimento Tácito: (Ex: "Habilidade de negociação com fornecedores críticos")
    Conhecimento Explícito: (Ex: "Domínio técnico do software de gestão de estoque")
    Plano de Atividades: (Listagem numerada das atividades, encontros, mentorias e temas a serem desenvolvidos nas seções para garantir a adoção do sistema)

    REGRAS ADICIONAIS:
    1. Gere um bloco completo para cada persona identificada.
    2. NÃO use emojis. NÃO use tags HTML.
    3. NÃO use negrito nos rótulos internos (Mentor, Objetivos, etc), apenas nos títulos principais se necessário.
    4. Seja específico sobre a transferência de conhecimento para o SISTEMA descrito no contexto.
    
    Contexto do Projeto:
    ${context}`;
    try {
        const response = await withRetry(() => ai.models.generateContent({ model: FLASH_MODEL, contents: prompt }));
        return { text: response.text };
    } catch (error) {
        console.error("Error in getMentorPlan:", error);
        throw error;
    }
};

export const refineArtifact = async (artifactType: ArtifactType, currentContent: string, suggestions: string): Promise<GeneratedArtifact> => {
    const prompt = `Atue como um Especialista em UX e Engenharia do Conhecimento. 
    Você gerou anteriormente o seguinte artefato do tipo "${artifactType}":
    
    --- CONTEÚDO ATUAL ---
    ${currentContent}
    --- FIM DO CONTEÚDO ATUAL ---
    
    O usuário solicitou as seguintes alterações/refinamentos:
    "${suggestions}"
    
    Sua tarefa é reescrever o artefato incorporando as sugestões do usuário, mantendo a estrutura técnica e a qualidade anterior. 
    Retorne o artefato completo e atualizado.`;

    try {
        const response = await withRetry(() => ai.models.generateContent({ 
            model: FLASH_MODEL, 
            contents: prompt 
        }));
        
        return { text: response.text };
    } catch (error) {
        console.error("Error in refineArtifact:", error);
        throw error;
    }
};

export const generateArtifact = async (artifactType: ArtifactType, context: string): Promise<GeneratedArtifact> => {
    switch (artifactType) {
        case ArtifactType.Observation: return getObservationSummary(context);
        case ArtifactType.InterviewQuestions: return getInterviewQuestions(context);
        case ArtifactType.SummarizeInterview: return getInterviewSummary(context);
        case ArtifactType.MOTables: return getMOTables(context);
        case ArtifactType.Personas: return getPersona(context);
        case ArtifactType.AgentModel: return getAgentModel(context);
        case ArtifactType.KnowledgeInventory: return getKnowledgeInventory(context);
        case ArtifactType.EmpathyMap: return getEmpathyMap(context);
        case ArtifactType.KnowledgeBase: return getKnowledgeBase(context);
        case ArtifactType.UserJourney: return getUserJourney(context);
        case ArtifactType.HypothesisGeneration: return getHypotheses(context);
        case ArtifactType.FunctionalRequirements: return getFunctionalRequirements(context);
        case ArtifactType.TaskModel: return getTaskModel(context);
        case ArtifactType.UserFlows: return getUserFlows(context);
        case ArtifactType.TestCases: return getTestCases(context);
        case ArtifactType.MonitoringPlan: return getMentorPlan(context);
        default: throw new Error('Tipo de artefato desconhecido');
    }
};
