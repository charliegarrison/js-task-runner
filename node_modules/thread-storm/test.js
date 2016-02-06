var threadStorm = require("./threadStorm");


if(!threadStorm.isMaster) {
  return;
}

threadStorm.ee.on('ready', function() {
  threadStorm.runTask("testTask.js",{length: 100});
  threadStorm.runTask("testTask.js",{length: 800});
  threadStorm.runTask("testTask.js",{length: 9000});
  threadStorm.runTask("testTask.js",{length: 1890});
  threadStorm.runTask("testTask.js",{length: 25});
  threadStorm.runTask("testTask.js",{length: 500});
  threadStorm.runTask("testTask.js",{length: 4000});
  threadStorm.runTask("testTask.js",{length: 1000});
});

threadStorm.start();
