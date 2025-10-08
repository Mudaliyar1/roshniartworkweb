require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const crypto = require('crypto');

/**
 * Admin Management Utility
 * Usage: node scripts/admin-utils.js [command] [args]
 * 
 * Commands:
 *   list              - List all admin users
 *   create [email]    - Create new admin user
 *   reset [email]     - Reset password for admin user
 *   delete [email]    - Delete admin user
 *   help              - Show this help message
 */

async function listAdmins() {
  try {
    const admins = await User.find({ isAdmin: true }).select('email createdAt -_id');
    console.log('\n📋 Admin Users:');
    console.log('==================');
    admins.forEach((admin, index) => {
      console.log(`${index + 1}. Email: ${admin.email}`);
      console.log(`   Created: ${admin.createdAt.toLocaleDateString()}`);
      console.log('');
    });
  } catch (error) {
    console.error('Error listing admins:', error);
  }
}

async function createAdmin(email) {
  try {
    const password = crypto.randomBytes(16).toString('hex');
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log(`User with email ${email} already exists.`);
      return;
    }

    const adminUser = new User({
      email,
      password,
      isAdmin: true
    });

    await adminUser.save();
    console.log('\n✅ Admin user created successfully!');
    console.log('=====================================');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log('=====================================\n');
    console.log('⚠️  Save this password securely - it cannot be retrieved later!');
  } catch (error) {
    console.error('Error creating admin:', error);
  }
}

async function resetPassword(email) {
  try {
    const user = await User.findOne({ email });
    if (!user) {
      console.log(`User with email ${email} not found.`);
      return;
    }

    const newPassword = crypto.randomBytes(16).toString('hex');
    user.password = newPassword;
    await user.save();

    console.log('\n🔄 Password reset successful!');
    console.log('=====================================');
    console.log(`Email: ${email}`);
    console.log(`New Password: ${newPassword}`);
    console.log('=====================================\n');
    console.log('⚠️  Save this new password securely - it cannot be retrieved later!');
  } catch (error) {
    console.error('Error resetting password:', error);
  }
}

async function deleteAdmin(email) {
  try {
    const result = await User.deleteOne({ email, isAdmin: true });
    if (result.deletedCount === 0) {
      console.log(`Admin user with email ${email} not found.`);
      return;
    }
    console.log(`✅ Admin user ${email} deleted successfully.`);
  } catch (error) {
    console.error('Error deleting admin:', error);
  }
}

function showHelp() {
  console.log('\n🔧 Admin Management Utility');
  console.log('==========================');
  console.log('Usage: node scripts/admin-utils.js [command] [args]');
  console.log('');
  console.log('Commands:');
  console.log('  list              - List all admin users');
  console.log('  create [email]    - Create new admin user');
  console.log('  reset [email]     - Reset password for admin user');
  console.log('  delete [email]    - Delete admin user');
  console.log('  help              - Show this help message');
  console.log('');
  console.log('Examples:');
  console.log('  node scripts/admin-utils.js list');
  console.log('  node scripts/admin-utils.js create admin@example.com');
  console.log('  node scripts/admin-utils.js reset admin@example.com');
  console.log('  node scripts/admin-utils.js delete admin@example.com');
  console.log('');
}

async function main() {
  const command = process.argv[2];
  const argument = process.argv[3];

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    switch (command) {
      case 'list':
        await listAdmins();
        break;
      case 'create':
        if (!argument) {
          console.log('Please provide an email address.');
          console.log('Usage: node scripts/admin-utils.js create [email]');
          break;
        }
        await createAdmin(argument);
        break;
      case 'reset':
        if (!argument) {
          console.log('Please provide an email address.');
          console.log('Usage: node scripts/admin-utils.js reset [email]');
          break;
        }
        await resetPassword(argument);
        break;
      case 'delete':
        if (!argument) {
          console.log('Please provide an email address.');
          console.log('Usage: node scripts/admin-utils.js delete [email]');
          break;
        }
        await deleteAdmin(argument);
        break;
      case 'help':
      case undefined:
        showHelp();
        break;
      default:
        console.log(`Unknown command: ${command}`);
        showHelp();
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

if (require.main === module) {
  main();
}