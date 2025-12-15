const API_BASE = 'http://localhost:3000';
let adminToken = '';

document.addEventListener('DOMContentLoaded', () => {
  loadProducts();
  loadFeaturedProducts();
  setupEventListeners();
  updateCartCount();
  setupNavLinks();
  updateNavLinks();
});

function setupEventListeners() {
  document.getElementById('order-form').addEventListener('submit', placeOrder);
  document.getElementById('pay-btn').addEventListener('click', processPayment);
  document.getElementById('payment-method').addEventListener('change', toggleMobileMoneyFields);
  document.getElementById('toggle-admin-btn').addEventListener('click', toggleAdminPanel);
  document.getElementById('submit-pass-btn').addEventListener('click', submitAdminPassword);
  document.getElementById('add-product-form').addEventListener('submit', addProduct);
  document.getElementById('cart-icon').addEventListener('click', openCartModal);
  document.getElementById('checkout-btn').addEventListener('click', checkout);
  document.querySelector('.close').addEventListener('click', closeCartModal);
  document.getElementById('register-form').addEventListener('submit', registerUser);
  document.getElementById('login-form').addEventListener('submit', loginUser);
  document.querySelector('.hamburger').addEventListener('click', toggleHamburgerMenu);
  document.getElementById('account-details-btn').addEventListener('click', showAccountDetails);
}

async function loadProducts() {
  try {
    const response = await fetch(`${API_BASE}/products`);
    const products = await response.json();
    displayProducts(products);
  } catch (error) {
    console.error('Error loading products:', error);
  }
}

function displayProducts(products) {
  const container = document.getElementById('products-container');
  container.innerHTML = '';
  products.forEach(product => {
    const imageSrc = product.image.startsWith('/uploads') ? `http://localhost:3000${product.image}` : product.image;
    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
      <img src="${imageSrc}" alt="${product.name}" class="product-image">
      <h3>${product.name}</h3>
      <p>${product.description}</p>
      <p>Price: KES ${product.price.toLocaleString()}</p>
      <p>Location: ${product.location}</p>
      <p>Remaining Quantity: ${product.quantity}</p>
      <button onclick="viewDetails('${product._id}')">View Details</button>
      <button onclick="addToCart('${product._id}', '${product.name}', ${product.price})">Add to Cart</button>
    `;
    container.appendChild(card);
  });
}

async function viewDetails(id) {
  try {
    const response = await fetch(`${API_BASE}/products/${id}`);
    const product = await response.json();
    const imageSrc = product.image.startsWith('/uploads') ? `http://localhost:3000${product.image}` : product.image;
    document.getElementById('product-details').innerHTML = `
      <img src="${imageSrc}" alt="${product.name}" class="product-image">
      <h3>${product.name}</h3>
      <p>${product.description}</p>
      <p>Price: KES ${product.price.toLocaleString()}</p>
      <p>Location: ${product.location}</p>
      <p>Remaining Quantity: ${product.quantity}</p>
    `;
  } catch (error) {
    console.error('Error loading product details:', error);
  }
}

// Cart functions
function addToCart(id, name, price) {
  let cart = JSON.parse(localStorage.getItem('cart')) || [];
  const existingItem = cart.find(item => item.id === id);
  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({ id, name, price, quantity: 1 });
  }
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartCount();
  alert(`${name} added to cart!`);
}

function updateCartCount() {
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  const count = cart.reduce((total, item) => total + item.quantity, 0);
  document.getElementById('cart-count').textContent = count;
}

function openCartModal() {
  const modal = document.getElementById('cart-modal');
  modal.style.display = 'block';
  displayCartItems();
}

function closeCartModal() {
  const modal = document.getElementById('cart-modal');
  modal.style.display = 'none';
}

