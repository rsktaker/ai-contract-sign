import { NextRequest, NextResponse } from 'next/server';
import { regenerateContract } from '@/lib/openai';

export async function POST(request: NextRequest) {
  try {
    const { contractJson, userPrompt } = await request.json();

    if (!contractJson || !userPrompt) {
      return NextResponse.json(
        { error: 'Contract and user prompt are required' },
        { status: 400 }
      );
    }

    const regeneratedContract = await regenerateContract(contractJson, userPrompt);
    
    return NextResponse.json(regeneratedContract);
  } catch (error) {
    console.error('Error regenerating contract:', error);
    return NextResponse.json(
      { error: 'Failed to regenerate contract' },
      { status: 500 }
    );
  }
} 