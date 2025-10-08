# Admin Dashboard Login Information

## 🔐 Current Admin Credentials

**Email:** admin@roshniartwork.com  
**Password:** `0d98fba2b0523d1f5af3d3fea436a69e`

## 🌐 Access URL
- **Admin Login:** http://localhost:3000/login
- **Admin Dashboard:** http://localhost:3000/admin

## 🛠️ Admin Management

### View All Admins
```bash
node scripts/admin-utils.js list
```

### Create New Admin
```bash
node scripts/admin-utils.js create newadmin@example.com
```

### Reset Admin Password
```bash
node scripts/admin-utils.js reset admin@roshniartwork.com
```

### Delete Admin
```bash
node scripts/admin-utils.js delete admin@example.com
```

## ⚠️ Security Reminders

1. **Change the default admin email** in production
2. **Use strong, unique passwords** for each admin account
3. **Never share admin credentials** via unsecured channels
4. **Monitor admin login activity** regularly
5. **Consider implementing 2FA** for additional security
6. **Use HTTPS** in production environments

## 🚨 Emergency Procedures

If you lose admin access:
1. Run the password reset script: `node scripts/admin-utils.js reset admin@roshniartwork.com`
2. Or create a new admin: `node scripts/admin-utils.js create newemail@example.com`
3. Check database directly if needed (requires MongoDB access)

---

**⚠️ IMPORTANT:** Delete or secure this file after noting down the credentials!