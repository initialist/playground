import { AgentThoughtStep } from '@/types/playground';

export interface ParsedStreamOutput {
  planSteps: AgentThoughtStep[];
  code: string;
  isGeneratingCode: boolean;
}

/**
 * Extracts structured agent thought steps and clean HTML code from AI output stream.
 */
export function parseAIStream(rawText: string): ParsedStreamOutput {
  const planSteps: AgentThoughtStep[] = [];
  let code = '';
  let isGeneratingCode = false;

  // 1. Extract <agent_plan> ... </agent_plan>
  const planMatch = rawText.match(/<agent_plan>([\s\S]*?)(?:<\/agent_plan>|$)/i);
  if (planMatch) {
    const planContent = planMatch[1].trim();
    const lines = planContent.split('\n').map(l => l.trim()).filter(Boolean);

    lines.forEach((line, index) => {
      // Check for bracket prefix e.g. [Planning] Concept or [Audio] Sounds
      const match = line.match(/^\[(.*?)\]\s*(.*)$/);
      if (match) {
        planSteps.push({
          id: `step-${index}`,
          stage: mapTagToStage(match[1]),
          title: match[1],
          detail: match[2],
          timestamp: Date.now(),
          status: 'success',
        });
      } else {
        planSteps.push({
          id: `step-${index}`,
          stage: 'coding',
          title: `Step ${index + 1}`,
          detail: line,
          timestamp: Date.now(),
          status: 'success',
        });
      }
    });
  }

  // 2. Extract code after </agent_plan> or HTML start
  let codePortion = rawText;
  if (rawText.includes('</agent_plan>')) {
    codePortion = rawText.split('</agent_plan>')[1] || '';
  } else if (rawText.includes('<agent_plan>')) {
    // If still in agent_plan and hasn't closed yet, don't parse as code yet
    return {
      planSteps,
      code: '',
      isGeneratingCode: false,
    };
  }

  // Strip markdown code fences if present (e.g. ```html ... ```)
  codePortion = codePortion.trim();
  if (codePortion.startsWith('```html')) {
    codePortion = codePortion.replace(/^```html\s*/i, '');
  } else if (codePortion.startsWith('```')) {
    codePortion = codePortion.replace(/^```\s*/i, '');
  }

  // If ending with ```, remove it
  if (codePortion.endsWith('```')) {
    codePortion = codePortion.slice(0, -3).trim();
  }

  if (codePortion.includes('<html') || codePortion.includes('<!DOCTYPE') || codePortion.includes('<canvas')) {
    isGeneratingCode = true;
    code = codePortion;
  }

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
