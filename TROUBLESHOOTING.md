# PowerSense Troubleshooting Guide

## Common Issues and Solutions

### 🔴 Backend Issues

#### Issue: "Cannot connect to MongoDB"
**Symptoms:**
- Backend server starts but can't connect to database
- Error messages about connection refused

**Solutions:**
1. Check your internet connection
2. Verify MongoDB Atlas credentials
3. Whitelist your IP address in MongoDB Atlas:
   - Go to MongoDB Atlas dashboard
   - Network Access → Add IP Address
   - Add your current IP or use 0.0.0.0/0 (allow all - for development only)
4. Verify connection string in `BACKEND/config/app.js`

#### Issue: "Port 5000 is already in use"
**Symptoms:**
- Error: `EADDRINUSE: address already in use :::5000`

**Solutions:**
1. **Find and kill the process:**
   ```powershell
   netstat -ano | findstr :5000
   taskkill /PID <process_id> /F
   ```
2. **Or change the port:**
   - Edit `BACKEND/server.js`
   - Change `const PORT = 5000;` to another port (e.g., 5001)
   - Update proxy in `frontend/package.json` to match

#### Issue: "Module not found"
**Symptoms:**
- Error: `Cannot find module 'express'` or similar

**Solution:**
```bash
cd BACKEND
npm install
```

---

### 🔵 Frontend Issues

#### Issue: "Proxy error: Could not proxy request"
**Symptoms:**
- Frontend loads but API calls fail
- Error in console about proxy to localhost:5000

**Solutions:**
1. **Make sure backend is running:**
   - Open a terminal
   - Navigate to BACKEND folder
   - Run `npm start`
   - Wait for "Server is running on port 5000"

2. **Check the proxy setting:**
   - Open `frontend/package.json`
   - Verify: `"proxy": "http://localhost:5000"`

3. **Restart frontend after backend is running**

#### Issue: "Port 3000 is already in use"
**Symptoms:**
- Error: `Something is already running on port 3000`

**Solutions:**
1. **Kill the process:**
   ```powershell
   netstat -ano | findstr :3000
   taskkill /PID <process_id> /F
   ```

2. **Or use a different port:**
   ```bash
   $env:PORT=3001; npm start
   ```

#### Issue: React warnings about hooks
**Symptoms:**
- Warning about missing dependencies in useEffect

**Solution:**
- These warnings are already addressed in the code
- They're informational and don't break functionality
- The app works correctly despite the warnings

#### Issue: "Module not found" in frontend
**Solution:**
```bash
cd frontend
npm install
```

---

### 🟡 Application Issues

#### Issue: Bills not showing up
**Possible Causes & Solutions:**

1. **No bills in database:**
   - Create your first bill using the "Add New Bill" button
   - Or test API directly with Postman

2. **API connection failed:**
   - Check browser console for errors
   - Verify backend is running
   - Check Network tab in browser DevTools

3. **Database is empty:**
   - Normal for first-time setup
   - Add some test data through the UI

#### Issue: Can't create a bill
**Check:**
1. All required fields are filled (marked with *)
2. Bill number is unique
3. Numbers are valid (positive values)
4. Backend is running and connected to database

**Common Errors:**
- "Bill number already exists" → Use a different bill number
- "Validation failed" → Check all required fields

#### Issue: Statistics not loading
**Solutions:**
1. Create at least one bill first
2. Refresh the page
3. Check browser console for errors
4. Verify backend `/api/monthly-bills/stats` endpoint is working:
   - Visit: http://localhost:5000/api/monthly-bills/stats

#### Issue: Edit page shows loading forever
**Causes:**
- Backend not running
- Bill ID in URL is invalid
- Database connection issue

**Solution:**
- Go back to bills list
- Try editing a different bill
- Check browser console for errors

---

### 🟢 Performance Issues

#### Issue: Slow loading times
**Solutions:**
1. **Check internet connection** (for MongoDB Atlas)
2. **Reduce data size:**
   - Limit number of bills
   - Add pagination (future enhancement)
