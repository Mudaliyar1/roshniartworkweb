# Roshni Artwork Portfolio

A modern, responsive web application for showcasing artwork portfolios. Built with Node.js, Express, MongoDB, and Bootstrap.

## Features

- **Public Gallery**: Showcase artwork with filtering, search, and pagination
- **Admin Dashboard**: Manage artworks, messages, and site styling
- **Responsive Design**: Optimized for all devices
- **Image Management**: Upload, resize, and organize artwork images
- **Video Support**: Upload videos or embed from platforms like YouTube
- **Contact Form**: Receive and manage messages from visitors
- **Customizable Styling**: Change colors, fonts, and logo through the admin panel

## Prerequisites

- Node.js (v14+)
- MongoDB (local or Atlas)
- npm or yarn

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/roshniartworkweb.git
   cd roshniartworkweb
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/roshniartworkweb
   SESSION_SECRET=your_session_secret
   ADMIN_EMAIL=admin@example.com
   ADMIN_PASSWORD=your_secure_password
   MAX_FILE_SIZE=10485760
   UPLOAD_PATH=./public/uploads
   ```

4. Seed the database with initial data:
   ```
   node seed.js
   ```

5. Start the application:
   ```
   npm start
   ```

   For development with auto-restart:
   ```
   npm run dev
   ```

6. Access the application:
   - Public site: http://localhost:3000
   - Admin login: http://localhost:3000/login

## Project Structure

```
roshniartworkweb/
├── app.js                  # Main application file
├── seed.js                 # Database seeding script
├── controllers/            # Route controllers
├── middleware/             # Custom middleware
├── models/                 # Mongoose models
├── public/                 # Static assets
│   ├── css/                # Stylesheets
│   ├── js/                 # Client-side JavaScript
│   └── uploads/            # Uploaded files
├── routes/                 # Route definitions
├── views/                  # EJS templates
│   ├── admin/              # Admin panel views
│   ├── layouts/            # Layout templates
│   └── partials/           # Reusable view components
└── tests/                  # Test files
```

## Admin Access

After running the seed script, you can log in with:
- Email: admin@example.com (or the email specified in your .env file)
- Password: password123 (or the password specified in your .env file)

## Customization

### Site Styling

You can customize the site appearance through the admin panel:
1. Log in to the admin dashboard
2. Navigate to "Site Styling"
3. Adjust colors, fonts, and upload a custom logo
4. Save changes

### Content Management

1. **Artworks**: Add, edit, and manage artwork through the admin dashboard
2. **Messages**: View and respond to contact form submissions

## Deployment

For production deployment:

1. Set appropriate environment variables
2. Use a process manager like PM2:
   ```
   npm install -g pm2
   pm2 start app.js --name "roshniartworkweb"
   ```

3. Set up a reverse proxy with Nginx or similar

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues or questions, please open an issue on the GitHub repository or contact the maintainer.