#!/bin/bash

echo "Setting up RPG Cards Application..."

# Setup backend
echo "Setting up backend..."
cd backend
npm install
echo "Backend dependencies installed!"

# Setup frontend  
echo "Setting up frontend..."
cd ../frontend
npm install
echo "Frontend dependencies installed!"

cd ..
echo ""
echo "Setup complete!"
echo ""
echo "To run the application:"
echo "1. Backend: cd backend && npm run dev"
echo "2. Frontend: cd frontend && ng serve"
echo ""
echo "Then visit http://localhost:4200"
