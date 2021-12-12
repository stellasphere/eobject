var object = {}
var setup = false;
var debugSetting = false;

module.exports = {}

module.exports.setup = function(recievedObject, settings) {
  var eobjectSettings = settings || {}

  // Sets the object with the object recieved from the setup function.
  object = recievedObject;

  setup = true;

  if(eobjectSettings.debug === true) debugSetting = true
}

module.exports.generator = async function(req, res, next) {
  if(setup === false) new Error("Object Routes Generator - Not Setup Yet")

  var path = req.path.split("/");
  path.shift();
  debug("Requested Path",path)

  // Root page
  if(path[0] === "") {
    return res.send(`Object Routes Generator <hr>
    From this path, you can enter a API request for the following paths:
    ${Object.keys(object).join(",")}`)
  }

  // Sets the current path data with the object, since it is currently at the root.
  var currentPathData = object
  debug("Starting Object",currentPathData)

  for(i in path) {
    // Iterates up the path. If there is a matching property, then it narrows the object.
    if(currentPathData.hasOwnProperty(path[i])) {
      currentPathData = currentPathData[path[i]]
      debug("Object Narrowed",currentPathData)
    } else {
      debug("Skipped - Property Not Found")
      return next();
    }
  }

  // Here, the object has been narrowed to the extent the client path requested.
  debug("Final Object",currentPathData,typeof currentPathData)

  // Alters returning data based on the type of data.
  if( (typeof currentPathData) === "function" ) {
    var functionArguments = req.query;
    debug("Query",req.query)

    var commentStripping = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
    var argumentNames = /([^\s,]+)/g
    var functionString = currentPathData.toString().replace(commentStripping, '');
    var functionParameters = functionString.slice(functionString.indexOf('(')+1, functionString.indexOf(')')).match(argumentNames);
    if(functionParameters === null) functionParameters = [];

    debug("Function Parameters",functionParameters)

    for(i in functionParameters) {
      debug("Current Parameters",functionParameters[i])
      if(functionArguments.hasOwnProperty(functionParameters[i])) {
        debug("Found Matching Function Parameter",functionParameters[i],functionArguments[functionParameters[i]])
        functionParameters[i] = functionArguments[functionParameters[i]]
      } else {
        functionParameters[i] = undefined
      }
    }

    debug("Finalized Arguments",functionParameters)

    return res.json(await currentPathData(...functionParameters))
  } else if( (typeof currentPathData) === "object" ) {
    return res.json(currentPathData)
  } else if( (typeof currentPathData) === "string" ) {
    return res.send(currentPathData)
  } else if( (typeof currentPathData) === "number" ) {
    return res.send(currentPathData.toString())
  } else {
    try {
      return res.send(currentPathData)
    } catch(e) {
      debug("Skipped")
      next()
    }
  }

  debug("Skipped")
  next();

  function debug(item,...log) {
    if(debugSetting === true) {
      console.log("Object Routes Generator","-",item,...log)
    }
  }
}