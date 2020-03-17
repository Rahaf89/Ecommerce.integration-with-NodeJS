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

app.get("/suppliers", (req, res) => {
  pool.query("SELECT * FROM suppliers", (error, result) => {
    res.json(result.rows);
  });
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
    query = `SELECT * FROM products WHERE product_name is like '%${productNameQuery}%' ORDER BY product_name `;
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

app.listen(3000, function() {
  console.log("Server is listening on port 3000. Ready to accept requests!");
});
