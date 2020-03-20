const express = require("express");
const app = express();
const secrets = require("./secrets");
const { Pool } = require("pg");

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "cyf_ecommerce",
  password: secrets.dbPassword,
  port: 5432
});

const bodyParser = require("body-parser");
app.use(bodyParser.json());

app.get("/customers", (req, res) => {
  pool.query("SELECT * FROM customers", (error, result) => {
    res.json(result.rows);
  });
});

app.get("/customers/:customerId", function(req, res) {
  const customerId = req.params.customerId;

  pool
    .query("SELECT * FROM customers where id = $1", [customerId])
    .then(result => res.json(result.rows))
    .catch(err => res.status(500).send(error));
});

app.get('/customers/:customerId/orders',(req,res)=>{
  const customerId=req.params.customerId
  const query='select c.name ,o.order_reference, o.order_date, p.product_name, p.unit_price,s.supplier_name,oi.quantity from customers c join orders o on o.customer_id = c.id join order_items oi on oi.order_id =o.id join products p on p.id =oi.product_id join suppliers s on s.id=p.supplier_id where c.id =$1';
  pool.query(query, [customerId])
  .then(result => res.json(result.rows))
  .catch(e => console.error(e));
})

app.post("/customers", (req, res) => {
  const newCustomerName = req.body.name;
  const newCustomerAddress = req.body.address;
  const newCustomerCity = req.body.city;
  const newCustomerCountry = req.body.country;

  const query =
    "INSERT INTO customers (name,address,city,country) VALUES ($1,$2,$3,$4)";

  const params = [
    newCustomerName,
    newCustomerAddress,
    newCustomerCity,
    newCustomerCountry
  ];

  pool
    .query(query, params)
    .then(() => res.send("Customer Created!"))
    .catch(e => res.status(500).send(e));
});

app.post("/customers/:customerId/orders", function(req, res) {
  const customerId=req.params.customerId;
  const orderDate = req.body.order_date;
  const orderReference = req.body.order_reference;
  pool.query("SELECT * FROM customers WHERE id=$1", [customerId])
      .then(() => {
          if(!customerId) {
              return res.status(400).send('There is no customer with that ID!');
          } else {
              const query = "INSERT INTO orders (order_date, order_reference,customer_id) VALUES ($1, $2,$3)";
              pool.query(query, [orderDate, orderReference, customerId])
                  .then(() => res.send("Order created!"))
                  .catch(e => console.error(e));
          }
      });
});

app.put("/customers/:customerId", function(req, res) { 
  const newCustomerName = req.body.name;
  const newCustomerAddress = req.body.address;
  const newCustomerCity = req.body.city;
  const newCustomerCountry = req.body.country;
  const newcustomerId = req.params.id;

  pool.query(
    "UPDATE customers SET name=$1, address=$2, city=$3, country=$4 WHERE id=$5", 
    [newCustomerName, newCustomerAddress,newCustomerCity, newCustomerCountry , newcustomerId])
      .then(() => res.send(`Customer updated ! `))
      .catch(e => console.error(e)); 
}); 

app.delete("/customers/:customerId", function(req, res) {
  const customerId = req.params.customerId;
  pool.query("DELETE FROM orders WHERE customer_id=$1", [customerId])
      .then(() => {
          pool.query("DELETE FROM customers WHERE id=$1", [customerId])
              .then(() => res.send(`Customer ${customerId} deleted!`))
              .catch(e => console.error(e));;
      })
      .catch(e => console.error(e));
});

app.get("/products", (req, res) => {
  pool.query(
    "SELECT products.*, suppliers.supplier_name FROM products join suppliers on products.supplier_id = suppliers.id",
    (error, result) => {
      res.json(result.rows);
    }
  );
});

app.get("/products", function(req, res) {
  const productNameQuery = req.query.product_name;

  let query = "SELECT * FROM products ORDER BY product_name";

  if (productNameQuery) {
    query = `SELECT * FROM products WHERE product_name ilike '%${productNameQuery}%' ORDER BY product_name `;
  }

  pool
    .query(query)
    .then(result => res.json(result.rows))
    .catch(err => res.status(500).send(error));
});

app.post("/products", function(req, res) {
  const ProductName = req.body.product_name;
  const ProductPrice = req.body.unit_price;
  const SupplierId = req.body.supplier_id;

  if (!Number.isInteger(ProductPrice) || ProductPrice <= 0) {
    return res.status(400).send("The price should be a positive integer.");
  }

  pool
    .query("SELECT * FROM products WHERE supplier_id=$1", [SupplierId])
    .then(result => {
      if (!SupplierId) {
        return res.status(400).send("There is no supplier with that id!");
      } else {
        const query =
          "INSERT INTO products (product_name, unit_price,supplier_id) VALUES ($1, $2, $3)";
        pool
          .query(query, [ProductName, ProductPrice, SupplierId])
          .then(() => res.send("Product added!"))
          .catch(e => console.error(e));
      }
    });
});

app.get ('/orders',(req, res)=>{
  pool.query('SELECT * FROM orders', (error, result) => {
      res.json(result.rows);
  })    
});

app.get("/orders/:orderId", function(req, res) {
  const orderId = req.params.orderId;

  pool
    .query("SELECT * FROM orders where id = $1", [orderId])
    .then(result => res.json(result.rows))
    .catch(err => res.status(500).send(error));
});

app.delete("/orders/:orderId", function(req, res) {
  const orderId = req.params.orderId;
  pool.query("DELETE FROM order_items WHERE order_id=$1", [orderId])
  .then(() => {
      pool.query("DELETE FROM orders WHERE id=$1", [orderId])
          .then(() => res.send(`Order ${orderId} deleted!`))
          .catch(e => console.error(e));;
  })
  .catch(e => console.error(e));
});


app.get("/customers/:customerId/orders", function(req, res) {
  const customerId = req.params.customerId; 

  const query = 
    "select orders.order_date , orders.order_reference , products.product_name, products.unit_price, suppliers.supplier_name , order_items.quantity" + 
    "from orders join order_items on order_items.order_id =orders.id" + 
    "join products on order_items.product_id =products.id"+
    "join suppliers on products.supplier_id = suppliers.id"+
    "where customerId = $1"; 

  pool
    .query(query, [customerId])
    .then(result => res.json(result.rows))
    .catch(err => res.status(500).send(error)); 
}); 


app.delete("/orders/:orderId", function(req, res) {
  const orderId = req.params.orderId;

  pool.query("DELETE FROM orders WHERE id=$1", [orderId])
      .then(() => res.send(`order ${orderId} deleted!`))
      .catch(e => console.error(e));
});

app.listen(3000, function() {
  console.log("Server is listening on port 3000. Ready to accept requests!");
});
