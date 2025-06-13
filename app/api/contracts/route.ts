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
    console.log("UserId: ", userId);

    // Convert userId to ObjectId if it's a valid ObjectId string
    let userIdQuery = userId;
    if (mongoose.Types.ObjectId.isValid(userId)) {
      userIdQuery = new mongoose.Types.ObjectId(userId);
    }

    // Query for contracts where either:
    // 1. The user is in the parties array (by email)
    // 2. The user is the creator (by userId - now as ObjectId)
    const contracts = await db.collection('contracts')
      .find({
        $or: [
          { 'parties.email': userEmail },
          { userId: userIdQuery } // Now using ObjectId
        ]
      })
      .sort({ createdAt: -1 })
      .toArray();

    console.log(`Found ${contracts.length} contracts for user`);

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

    // Validate required fields (including type and requirements)
    if (!body.title || !body.content || !body.type || !body.requirements || !body.parties || !Array.isArray(body.parties)) {
      return NextResponse.json(
        { error: 'Missing required fields: title, content, type, requirements, and parties array are required' },
        { status: 400 }
      );
    }

    // Validate type enum
    const validTypes = ['service', 'nda', 'employment', 'lease', 'custom'];
    if (!validTypes.includes(body.type)) {
      return NextResponse.json(
        { error: 'Invalid contract type. Must be one of: service, nda, employment, lease, custom' },
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

    // Convert userId to ObjectId for consistency
    const userId = session.user.id;
    let userIdToStore = userId;
    if (mongoose.Types.ObjectId.isValid(userId)) {
      userIdToStore = new mongoose.Types.ObjectId(userId);
    }

    // Prepare contract data with userId as ObjectId
    const newContract = {
      userId: userIdToStore, // Store as ObjectId for consistency
      title: body.title,
      type: body.type,
      requirements: body.requirements,
      content: body.content,
      parties: body.parties.map((party: any) => ({
        name: party.name,
        email: party.email,
        role: party.role,
        signed: false,
        signatureId: null
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