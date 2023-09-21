//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const dotenv = require("dotenv");
dotenv.config();
const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
console.log(process.env.MONGODB_PASSWORD);
mongoose.set('strictQuery', true);
const uri = `mongodb+srv://mohanshankarmummana:${process.env.MONGODB_PASSWORD}@cluster0.tophk4r.mongodb.net/?retryWrites=true&w=majority`;
//mongoose.connect('mongodb://127.0.0.1:27017/todoListDB',{useNewUrlParser : true});
try {
  // Connect to the MongoDB cluster
  mongoose.connect(
    uri,
    { useNewUrlParser: true, useUnifiedTopology: true },
    () => console.log("Mongoose is connected")
  );
} 
catch (e) {
  console.log("could not connect");
}
const taskSchema = mongoose.Schema({
  name : String
})
const Task = mongoose.model("Task",taskSchema)

const task1 = new Task({
  name:"Welcome to the todoList"
})
const task2 = new Task({
  name:"Add your Daily Tasks"
})
const task3 = new Task({
  name:"<-- Click here to remove task"
})
const defaultTasks = [task1,task2,task3]

const listSchema = {
  name : String,
  tasks : [taskSchema]
}

const List = mongoose.model("List",listSchema);

app.get("/", function(req, res) {

  Task.find({}, function(err,foundTasks){
    if(foundTasks.length === 0){
      Task.insertMany(defaultTasks,function(err){
        if(err) console.log(err);
        else console.log("Succesfully Inserted default Items");
      })
      res.redirect("/")
    }
    else{
      res.render("list", {listTitle: "TODAY", newListItems: foundTasks});
    }
  });
});


app.get("/:custom",function(req,res){
  //console.log(req.params.custom)
  const curList = _.capitalize(req.params.custom)
  List.findOne({name: curList},function(err,foundList){
    if(err) console.log(err);
    else {
      if(!foundList){
        const list = new List({
          name : curList,
          tasks : defaultTasks
        })
        list.save()
        res.redirect("/"+ curList)
      }
      else{
        res.render("list",{listTitle : curList, newListItems:foundList.tasks})
      }
    }
  });
});

app.post("/", function(req, res){

  const newTask = req.body.newTask;
  const curList = req.body.list;

  const task = new Task({
    name : newTask
  })
  if(curList === "TODAY"){
    task.save(function(err) {
      if (err) {
        console.log(err);
      } else {
        console.log("Successfully Inserted new Item");
      }
    });
    res.redirect("/")
  }
  else{
    List.findOne({name:curList},function(err,foundList){
      foundList.tasks.push(task)
      foundList.save(function(err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Successfully Inserted new Item");
        }
      });
      res.redirect("/"+curList)
    })
  }
});

app.post("/delete",function(req,res){
  
  const id = req.body.checkbox;
  const curList = req.body.listName;
  if (curList === "TODAY"){
    Task.findByIdAndRemove(id, function(err){
      if(!err){
        res.redirect("/")
        console.log("Succesfully deleted")
      }
    })
  }
  else{
    List.findOneAndUpdate({name: curList}, {$pull: {tasks: {_id: id}}}, function(err, foundList){
      if (!err){
        res.redirect("/" + curList);
      }
    })
  }
})


app.listen(3000, function() {
  console.log("Server started on port 3000");
});