function displayCartItems() {
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  const cartItems = document.getElementById('cart-items');
  const cartTotal = document.getElementById('cart-total');
  cartItems.innerHTML = '';
  let total = 0;
  cart.forEach((item, index) => {
    const itemTotal = item.price * item.quantity;
    total += itemTotal;
    const cartItem = document.createElement('div');
    cartItem.className = 'cart-item';
    cartItem.innerHTML = `
      <span>${item.name} - KES ${item.price.toLocaleString()} x ${item.quantity} = KES ${itemTotal.toLocaleString()}</span>
      <div>
        <button onclick="updateCartItem(${index}, ${item.quantity - 1})">-</button>
        <button onclick="updateCartItem(${index}, ${item.quantity + 1})">+</button>
        <button onclick="removeCartItem(${index})">Remove</button>
      </div>
    `;
    cartItems.appendChild(cartItem);
  });
  cartTotal.textContent = `Total: KES ${total.toLocaleString()}`;
}

function updateCartItem(index, quantity) {
  let cart = JSON.parse(localStorage.getItem('cart')) || [];
  if (quantity <= 0) {
    cart.splice(index, 1);
  } else {
    cart[index].quantity = quantity;
  }
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartCount();
  displayCartItems();
}

function removeCartItem(index) {
  let cart = JSON.parse(localStorage.getItem('cart')) || [];
  cart.splice(index, 1);
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartCount();
  displayCartItems();
}

function checkout() {
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  if (cart.length === 0) {
    alert('Your cart is empty!');
    return;
  }
  // For simplicity, place order for the first item in cart
  const firstItem = cart[0];
  document.getElementById('product-id').value = firstItem.id;
  document.getElementById('quantity').value = firstItem.quantity;
  document.getElementById('order-section').scrollIntoView();
  closeCartModal();
}

function addToOrder(productId) {
  document.getElementById('product-id').value = productId;
  document.getElementById('order-section').scrollIntoView();
}

async function placeOrder(event) {
  event.preventDefault();
  const productId = document.getElementById('product-id').value;
  const quantity = document.getElementById('quantity').value;

  try {
    const response = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_id: parseInt(productId), quantity: parseInt(quantity) })
    });
    const result = await response.json();
    document.getElementById('order-status').innerHTML = `Order placed! Order ID: ${result.id}`;
    document.getElementById('order-id').value = result.id;
    document.getElementById('payment-section').style.display = 'block';
    document.getElementById('payment-section').scrollIntoView();
  } catch (error) {
    console.error('Error placing order:', error);
  }
}

