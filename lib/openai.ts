import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Replace with your actual OpenAI API key
});

// TypeScript interfaces for contract structure
interface Signature {
  party: string;
  img_url: string;
  index: number; // index of the signature in the block
}

interface ContractBlock {
  text: string;
  signatures: Signature[];
}

interface ContractJson {
  blocks: ContractBlock[];
  unknowns: string[];
}

export async function generateContract(requirements: {
  type: string;
  parties: string[];
  terms: string;
  additionalRequirements?: string;
}): Promise<string> {
  const prompt = `Generate a professional ${requirements.type} contract with the following requirements:
Parties involved: ${requirements.parties.join(', ')}
Key terms: ${requirements.terms}
Additional requirements: ${requirements.additionalRequirements || 'None'}

Please create a comprehensive, legally sound contract that includes:
1. Clear identification of all parties
2. Detailed terms and conditions
3. Rights and obligations of each party
4. Duration/term of the contract
5. Termination clauses
6. Dispute resolution
7. Governing law
8. Signature blocks for all parties

Format the contract professionally with clear sections and subsections.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o', // You can also use 'gpt-4', 'gpt-3.5-turbo', etc.
      max_tokens: 4000,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const content = response.choices[0]?.message?.content;
    if (content) {
      return content;
    } else {
      throw new Error('No content received from OpenAI API');
    }
    
  } catch (error) {
    console.error('Error generating contract:', error);
    throw new Error('Failed to generate contract');
  }
}

// Helper function to clean JSON responses that might be wrapped in markdown
function cleanJsonResponse(text: string): string {
  // Remove markdown code blocks if present
  let cleaned = text.trim();
  
  // Remove ```json at the start
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/, '');
  }
  
  // Remove ``` at the end
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.replace(/\s*```$/, '');
  }
  
  // Also handle cases where it just starts with ```
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '');
  }
  
  return cleaned.trim();
}

export async function generateContractJson(userPrompt: string): Promise<ContractJson> {
  const systemPrompt = `
You are a contract‐writing assistant. When given a user prompt, produce a JSON object exactly matching this schema:

{
  "blocks": [
    {
      "text": string, // a paragraph/clause of the contract. For the signature block, missing signature fields should be replaced by 20 underscores. You can include newlines (\\n) for better formatting.
      "signatures": [
        {
          "party": string,         // Which of the parties is signing this signature field. Two possible values: "PartyA" or "PartyB". PartyA is the party that generated the contract and is requesting the signature. PartyB is the party that is signing the contract.
          "img_url": string,       // The URL of the party's signature image. This will be used to display the signature image in the UI and will be entered client-side. Do NOT include any text in this field as it will be updated client-side (should be empty for now).
          "index": number          // The index of the signature in the block.
        },
        ...
      ]
    },
    ...
  ],
  "unknowns": string[] // A list of ESSENTIAL, CRITICAL, MANDATORY pieces of information that you DESPERATELY NEED to complete the contract. Do NOT inlude any information that the contract can be created WITHOUT.
}

CRITICAL REQUIREMENTS:
- Generate 10 COMPREHENSIVE, all-embracing, all-encompassing, all-inclusive, broad blocks to create a complete, professional contract
- Each block should represent a major contract section (e.g., parties/scope, terms, payment, termination, signatures)
- Signature fields must be exactly 20 underscores: ____________________
- Each signature field must have a party field that is either "PartyA" or "PartyB"
- You can use newlines (\\n) within contract text for better formatting and readability
- Make sure the contract is comprehensive and professional
- Make sure the list of unknowns is as short as possible, consisting of ONLY the most essential, critical, mandatory pieces of information that the contract cannot be created without.

IMPORTANT - USE SPECIFIC DETAILS FROM USER PROMPT:
- If the user mentions specific names (like "Tayler", "John", "Sarah"), use those names directly in the contract text instead of generic "PartyA" or "PartyB"
- If the user mentions specific context (like "business idea", "consulting work", "rental agreement"), incorporate that specific language
- If the user provides company names, use them
- If the user specifies relationships (like "friend", "colleague"), reference that context appropriately

EXAMPLES:
- User says "NDA with my friend Tayler for a business idea" → Use "Tayler" as the name and "business idea" context
- User says "service contract with ABC Corp for consulting" → Use "ABC Corp" and "consulting" specifically
- User says "rental agreement for my apartment" → Reference "apartment rental" specifically

Return ONLY the JSON (no extra commentary or markdown formatting).
`;

  const userMessage = `Please draft a contract based on this request. Pay special attention to any specific names, companies, contexts, or details mentioned and incorporate them directly into the contract text:

"${userPrompt}"

Remember: Use any specific names or details provided instead of generic placeholders.`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt.trim() },
      { role: "user", content: userMessage },
    ],
  });

  // Clean the response and parse as JSON
  const text = completion.choices[0].message.content;
  const cleanedText = cleanJsonResponse(text || '');
  return JSON.parse(cleanedText);
}

