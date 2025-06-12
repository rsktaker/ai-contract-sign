// app/api/contracts/[id]/send/route.ts
import { NextRequest, NextResponse } from "next/server";
import { sendContractEmail } from "@/lib/mailer";
import mongoose from 'mongoose';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { contractJson, recipientEmail } = await request.json();

    if (!contractJson || !recipientEmail) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Await params before use
    const { id } = await params;
    
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid contract ID format" },
        { status: 400 }
      );
    }

    // Send the contract email and update the database
    await sendContractEmail(id, contractJson, recipientEmail);
    
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to send contract email." },
      { status: 500 }
    );
  }
}