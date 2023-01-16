var object = {}
var setup = false;
var settings = {
  debug: false,
  secureonly: false,
  rootpagedisplay: true,
  ifnotfoundsendtonext: true,
  ifemptyobjectstillsend: true,
  acceptqueryfunctionarguments: true,
  acceptbodyfunctionarguments: false,
  requestdata: false,
  responsedata: false,
  executefunctionintrycatch: true,
  functionerrormessage: (err) => {return {error:err}},
  validtypes: {
    function: true,
    object: true,
    string: true,
    number: true
  }
};

module.exports = {}

module.exports.setup = function(recievedObject, recievedSettings) {
  recievedSettings = recievedSettings || {}
  Object.assign(settings,recievedSettings)
  debug("Settings",settings)
  setup = true;
  
  // Sets the object with the object recieved from the setup function.
  object = recievedObject;

}

module.exports.generator = async function(req, res, next) {  
  if(setup === false) new Error("Not Setup Yet")

  var path = req.path.split("/");
  path.shift();
  debug("Requested Path",path)

  // Secure Check
  var secure = ( (req.secure == true) || (req.headers['x-forwarded-proto'] == 'https') )
  if((settings.secureonly === true) && (!secure)) {
    debug("Request Denied Due To Unsecure Connection")
    return res.status(403).send("403 Not Secure | Only secure connections are allowed as specified by the options")
  }
  
  // Root page
  if( (path[0] === "") && (settings.rootpagedisplay === true) ) {
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
      if(settings.ifnotfoundsendtonext === true) {
        return next();
      } else {
        return res.status(404).send("404 Not Found | Property Not Found")
      }
    }
  }

  // Here, the object has been narrowed to the extent the client path requested.
  debug("Final Object",currentPathData,typeof currentPathData)

  // Alters returning data based on the type of data.
  if( ((typeof currentPathData) === "function") && (settings.validtypes.function ===  true) ) {
    var receivedArguments = req.query;
    var receivedData = req.body;
    debug("Query",req.query)
    debug("Body",receivedData)

    var commentStripping = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
    var argumentNames = /([^\s,]+)/g
    var functionString = currentPathData.toString().replace(commentStripping, '');
    var functionArguments = functionString.slice(functionString.indexOf('(')+1, functionString.indexOf(')')).match(argumentNames);
    if(functionArguments === null) functionArguments = [];
    var functionArgumentsData = []

    debug("Function Arguments",functionArguments)
    
    // QUERY STRING PARAMETERS
    if(settings.acceptqueryfunctionarguments === true) {
      debug("Checking Query String For Function Argument Data")
      for(i in functionArguments) {
        debug("Current Arguments",functionArguments[i])
        if(receivedArguments.hasOwnProperty(functionArguments[i])) {
          debug("Found Matching Function Argument",functionArguments[i],receivedArguments[functionArguments[i]])
          functionArgumentsData[i] = receivedArguments[functionArguments[i]]
        } else {
          functionArgumentsData[i] = undefined
        }
      }  
    }
    
    // REQUEST BODY PARAMETERS
    if(settings.acceptbodyfunctionarguments === true) {
      debug("Checking Body For Function Argument Data")
      for(i in functionArguments) {
        debug("Current Arguments",functionArguments[i])
        if(receivedData.hasOwnProperty(functionArguments[i])) {
          debug("Found Matching Function Argument",functionArguments[i],receivedData[functionArguments[i]])
          functionArgumentsData[i] = receivedData[functionArguments[i]]
        } else {
          functionArgumentsData[i] = undefined || functionArgumentsData[i]
        }
      }
    }

    // REQUEST DATA
    if(settings.requestdata === true) {
      for(argument in functionArguments) {
        var lastargument = functionArguments[argument]
        var lastargumentdata = functionArgumentsData[argument]
        
        debug("Checking if argument is 'req'",lastargument,lastargumentdata)
  
        if((lastargument === "req")&&(lastargumentdata === undefined)) {
          functionArgumentsData[argument] = req
        }
      }
    }

    
    // RESPONSE DATA
    if(settings.responsedata === true) {
      for(argument in functionArguments) {
        var lastargument = functionArguments[argument]
        var lastargumentdata = functionArgumentsData[argument]
        
        debug("Checking if argument is 'res'",lastargument,lastargumentdata)
  
        if((lastargument === "res")&&(lastargumentdata === undefined)) {
          functionArgumentsData[argument] = res
        }
      }
    }
    
    debug("Finalized Arguments",functionArgumentsData)

    // EXECUTING THE FUNCTION
    var functionResult
    if(settings.executefunctionintrycatch) {
      debug("Function excecuting in a try/catch")
      try {
        functionResult = await currentPathData(...functionArgumentsData)
      } catch(e) {
        debug("Function execution resulted in a error",e)

        var errormessage = settings.functionerrormessage(e)
        
        return res.json(errormessage)
      }
    } else {
      debug("Function excecuting without try/catch")
      functionResult = await currentPathData(...functionArgumentsData)
    }
    
    return res.json(functionResult)
  } else if( ((typeof currentPathData) === "object") && (settings.validtypes.object ===  true) ) {
    if(!(Object.keys(currentPathData).length === 0)) {
      return res.json(currentPathData)
    }    
  } else if( ((typeof currentPathData) === "string") && (settings.validtypes.string ===  true) ) {
    return res.send(currentPathData)
  } else if( ((typeof currentPathData) === "number") && (settings.validtypes.number ===  true) ) {
    return res.send(currentPathData.toString())
  } else {
    debug("Skipped","Invalid Data Type",(typeof currentPathData),currentPathData)
    next()
  }

  debug("Skipped")
  if(settings.ifnotfoundsendtonext === true) next();
}

function debug(item,...log) {
  if(settings.debug === true) {
    console.log("Object Routes Generator","-",item,...log)
  }
}