module.exports = function(sessionData,parent) {
  for(var i=0;i<30;i++) {
    console.log(new Date().getTime() + " " + i);//new Date().getTime()
  }

  parent.taskCommunicator({msg: "completed"});
};
