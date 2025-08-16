# Framtt Backend API

A comprehensive Node.js backend API for the Framtt car rental management demo website. This backend handles questionnaire submissions, demo requests, lead management, and analytics.

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- MySQL/MariaDB database
- npm or yarn

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

3. **Setup database**
   ```bash
   npm run db:setup
   ```

4. **Seed sample data (optional)**
   ```bash
   npm run db:seed
   ```

5. **Start the server**
   ```bash
   npm run dev  # Development mode
   npm start    # Production mode
   ```

## 📋 Available Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start production server |
| `npm run dev` | Start development server with nodemon |
| `npm run db:setup` | Setup database schema |
| `npm run db:migrate` | Run migrations only |
| `npm run db:seed` | Add sample data |
| `npm run db:seed -- --force` | Force seed (override existing data) |
| `npm test` | Run tests |

## 🏗️ Project Structure

```
backend/
├── config/          # Database configuration
├── controllers/     # Route controllers
├── middleware/      # Express middleware
├── models/          # Data models
├── routes/          # API routes
├── services/        # Business logic services
├── utils/           # Utility functions
├── scripts/         # Database scripts
└── server.js        # Main server file
```

## 📡 API Endpoints

### Public Endpoints
- `GET /api/health` - Health check
- `POST /api/questionnaire/submit` - Submit questionnaire
- `GET /api/questionnaire/solutions/:sessionId` - Get solutions
- `POST /api/demo/request` - Submit demo request

### Protected Endpoints (require API key)
- `GET /api/leads` - Get all leads
- `GET /api/analytics/overview` - Analytics overview
- `PUT /api/leads/:id` - Update lead
- `POST /api/leads/:id/activities` - Add lead activity

## 🔐 Authentication

Use API key authentication for admin endpoints:
```bash
curl -H "X-API-Key: your-api-key" http://localhost:3001/api/leads
```

## 🗄️ Database Schema

The API uses MySQL with the following main tables:
- `questionnaires` - Questionnaire responses
- `demo_requests` - Demo requests
- `leads` - Qualified leads
- `lead_activities` - Lead activity tracking
- `users` - Admin users

## 🧪 Testing

Sample data includes:
- 5 questionnaire responses
- 5 demo requests
- 4 qualified leads
- Lead activities and analytics data

## 📧 Email Integration

Configure SMTP settings in `.env`:
```env
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-password
```

## 🚨 Error Handling

The API includes comprehensive error handling:
- Input validation
- Database error handling
- Rate limiting
- Security middleware

## 📊 Analytics

Built-in analytics for:
- Questionnaire completion rates
- Demo request conversion
- Lead qualification funnel
- Daily/monthly trends

## 🔧 Configuration

Key environment variables:
```env
# Server
PORT=3001
NODE_ENV=development

# Database  
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=password
DB_NAME=framtt_demo

# Security
JWT_SECRET=your-secret-key
API_KEY=your-api-key

# Email
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email
SMTP_PASSWORD=your-password
```

## 🐛 Troubleshooting

**Database connection issues:**
1. Verify MySQL is running
2. Check credentials in `.env`
3. Ensure database exists

**Migration errors:**
```bash
npm run db:setup
```

**Port already in use:**
Change PORT in `.env` file

## 📝 License

MIT License - see LICENSE file for details