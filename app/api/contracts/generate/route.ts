// Test code to bypass authentication
import { NextRequest, NextResponse } from 'next/server';
import { generateContractJson } from '@/lib/openai';
import Contract from '@/models/Contract';
import { connectToDatabase } from '@/lib/mongodb';
import mongoose from 'mongoose';
// import { getServerSession } from 'next-auth'; // Commented out for testing

export async function POST(request: NextRequest) {
  try {
    // TESTING MODE - Comment out auth check
    /*
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    */
    
    await connectToDatabase();
   
    // Get the prompt from the request body
    const body = await request.json();
    const { prompt } = body;
    
    // Generate contract using GPT, retreive it as a JSON object
    const contractJson = await generateContractJson(prompt);
    
    // Create a valid ObjectId for testing
    const testUserId = new mongoose.Types.ObjectId();
    
    // Save to database with all required fields
    const contract = await Contract.create({
      userId: testUserId,
      title: `Contract - ${new Date().toLocaleDateString()}`,
      type: 'custom',
      requirements: prompt,
      content: JSON.stringify(contractJson),
      status: 'draft'
    });
    
    return NextResponse.json({ contract }, { status: 201 });
  } catch (error) {
    console.error('Error generating contract:', error);
    return NextResponse.json(
      { error: 'Failed to generate contract' },
      { status: 500 }
    );
  }
}