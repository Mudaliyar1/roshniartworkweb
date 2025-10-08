require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const crypto = require('crypto');

// Generate secure admin credentials
function generateSecureCredentials() {
  const adminEmail = 'admin@roshniartwork.com';
  const adminPassword = crypto.randomBytes(16).toString('hex'); // 32 character random password
  return { adminEmail, adminPassword };
}

async function createAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Generate secure credentials
    const { adminEmail, adminPassword } = generateSecureCredentials();

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminEmail });
    
    if (existingAdmin) {
      console.log('Admin user already exists. Updating password...');
      existingAdmin.password = adminPassword;
      await existingAdmin.save();
      console.log('Admin password updated successfully!');
    } else {
      // Create new admin user
      const adminUser = new User({
        email: adminEmail,
        password: adminPassword,
        isAdmin: true
      });

      await adminUser.save();
      console.log('Admin user created successfully!');
    }

    console.log('\n🔐 ADMIN CREDENTIALS (SAVE THESE SECURELY):');
    console.log('=====================================');
    console.log(`Email: ${adminEmail}`);
    console.log(`Password: ${adminPassword}`);
    console.log('=====================================\n');

    console.log('⚠️  IMPORTANT SECURITY NOTES:');
    console.log('- Change the default admin email in production');
    console.log('- Store these credentials securely');
    console.log('- Consider using environment variables for admin credentials');
    console.log('- Set up proper monitoring for admin login attempts');

  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
if (require.main === module) {
  createAdmin();
}

module.exports = { createAdmin, generateSecureCredentials };