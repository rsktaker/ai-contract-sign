// import { NextRequest, NextResponse } from 'next/server';
// import { generateContract } from '@/lib/claude';
// import Contract from '@/models/Contract';
// import dbConnect from '@/lib/mongodb';
// import { getServerSession } from 'next-auth';

// export async function POST(request: NextRequest) {
//   try {
//     const session = await getServerSession();
//     if (!session) {
//       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
//     }

//     await dbConnect();
    
//     const body = await request.json();
//     const { type, parties, terms, additionalRequirements } = body;

//     // Generate contract using Claude
//     const contractContent = await generateContract({
//       type,
//       parties,
//       terms,
//       additionalRequirements
//     });

//     // Save to database
//     const contract = await Contract.create({
//       userId: session.user.id,
//       title: `${type} Agreement - ${new Date().toLocaleDateString()}`,
//       type,
//       requirements: JSON.stringify({ parties, terms, additionalRequirements }),
//       content: contractContent,
//       parties: parties.map((party: any) => ({
//         name: party.name,
//         email: party.email,
//         role: party.role,
//         signed: false
//       }))
//     });

//     return NextResponse.json({ contract }, { status: 201 });
//   } catch (error) {
//     console.error('Error generating contract:', error);
//     return NextResponse.json(
//       { error: 'Failed to generate contract' },
//       { status: 500 }
//     );
//   }
// }



// Test code to bypass authentication
import { NextRequest, NextResponse } from 'next/server';
import { generateContract } from '@/lib/claude';
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
   
    const body = await request.json();
    const { type, parties, terms, additionalRequirements } = body;
    
    // Generate contract using Claude
    const contractContent = await generateContract({
      type,
      parties,
      terms,
      additionalRequirements
    });
    
    // Create a valid ObjectId for testing
    const testUserId = new mongoose.Types.ObjectId();
    
    // Save to database with proper ObjectId
    const contract = await Contract.create({
      userId: testUserId, // Using proper ObjectId for testing
      title: `${type} Agreement - ${new Date().toLocaleDateString()}`,
      type,
      requirements: JSON.stringify({ parties, terms, additionalRequirements }),
      content: contractContent,
      parties: parties.map((party: any) => ({
        name: party.name,
        email: party.email,
        role: party.role,
        signed: false
      }))
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