import { AgentThoughtStep } from '@/types/playground';

export interface ParsedStreamOutput {
  planSteps: AgentThoughtStep[];
  code: string;
  isGeneratingCode: boolean;
}

/**
 * Robustly extracts the clean HTML code from AI output, handling markdown fences,
 * preamble text, thinking tags, or raw HTML.
 */
export function extractCleanHtml(text: string): string {
  if (!text) return '';

  // 1. Check for markdown code fences: ```html ... ```
  const fenceMatch = text.match(/```(?:html|htm)?\s*([\s\S]*?)(?:```|$)/i);
  if (fenceMatch) {
    const candidate = fenceMatch[1].trim();
    if (
      candidate.includes('<!DOCTYPE') ||
      candidate.includes('<html') ||
      candidate.includes('<head') ||
      candidate.includes('<body') ||
      candidate.includes('<canvas') ||
      candidate.includes('<script')
    ) {
      return candidate;
    }
  }

  // 2. Strip <agent_plan>...</agent_plan> if present
  let clean = text;
  if (clean.includes('</agent_plan>')) {
    clean = clean.split('</agent_plan>')[1] || '';
  }

  // 3. Find first HTML doctype or tag
  const docTypeIndex = clean.indexOf('<!DOCTYPE');
  const htmlIndex = clean.indexOf('<html');

  let startIndex = -1;
  if (docTypeIndex !== -1 && htmlIndex !== -1) {
    startIndex = Math.min(docTypeIndex, htmlIndex);
  } else if (docTypeIndex !== -1) {
    startIndex = docTypeIndex;
  } else if (htmlIndex !== -1) {
    startIndex = htmlIndex;
  } else {
    // Check for <body> or <canvas>
    const bodyIndex = clean.indexOf('<body');
    if (bodyIndex !== -1) startIndex = bodyIndex;
  }

  if (startIndex !== -1) {
    let result = clean.slice(startIndex).trim();
    if (result.endsWith('```')) {
      result = result.slice(0, -3).trim();
    }
    return result;
  }

  return '';
}

/**
 * Extracts structured agent thought steps and clean HTML code from AI output stream.
 */
export function parseAIStream(rawText: string): ParsedStreamOutput {
  const planSteps: AgentThoughtStep[] = [];

  // Extract <agent_plan> ... </agent_plan>
  const planMatch = rawText.match(/<agent_plan>([\s\S]*?)(?:<\/agent_plan>|$)/i);
  if (planMatch) {
    const planContent = planMatch[1].trim();
    const lines = planContent.split('\n').map(l => l.trim()).filter(Boolean);

    lines.forEach((line, index) => {
      const match = line.match(/^\[(.*?)\]\s*(.*)$/);
      if (match) {
        planSteps.push({
          id: `step-${index}`,
          stage: mapTagToStage(match[1]),
          title: match[1],
          detail: match[2],
          timestamp: 1740000000000,
          status: 'success',
        });
      } else {
        planSteps.push({
          id: `step-${index}`,
          stage: 'coding',
          title: `Step ${index + 1}`,
          detail: line,
          timestamp: 1740000000000,
          status: 'success',
        });
      }
    });
  }

  const code = extractCleanHtml(rawText);
  const isGeneratingCode = Boolean(code && code.length > 20);

  return {
    planSteps,
    code,
    isGeneratingCode,
  };
}

function mapTagToStage(tag: string) {
  const lower = tag.toLowerCase();
  if (lower.includes('plan') || lower.includes('concept')) return 'planning';
  if (lower.includes('diag') || lower.includes('heal') || lower.includes('fix')) return 'healing';
  if (lower.includes('test') || lower.includes('verify')) return 'testing';
  return 'coding';
}
