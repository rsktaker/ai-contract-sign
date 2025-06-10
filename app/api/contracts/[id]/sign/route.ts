import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import mongoose from 'mongoose';
import Contract from '@/models/Contract';


export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { contractJson, timestamp } = await request.json();

    if (!contractJson) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Await params before use
    const { id } = await params;
    
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid contract ID format' },
        { status: 400 }
      );
    }

    // Connect to database
    await connectToDatabase();

    // Find the contract
    const contract = await Contract.findById(id);

    if (!contract) {
      return NextResponse.json(
        { error: 'Contract not found' },
        { status: 404 }
      );
    }

    // If all parties have signed, update the contract status
    
    contract.status = 'completed';
    contract.completedAt = new Date().toISOString();
    

    // Save the updated contract
    await contract.save();

    
    const recipientEmail = contract.recipientEmail;
    // Use recipientEmail as needed
    console.log('Recipient email:', recipientEmail);

    
    

    return NextResponse.json({
      success: true,
      message: 'Contract signed successfully',
    });

  } catch (error) {
    console.error('Error signing contract:', error);
    // Log the actual error message for debugging
    console.error('Full error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      name: error instanceof Error ? error.name : 'Unknown error type'
    });
    return NextResponse.json(
      { error: 'Failed to sign contract' },
      { status: 500 }
    );
  }
}