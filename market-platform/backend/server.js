const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const axios = require('axios');
const dayjs = require('dayjs');
const { Base64 } = require('js-base64');
const app = express();
const PORT = 3000;

// M-Pesa credentials
const CONSUMER_KEY = 'cHA4oHxOlvs01GUJUEdwsfe8iw5ljRYeQvdOt7CDdASSt8hm';
const CONSUMER_SECRET = 'SuOeF3kAJsu9VAXfqs4YAyMWx0xevgG402GOYSLltShvpoq9XaJtXq609GmNLhUF';
const SHORT_CODE = '174379';
const PASSKEY = 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919';

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, '../frontend')));

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/ecommerce', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB');
}).catch(err => {
  console.error('MongoDB connection error:', err);
});

// Define schemas
const productSchema = new mongoose.Schema({
  name: String,
  description: String,
  price: Number,
  image: String,
  location: String,
  quantity: Number
});

const orderSchema = new mongoose.Schema({
  product_id: mongoose.Schema.Types.ObjectId,
  quantity: Number,
  total: Number,
  status: { type: String, default: 'pending' }
});

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  phone: String,
  password: String // In production, hash passwords
});

const Product = mongoose.model('Product', productSchema);
const Order = mongoose.model('Order', orderSchema);
const User = mongoose.model('User', userSchema);

// User authentication middleware (simple, for demo)
const authenticateUser = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader === 'Bearer user-token') {
    next();
  } else {
    res.status(401).json({ message: 'Unauthorized' });
  }
};

// Register user
app.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    const user = new User({ name, email, phone, password });
    await user.save();
    res.json({ message: 'User registered successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login user
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || user.password !== password) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    res.json({ message: 'Login successful', token: 'user-token' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin authentication middleware
const authenticateAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader === 'Bearer admin-token') {
    next();
  } else {
    res.status(401).json({ message: 'Unauthorized' });
  }
};

// Admin login
app.post('/admin/login', (req, res) => {
  const { password } = req.body;
  if (password === 'admin123') { // Hardcoded admin password for simplicity
    res.json({ success: true, token: 'admin-token' });
  } else {
    res.status(401).json({ success: false, message: 'Invalid password' });
  }
});

// Insert sample products if not exist
Product.findOne({ name: 'Laptop' }).then(product => {
  if (!product) {
    Product.insertMany([
      { name: 'Laptop', description: 'High-performance laptop', price: 120000, image: 'https://via.placeholder.com/300x200?text=Laptop', location: 'Store A, 123 Main St', quantity: 5 },
      { name: 'Phone', description: 'Smartphone with camera', price: 70000, image: 'https://via.placeholder.com/300x200?text=Phone', location: 'Store B, 456 Elm St', quantity: 10 },
      { name: 'Headphones', description: 'Noise-cancelling headphones', price: 25000, image: 'https://via.placeholder.com/300x200?text=Headphones', location: 'Store A, 123 Main St', quantity: 8 }
    ]);
  }
});

// Routes
app.get('/products', async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/products', upload.single('image'), async (req, res) => {
  try {
    const { name, description, price, location, quantity } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : req.body.image;
    const product = new Product({ name, description, price, image, location, quantity });
    await product.save();
    res.json({ id: product._id, message: 'Product added successfully', image });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/products/:id', async (req, res) => {
  try {
    const { name, description, price, image, location, quantity } = req.body;
    const product = await Product.findByIdAndUpdate(req.params.id, { name, description, price, image, location, quantity }, { new: true });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json({ message: 'Product updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/products/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/orders', async (req, res) => {
  try {
    const { product_id, quantity } = req.body;
    const product = await Product.findById(product_id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    if (typeof product.quantity !== 'number') product.quantity = 0;
    if (product.quantity < quantity) return res.status(400).json({ error: 'Insufficient quantity' });
    const total = product.price * quantity;
    const order = new Order({ product_id, quantity, total });
    await order.save();
    // Update product quantity
    product.quantity -= quantity;
    await product.save();
    res.json({ id: order._id, message: 'Order placed successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/orders/:id', authenticateAdmin, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// M-Pesa access token
let accessToken = '';

async function getAccessToken() {
  const auth = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64');
  try {
    const response = await axios.get('https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
      headers: {
        'Authorization': `Basic ${auth}`
      }
    });
    accessToken = response.data.access_token;
    return accessToken;
  } catch (error) {
    console.error('Error getting access token:', error);
    throw error;
  }
}

// Payment processing
app.post('/payment', async (req, res) => {
  const { order_id, payment_method, phone_number } = req.body;

  if (payment_method === 'mobile-money') {
    try {
      await getAccessToken();
      const timestamp = dayjs().format('YYYYMMDDHHmmss');
      const password = Base64.encode(SHORT_CODE + PASSKEY + timestamp);

      const stkPushData = {
        BusinessShortCode: SHORT_CODE,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: 1, // For testing, use 1 KES
        PartyA: phone_number,
        PartyB: SHORT_CODE,
        PhoneNumber: phone_number,
        CallBackURL: 'https://example.com/callback', // sandbox callback URL
        AccountReference: `Order-${order_id}`,
        TransactionDesc: 'Payment for order'
      };

      const response = await axios.post('https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest', stkPushData, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      res.json({ success: true, message: 'STK Push sent to your phone. Please enter your PIN to complete payment.', checkoutRequestId: response.data.CheckoutRequestID });
    } catch (error) {
      console.error('Error processing M-Pesa payment:', error.response ? error.response.data : error.message);
      let errorMessage = 'Payment processing failed';
      if (error.response && error.response.data) {
        const { errorCode, errorMessage: apiErrorMessage } = error.response.data;
        if (errorCode === '500.001.1001') {
          errorMessage = 'Invalid credentials for M-Pesa STK Push. Please check your passkey and shortcode.';
        } else if (apiErrorMessage) {
          errorMessage = `M-Pesa error: ${apiErrorMessage}`;
        } else if (errorCode) {
          errorMessage = `M-Pesa error code: ${errorCode}`;
        }
      }
      res.status(500).json({ success: false, message: errorMessage });
    }
  } else {
    // Simulate other payment methods
    setTimeout(() => {
      res.json({ success: true, message: 'Payment processed successfully' });
    }, 1000);
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