async function processPayment() {
  const orderId = document.getElementById('order-id').value;
  const paymentMethod = document.getElementById('payment-method').value;
  let body = { order_id: orderId, payment_method: paymentMethod };

  if (paymentMethod === 'mobile-money') {
    const phoneNumber = document.getElementById('phone-number').value;
    if (!phoneNumber) {
      alert('Please enter your phone number for Mobile Money payment.');
      return;
    }
    body.phone_number = phoneNumber;
  }

  try {
    const response = await fetch(`${API_BASE}/payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const result = await response.json();
    document.getElementById('payment-status').innerHTML = result.message;
  } catch (error) {
    console.error('Error processing payment:', error);
  }
}

function toggleMobileMoneyFields() {
  const paymentMethod = document.getElementById('payment-method').value;
  const mobileMoneyFields = document.getElementById('mobile-money-fields');
  if (paymentMethod === 'mobile-money') {
    mobileMoneyFields.style.display = 'block';
  } else {
    mobileMoneyFields.style.display = 'none';
  }
}

async function submitAdminPassword() {
  const password = document.getElementById('admin-pass').value;
  try {
    const response = await fetch(`${API_BASE}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    const result = await response.json();
    if (result.success) {
      adminToken = result.token;
      document.getElementById('admin-password').style.display = 'none';
      document.getElementById('admin-panel').style.display = 'block';
      loadAdminProducts();
    } else {
      alert('Invalid password');
    }
  } catch (error) {
    console.error('Error logging in:', error);
  }
}

function toggleAdminPanel() {
  const panel = document.getElementById('admin-panel');
  panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
  if (panel.style.display === 'block') {
    loadAdminProducts();
  }
}

async function addProduct(event) {
  event.preventDefault();
  const name = document.getElementById('add-name').value;
  const description = document.getElementById('add-description').value;
  const price = parseInt(document.getElementById('add-price').value);
  const imageUrl = document.getElementById('add-image-url').value;
  const imageFile = document.getElementById('add-image-file').files[0];
  const location = document.getElementById('add-location').value;
  const quantity = parseInt(document.getElementById('add-quantity').value);

  if (!imageUrl && !imageFile) {
    alert('Please provide either an image URL or upload an image file.');
    return;
  }

  const formData = new FormData();
  formData.append('name', name);
  formData.append('description', description);
  formData.append('price', price);
  formData.append('location', location);
  formData.append('quantity', quantity);
  if (imageFile) {
    formData.append('image', imageFile);
  } else {
    formData.append('image', imageUrl);
  }

  try {
    const response = await fetch(`${API_BASE}/products`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${adminToken}` },
      body: formData
    });
    const result = await response.json();
    alert(result.message);
    loadAdminProducts();

    // Add the new product to the products section immediately
    const newProduct = {
      _id: result.id,
      name,
      description,
      price,
      image: result.image || imageUrl,
      location,
      quantity
    };
    addProductToDisplay(newProduct);

    document.getElementById('add-product-form').reset();
  } catch (error) {
    console.error('Error adding product:', error);
  }
}

async function loadAdminProducts() {
  try {
    const response = await fetch(`${API_BASE}/products`);
    const products = await response.json();
    displayAdminProducts(products);
  } catch (error) {
    console.error('Error loading admin products:', error);
  }
}

function displayAdminProducts(products) {
  const container = document.getElementById('admin-products');
  container.innerHTML = '<h3>Manage Products</h3>';
  products.forEach(product => {
    const div = document.createElement('div');
    div.className = 'admin-product';
    div.innerHTML = `
      <p><strong>${product.name}</strong> - KES ${product.price.toLocaleString()} - Qty: ${product.quantity}</p>
      <button onclick="editProduct('${product._id}')">Edit</button>
      <button onclick="deleteProduct('${product._id}')">Delete</button>
    `;
    container.appendChild(div);
  });
}

async function deleteProduct(id) {
  if (confirm('Are you sure you want to delete this product?')) {
    try {
      const response = await fetch(`${API_BASE}/products/${id}`, {
        method: 'DELETE'
      });
      const result = await response.json();
      alert(result.message);
      loadAdminProducts();
      loadProducts(); // Refresh customer view
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  }
}

function editProduct(id) {
  // For simplicity, prompt for new values
  const name = prompt('New name:');
  const description = prompt('New description:');
  const price = parseInt(prompt('New price:'));
  const image = prompt('New image URL:');
  const location = prompt('New location:');
  const quantity = parseInt(prompt('New quantity:'));

  if (name && description && price && image && location && quantity) {
    updateProduct(id, { name, description, price, image, location, quantity });
  }
}

async function updateProduct(id, data) {
  try {
    const response = await fetch(`${API_BASE}/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await response.json();
    alert(result.message);
    loadAdminProducts();
    loadProducts(); // Refresh customer view
  } catch (error) {
    console.error('Error updating product:', error);
  }
}

// Account functions
async function registerUser(event) {
  event.preventDefault();
  const name = document.getElementById('reg-name').value;
  const email = document.getElementById('reg-email').value;
  const phone = document.getElementById('reg-phone').value;
  const password = document.getElementById('reg-password').value;

  try {
    const response = await fetch(`${API_BASE}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, phone, password })
    });
    const result = await response.json();
    if (response.ok) {
      alert('Account created successfully!');
      document.getElementById('register-form').reset();
      updateNavLinks();
    } else {
      alert(result.message || 'Registration failed');
    }
  } catch (error) {
    console.error('Error registering user:', error);
  }
}

function addProductToDisplay(product) {
  const container = document.getElementById('products-container');
  const imageSrc = product.image.startsWith('/uploads') ? `http://localhost:3000${product.image}` : product.image;
  const card = document.createElement('div');
  card.className = 'product-card';
  card.innerHTML = `
    <img src="${imageSrc}" alt="${product.name}" class="product-image">
    <h3>${product.name}</h3>
    <p>${product.description}</p>
    <p>Price: KES ${product.price.toLocaleString()}</p>
    <p>Location: ${product.location}</p>
    <p>Remaining Quantity: ${product.quantity}</p>
    <button onclick="viewDetails('${product._id}')">View Details</button>
    <button onclick="addToCart('${product._id}', '${product.name}', ${product.price})">Add to Cart</button>
  `;
  container.appendChild(card);
}

async function loginUser(event) {
  event.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;

  try {
    const response = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const result = await response.json();
    document.getElementById('login-status').innerText = result.message;
    if (response.ok) {
      // Store user token or redirect
      localStorage.setItem('userToken', result.token);
      alert('Login successful');
    }
  } catch (error) {
    console.error('Error logging in:', error);
    document.getElementById('login-status').innerText = 'Login failed';
  }
}

function toggleHamburgerMenu() {
  const hamburger = document.querySelector('.hamburger');
  const navMenu = document.querySelector('.nav-menu');
  const hamburgerContent = document.querySelector('.hamburger-content');
  hamburger.classList.toggle('active');
  navMenu.classList.toggle('active');
  hamburgerContent.classList.toggle('active');
}

function searchProducts() {
  const query = document.getElementById('search-input').value.toLowerCase();
  const cards = document.querySelectorAll('.product-card');
  cards.forEach(card => {
    const name = card.querySelector('h3').textContent.toLowerCase();
    const description = card.querySelector('p').textContent.toLowerCase();
    if (name.includes(query) || description.includes(query)) {
      card.style.display = 'block';
    } else {
      card.style.display = 'none';
    }
  });
}

function showTab(tab) {
  const registerTab = document.getElementById('register-tab');
  const loginTab = document.getElementById('login-tab');
  const registerBtn = document.querySelector('.tab-button[onclick="showTab(\'register\')"]');
  const loginBtn = document.querySelector('.tab-button[onclick="showTab(\'login\')"]');

  if (tab === 'register') {
    registerTab.style.display = 'block';
    loginTab.style.display = 'none';
    registerBtn.classList.add('active');
    loginBtn.classList.remove('active');
  } else {
    registerTab.style.display = 'none';
    loginTab.style.display = 'block';
    registerBtn.classList.remove('active');
    loginBtn.classList.add('active');
  }
}

function showMainTab(tab) {
  const accountSection = document.getElementById('account-section');
  accountSection.style.display = 'block';

  const registerTab = document.getElementById('main-register-tab');
  const loginTab = document.getElementById('main-login-tab');
  const registerBtn = document.querySelector('.tab-button[onclick="showMainTab(\'register\')"]');
  const loginBtn = document.querySelector('.tab-button[onclick="showMainTab(\'login\')"]');

  if (tab === 'register') {
    registerTab.style.display = 'block';
    loginTab.style.display = 'none';
    registerBtn.classList.add('active');
    loginBtn.classList.remove('active');
  } else {
    registerTab.style.display = 'none';
    loginTab.style.display = 'block';
    registerBtn.classList.remove('active');
    loginBtn.classList.add('active');
  }

  setTimeout(() => {
    accountSection.scrollIntoView({ behavior: 'smooth' });
  }, 300);
}

function setupNavLinks() {
  // No specific nav links to set up since account is in hamburger
}

function logout() {
  localStorage.removeItem('userToken');
  alert('Logged out successfully!');
  updateNavLinks();
}

function updateNavLinks() {
  const logoutLink = document.getElementById('logout-link');
  const userToken = localStorage.getItem('userToken');
  if (userToken) {
    logoutLink.style.display = 'block';
  } else {
    logoutLink.style.display = 'none';
  }
}

function subscribeNewsletter(event) {
  event.preventDefault();
  const email = document.getElementById('newsletter-email').value;
  alert(`Thank you for subscribing! We'll send updates to ${email}`);
  document.getElementById('newsletter-form').reset();
}

function filterByCategory(event) {
  const category = event.currentTarget.querySelector('h3').textContent.toLowerCase();
  const cards = document.querySelectorAll('.product-card');
  cards.forEach(card => {
    const name = card.querySelector('h3').textContent.toLowerCase();
    if (name.includes(category) || category === 'all') {
      card.style.display = 'block';
    } else {
      card.style.display = 'none';
    }
  });
  document.getElementById('products-section').scrollIntoView({ behavior: 'smooth' });
}
