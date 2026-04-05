import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, ImageRun } from "docx";
import { jsPDF } from "jspdf";

// App Theme Colors for PDF
const THEME = {
    bg: [9, 9, 11],         // Zinc 950
    cardBg: [24, 24, 27],   // Zinc 900
    text: [228, 228, 231],  // Zinc 200 (Brighter for better contrast)
    textBold: [255, 255, 255], // White
    accent: [249, 115, 22], // Orange 500
    accentSecondary: [251, 191, 36], // Amber 400
    border: [63, 63, 70]    // Zinc 700
};

/**
 * Limpa o texto removendo tags HTML e emojis para garantir compatibilidade
 * e atender aos requisitos de exportação limpa.
 */
const cleanTextForExport = (text: string): string => {
    if (!text) return "";
    
    // 1. Ignorar linhas que são puramente separadores de tabela (ex: |---| ou | :--- |)
    if (text.trim().match(/^\|?[\s\-:|]+\|?$/) && text.includes('---')) {
        return "";
    }

    // 2. Remover o caractere pipe (|) usado em tabelas e referências a "Tabela"
    let cleaned = text.replace(/\|/g, ' ');
    cleaned = cleaned.replace(/Tabela\s?\d*:?\s?/gi, ''); // Remove "Tabela 1:", "Tabela:", etc.
    
    // 3. Remover tags HTML (ex: <br>, <div>, etc)
    cleaned = cleaned.replace(/<[^>]*>/g, '');
    
    // 4. Remover Emojis usando regex de ranges Unicode
    cleaned = cleaned.replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '');
    
    return cleaned.trim();
};

export const generateAndDownloadDocx = async (title: string, subtitle: string, content: string) => {
    const lines = content.split('\n');
    const docChildren: (Paragraph)[] = [];

    docChildren.push(
        new Paragraph({
            text: cleanTextForExport(title),
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 },
        })
    );

    docChildren.push(
        new Paragraph({
            text: cleanTextForExport(subtitle),
            heading: HeadingLevel.HEADING_2,
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 },
        })
    );

    const imageRegex = /!\[(.*?)\]\((data:image\/(.*?);base64,.*?)\)/;

    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) {
            docChildren.push(new Paragraph({ text: "" }));
            continue;
        }

        const imageMatch = trimmed.match(imageRegex);

        if (imageMatch) {
            try {
                const fullDataUri = imageMatch[2];
                const mimeType = imageMatch[3].toLowerCase();
                const base64Data = fullDataUri.split(',')[1];
                
                const imageBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

                let imgType: "png" | "jpeg" | "gif" | "bmp" | "svg" = "png";
                if (mimeType === 'jpg' || mimeType === 'jpeg') {
                    imgType = "jpeg";
                } else if (mimeType === 'svg+xml' || mimeType === 'svg') {
                    imgType = "svg";
                }

                docChildren.push(new Paragraph({
                    children: [
                        new ImageRun({
                            data: imageBuffer,
                            transformation: {
                                width: 300,
                                height: 300,
                            }
                        })
                    ],
                    alignment: AlignmentType.CENTER,
                    spacing: { before: 200, after: 200 }
                }));
            } catch (e) {
                console.error("Error embedding image in Docx", e);
            }
            continue;
        }

        const cleanedLine = cleanTextForExport(trimmed);
        if (!cleanedLine) continue;

        if (cleanedLine.startsWith('Módulo:') || cleanedLine.startsWith('MÓDULO:')) {
            docChildren.push(new Paragraph({
                children: [
                    new TextRun({
                        text: cleanedLine,
                        color: "F97316", // Laranja solicitado
                        bold: true,
                    })
                ],
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 240, after: 120 }
            }));
        } else if (cleanedLine.startsWith('**RF') || cleanedLine.startsWith('**Requisito')) {
            const content = cleanedLine.replace(/\*\*/g, '');
            docChildren.push(new Paragraph({
                children: [
                    new TextRun({
                        text: content,
                        bold: true,
                    })
                ],
                spacing: { before: 200, after: 100 }
            }));
        } else if (cleanedLine.startsWith('#### ')) {
            docChildren.push(new Paragraph({
                children: [
                    new TextRun({
                        text: cleanedLine.replace('#### ', ''),
                        bold: true,
                    })
                ],
                spacing: { before: 180, after: 90 }
            }));
        } else if (cleanedLine.startsWith('### ')) {
            docChildren.push(new Paragraph({
                text: cleanedLine.replace('### ', ''),
                heading: HeadingLevel.HEADING_3,
                spacing: { before: 200, after: 100 }
            }));
        } else if (cleanedLine.startsWith('## ')) {
            docChildren.push(new Paragraph({
                text: cleanedLine.replace('## ', ''),
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 240, after: 120 }
            }));
        } else if (cleanedLine.startsWith('# ')) {
            docChildren.push(new Paragraph({
                text: cleanedLine.replace('# ', ''),
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 280, after: 140 }
            }));
        } else {
            const parts = parseBoldText(cleanedLine);
            docChildren.push(new Paragraph({
                children: parts,
                spacing: { after: 120 },
                bullet: (cleanedLine.startsWith('- ') || cleanedLine.startsWith('* ')) ? { level: 0 } : undefined
            }));
        }
    }

    const doc = new Document({
        sections: [{
            properties: {},
            children: docChildren,
        }],
    });

    const blob = await Packer.toBlob(doc);
    saveBlob(blob, `${subtitle.replace(/\s+/g, '_')}.docx`);
};

