import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Replace with your actual OpenAI API key
});

export async function generateContract(requirements: {
  type: string;
  parties: string[];
  terms: string;
  additionalRequirements?: string;
}) {
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