const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/db');

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// Connect to Database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Basic Route
app.get('/', (req, res) => {
    res.send('CodeCraft Backend API is running...');
});

// Define Routes
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/hackathons', require('./routes/hackathonRoutes'));
app.use('/api/registrations', require('./routes/registrationRoutes'));

// Error Middleware
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
