# js-task-runner
A job scheduler and runner for node.js

First configure your tasks.json file. Which must be saved in the project root (just above your node_modules folder)
```javascript
{
  "test1": {
    "file": "testTask.js",
    "options": {
      "time": {
        "hrs": [0,6,12,18,19,20,21,22,23]
      },
      "daysOfWeek": ["mon","tue","wed","fri"],
      "daysOfMonth": [1,2,3,4,5,6],
      "months": ["feb","mar"]
    }
  },
  "test2": {
    "file": "testTask2.js",
    "options": {
      "interval": 20000
    }
  }
}

```
This is where your tasks will be configured. You have the following options:

* file - the file being run
* options it is either an interval task or a datetime task. If an interval it is in milliseconds. If it is a datetime task options has the following options
  * hrs - an array of numbers. Can be 0-23
  * daysOfWeek - an array of strings. Can be mon, tue, wed, thu, fri, sat, sun
  * daysOfMonth - an array of numbers. Can be 1-31
  * monts: an array of strings. Can be jan, feb, mar, apr, may, jun, jul, aug, sep, oct, nov, dec

js-task-runner implements node-thread-storm for its multithreading. Each task is run in its own thread.

To create a task you simple need to module.exports a function from a js file. Which must be saved in the project root (just above your node_modules folder). It will be passed two arguments. sessionData and parent. Parent is the node-thread-storm object managing the thread. When you task is done simply call parent.completed()  Ex:
```javascript
module.exports = function(sessionData,parent) {
  setTimeout(function() {
    parent.completed();
  },10000);
};
```

Finally to run js-task-runner simply:

`npm install js-task-runner`

create a file with this content:
```javascript
var cluster = require("cluster");
if(cluster.isMaster) {
  require("js-task-runner");
}
```
then run:
`node fileName`

