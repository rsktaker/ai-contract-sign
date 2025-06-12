import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import mongoose from 'mongoose';

// GET /api/contracts - Fetch all contracts
export async function GET(request: NextRequest) {
  try {
    // Connect to database
    await connectToDatabase();
    
    // Use native MongoDB driver through Mongoose connection
    const db = mongoose.connection.db;
    
    // Check if db exists
    if (!db) {
      console.error('Database connection failed');
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    // Fetch all contracts, sorted by creation date (newest first)
    const contracts = await db.collection('contracts')
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({ contracts }, { status: 200 });
  } catch (error) {
    console.error('Error fetching contracts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/contracts - Create a new contract
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.title || !body.content || !body.parties || !Array.isArray(body.parties)) {
      return NextResponse.json(
        { error: 'Missing required fields: title, content, and parties array are required' },
        { status: 400 }
      );
    }

    // Validate parties array
    if (body.parties.length === 0) {
      return NextResponse.json(
        { error: 'At least one party is required' },
        { status: 400 }
      );
    }

    // Validate each party
    for (const party of body.parties) {
      if (!party.name || !party.email || !party.role) {
        return NextResponse.json(
          { error: 'Each party must have name, email, and role' },
          { status: 400 }
        );
      }
    }

    // Connect to database
    await connectToDatabase();
    const db = mongoose.connection.db;

    if (!db) {
      console.error('Database connection failed');
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    // Prepare contract data
    const newContract = {
      title: body.title,
      content: body.content,
      parties: body.parties.map((party: any) => ({
        name: party.name,
        email: party.email,
        role: party.role,
        signed: false,
        signedAt: null
      })),
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Insert the new contract
    const result = await db.collection('contracts').insertOne(newContract);

    // Fetch the created contract
    const createdContract = await db.collection('contracts').findOne({
      _id: result.insertedId
    });

    return NextResponse.json(
      { 
        message: 'Contract created successfully',
        contract: createdContract 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating contract:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}