3. **Clear browser cache:**
   - Press Ctrl+Shift+Delete
   - Clear cached files

#### Issue: Page refreshes reset data
**Expected Behavior:**
- React development server hot-reloads on file changes
- Data persists in MongoDB
- Refresh browser to see latest data

---

### 🟣 Development Issues

#### Issue: Tailwind styles not applying
**Solutions:**
1. **Verify Tailwind is configured:**
   - Check `tailwind.config.js` exists
   - Check `postcss.config.js` exists
   - Verify `@tailwind` directives in `index.css`

2. **Restart development server:**
   ```bash
   # Stop server (Ctrl+C)
   npm start
   ```

3. **Rebuild Tailwind:**
   ```bash
   npm run build
   ```

#### Issue: Changes not reflecting
**Solutions:**
1. **Hard refresh browser:**
   - Windows: Ctrl+Shift+R
   - Clear cache if needed

2. **Restart development server:**
   - Stop with Ctrl+C
   - Run `npm start` again

3. **Check file is saved:**
   - Verify file save in editor
   - Look for unsaved indicator (dot in tab)

---

### 🔧 Testing Issues

#### Issue: Postman requests failing
**Solutions:**
1. **Verify backend is running** on port 5000
2. **Check request URL:** `http://localhost:5000/api/monthly-bills`
3. **Check request body format:**
   - Must be valid JSON
   - Content-Type: application/json
4. **See sample requests** in `PowerSense_API_Collection.json`

#### Issue: CORS errors
**Solution:**
- Backend already has CORS enabled
- If issues persist, check `server.js` for `cors()` middleware

---

## 🆘 Emergency Fixes

### Nuclear Option: Fresh Start
If all else fails, restart everything:

```powershell
# Stop all terminals (Ctrl+C in each)

# Backend
cd BACKEND
npm install
npm start

# Frontend (new terminal)
cd frontend
npm install
npm start
```

### Reset Database
To start with a fresh database:
1. Go to MongoDB Atlas
2. Browse Collections
3. Delete all documents in `monthlyBills` collection
4. Or drop the entire collection

### Reinstall Dependencies
```bash
# Backend
cd BACKEND
rm -rf node_modules package-lock.json
npm install

# Frontend
cd frontend
rm -rf node_modules package-lock.json
npm install
```

---

## 📞 Getting Help

### Debug Checklist
- [ ] Both servers are running
- [ ] No error messages in terminals
- [ ] MongoDB Atlas is accessible
- [ ] Browser console has no errors
- [ ] Network tab shows successful API calls
- [ ] Required fields are filled correctly

### Useful Commands

**Check what's running on a port:**
```powershell
netstat -ano | findstr :5000
netstat -ano | findstr :3000
```

**Kill a process:**
```powershell
taskkill /PID <process_id> /F
```

**View backend logs:**
- Check the terminal where backend is running
- Look for error messages

**View frontend logs:**
- Open browser DevTools (F12)
- Check Console tab
- Check Network tab for API calls

---

## 💡 Tips for Smooth Operation

1. **Always start backend first**, then frontend
2. **Keep terminal windows open** while using the app
3. **Don't close terminals** - they need to run continuously
4. **Check MongoDB Atlas** if connection issues occur
5. **Use unique bill numbers** to avoid conflicts
6. **Save your work** - data persists in MongoDB
7. **Refresh browser** if you make code changes
8. **Check console** first when something doesn't work

---

## ✅ Success Indicators

You know everything is working when:
- ✅ Backend shows: "Server is running on port 5000"
- ✅ Frontend shows: "webpack compiled successfully"
- ✅ Browser opens to localhost:3000
- ✅ You can see the PowerSense navbar
- ✅ Bills page loads (even if empty)
- ✅ You can create a new bill
- ✅ Statistics page shows data

---

**Still having issues? Check the documentation or create an issue on GitHub!**
