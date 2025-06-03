const db = require('../db/init');

// Create a new order
const createOrder = (req, res) => {
  try {
    console.log('Received order request:', JSON.stringify(req.body));
    
    // Extract data from request body
    const { customerInfo, cart } = req.body;
    
    // Insert into orders table directly (no transaction)
    const orderInsert = db.prepare(`
      INSERT INTO orders 
      (full_name, email, country_code, phone, nationality, place_of_residence, 
       address, zip_code) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const orderResult = orderInsert.run(
      customerInfo.fullName,
      customerInfo.email,
      customerInfo.phoneCountry || '+62',
      customerInfo.phoneNumber,
      customerInfo.nationality,
      customerInfo.residence1 || '',
      customerInfo.residence1 || '',  // Using residence1 as address
      customerInfo.zipCode || ''
    );

    const orderId = orderResult.lastInsertRowid;
    console.log('Created order with ID:', orderId);
    
    // Debug print to see the actual cart items
    console.log('Cart items:', JSON.stringify(cart));
    
    // For each item in cart, add an order detail
    for (const item of cart) {
      try {
        // Map the frontend ticket types to database pass types
        let passType;
        if (item.type === '3day') {
          passType = `${item.class === 'vip' ? 'VIP' : 'General'} 3-Day`;
        } else if (['friday', 'saturday', 'sunday'].includes(item.type)) {
          passType = `${item.class === 'vip' ? 'VIP' : 'General'} 1-Day`;
        } else {
          console.error('Unknown pass type:', item.type);
          continue;
        }
        
        console.log('Looking for pass type:', passType);
        
        const pass = db.prepare('SELECT passes_id, stock FROM passes WHERE tier = ?').get(passType);
        
        if (!pass) {
          console.error('Pass not found for:', passType);
          continue;
        }
        
        console.log('Found pass:', JSON.stringify(pass));

        // Insert into order_details
        const orderDetailInsert = db.prepare(
          'INSERT INTO order_details (order_id, passes_id, quantity) VALUES (?, ?, ?)'
        );
        
        const orderDetailResult = orderDetailInsert.run(orderId, pass.passes_id, item.quantity);
        console.log('Created order detail:', JSON.stringify(orderDetailResult));
        
        // Update stock (if needed)
        const updateStock = db.prepare('UPDATE passes SET stock = stock - ? WHERE passes_id = ?');
        updateStock.run(item.quantity, pass.passes_id);
      } catch (detailError) {
        console.error('Error processing cart item:', detailError);
      }
    }

    // Return the order ID explicitly
    res.status(201).json({ 
      orderId: orderId,  // Explicitly set this
      message: 'Order created successfully' 
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ message: `Failed to create order: ${error.message}` });
  }
};

// Get order by ID
const getOrderById = (req, res) => {
  try {
    const { id } = req.params;
    
    const orderDetails = db.prepare(`
      SELECT o.*, od.quantity, p.tier, p.price
      FROM orders o
      JOIN order_details od ON o.order_id = od.order_id
      JOIN passes p ON od.passes_id = p.passes_id
      WHERE o.order_id = ?
    `).all(id);
    
    if (orderDetails.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Format the response
    const order = {
      orderId: orderDetails[0].order_id,
      fullName: orderDetails[0].full_name,
      email: orderDetails[0].email,
      phone: orderDetails[0].phone,
      nationality: orderDetails[0].nationality,
      createdAt: orderDetails[0].created_at,
      items: orderDetails.map(item => ({
        tier: item.tier,
        quantity: item.quantity,
        price: item.price,
        totalPrice: item.price * item.quantity
      })),
      totalAmount: orderDetails.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    };
    
    res.status(200).json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ message: 'Failed to fetch order' });
  }
};

module.exports = {
  createOrder,
  getOrderById
};