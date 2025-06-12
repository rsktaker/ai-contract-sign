import { connectToDatabase } from '../lib/mongodb';
import Contract from '../models/Contract';
import mongoose from 'mongoose';

// Generate sample user IDs (you can create actual users later)
const SAMPLE_USER_ID_1 = new mongoose.Types.ObjectId();
const SAMPLE_USER_ID_2 = new mongoose.Types.ObjectId();
const SAMPLE_USER_ID_3 = new mongoose.Types.ObjectId();

const seedContracts = [
  {
    userId: SAMPLE_USER_ID_1,
    title: 'Web Development Service Agreement',
    type: 'service',
    requirements: 'Create a responsive e-commerce website with payment integration, user authentication, and admin dashboard. Project timeline: 8 weeks.',
    content: `
      SERVICE AGREEMENT
      
      This Service Agreement ("Agreement") is entered into between the parties for web development services.
      
      SCOPE OF WORK:
      - Design and develop responsive e-commerce website
      - Implement payment gateway integration
      - Create user authentication system
      - Build admin dashboard for inventory management
      - Provide 3 months of maintenance support
      
      TIMELINE: 8 weeks from project start date
      PAYMENT TERMS: 50% upfront, 50% upon completion
      
      Both parties agree to the terms outlined above.
    `,
    parties: [
      {
        name: 'John Smith',
        email: 'john@clientcompany.com',
        role: 'Client',
        signed: false
      },
      {
        name: 'Sarah Johnson',
        email: 'sarah@webdev.com',
        role: 'Service Provider',
        signed: false
      }
    ],
    status: 'draft'
  },
  {
    userId: SAMPLE_USER_ID_1,
    title: 'Software Development NDA',
    type: 'nda',
    requirements: 'Standard non-disclosure agreement for software development project involving proprietary algorithms and trade secrets.',
    content: `
      NON-DISCLOSURE AGREEMENT
      
      This Non-Disclosure Agreement ("Agreement") is entered into to protect confidential information.
      
      CONFIDENTIAL INFORMATION includes but is not limited to:
      - Proprietary algorithms and source code
      - Business strategies and financial data
      - Customer lists and contact information
      - Technical specifications and documentation
      
      OBLIGATIONS:
      - Maintain strict confidentiality of all disclosed information
      - Use information solely for the intended business purpose
      - Return or destroy confidential materials upon request
      
      This agreement remains in effect for 5 years from the date of signing.
    `,
    parties: [
      {
        name: 'Tech Innovations Inc.',
        email: 'legal@techinnovations.com',
        role: 'Disclosing Party',
        signed: true
      },
      {
        name: 'DevCorp Solutions',
        email: 'contracts@devcorp.com',
        role: 'Receiving Party',
        signed: false
      }
    ],
    status: 'pending'
  },
  {
    userId: SAMPLE_USER_ID_2,
    title: 'Senior Developer Employment Contract',
    type: 'employment',
    requirements: 'Full-time employment contract for Senior Full Stack Developer position with competitive salary, benefits, and equity package.',
    content: `
      EMPLOYMENT AGREEMENT
      
      This Employment Agreement is for the position of Senior Full Stack Developer.
      
      POSITION DETAILS:
      - Job Title: Senior Full Stack Developer
      - Department: Engineering
      - Start Date: To be determined
      - Employment Type: Full-time, At-will
      
      COMPENSATION:
      - Base Salary: $120,000 annually
      - Performance Bonus: Up to 15% of base salary
      - Equity: 0.5% company stock options
      - Benefits: Health, dental, vision insurance, 401k matching
      
      RESPONSIBILITIES:
      - Lead development of web applications using React and Node.js
      - Mentor junior developers and conduct code reviews
      - Collaborate with product and design teams
      - Participate in architectural decisions
      
      This offer is contingent upon successful background check and reference verification.
    `,
    parties: [
      {
        name: 'StartupCo Inc.',
        email: 'hr@startupco.com',
        role: 'Employer',
        signed: false
      },
      {
        name: 'Alex Chen',
        email: 'alex.chen@email.com',
        role: 'Employee',
        signed: false
      }
    ],
    status: 'draft'
  },
  {
    userId: SAMPLE_USER_ID_2,
    title: 'Office Space Lease Agreement',
    type: 'lease',
    requirements: '12-month commercial lease for 2,500 sq ft office space in downtown district with parking and utilities included.',
    content: `
      COMMERCIAL LEASE AGREEMENT
      
      This Lease Agreement is for commercial office space.
      
      PROPERTY DETAILS:
      - Address: 123 Business District, Suite 400
      - Square Footage: 2,500 sq ft
      - Parking Spaces: 8 dedicated spots
      - Utilities: Included in rent
      
      LEASE TERMS:
      - Lease Term: 12 months
      - Monthly Rent: $4,500
      - Security Deposit: $9,000 (2 months rent)
      - Lease Start Date: July 1, 2025
      
      TENANT IMPROVEMENTS:
      - Landlord to provide paint and carpet cleaning
      - Tenant responsible for furniture and equipment
      - Conference room and kitchen facilities included
      
      Rent due on the 1st of each month. Late fees apply after 5-day grace period.
    `,
    parties: [
      {
        name: 'Downtown Properties LLC',
        email: 'leasing@downtownproperties.com',
        role: 'Landlord',
        signed: false
      },
      {
        name: 'Growing Business Inc.',
        email: 'admin@growingbusiness.com',
        role: 'Tenant',
        signed: false
      }
    ],
    status: 'draft'
  },
  {
    userId: SAMPLE_USER_ID_3,
    title: 'Partnership Agreement',
    type: 'custom',
    requirements: 'Business partnership agreement for launching a tech startup, defining roles, equity split, and decision-making processes.',
    content: `
      BUSINESS PARTNERSHIP AGREEMENT
      
      This Partnership Agreement establishes a business partnership for a technology startup.
      
      BUSINESS DETAILS:
      - Company Name: InnovateTech Solutions
      - Business Type: Software Development and Consulting
      - Industry: Technology Services
      
      PARTNERSHIP STRUCTURE:
      - Partner 1: 60% equity, CEO role, business development focus
      - Partner 2: 40% equity, CTO role, technical development focus
      
      RESPONSIBILITIES:
      Partner 1 (CEO):
      - Business strategy and planning
      - Client acquisition and relationships
      - Financial management and fundraising
      - Legal and administrative duties
      
      Partner 2 (CTO):
      - Technical architecture and development
      - Team building and management
      - Product development oversight
      - Technology strategy
      
      DECISION MAKING:
      - Major decisions require unanimous consent
      - Day-to-day operations managed by respective roles
      - Monthly partnership meetings required
      
      FINANCIAL TERMS:
      - Initial investment: $50,000 each partner
      - Profit sharing based on equity percentages
      - Salary to be determined based on company revenue
    `,
    parties: [
      {
        name: 'Michael Rodriguez',
        email: 'mike@innovatetech.com',
        role: 'CEO Partner',
        signed: true
      },
      {
        name: 'Emily Watson',
        email: 'emily@innovatetech.com',
        role: 'CTO Partner',
        signed: true
      }
    ],
    status: 'signed'
  }
];

