# Monthly Bill API Documentation

## Base URL
`http://localhost:5000/api/bills`

## Endpoints

### 1. Create a New Bill
- **POST** `/api/bills`
- **Body:**
```json
{
  "billNumber": "PWR-2024-001",
  "billIssueDate": "2024-01-15",
  "totalKWh": 250.5,
  "totalPayment": 1500.00,
  "totalPaid": 0
}
```

### 2. Get All Bills
- **GET** `/api/bills`
- **Query Parameters:**
  - `page` (optional): Page number (default: 1)
  - `limit` (optional): Items per page (default: 10)
  - `isPaid` (optional): Filter by payment status (true/false)
  - `billNumber` (optional): Search by bill number

### 3. Get Bill by ID
- **GET** `/api/bills/:id`

### 4. Get Bill by Bill Number
- **GET** `/api/bills/number/:billNumber`

### 5. Update Bill
- **PUT** `/api/bills/:id`
- **Body:** (same as create, all fields optional)

### 6. Delete Bill
- **DELETE** `/api/bills/:id`

### 7. Get Statistics
- **GET** `/api/bills/stats`
- **Returns:**
```json
{
  "success": true,
  "data": {
    "totalBills": 10,
    "paidBills": 6,
    "unpaidBills": 4,
    "totalKWhConsumption": 2500.5,
    "totalAmountDue": 15000.00,
    "totalAmountPaid": 9000.00,
    "totalOutstanding": 6000.00
  }
}
```

## Bill Object Structure
```json
{
  "_id": "ObjectId",
  "billNumber": "PWR-2024-001",
  "billIssueDate": "2024-01-15T00:00:00.000Z",
  "totalKWh": 250.5,
  "totalPayment": 1500.00,
  "totalPaid": 800.00,
  "balance": 700.00,
  "isPaid": false,
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-20T15:45:00.000Z"
}
```

## Response Format
All responses follow this format:
```json
{
  "success": true/false,
  "message": "Description",
  "data": { ... },
  "error": "Error message (if any)"
}
```

## Sample Usage

### Create a Bill:
```bash
curl -X POST http://localhost:5000/api/bills \
  -H "Content-Type: application/json" \
  -d '{
    "billNumber": "PWR-2024-001",
    "billIssueDate": "2024-01-15",
    "totalKWh": 250.5,
    "totalPayment": 1500.00,
    "totalPaid": 0
  }'
```

### Get All Bills:
```bash
curl http://localhost:5000/api/bills
```

### Update a Bill:
```bash
curl -X PUT http://localhost:5000/api/bills/BILL_ID \
  -H "Content-Type: application/json" \
  -d '{
    "totalPaid": 1500.00
  }'
```
