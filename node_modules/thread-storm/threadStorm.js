var events = require('events'),
  eventEmitter = new events.EventEmitter(),
  threadStorm=module.exports={},
  ee = threadStorm.ee = eventEmitter,
  cluster = require('cluster');



threadStorm.isMaster = cluster.isMaster;
if(cluster.isMaster) {
  var workers={},
    availableWorkers=[],
   CPUs = require('os').cpus(),
   taskMapping={};

   threadStorm.start = function() {
     registerListeners();
     waitForForking();

     CPUs.forEach(function() {
       cluster.fork();
     });
   };


   threadStorm.runTask = function(task,data) {
     var msgObj,
      msg;

     if(availableWorkers.length > 0) {
       msg = "Running Worker";
       msgObj = {
         status: 1,
         msg:msg
       };
       var worker = workers[availableWorkers[0]];

       taskMapping[worker.id]=task;
       setWorkerUnAvailable(worker);

       worker.send({
         cmd: 'run',
         task: task,
         data: data
       });
     }
     else {
       msg = "Currently there are no available workers to run " + task + ". What a sham.";
       msgObj = {
         status: 0,
         msg:msg
       };
       console.log(msg);
     }
   };

    setWorkerAvailable = function(worker) {
      var index = availableWorkers.indexOf(worker.id);
      if(index === -1) {
        availableWorkers.push(worker.id);
        console.log("worker " + worker.id + " is ready for work, and a little too excited about it.");
      }
    };

    setWorkerUnAvailable = function(worker) {
      var index = availableWorkers.indexOf(worker.id);

      if(index > -1) {
        availableWorkers.splice(index,index+1);
        console.log("worker " + worker.id + " has been removed from available workers");
      }

    };

    registerListeners = function() {
      cluster.on('fork',function(worker) {

      });

      cluster.on('online',function(worker) {
        workers[worker.id]=worker;

        //console.log("my name is worker "+worker.id+", and I am online");

        setWorkerAvailable(worker);

        worker.on('message', function(msgObj) {
          if(msgObj.msg === "completed") {
            console.log("worker " + worker.id + " has completed running your code! TURN UP!");
            setWorkerAvailable(worker);
            ee.emit('taskComplete',{task: taskMapping[worker.id]});
          }
          else {
            ee.emit('msg',msgObj);
          }
        });
      });

      cluster.on('listening',function(worker,address) {
        console.log("worker is listening");
      });

      cluster.on('disconnect', function(worker) {
        if(worker.suicide) {
          console.log("worker " + worker.id + " has disconnected. It is ok, it was intentional and very tasteful if I may be so bold.");
        }
        else {
          console.log("worker " + worker.id + " has disconnected. The nerve...");
        }
        setWorkerUnAvailable(worker);
      });

      cluster.on('exit', function(worker, code, signal) {
        if(worker.suicide) {
          console.log("worker " + worker.process.pid + " died. It completed its mission in life.");
        }
        else {
          console.log("worker " + worker.process.pid + " died. It was a massacre");
        }
        setWorkerUnAvailable(worker);
        cluster.fork();
      });


    };

    waitForForking = function() {
      setTimeout(function() {
        if(Object.keys(workers).length < CPUs.length) {
          console.log("Not all of the workers are up yet. No worries, going to keep waiting for these slackers to come online. You can sit back and watch Dragon Ball Z");
          waitForForking();
        }
        else {
          ee.emit("ready");
          console.log("All workers are up and running. Let's put them to work.");
        }
      },1000);
    };



}
else if(cluster.isWorker) {
  var worker = cluster.worker,
    i=0,
    taskCommunicator,
    taskToRun;

  //can be called from task
  module.exports.taskCommunicator = function(msgObj) {
    process.send(msgObj);
  }

  //you can call when your task is completed
  module.exports.completed = function(msgObj) {
    process.send({msg: 'completed'});
    worker.kill();
  }

  process.on('message', function(msgObj) {
    if(msgObj.cmd === "run") {
      console.log("worker " + worker.id +  " here, about run task "+msgObj.task+". Thank you for this opportunity, I am stoked. :)");
      taskToRun=require(process.cwd()+"/"+msgObj.task);
      taskToRun(msgObj.data,module.exports);
    }
  });
}