async function seedDatabase() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await connectToDatabase();
    console.log('✅ Connected to MongoDB successfully');

    console.log('🗑️  Clearing existing contracts...');
    await Contract.deleteMany({});
    console.log('✅ Existing contracts cleared');

    console.log('🌱 Seeding contracts...');
    const createdContracts = await Contract.insertMany(seedContracts);
    console.log(`✅ Successfully created ${createdContracts.length} contracts`);

    console.log('\n📊 Seeded Contract Summary:');
    console.log('='.repeat(50));
    
    for (const contract of createdContracts) {
      console.log(`📄 ${contract.title}`);
      console.log(`   Type: ${contract.type}`);
      console.log(`   Status: ${contract.status}`);
      console.log(`   Parties: ${contract.parties.length}`);
      console.log(`   ID: ${contract._id}`);
      console.log('');
    }

    console.log('🔍 Testing contract queries...');
    
    // Test finding contracts by type
    const serviceContracts = await Contract.find({ type: 'service' });
    console.log(`✅ Found ${serviceContracts.length} service contracts`);
    
    // Test finding contracts by status
    const draftContracts = await Contract.find({ status: 'draft' });
    console.log(`✅ Found ${draftContracts.length} draft contracts`);
    
    // Test finding signed contracts
    const signedContracts = await Contract.find({ status: 'signed' });
    console.log(`✅ Found ${signedContracts.length} signed contracts`);
    
    // Test finding contracts by user
    const userContracts1 = await Contract.find({ userId: SAMPLE_USER_ID_1 });
    console.log(`✅ Found ${userContracts1.length} contracts for user 1`);
    
    const userContracts2 = await Contract.find({ userId: SAMPLE_USER_ID_2 });
    console.log(`✅ Found ${userContracts2.length} contracts for user 2`);
    
    const userContracts3 = await Contract.find({ userId: SAMPLE_USER_ID_3 });
    console.log(`✅ Found ${userContracts3.length} contracts for user 3`);

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('💡 You can now test your Contract model with real data');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the seed function
seedDatabase();