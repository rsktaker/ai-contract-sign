import mongoose from 'mongoose';

const SignatureSchema = new mongoose.Schema({
  contractId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contract',
    required: true
  },
  partyEmail: {
    type: String,
    required: true
  },
  signatureData: {
    type: String, // Base64 encoded signature image
    required: true
  },
  ipAddress: String,
  timestamp: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.models.Signature || mongoose.model('Signature', SignatureSchema);   