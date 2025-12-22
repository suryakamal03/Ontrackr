import { GoogleGenAI } from '@google/genai'

const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || 'AIzaSyB1qmZaz_f-8C5JlE9PUKZ-wpxA2HH5ASc'

// Initialize Gemini AI
const ai = new GoogleGenAI({ apiKey: API_KEY })

export interface FlowchartGenerationResult {
  success: boolean
  mermaidCode?: string
  error?: string
}

/**
 * Generate a flowchart using Gemini 2.5 Flash model
 * @param prompt User's description of the workflow/process
 * @returns Mermaid diagram code or error
 */
export async function generateFlowchart(prompt: string): Promise<FlowchartGenerationResult> {
  try {
    if (!prompt || prompt.trim().length === 0) {
      return {
        success: false,
        error: 'Please provide a description for the flowchart'
      }
    }

    const systemPrompt = `You are an expert at creating flowcharts using Mermaid diagram syntax.
Given a process description, generate a clean, well-structured Mermaid flowchart.

Rules:
1. Use ONLY Mermaid flowchart syntax (graph TD or graph LR)
2. Keep it simple and readable
3. Use meaningful node IDs and labels
4. Include decision points (rhombus shapes) where appropriate
5. Return ONLY the Mermaid code, no explanations
6. Start with "graph TD" or "graph LR"
7. Use proper arrow syntax (-->)

Example format:
graph TD
    A[Start] --> B{Decision?}
    B -->|Yes| C[Action 1]
    B -->|No| D[Action 2]
    C --> E[End]
    D --> E

Now generate a flowchart for the following process:`

    const fullPrompt = `${systemPrompt}\n\n${prompt}`

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: fullPrompt,
    })

    const text = response.text

    // Extract mermaid code (remove markdown code blocks if present)
    let mermaidCode = text.trim()
    
    // Remove markdown code block syntax
    mermaidCode = mermaidCode.replace(/```mermaid\n?/g, '')
    mermaidCode = mermaidCode.replace(/```\n?/g, '')
    mermaidCode = mermaidCode.trim()

    // Validate that it starts with graph
    if (!mermaidCode.toLowerCase().startsWith('graph')) {
      return {
        success: false,
        error: 'Generated diagram is not in valid Mermaid format'
      }
    }

    return {
      success: true,
      mermaidCode
    }
  } catch (error: any) {
    console.error('[GeminiService] Error generating flowchart:', error)
    return {
      success: false,
      error: error.message || 'Failed to generate flowchart. Please try again.'
    }
  }
}