export const generateAndDownloadPdf = (title: string, subtitle: string, content: string) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20; 
    const maxLineWidth = pageWidth - (margin * 2);
    let yPos = 20;

    const drawPageBackground = () => {
        doc.setFillColor(THEME.bg[0], THEME.bg[1], THEME.bg[2]);
        doc.rect(0, 0, pageWidth, pageHeight, 'F');

        doc.setDrawColor(THEME.accent[0], THEME.accent[1], THEME.accent[2]);
        doc.setLineWidth(0.5);
        doc.line(margin, 15, pageWidth - margin, 15);
        
        doc.setFontSize(8);
        doc.setTextColor(THEME.accentSecondary[0], THEME.accentSecondary[1], THEME.accentSecondary[2]);
        doc.setFont("helvetica", "bold");
        doc.text("AGENTE UX", margin, 12);
        
        doc.setTextColor(100, 100, 100);
        doc.setFont("helvetica", "normal");
        doc.text(new Date().toLocaleDateString(), pageWidth - margin, 12, { align: "right" });
    };

    const checkPageBreak = (heightNeeded: number) => {
        if (yPos + heightNeeded > pageHeight - margin) {
            // Salva o estado atual da fonte para restaurar após desenhar o cabeçalho da nova página
            const fontSize = doc.getFontSize();
            const font = doc.getFont();
            const textColor = doc.getTextColor();

            doc.addPage();
            drawPageBackground();
            
            // Restaura o estado da fonte
            doc.setFontSize(fontSize);
            doc.setFont(font.fontName, font.fontStyle);
            doc.setTextColor(textColor);

            yPos = 30;
            return true;
        }
        return false;
    }

    drawPageBackground();
    yPos = 30;

    doc.setFontSize(22);
    doc.setTextColor(THEME.accent[0], THEME.accent[1], THEME.accent[2]);
    doc.setFont("helvetica", "bold");
    
    const splitTitle = doc.splitTextToSize(cleanTextForExport(title), maxLineWidth);
    splitTitle.forEach((line: string) => {
        doc.text(line, pageWidth / 2, yPos, { align: "center" });
        yPos += 10;
    });
    yPos += 5;

    doc.setFontSize(16);
    doc.setTextColor(THEME.textBold[0], THEME.textBold[1], THEME.textBold[2]);
    doc.setFont("helvetica", "normal");
    
    const splitSubtitle = doc.splitTextToSize(cleanTextForExport(subtitle), maxLineWidth);
    splitSubtitle.forEach((line: string) => {
        doc.text(line, pageWidth / 2, yPos, { align: "center" });
        yPos += 8;
    });
    yPos += 20;

    doc.setDrawColor(THEME.border[0], THEME.border[1], THEME.border[2]);
    doc.line(margin, yPos - 10, pageWidth - margin, yPos - 10);

    const BODY_FONT_SIZE = 10;
    const HEADER_1_SIZE = 16;
    const HEADER_2_SIZE = 14;
    const HEADER_3_SIZE = 12;

    doc.setFontSize(BODY_FONT_SIZE);
    
    const lines = content.split('\n');
    const imageRegex = /!\[(.*?)\]\((data:image\/(.*?);base64,.*?)\)/;

    lines.forEach(line => {
        const trimmed = line.trim();
        
        if (!trimmed) {
            yPos += 4;
            checkPageBreak(5);
            return;
        }

        const imageMatch = trimmed.match(imageRegex);
        if (imageMatch) {
            try {
                const fullDataUri = imageMatch[2];
                const mimeType = imageMatch[3].toLowerCase();
                const imgHeight = 90; 
                const imgWidth = 90;
                checkPageBreak(imgHeight + 10);
                const xPos = (pageWidth - imgWidth) / 2;
                doc.setDrawColor(THEME.border[0], THEME.border[1], THEME.border[2]);
                doc.setFillColor(THEME.cardBg[0], THEME.cardBg[1], THEME.cardBg[2]);
                doc.roundedRect(xPos - 2, yPos - 2, imgWidth + 4, imgHeight + 4, 3, 3, 'FD');
                let format = 'PNG';
                if (mimeType === 'jpg' || mimeType === 'jpeg') format = 'JPEG';
                if (mimeType === 'webp') format = 'WEBP';
                doc.addImage(fullDataUri, format, xPos, yPos, imgWidth, imgHeight);
                yPos += imgHeight + 15;
            } catch (e) {
                console.error("Error adding image to PDF", e);
            }
            return;
        }

        const cleanedLine = cleanTextForExport(trimmed);
        if (!cleanedLine) return;

        // Título do Módulo (Laranja)
        if (cleanedLine.startsWith('Módulo:') || cleanedLine.startsWith('MÓDULO:')) {
            doc.setFont("helvetica", "bold");
            doc.setFontSize(HEADER_2_SIZE);
            doc.setTextColor(THEME.accent[0], THEME.accent[1], THEME.accent[2]); 
            
            const splitMod = doc.splitTextToSize(cleanedLine, maxLineWidth);
            checkPageBreak((splitMod.length * HEADER_2_SIZE) + 5);
            
            splitMod.forEach((mLine: string) => {
                doc.text(mLine, margin, yPos);
                yPos += HEADER_2_SIZE * 0.8;
            });
            yPos += 5;
            return;
        }

        // Cabeçalhos (Hierarquia)
        if (cleanedLine.startsWith('# ')) {
            const textToPrint = cleanedLine.replace('# ', '').replace(/\*\*/g, '');
            doc.setFont("helvetica", "bold");
            doc.setFontSize(HEADER_1_SIZE);
            doc.setTextColor(THEME.textBold[0], THEME.textBold[1], THEME.textBold[2]);
            
            const splitH1 = doc.splitTextToSize(textToPrint, maxLineWidth);
            checkPageBreak(splitH1.length * HEADER_1_SIZE);
            
            splitH1.forEach((hLine: string) => {
                doc.text(hLine, margin, yPos + 4);
                yPos += HEADER_1_SIZE * 0.8;
            });
            yPos += 4;
            return;
        } 
        
        if (cleanedLine.startsWith('## ')) {
            const textToPrint = cleanedLine.replace('## ', '').replace(/\*\*/g, '');
            doc.setFont("helvetica", "bold");
            doc.setFontSize(HEADER_2_SIZE);
            doc.setTextColor(THEME.textBold[0], THEME.textBold[1], THEME.textBold[2]);
            
            const splitH2 = doc.splitTextToSize(textToPrint, maxLineWidth);
            checkPageBreak(splitH2.length * HEADER_2_SIZE);
            
            splitH2.forEach((hLine: string) => {
                doc.text(hLine, margin, yPos + 3);
                yPos += HEADER_2_SIZE * 0.8;
            });
            yPos += 3;
            return;
        }

        if (cleanedLine.startsWith('#### ')) {
            const textToPrint = cleanedLine.replace('#### ', '').replace(/\*\*/g, '');
            doc.setFont("helvetica", "bold");
            doc.setFontSize(BODY_FONT_SIZE);
            doc.setTextColor(THEME.textBold[0], THEME.textBold[1], THEME.textBold[2]);
            
            const splitH4 = doc.splitTextToSize(textToPrint, maxLineWidth);
            checkPageBreak(splitH4.length * BODY_FONT_SIZE);
            
            splitH4.forEach((hLine: string) => {
                doc.text(hLine, margin, yPos + 2);
                yPos += BODY_FONT_SIZE * 0.8;
            });
            yPos += 2;
            return;
        }

        if (cleanedLine.startsWith('### ')) {
            const textToPrint = cleanedLine.replace('### ', '').replace(/\*\*/g, '');
            doc.setFont("helvetica", "bold");
            doc.setFontSize(HEADER_3_SIZE);
            doc.setTextColor(THEME.textBold[0], THEME.textBold[1], THEME.textBold[2]);
            
            const splitH3 = doc.splitTextToSize(textToPrint, maxLineWidth);
            checkPageBreak(splitH3.length * HEADER_3_SIZE);
            
            splitH3.forEach((hLine: string) => {
                doc.text(hLine, margin, yPos + 2);
                yPos += HEADER_3_SIZE * 0.8;
            });
            yPos += 2;
            return;
        }

        const lineHeight = 5.5;
        doc.setFontSize(BODY_FONT_SIZE);
        
        // Detecta padrão de rótulo em negrito (**Chave:** Conteúdo)
        const boldHeaderMatch = cleanedLine.match(/^\*\*(.*?)\*\*:(.*)$/);
        const fullBoldMatch = cleanedLine.match(/^\*\*(.*?)\*\*$/);
        
        if (boldHeaderMatch) {
            const label = boldHeaderMatch[1] + ":";
            const content = boldHeaderMatch[2].trim();
            
            // Especial para Observações em branco (textBold)
            const isObservation = label.toLowerCase().includes("observações");
            
            // Rótulo
            doc.setFont("helvetica", "bold");
            doc.setTextColor(isObservation ? THEME.textBold[0] : THEME.text[0], isObservation ? THEME.textBold[1] : THEME.text[1], isObservation ? THEME.textBold[2] : THEME.text[2]);
            
            const labelWidth = doc.getTextWidth(label);
            checkPageBreak(lineHeight + 2);
            doc.text(label, margin, yPos);
            
            // Conteúdo (Lidar com parágrafo quebrado forçando quebra para nova linha se for muito longo)
            doc.setFont("helvetica", "normal");
            doc.setTextColor(THEME.text[0], THEME.text[1], THEME.text[2]);
            
            // Se o conteúdo for maior que 30 caracteres, jogamos para a linha de baixo para evitar "formatação quebrada"
            if (content.length > 30) {
                yPos += lineHeight;
                const splitContent = doc.splitTextToSize(content, maxLineWidth);
                splitContent.forEach((cl: string) => {
                    checkPageBreak(lineHeight);
                    doc.text(cl, margin, yPos);
                    yPos += lineHeight;
                });
            } else {
                doc.text(content, margin + labelWidth + 2, yPos);
                yPos += lineHeight;
            }
            
            yPos += 2;
            return;
        }

        if (fullBoldMatch) {
            const content = fullBoldMatch[1];
            doc.setFont("helvetica", "bold");
            doc.setTextColor(THEME.textBold[0], THEME.textBold[1], THEME.textBold[2]);
            
            const splitContent = doc.splitTextToSize(content, maxLineWidth);
            splitContent.forEach((cl: string) => {
                checkPageBreak(lineHeight);
                doc.text(cl, margin, yPos);
                yPos += lineHeight;
            });
            yPos += 2;
            return;
        }

        // Renderização padrão para linhas comuns
        doc.setFont("helvetica", "normal");
        doc.setTextColor(THEME.text[0], THEME.text[1], THEME.text[2]);
        const splitText = doc.splitTextToSize(cleanedLine.replace(/\*\*/g, ''), maxLineWidth);
        splitText.forEach((tLine: string) => {
            checkPageBreak(lineHeight);
            doc.text(tLine, margin, yPos);
            yPos += lineHeight;
        });
        yPos += 2;
    });

    doc.save(`${subtitle.replace(/\s+/g, '_')}.pdf`);
};

const parseBoldText = (text: string): TextRun[] => {
    const parts: TextRun[] = [];
    const regex = /\*\*(.*?)\*\*/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
        if (match.index > lastIndex) {
            parts.push(new TextRun(text.substring(lastIndex, match.index)));
        }
        parts.push(new TextRun({
            text: match[1],
            bold: true,
        }));
        lastIndex = regex.lastIndex;
    }
    if (lastIndex < text.length) {
        parts.push(new TextRun(text.substring(lastIndex)));
    }
    return parts;
};

const saveBlob = (blob: Blob, fileName: string) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    document.body.appendChild(a);
    a.style.display = "none";
    a.href = url;
    a.download = fileName;
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
};