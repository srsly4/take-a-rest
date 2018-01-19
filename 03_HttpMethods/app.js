// File 03_HttpMethods/app.js
//
const express = require("express");
const app = express();

function printReqSummary(request) {
  console.log(`Handling ${request.method} ${request.originalUrl}`);
}

/* Store items collection in this array */
let items = [];

/* GET / -- Show main page */
app.get("/", function(request, response) {
  printReqSummary(request);
  response.send(
    `<h1>HTTP Methods</h1><ul>
      <li>Show items (GET /item)</li>
      <li>Add an item (PUT /item/:name)</li>
      <li>Remove an item (DELETE /item/:name)</li></ul>`
  );
});

/* GET /item -- Show all items from the collection */
app.get("/item", function(request, response) {
  printReqSummary(request);
  response.send(`<p>Available items: ${items.toString()}</p>`);
});

app.post("/item", function(request, response) {
  if (!request.query.newName) {
    response.send(`New name not provided`);
  }

  const key = items.indexOf(request.query.newName);
  if (key !== -1) {
    response.send(`<p>Item "${request.query.newName}" already exists</p>`);
  } else {
    items.push(request.query.newName);
    response.send(`<p>Item "${request.query.newName}" created</p>`);
  }

});

/* PUT /item/:name -- add (put) new item to the collection */
app.put("/item/:name", function(request, response) {
  printReqSummary(request);
  const itemName = request.params.name;

  if (!request.query.newName) {
    response.send(`New name not provided`);
  }

  const key = items.indexOf(itemName);
  if (key !== -1) {
    items[key] = request.query.newName;
    response.send(`<p>Item "${itemName}" changed to ${request.query.newName}</p>`);
  } else {
    response.send(`<p>Item "${itemName}" doesn't exist</p>`);
  }
});

/* DELETE /item/:name -- remove a given item from the collection */
app.delete("/item/:name", function(request, response) {
  printReqSummary(request);
  const itemName = request.params.name;
  /* Is the item in collection? */
  if (items.includes(itemName)) {
    items = items.filter(item => item !== itemName);
    response.send(`<p>Item "${itemName}" removed successfully</p>`);
  } else {
    response.send(`<p>Item "${itemName}" doesn't exists</p>`);
  }
});

app.listen(3000);
