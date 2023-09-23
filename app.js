const cors = require("cors");
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser"); // Import the cookie-parser package
dotenv.config();
const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(cors());
app.use(cookieParser()); // Use the cookie-parser middleware for handling cookies

console.log(process.env.MONGODB_PASSWORD);
mongoose.set('strictQuery', true);

// Your MongoDB URI configuration
const uri = `mongodb+srv://mohanshankarmummana:${process.env.MONGODB_PASSWORD}@cluster0.tophk4r.mongodb.net/?retryWrites=true&w=majority`;

// Connect to the MongoDB cluster
mongoose.connect(
  uri,
  { useNewUrlParser: true, useUnifiedTopology: true },
  () => console.log("Mongoose is connected")
);

const taskSchema = mongoose.Schema({
  name: String,
});

const Task = mongoose.model("Task", taskSchema);

const task1 = new Task({
  name: "Welcome to the todoList",
});

const task2 = new Task({
  name: "Add your Daily Tasks",
});

const task3 = new Task({
  name: "<-- Click here to remove task",
});

const defaultTasks = [task1, task2, task3];

const listSchema = {
  name: String,
  tasks: [taskSchema],
};

const List = mongoose.model("List", listSchema);

// Define a function to generate a unique device identifier
function generateUniqueDeviceId() {
  // Implement your logic to generate a unique device identifier here
  // You can use libraries like uuid to generate unique IDs
}

app.get("/", function (req, res) {
  // Check if a device identifier cookie exists
  const deviceId = req.cookies.deviceId;

  if (!deviceId) {
    // If a device identifier doesn't exist, generate a unique one
    const newDeviceId = generateUniqueDeviceId(); // Implement this function
    res.cookie("deviceId", newDeviceId, { maxAge: 365 * 24 * 60 * 60 * 1000 }); // Set the deviceId as a cookie (with an expiration time)
  }

  // Now you can use the deviceId for device-specific logic
  // ...

  Task.find({}, function (err, foundTasks) {
    if (foundTasks.length === 0) {
      Task.insertMany(defaultTasks, function (err) {
        if (err) console.log(err);
        else console.log("Successfully Inserted default Items");
      });
      res.redirect("/");
    } else {
      res.render("list", { listTitle: "TODAY", newListItems: foundTasks });
    }
  });
});

app.get("/:custom", function (req, res) {
  const curList = _.capitalize(req.params.custom);

  List.findOne({ name: curList }, function (err, foundList) {
    if (err) console.log(err);
    else {
      if (!foundList) {
        const list = new List({
          name: curList,
          tasks: defaultTasks,
        });
        list.save();
        res.redirect("/" + curList);
      } else {
        res.render("list", {
          listTitle: curList,
          newListItems: foundList.tasks,
        });
      }
    }
  });
});

app.post("/", function (req, res) {
  const newTask = req.body.newTask;
  const curList = req.body.list;

  const task = new Task({
    name: newTask,
  });
  if (curList === "TODAY") {
    task.save(function (err) {
      if (err) {
        console.log(err);
      } else {
        console.log("Successfully Inserted new Item");
      }
    });
    res.redirect("/");
  } else {
    List.findOne({ name: curList }, function (err, foundList) {
      foundList.tasks.push(task);
      foundList.save(function (err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Successfully Inserted new Item");
        }
      });
      res.redirect("/" + curList);
    });
  }
});

app.post("/delete", function (req, res) {
  const id = req.body.checkbox;
  const curList = req.body.listName;
  if (curList === "TODAY") {
    Task.findByIdAndRemove(id, function (err) {
      if (!err) {
        res.redirect("/");
        console.log("Successfully deleted");
      }
    });
  } else {
    List.findOneAndUpdate(
      { name: curList },
      { $pull: { tasks: { _id: id } } },
      function (err, foundList) {
        if (!err) {
          res.redirect("/" + curList);
        }
      }
    );
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
