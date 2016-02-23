var threadStorm = require('thread-storm');

if(!threadStorm.isMaster) {
  return;
}

var fs = require('fs'),
  events = require('events'),
  eventEmitter = new events.EventEmitter(),
  taskRunner=module.exports={},
  log,
  writingLogs=false,
  logQueue=0;


  var taskRunner = module.exports = {},
   tasks,
   dateTimeTasks={},
   weekDays,
   months;

    weekDays={
      0: "sun",
      1: "mon",
      2: "tue",
      3: "wed",
      4: "thu",
      5: "fri",
      6: "sat"
    };

    months={
      1: "jan",
      2: "feb",
      3: "mar",
      4: "apr",
      5: "may",
      6: "jun",
      7: "jul",
      8: "aug",
      9: "sep",
      10: "oct",
      11: "nov",
      12: "dec"
    };

    taskRunner.loadLog = function(cb) {
        fs.readFile('taskLog.json',function(err,data) {
          if(err) {
            log={};
          }
          else {

            try {
              log=JSON.parse(data);
            }
            catch(err) {
              log={};
            }
          }
          cb();
        });
    };

    taskRunner.writeLogToDisk = function() {
      if(!writingLogs) {
        writingLogs=true;
        fs.writeFile('taskLog.json',JSON.stringify(log),function(err) {
          writingLogs=false;
          if(logQueue > 0) {
            logQueue--;
            taskRunner.writeLogToDisk();
          }
        });
      }
      else {
        logQueue++;
      }
    };

    taskRunner.logTaskStart = function(taskName,date) {
      log[taskName]={};
      log[taskName].st=date;
      log[taskName].ed=null;
      taskRunner.writeLogToDisk();
    };

    taskRunner.logTaskCompleted = function(taskName,date) {
      log[taskName].ed=date;
      taskRunner.writeLogToDisk();
    };

    taskRunner.start = function() {
      threadStorm.ee.on("msg",function(msgObj) {
        console.log(msgObj);
      });

      threadStorm.ee.on("taskFailed",function(msgObj) {
        var failedTask;

        Object.keys(tasks).forEach(function(taskName) {
          task=tasks[taskName];
          if(task.file===msgObj.task) {
            failedTask=task;
          }
        });

        completedTask.running=false;
      });

      threadStorm.ee.on("taskComplete",function(msgObj) {
        var completedTask;

        Object.keys(tasks).forEach(function(taskName) {
          task=tasks[taskName];
          if(task.file===msgObj.task) {
            completedTask=task;
          }
        });

        completedTask.running=false;
        taskRunner.logTaskCompleted(completedTask.taskID,new Date().getTime());
      });

      taskRunner.loadLog(function() {
        taskRunner.restartTasks();
      });

    };

    taskRunner.restartTasks = function() {
      Object.keys(log).forEach(function(taskName) {
        var task = log[taskName];
        //if the task was started but not ended we want to restart it
        if(task.st && task.ed === null) {
          taskRunner.run(tasks[taskName]);
        }
      });

      taskRunner.processTasks();
    };


    taskRunner.processTasks = function() {
      Object.keys(tasks).forEach(function(taskName) {
        var task = tasks[taskName];

        if(task.options.interval) {
          setInterval((function(task) {
            return function() {
              taskRunner.run(task);
            };
          })(task),task.options.interval);
        }
        else {
          dateTimeTasks[taskName]=task;
        }

      });

      taskRunner.loop();
    };


    taskRunner.loop = function() {
      var date;

      setInterval(function() {
        date = new Date();
        Object.keys(dateTimeTasks).forEach(function(taskName) {
          var task = dateTimeTasks[taskName],
            runTask=true,
            change=false,
            lastRun=null,
            lastRunDate;

          if(log[taskName] && log[taskName].ed) {
            lastRun = log[taskName].ed;
            if(lastRun) {
                lastRunDate = new Date(lastRun);
            }
          }

          if(task.options.time) {
            //check if its time to run task
            if(task.options.time.hrs.indexOf((date.getHours())) > -1) {
              //check if we have already ran it in this window
              if((!lastRunDate || lastRunDate.getHours() !== date.getHours()) || change) {
                change=true;
                runTask=true;
              }
              else {
                runTask=false;
              }
            }
            else {
              runTask=false;
            }
          }

          if(task.options.daysOfWeek) {
            if(task.options.daysOfWeek.indexOf(weekDays[date.getDay()]) > -1) {
              //check if we have already ran it in this window
              if((!lastRunDate || lastRunDate.getDay() !== date.getDay()) || change) {
                change=true;
                runTask=true;
              }
              else {
                runTask=false;
              }
            }
            else {
              runTask=false;
            }
          }

          if(task.options.daysOfMonth) {
            if(task.options.daysOfMonth.indexOf(date.getDate()) > -1) {
              //check if we have already ran it in this window
              if((!lastRunDate || lastRunDate.getDate() !== date.getDate()) || change) {
                change=true;
                runTask=true;
              }
              else {
                runTask=false;
              }

            }
            else {
              runTask=false;
            }
          }

          if(task.options.months) {
            if(task.options.months.indexOf(months[date.getMonth()]) > -1) {
              //check if we have already ran it in this window
              if((!lastRunDate || lastRunDate.getMonth() !== date.getMonth()) || change) {
                change=true;
                runTask=true;
              }
              else {
                runTask=false;
              }

            }
            else {
              runTask=false;
            }
          }

          if(runTask) {
            taskRunner.run(task);
          }
        });
      },1000);


    };



    taskRunner.run = function(task) {
      if(!task.running) {
        task.running=true;
        taskRunner.logTaskStart(task.taskID,new Date().getTime());
        var result=threadStorm.runTask(task.file,null);
        //if result is false then it could not assign this task a thread and it is therefore not running
        if(!result) {
          task.running=false;
        }
      }
      else {
        console.log("Tried to run task " + task.taskID + " but it is already running");
      }

    };


threadStorm.ee.on('ready', function() {
    fs.readFile('tasks.json',function(err,data) {
      if(err) {
        console.log("Error reading tasks.json " + err);
        return;
      }

      tasks=JSON.parse(data);


      Object.keys(tasks).forEach(function(taskName) {
        tasks[taskName].taskID=taskName;
      });
      taskRunner.start();

    });
});

threadStorm.start();

console.log("waiting for thread storm");
