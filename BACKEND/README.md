# PowerSense Backend

This is the backend API for the PowerSense MERN application built with Node.js, Express.js, and MongoDB.

## Features

- User authentication (register, login, JWT tokens)
- User management (CRUD operations)
- Role-based access control (User/Admin)
- Password hashing with bcrypt
- Input validation and sanitization
- Error handling middleware
- CORS support
- Environment-based configuration

## Tech Stack

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing
- **express-validator** - Input validation
- **cors** - Cross-origin resource sharing

## Installation

1. Navigate to the backend directory:
   ```bash
   cd BACKEND
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment variables:
   - Copy `.env` and update the values according to your setup
   - Set your MongoDB connection string
   - Set a secure JWT secret

4. Start the development server:
   ```bash
   npm run dev
   ```

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
MONGODB_URI=mongodb://localhost:27017/powersense
PORT=5000
NODE_ENV=development
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
```

## API Routes

### Authentication Routes (`/api/auth`)

- **POST** `/register` - Register a new user
- **POST** `/login` - Login user
- **GET** `/me` - Get current user (protected)
- **PUT** `/profile` - Update user profile (protected)

### User Routes (`/api/users`)

- **GET** `/` - Get all users (admin only)
- **GET** `/:id` - Get user by ID
- **PUT** `/:id` - Update user (admin only)
- **DELETE** `/:id` - Delete user (admin only)
- **PUT** `/:id/toggle-status` - Toggle user active status (admin only)

## Project Structure

```
BACKEND/
├── config/
│   └── database.js          # Database configuration
├── middleware/
│   └── auth.js              # Authentication middleware
├── models/
│   └── User.js              # User model
├── routes/
│   ├── auth.js              # Authentication routes
│   └── users.js             # User management routes
├── utils/
│   ├── response.js          # Response utilities
│   └── validation.js        # Validation utilities
├── .env                     # Environment variables
├── .gitignore              # Git ignore file
├── package.json            # Dependencies and scripts
├── server.js               # Main server file
└── README.md               # Project documentation
```

## Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm test` - Run tests (not implemented yet)

## Usage

1. Start the server with `npm run dev`
2. The API will be available at `http://localhost:5000`
3. Use Postman or any REST client to test the endpoints
4. Register a user and use the JWT token for protected routes

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Error Handling

The API includes comprehensive error handling with consistent error responses:

```json
{
  "success": false,
  "message": "Error message",
  "errors": [...],
  "timestamp": "2026-02-07T10:00:00.000Z"
}
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test your changes
5. Submit a pull request

## License

This project is licensed under the ISC License.
