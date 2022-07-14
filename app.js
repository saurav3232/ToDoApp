const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const mongoose = require("mongoose");
const _ = require("lodash");
mongoose.connect("mongodb+srv://admin-saurav:test123@cluster0.od74r.mongodb.net/todoListDb");
app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
const itemsSchema = new mongoose.Schema({
  name: String,
});
const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema],
});
const List = mongoose.model("List", listSchema);
const Item = mongoose.model("Item", itemsSchema);
const item1 = new Item({
  name: "Welcome to todo list",
});
const item2 = new Item({
  name: "Hit + to add items to the list",
});
const item3 = new Item({
  name: "Hit <-- to delete item from the list",
});
const defaultItems = [item1, item2, item3];
app.get("/", async function (req, res) {
  const data = await Item.find();
  if (data.length === 0) {
    Item.insertMany(defaultItems, (err) => {
      if (err) {
        console.log(err);
      } else {
        console.log("Successfully saved default items to the database");
      }
    });
    res.redirect("/");
  } else {
    res.render("list", { listTitle: "Today", newListItems: data });
  }
});

app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item = new Item({
    name: itemName,
  });
  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName }, (err, foundlist) => {
      foundlist.items.push(item);
      foundlist.save();
      res.redirect("/" + listName);
    });
  }
});
app.post("/delete", async function (req, res) {
  const checkedItem = req.body.checkbox;
  const listName = req.body.listName;
  if (listName === "Today") {
    const del = await Item.deleteOne({
      _id: checkedItem,
    });
    console.log(del);
    res.redirect("/");
  } else {
    List.findOneAndUpdate(
      { name: listName },
      {
        $pull: {
          items: { _id: checkedItem },
        },
      },
      function (err, foundList) {
        if (!err) {
          res.redirect("/" + listName);
        }
      }
    );
  }
});
app.get("/:customListname", (req, res) => {
  const customListname = _.capitalize(req.params.customListname);
  List.findOne({ name: customListname }, (err, foundlist) => {
    if (!err) {
      if (!foundlist) {
        //create a new list
        const list = new List({
          name: customListname,
          items: defaultItems,
        });
        list.save();
        res.redirect("/" + customListname);
        console.log("Doesn't exist");
      } else {
        //show existing list
        res.render("list", {
          listTitle: foundlist.name,
          newListItems: foundlist.items,
        });
        console.log("exists");
      }
    }
  });
});

app.get("/about", function (req, res) {
  res.render("about");
});
let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}
app.listen(port, function () {
  console.log(`Server started on port ${port}`);
});
