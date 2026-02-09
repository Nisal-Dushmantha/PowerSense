# PowerSense - Electricity Bill Management System

A full-stack MERN (MongoDB, Express, React, Node.js) application for managing monthly electricity bills with beautiful UI and comprehensive CRUD operations.

## Features

✨ **Full CRUD Operations**
- Create, Read, Update, and Delete monthly electricity bills
- Track bill numbers, issue dates, KWh usage, payments, and balances
- Mark bills as paid/unpaid

📊 **Statistics Dashboard**
- View total bills, paid/pending counts
- Track total KWh usage across all bills
- Monitor total amounts, payments, and outstanding balances
- Calculate averages and completion rates

🎨 **Modern UI**
- Built with React and Tailwind CSS
- Responsive design for all devices
- Clean and intuitive interface
- Real-time updates

## Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - ODM for MongoDB

### Frontend
- **React** - UI library
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **Tailwind CSS** - Utility-first CSS framework

## Project Structure

```
PowerSense/
├── BACKEND/
│   ├── config/
│   │   └── app.js              # Database connection
│   ├── controllers/
│   │   └── monthlyBill.js      # Business logic
│   ├── models/
│   │   └── MonthlyBill.js      # Database schema
│   ├── routes/
│   │   └── monthlyBill.js      # API routes
│   ├── server.js               # Entry point
│   ├── package.json
│   ├── API_Documentation.md    # API documentation
│   └── PowerSense_API_Collection.json  # Postman collection
│
└── frontend/
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── components/
    │   │   ├── Navbar.js       # Navigation bar
    │   │   ├── BillList.js     # List all bills
    │   │   ├── CreateBill.js   # Create new bill
    │   │   ├── EditBill.js     # Edit existing bill
    │   │   └── BillStats.js    # Statistics dashboard
    │   ├── services/
    │   │   └── api.js          # API service layer
    │   ├── App.js              # Main app component
    │   ├── index.js            # Entry point
    │   └── index.css           # Global styles
    ├── tailwind.config.js
    ├── postcss.config.js
    └── package.json
```

## Getting Started

### Prerequisites

- **Node.js** (v14 or higher)
- **MongoDB Atlas account** (or local MongoDB)
- **npm** or **yarn**

### Installation

1. **Clone or navigate to the project directory**
   ```bash
   cd PowerSense
   ```

2. **Install Backend Dependencies**
   ```bash
   cd BACKEND
   npm install
   ```

3. **Install Frontend Dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

### Running the Application

#### Start Backend Server (Terminal 1)
```bash
cd BACKEND
npm start
```
The backend server will run on `http://localhost:5000`

#### Start Frontend Development Server (Terminal 2)
```bash
cd frontend
npm start
```
The frontend will run on `http://localhost:3000` and automatically open in your browser.

## Usage

### Navigation

- **Bills** - View all monthly bills in a table format
- **Add New Bill** - Create a new electricity bill
- **Statistics** - View comprehensive statistics and insights
- **Edit** - Click edit button on any bill to update it
- **Delete** - Click delete button to remove a bill (with confirmation)

### Creating a Bill

1. Click "Add New Bill" in the navigation or on the Bills page
2. Fill in the required fields:
   - **Bill Number** (unique identifier)
   - **Bill Issue Date**
   - **Total KWh** (electricity usage)
   - **Total Payment** (amount due)
   - **Total Paid** (optional - amount paid so far)
   - **Mark as Paid** (checkbox)
3. Click "Create Bill"

### Editing a Bill

1. Go to the Bills page
2. Click "Edit" on the bill you want to update
3. Modify the fields as needed
4. Click "Update Bill"

### Viewing Statistics

1. Click "Statistics" in the navigation
2. View:
   - Total bills count
   - Paid vs pending bills
   - Total KWh usage
   - Total amounts and payments
   - Outstanding balances
   - Average calculations
   - Payment completion rate

## API Endpoints

### Monthly Bills

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/monthly-bills` | Get all bills |
| GET | `/api/monthly-bills/stats` | Get statistics |
| GET | `/api/monthly-bills/:id` | Get bill by ID |
| POST | `/api/monthly-bills` | Create new bill |
| PUT | `/api/monthly-bills/:id` | Update bill |
| DELETE | `/api/monthly-bills/:id` | Delete bill |

For detailed API documentation, see `BACKEND/API_Documentation.md`

## Testing with Postman

1. Import the Postman collection: `BACKEND/PowerSense_API_Collection.json`
2. The collection includes pre-configured requests for all endpoints
3. Sample data is provided in the collection for easy testing

## Database Schema

### MonthlyBill Model

```javascript
{
  billNumber: String (required, unique),
  billIssueDate: Date (required),
  totalKWh: Number (required, min: 0),
  totalPayment: Number (required, min: 0),
  totalPaid: Number (default: 0, min: 0),
  balance: Number (auto-calculated),
  isPaid: Boolean (default: false),
  createdAt: Date (auto-generated),
  updatedAt: Date (auto-generated)
}
```

## Environment Variables

The backend uses a hard-coded MongoDB connection string. If you need to use environment variables:

1. Create a `.env` file in the `BACKEND` directory
2. Add: `MONGODB_URI=your_mongodb_connection_string`
3. Update `config/app.js` to use `process.env.MONGODB_URI`

## Production Build

To create a production build of the frontend:

```bash
cd frontend
npm run build
```

This creates an optimized build in the `frontend/build` directory.

## Troubleshooting

### Backend won't connect to MongoDB
- Check your MongoDB Atlas connection string
- Ensure your IP address is whitelisted in MongoDB Atlas
- Verify network connectivity

### Frontend can't connect to backend
- Ensure the backend server is running on port 5000
- Check the proxy setting in `frontend/package.json`
- Verify no firewall is blocking the connection

### Port already in use
- Backend: Change port in `BACKEND/server.js`
- Frontend: Set `PORT=3001` environment variable before starting

## Future Enhancements

- 🔐 User authentication and authorization
- 📧 Email notifications for due bills
- 📱 Mobile app version
- 📈 Advanced analytics and charts
- 💾 Export bills to PDF/Excel
- 🔍 Advanced filtering and search
- 📅 Bill reminders and scheduling

## Contributing

Feel free to fork this project and submit pull requests for any improvements.

## License

This project is open source and available for educational purposes.

## Support

For issues or questions, please create an issue in the project repository.

---

**Made with ⚡ by PowerSense Team**
