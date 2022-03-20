# eobject
eobject is a package designed to quickly and easily create a API from a JavaScript object.

Compatible with all data types, including functions, valid in JavaScript objects, eobject automatically generates Express.js routes. 



| JSON | Web |
|--|--|
| ![A JSON Object](https://i.ibb.co/HBJGwcM/chrome-Y4-Nm-I8-Au8s.png) | example.com/info - `{name:"Test",version: "1.0.0"}`<br> example.com/info/name - `Test`<br> example.com/info/version - `1.0.0`<br> example.com/users - `{}`<br> example.com/users/add - *nothing*<br> example.com/users/add?email=johndoe@example.com - `johndoe@example.com`
The above is based on the [example](#example). 

### A note on functions:
Functions do work in eobject. Functions, if they have parameters, will pull them from the query string (*?firstName=John&lastName=Doe*) and send them matched to the parameter names of the function.  
Order of the query strings does not matter, but the name of the field/key must exactly match the name of the parameter in the function.  
**Example:**  
`/users/add?email=example@example.com` - Will Work  
`/users/add?Email=example@example.com` - Will Not Work  
`/users/add?mail=example@example.com` - Will Not Work




## Getting Started
- Install the package.
`npm install eobject`
- Start with the setup function to provide the object.
`eobject.setup(*object*);`
- Use the generator function in `app.get();`.  
To use on the root: `app.use(eobject.generator);`  
To use on a directory: `app.use('/api',eobject.generator);`  
- Then, it should be accessible. Ex: `object.info.name` should corespond to `/info/name`





## Docs
### eobject.setup( *object* , *settings* )
The setup function configures eobject with the object that it should generate routes from.
It accepts a JavaScript object and a [settings](#settings) object.
#### Usage Example
```
const express = require('express');
const app = express();

const eobject = require('eobject');

var object = {
  properties: {
    a: "yes",
    b: "no"
  }
}
var settings = {
  debug: true
}

eobject.setup(object,settings)
app.use('/api',eobject.generator)

app.listen(3000, () => {
  console.log('server started');
});
```


### eobject.generator( *req* , *res* , *next* )
The generator function is a Express.js middleware function and shouldn't be used directory.
To be used in: `app.use(eobject.generator)` or `app.use('*PATH*',eobject.generator)`
#### Usage Example
```
app.use('/api',eobject.generator)
```


### settings
The settings object currently only takes the `debug` property.
#### Usage Example
```
var settings = {
  debug: true
}

eobject.setup(object,{})
```





## Example
```
const express = require('express');
const app = express();

const object = {
  info: {
    name: "Test",
    version: '1.0.0'
  },
  users: {
    add: async function(firstName,lastName,email) {
      return email
    }
  }
}

const eobject = require('eobject');
eobject.setup(object,{});
app.use('/api',eobject.generator)

app.get('*',(req,res)=>{
  res.send("404")
})

app.listen(3000, () => {
  console.log('server started');
});

```