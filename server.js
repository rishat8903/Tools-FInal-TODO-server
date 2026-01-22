require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://ashiq:7598901@cluster0.9r5kc1g.mongodb.net/?appName=Cluster0';

mongoose.connect(MONGODB_URI)
    .then(() => console.log('✅ MongoDB connected successfully'))
    .catch(err => {
        console.error('❌ MongoDB connection error:', err.message);
        console.error('\n🔧 Troubleshooting steps:');
        console.error('1. Check if your IP is whitelisted in MongoDB Atlas');
        console.error('2. Go to: https://cloud.mongodb.com/');
        console.error('3. Navigate to: Network Access → Add IP Address');
        console.error('4. Click "Allow Access from Anywhere" or add your current IP\n');
    });

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});

const User = mongoose.model('User', userSchema);
const todoSchema = new mongoose.Schema({
    title: { type: String, required: true },
    done: { type: Boolean, default: false },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
});

const Todo = mongoose.model('Todo', todoSchema);
// ========== AUTH ENDPOINTS ==========
app.post('/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username, password });

        if (user) {
            res.json({ success: true, userId: user._id, username: user.username });
        } else {
            res.json({ success: false, message: 'Invalid username or password' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/auth/register', async (req, res) => {
    try {
        const { username, password } = req.body;

        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.json({ success: false, message: 'Username already exists' });
        }

        const user = new User({ username, password });
        await user.save();

        res.json({ success: true, userId: user._id, username: user.username });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/todos/:userId', async (req, res) => {
    try {
        const todos = await Todo.find({ userId: req.params.userId });
        res.json(todos);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/todos', async (req, res) => {
    try {
        const { title, userId } = req.body;
        const todo = new Todo({ title, userId });
        await todo.save();
        res.json(todo);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/todos/:id', async (req, res) => {
    try {
        const todo = await Todo.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(todo);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/todos/:id', async (req, res) => {
    try {
        await Todo.findByIdAndDelete(req.params.id);
        res.json({ message: 'Deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
}).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`❌ Error: Port ${PORT} is already in use.`);
        console.error(`🔧 Solution: Kill the process using port ${PORT} or change the port in .env file.`);
    } else {
        console.error('❌ Server error:', err.message);
    }
    process.exit(1);
});
