const pool = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');


const defaultUsers = [
    {
        username: 'testuser',
        password: 'testpassword123',
        fullname: 'Test User',
        user_id: 1,
    },
    {
        username: 'guestuser',
        password: 'guestpassword456',
        fullname: 'Guest User',
        user_id: 2,
    }
];

const login = async (req, res) => {
    const { username, password } = req.body;

    
    const defaultUser = defaultUsers.find(user => user.username === username);

    if (defaultUser) {
      
        if (password === defaultUser.password) {
            const token = jwt.sign(
                { user_id: defaultUser.user_id, username: defaultUser.username },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_ACCESS_EXPIRATION_TIME }
            );
            return res.json({ token });
        } else {
            return res.status(400).json({ error: 'Invalid Credentials' });
        }
    }

    
    try {
        const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);

        if (rows.length === 0) {
            return res.status(400).json({ error: 'Invalid Credentials' });
        }

        const user = rows[0];
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid Credentials' });
        }

        const token = jwt.sign(
            { user_id: user.user_id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_ACCESS_EXPIRATION_TIME }
        );

        res.json({ token });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = { register, login };