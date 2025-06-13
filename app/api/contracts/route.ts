// app/api/contracts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import mongoose from 'mongoose';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// GET /api/contracts - Fetch contracts for authenticated user
export async function GET(request: NextRequest) {
  try {
    // Get the session to check if user is authenticated
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

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

    // Fetch contracts where the user is a party
    const userEmail = session.user.email;
    const userId = session.user.id;

    // Query for contracts where either:
    // 1. The user is in the parties array (by email)
    // 2. The user is the creator (if you have a createdBy field)
    const contracts = await db.collection('contracts')
      .find({
        $or: [
          { 'parties.email': userEmail },
          { createdBy: userId } // Optional: if you track who created the contract
        ]
      })
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
    // Get the session to check if user is authenticated
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

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

    // Prepare contract data with creator information
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
      createdBy: session.user.id, // Track who created the contract
      createdByEmail: session.user.email,
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