export async function regenerateBlockJson(
  fullContractJson: ContractJson,
  blockIndex: number,
  userInstructions: string
): Promise<ContractJson> {
  const systemPrompt = `
You are a contract‐writing assistant. Here is the existing contract (blocks 0 to ${
    blockIndex - 1
  }, blocks ${blockIndex + 1} to end):
${JSON.stringify(
  fullContractJson.blocks.filter((_: ContractBlock, idx: number) => idx !== blockIndex),
  null,
  2
)}

Here is block ${blockIndex} EXACTLY as in JSON (including text and, if any, signature placeholders):
${JSON.stringify(fullContractJson.blocks[blockIndex], null, 2)}

Please regenerate ONLY block ${blockIndex} according to the user's instructions below and return the entire contract in the same JSON schema. Do NOT modify any other blocks or return extra fields, ONLY modify block ${blockIndex}.

Also, update the list of unknowns. If you can cross out an unknown, given information you were provided in the user instructions, MAKE SURE to do so.

CRITICAL REQUIREMENTS:
- Signature fields must be exactly 20 underscores: ____________________
- Each signature field must have a party field that is either "PartyA" or "PartyB"
- You can use newlines (\\n) within contract text for better formatting and readability
- Update the list of unknowns. If you can cross out an unknown, given information you were provided in the user instructions, do so.

IMPORTANT - USE SPECIFIC DETAILS FROM USER PROMPT:
- If the user mentions specific names (like "Tayler", "John", "Sarah"), use those names directly in the contract text instead of generic "PartyA" or "PartyB"
- If the user mentions specific context (like "business idea", "consulting work", "rental agreement"), incorporate that specific language
- If the user provides company names, use them
- If the user specifies relationships (like "friend", "colleague"), reference that context appropriately
- Do NOT edit any img_url fields; those are edited client-side.

Return ONLY the JSON (no extra commentary or markdown formatting).


User instructions: "${userInstructions}"
`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "system", content: systemPrompt.trim() }],
  });
  
  const text = completion.choices[0].message.content;
  const cleanedText = cleanJsonResponse(text || '');
  return JSON.parse(cleanedText);
}

export async function regenerateContract(
  contractJson: ContractJson,
  userInstructions: string
): Promise<ContractJson> {
  const systemPrompt = `
You are a contract‐writing assistant. Here is the existing contract:
${JSON.stringify(contractJson, null, 2)}

Please regenerate the ENTIRE contract according to the user's instructions below and return the complete contract in the same JSON schema format.

CRITICAL REQUIREMENTS:
- Generate comprehensive blocks to create a complete, professional contract
- Each block should represent a major contract section (e.g., parties/scope, terms, payment, termination, signatures)
- Signature fields must be exactly 20 underscores: ____________________
- Each signature field must have a party field that is either "PartyA" or "PartyB"
- You can use newlines (\\n) within contract text for better formatting and readability
- Update the list of unknowns based on the new contract requirements
- Do NOT modify any existing img_url fields that contain actual signature URLs; those are entered client-side
- Preserve any existing signature images in img_url fields

IMPORTANT - USE SPECIFIC DETAILS FROM USER PROMPT:
- If the user mentions specific names, use those names directly in the contract text
- If the user mentions specific context, incorporate that specific language
- If the user provides company names, use them
- If the user specifies relationships, reference that context appropriately

Return ONLY the JSON (no extra commentary or markdown formatting).

User instructions: "${userInstructions}"
`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "system", content: systemPrompt.trim() }],
  });
  
  const text = completion.choices[0].message.content;
  const cleanedText = cleanJsonResponse(text || '');
  return JSON.parse(cleanedText);
}

export async function generateSummaryText(contractJson: ContractJson): Promise<string> {
  const systemPrompt = `
You are a contract summarization assistant. You MUST return a JSON array of exactly 4 strings.

CRITICAL REQUIREMENTS:
- Return ONLY a JSON array with exactly 4 strings
- Each string should be a concise summary point about the contract
- Maximum 50 words per string
- NO markdown, NO special formatting
- Just plain text strings in a JSON array

EXAMPLE FORMAT (copy this structure exactly):
[
  "This contract establishes a service agreement between two parties",
  "The service provider will deliver specified work within 30 days",
  "Payment terms include a $5000 fee due upon completion", 
  "Either party may terminate with 7 days written notice"
]

Return ONLY the JSON array, no other text.
`;

  const userMessage = `Summarize this contract as a JSON array of exactly 4 strings:\n\n${JSON.stringify(contractJson, null, 2)}`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt.trim() },
      { role: "user", content: userMessage },
    ],
    temperature: 0.1, // Very low temperature for consistent formatting
  });

  const result = completion.choices[0].message.content?.trim() || '';
  console.log("Raw AI summary response:", JSON.stringify(result));
  
  try {
    // Parse as JSON array
    const cleanedResult = cleanJsonResponse(result);
    const summaryArray = JSON.parse(cleanedResult);
    
    if (Array.isArray(summaryArray) && summaryArray.length >= 4) {
      // Take first 4 items and ensure they're strings
      const finalSummary = summaryArray.slice(0, 4).map(item => String(item).trim());
      console.log("Parsed summary array:", finalSummary);
      return finalSummary.join('\n'); // Join with newlines for backward compatibility
    } else {
      throw new Error("Invalid array format or insufficient items");
    }
  } catch (error) {
    console.error("Failed to parse summary as JSON:", error);
    
    // Fallback: try to split the text manually
    const fallbackSummary = [
      "This contract establishes an agreement between the specified parties",
      "The terms and conditions are outlined in the contract blocks",
      "Payment and performance obligations are detailed in the agreement",
      "Termination and governing law provisions apply as specified"
    ];
    
    return fallbackSummary.join('\n');
  }
}
