import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import mongoose from 'mongoose';

// Define the Contract schema if you don't have it already
const contractSchema = new mongoose.Schema({
  title: String,
  content: String,
  parties: [{
    name: String,
    email: String,
    role: String,
    signed: { type: Boolean, default: false },
    signatureData: String,
    signedAt: String,
  }],
  status: { type: String, default: 'draft' },
  completedAt: String,
}, { timestamps: true });

// Create or get the model
const Contract = mongoose.models.Contract || mongoose.model('Contract', contractSchema);

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { partyEmail, signature, timestamp } = await request.json();

    if (!partyEmail || !signature) {
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

    // Find the party index
    const partyIndex = contract.parties.findIndex(
      (party: any) => party.email === partyEmail
    );

    if (partyIndex === -1) {
      return NextResponse.json(
        { error: 'Party not found in contract' },
        { status: 404 }
      );
    }

    // Check if party has already signed
    if (contract.parties[partyIndex].signed) {
      return NextResponse.json(
        { error: 'Party has already signed this contract' },
        { status: 400 }
      );
    }

    // Update the party's signed status and add signature data
    contract.parties[partyIndex].signed = true;
    contract.parties[partyIndex].signatureData = signature;
    contract.parties[partyIndex].signedAt = timestamp;

    // Check if all parties have signed
    const allSigned = contract.parties.every((party: any) => party.signed);

    // If all parties have signed, update the contract status
    if (allSigned) {
      contract.status = 'completed';
      contract.completedAt = new Date().toISOString();
    }

    // Save the updated contract
    await contract.save();

    return NextResponse.json({
      success: true,
      message: 'Contract signed successfully',
      allPartiesSigned: allSigned
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