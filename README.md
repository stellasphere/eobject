# eobject
eobject is a package designed to quickly and easily create a API from a JavaScript object.

Compatible with all data types valid in JavaScript objects, eobject automatically generates Express.js routes. 



| JSON | Web |
|--|--|
| ![A JSON Object](https://i.ibb.co/HBJGwcM/chrome-Y4-Nm-I8-Au8s.png) | example.com/info - `{name:"Test",version: "1.0.0"}`<br> example.com/info/name - `Test`<br> example.com/info/version - `1.0.0`<br> example.com/users - `{}`<br> example.com/users/add - *nothing*<br> example.com/users/add?email=johndoe@example.com - `johndoe@example.com`

### A note on functions
Functions do work in eobject. It is one of the primary use cases for eobject. Functions that have arguments map both to URL query strings, as well as the body of the function.


[Learn more about the usage of functions in eobject in the dedicated section] (#functions)


## Getting Started
- Install the package:
`npm install eobject`
- Start with the setup function to provide the object:
`eobject.setup(*object*,*settings (optional)*);`
- Use the generator function in `app.use();`.  
To use on the root: `app.use(eobject.generator);`  
To use on a directory: `app.use('/*path*',eobject.generator);` 
- Then, it should be accessible. Ex: `*object*.info.name` should corespond to `/info/name`

See the [full working example](#example) for more guidance.





## Docs
### eobject.setup( *object* , *?settings* )
The setup function configures eobject with the object that it should generate routes from.
It accepts a JavaScript object and a optional [settings](#settings) object.
#### Example
```
eobject.setup({test:"test"})
```
---
```
var object = {test: "test"}
var settings = {debug: true}
eobject.setup(object,settings)
```

### eobject.generator( *req* , *res* , *next* )
**Important**: The generator function is a Express.js middleware function and shouldn't be used directory.  
To only be used within: `app.use(eobject.generator)` or `app.use('*PATH*',eobject.generator)`
#### Example
```
app.use('/api',eobject.generator)
```
---
```
app.use(eobject.generator)
```


## Settings Documentation
#### Default Settings Object
```
{
  debug: false,
  secureonly: false,
  rootpagedisplay: true,
  ifnotfoundsendtonext: true,
  ifemptyobjectstillsend: true,
  "acceptqueryfunctionarguments": true,
  "acceptbodyfunctionarguments": false,
  "requestdata": false,
  "executefunctionintrycatch": true,
  "functionerrormessage": (err) => {return {error:err}},
  "validtypes": {
    "function": true,
    "object": true,
    "string": true,
    "number": true
  }
}
```
#### Settings Options
The following table specifies each settings option: (See above for default settings)

| Name | Description | 
| --- | --- |
| debug | Option for debug mode. It will show the process behind each and every request.  |
| secureonly | Option for allowing secure connections only. Only HTTPS connections will be allowed and anything else will be rejected by a 403 Forbidden response. |
| rootpagedisplay | Option to display the root 'welcome' screen. |
| ifnotfoundsendtonext | Option to send any unresolved requests beyond eobject to other Express.js routes. |
| ifemptyobjectstillsend | Option to still send any empty objects (empty object: {}) back to the client. |
| acceptqueryfunctionarguments | Option to disable accepting function arguments from URL query strings. |
| acceptbodyfunctionarguments | Option to enable accepting function arguments from the request body. ([See: "Pulling Arguments From the Query String of the Requested URL"](#Pulling-arguments-from-the-query-string-of-the-requested-URL)) |
| requestdata | Option to provide the [Express.js request (req)](https://expressjs.com/en/4x/api.html#req) object as the last parameter in a given function, if said last parameter is named `req`. |
| executefunctionintrycatch | Option to execute [functions](#functions) in a `try/catch`, where eobject will return a error message (which can be configured in the `functionerrormessage` option, see below) or not. If the function is not executed in a `try/catch`, if the function throws an error, the entire program will exit. |
| functionerrormessage | A function that configures the error message that is displayed when a function returns an error. |
| validtypes | Options to independently disable any specific data type from being used in eobject. |

## Functions
Although all valid data types that work in JavaScript objects do work in eobject, functions are their own special data type which requires more work in order to be used properly. 

For functions to effectively operate as an API, there must be methods of inputting function arguments from the client side. eobject has two ways of acomplishing this at this time:
- URL Query Strings
- Request Body


### Pulling arguments from the query string of the requested URL
eobject by default pulls argument data from the query string of the URL that is requested via key/value combinations of the query string, parsed by the native URL constructor. *You can disable* pulling arguments from query strings via the `acceptqueryfunctionarguments` option in the [settings] (#settings-options).

The order of the query strings does not matter, but the name of the key must exactly match the name of the argument in the function, including the case.  
**Example:**  
If the argument name is `firstName`:  
`/users/add?firstName=example@example.com` - *Will Work*  
`/users/add?FirstName=example@example.com` - Will Not Work  
`/users/add?firstname=example@example.com` - Will Not Work

Thus, it is recommended that function names do be named in lower-case. In the future, function names will become case-insensitive.

### Pulling arguments from the request body
eobject also has the option of pulling argument data from a JSON-formatted body of a HTTP request. **This functionality must be enabled via the `acceptbodyfunctionarguments` option in the [settings] (#settings-options) in order to be used.**

Although having a body for other types of requests is theoretically valid, eobject only accepts common practice request bodies in PUT, POST and PATCH requests. 

Express also requires that the `body-parser` package be used to parse the request body. The full working example includes a implementation of this. It requires the following lines of code be included before the `app.use(express.generator(*object*))` line and after app initalization of Express:
```
const bodyParser = require("body-parser");
app.use(bodyParser.json())
```




## Example
Full working example:
```
const eobject = require('eobject');
const express = require('express');
const bodyParser = require("body-parser");
const app = express();

var object = {
  info: {
    name: "Test",
    version: '1.0.0'
  },
  users: {
    add: async function(firstName,lastName,email) {
      return {
        name: firstName + " " + lastName,
        email: email
      }
    }
  }
}

var settings = {
  "acceptbodyfunctionarguments": true,
  "secureonly": true
}

app.use(bodyParser.json())

eobject.setup(object,settings);
app.use('/',eobject.generator)

app.get('*',(req,res) => {
  res.send("test")
})

app.listen(3000, () => {
  console.log('server started');
});
```