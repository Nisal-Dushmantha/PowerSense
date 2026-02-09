# Quick Start Guide - PowerSense

## 🚀 Get Up and Running in 3 Steps

### Step 1: Start the Backend Server

Open a terminal and run:
```bash
cd BACKEND
npm start
```

You should see:
```
🚀 Server is running on port 5000
🌐 API URL: http://localhost:5000
```

### Step 2: Start the Frontend Server

Open a **new terminal** and run:
```bash
cd frontend
npm start
```

Your browser will automatically open to `http://localhost:3000`

### Step 3: Start Using PowerSense!

The application is now ready! You can:

1. **View Bills** - See all your electricity bills at `http://localhost:3000/bills`
2. **Add New Bill** - Click "Add New Bill" button
3. **View Statistics** - Click "Statistics" in the navigation
4. **Edit Bills** - Click "Edit" on any bill
5. **Delete Bills** - Click "Delete" on any bill (with confirmation)

## 📝 Sample Bill Data

Here's some sample data you can use to test:

**Bill 1:**
- Bill Number: `BILL-2026-001`
- Bill Issue Date: `2026-01-15`
- Total KWh: `350`
- Total Payment: `75.50`
- Total Paid: `75.50`
- Mark as Paid: ✅

**Bill 2:**
- Bill Number: `BILL-2026-002`
- Bill Issue Date: `2026-02-15`
- Total KWh: `420`
- Total Payment: `92.40`
- Total Paid: `50.00`
- Mark as Paid: ❌

## 🎯 Key Features to Try

### 1. Create a Bill
- Go to "Add New Bill"
- Fill in all required fields (marked with *)
- Click "Create Bill"

### 2. View Statistics
- Click "Statistics" in the navbar
- See totals, averages, and payment rates
- Monitor outstanding balances

### 3. Edit a Bill
- Go to Bills page
- Click "Edit" on any bill
- Update payment information
- Mark as paid when complete

### 4. Delete a Bill
- Click "Delete" on any bill
- Confirm deletion in the popup

## 🔧 Troubleshooting

### "Proxy error: Could not proxy request"
**Solution:** Make sure the backend server is running on port 5000

### "Cannot connect to MongoDB"
**Solution:** Check your internet connection and MongoDB Atlas settings

### Port already in use
**Backend:** Stop other processes using port 5000, or change the port in `server.js`
**Frontend:** Stop other processes using port 3000

## 📚 Additional Resources

- **Full Documentation:** See `README.md`
- **API Documentation:** See `BACKEND/API_Documentation.md`
- **Test with Postman:** Import `BACKEND/PowerSense_API_Collection.json`

## 💡 Tips

1. **Balance is Auto-Calculated:** `balance = totalPayment - totalPaid`
2. **Bill Numbers Must Be Unique:** Each bill needs a unique identifier
3. **Dates:** Use the date picker for consistent formatting
4. **Real-time Updates:** Changes appear immediately in the list

## 🎨 UI Features

- **Responsive Design:** Works on desktop, tablet, and mobile
- **Color Coding:** 
  - Green badges = Paid bills
  - Yellow badges = Pending bills
  - Red text = Outstanding balances
- **Hover Effects:** Buttons and rows highlight on hover
- **Loading States:** Spinners show while data loads

---

**Enjoy using PowerSense! ⚡**
