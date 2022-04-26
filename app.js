//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

// Connect to MongoDB using Mongoose                    - 1. Mongoose Step#1
mongoose.connect("mongodb://localhost:27017/todolistDB");

// Create schema for the data you want to store         - 2. Mongoose Step#2
const itemsSchema = { name: String };

// Create Model/collection to store the data objects    - 3. Mongoose Step#3
const Item = mongoose.model("Item", itemsSchema);

// Create some sample rows i.e. documents using the above model
const todo1 = new Item({name: "Welcome to your ToDoList 🐙 "});
const todo2 = new Item({name: "Hit the + button to add a new item"});
const todo3 = new Item({name: "<-- Hit this button to delete an item."});

const defaultItems = [todo1, todo2, todo3];

// Custom List schema & model
const listSchema = {
  name: String,
  items: [itemsSchema]  
};

const List = mongoose.model("List", listSchema);


// Home route
app.get("/", function(req, res) {
  
  // Retrieve the items from MongoDB when the homepage is requested
  Item.find({}, function(err, foundItems){
  
  if (foundItems.length === 0) {
    // Add the default items into the MongoDB backend, if foundItems is 0
  Item.insertMany(defaultItems, function(err) {
  if (err) {
  console.log(err);
  } else {
    console.log("Default items inserted");
  }
  });

  res.redirect("/");  // Needed for first time the app is run. Redirects to root for the first time.

 } else {
    res.render("list", {listTitle: "Today", newListItems: foundItems});
 }
  });
  
});

// Custom Lists - created on the fly using "Express Route Parameters"
app.get("/:customListName", function(req, res){
  const customListName = req.params.customListName;

  List.findOne({name: customListName}, function(err, foundList){
    if(!err){
      if (!foundList) { 
        // Create a new list
        const list = new List({name: customListName, items: defaultItems});
        list.save();
        res.redirect("/" + customListName);
    } else {
      // Show an existing list
      res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
    }}
  })
});



app.post("/", function(req, res){

  const itemName = req.body.newItem;          //Get the new item/todo from the post request.
  const listName = req.body.list;

  const item = new Item({name: itemName});    //Create a new Mongo document of collection type 'Item'
  console.log("POST request ");
  console.log(req.body);

  if (listName === "Today"){
    item.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName}, function(err, foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});

app.post("/delete", function(req, res){
  // Access the _id of the item
  // Remove from the DB
  // Redirect to Home / route. This will render the items from the DB

  const checkedItemId = req.body.checkbox;

  Item.findByIdAndRemove(checkedItemId, function(err){
    if (!err) {
      console.log("Successfully deleted the item");
      res.redirect("/");
    }
  })

})

// app.get("/work", function(req,res){
//   res.render("list", {listTitle: "Work List", newListItems: workItems});
// });

// app.get("/about", function(req, res){
//   res.render("about");
// });


// Application Listener
app.listen(3000, function() {
  console.log("Server started on port 3000");
});
