import mongoose from 'mongoose';

const ContractSchema = new mongoose.Schema({
  
  title: {userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['service', 'nda', 'employment', 'lease', 'custom']
  },
  requirements: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  parties: [{
    name: String,
    email: String,
    role: String,
    signed: {
      type: Boolean,
      default: false
    },
    signatureId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Signature'
    }
  }],
  status: {
    type: String,
    enum: ['draft', 'pending', 'signed', 'completed'],
    default: 'draft'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.models.Contract || mongoose.model('Contract', ContractSchema);