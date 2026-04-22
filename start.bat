@echo off
echo Starting Corporate Quotation System...

echo Starting backend server...
cd backend
start cmd /k "npm start"

echo Starting frontend server...
cd ../frontend
start cmd /k "npm start"

echo Both servers are starting. Frontend will be available at http://localhost:3000, Backend at http://localhost:5000
pause