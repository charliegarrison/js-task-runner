# node-thread-storm
Multithreading in node. node-thread-storm allows you to run code simultaneously using node's cluster funcionality.


`npm install thread-storm`

Using the thread storm library is simple and straight forward. Below is a simple example. First, require the library.

```javascript
threadStorm = require('thread-storm')
```

The next part might seem a little strange, but you need to return if threadStorm.isMaster flag is false;

```javascript
if(!threadStorm.isMaster) {
  return;
}
```

Start the library and wait for the background threads to be ready.

```javascript
threadStorm.ee.on('ready', function() {
...do something
});

threadStorm.start();
```

Once the library is ready you can run tasks on the background threads as easy as

```javascript
threadStorm.runTask("someFile.js",{someKey: "some value"});
```

The first arg is the path and name of a JS files of code u want run.

The second arg will be passed as the first argument to your function.

The second arg passed to your function will be the module.exports of a job runner which are methods as follows:
 taskCommunicator (to pass data back to your main code)
 completed (to be called when your background code finished. If you ever want it to finish and free up the thread for other jobs.)
 
 your javascript file might look something like this:
 
 ```javascript
 module.exports = function(sessionData,parent) {
  setTimeout(function() {
    parent.completed();
  },10000);
};
```

you can also listen to the following events from threadStorm.ee

msg - get a message from the task running

taskComplete - called when your tasks completes




