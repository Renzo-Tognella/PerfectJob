#!/bin/bash
set -e

echo "========================================"
echo "  PerfectJob - Development Setup"
echo "========================================"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

echo "✅ Docker is running"
echo ""

# Start docker compose
echo "🚀 Starting PostgreSQL and Redis..."
docker compose up -d

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
RETRIES=30
until docker exec perfectjob-postgres pg_isready -U perfectjob -d perfectjob > /dev/null 2>&1 || [ $RETRIES -eq 0 ]; do
    sleep 1
    RETRIES=$((RETRIES - 1))
    echo "   ...retrying ($RETRIES left)"
done

if [ $RETRIES -eq 0 ]; then
    echo "❌ PostgreSQL failed to start. Check logs with: docker compose logs postgres"
    exit 1
fi

echo "✅ PostgreSQL is ready"
echo "✅ Redis is ready"
echo ""

# Print next steps
echo "========================================"
echo "  Infrastructure is up and running!"
echo "========================================"
echo ""
echo "Next steps:"
echo ""
echo "1. Run the backend (port 8081, profile dev):"
echo "   cd perfectjob-api"
echo "   Linux/Mac/Git Bash:"
echo "     ./mvnw spring-boot:run -Dspring-boot.run.profiles=dev"
echo "   Windows PowerShell:"
echo "     .\\mvnw.cmd spring-boot:run \"-Dspring-boot.run.profiles=dev\""
echo "     (ou: .\\run-dev.ps1)"
echo ""
echo "2. Run the admin web:"
echo "   cd perfectjob-admin"
echo "   npm install"
echo "   npm run dev"
echo "   Login: admin@perfectjob.com / Admin@123"
echo ""
echo "3. Run the mobile app:"
echo "   cd perfectjob-mobile"
echo "   npm install"
echo "   npx expo start"
echo ""
echo "Happy coding! 🚀"
