// Dependencies
var _data = require('./data');
var helpers = require('./helpers');




// Define all the handlers
var handlers = {};

// Ping handler
handlers.ping = function(data,callback){
    callback(200);
};

// Not found handler
handlers.notFound = function(data,callback){
  callback(404);
};



// ================================ Users =============================================
handlers.users = function(data,callback){
    var methods = ['get','post','put','delete']
    if(methods.indexOf(data.method)>-1){
        handlers._users[data.method](data,callback)
    }
    else{
        callback(405)
    }
}


// Container for all the users methods
handlers._users={}

// Users - post
// Required data: firstName, lastName, phone, password, tosAgreement
// Optional data: none
handlers._users.post = function(data,callback){
    //validate the data
    var firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
    var lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
    var phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
    var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
    var tosAgreement = typeof(data.payload.tosAgreement) == 'boolean' && data.payload.tosAgreement == true ? true : false;

    if(firstName && lastName && phone && password && tosAgreement){
        _data.read('users',phone,function(err,data){
            if(err){
                // Hash the password
                var hashedPassword = helpers.hash(password)

                // Create the user object
                if(hashedPassword){
                var userObj={
                    'firstName' : firstName,
                    'lastName' : lastName,
                    'phone' : phone,
                    'hashedPassword' : hashedPassword,
                    'tosAgreement' : true 
                }

                // Store the user object 
                _data.create('users',phone,userObj,function(err){
                    if(!err){
                        callback(200)
                    } else {
                        console.log(err)
                        callback(500,{'Error' : 'Could not create the new user'})
                        }
                    })
                } else {
                    callback(400,{'Error' : 'Could not hash the user\'s password.'})
                }
            }
            else {
                callback(400,{'Error' : 'The user already exists'})
            }
        })
    } else {
        callback(400,{'Error' : 'Missing required fields'})
    }
}

// Required data: phone
// Optional data: none

handlers._users.get = function(data,callback){
    var phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;

    if(phone){
        // Get token from headers
        var token = typeof(data.headers.token) == 'string' ? data.headers.token:false
        // Verify that the given token is valid for the phone number
        handlers._tokens.verifyToken(token,phone,function(tokenIsValid){
            if(tokenIsValid){
                _data.read('users',phone,function(err,data){
                    if(!err && data){
                        delete data.hashedPassword
                        callback(200,data)
                    }
                    else {
                        callback(404)
                    }
                })
            }
            else{
                callback(403,{'Error':'Missing required token in header, or token is invalid'})
            }
        })      
    } else {
        callback(400,{'Error' : 'Missing required field'})
    }
}

// Required data: phone
// Optional data: firstName, lastName, password (at least one must be specified)

handlers._users.put = function(data,callback){
    // Check for required field
  var phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;

  // Check for optional fields
  var firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
  var lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
  var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

  // Error if phone is invalid
  if(phone){
    // Error if nothing is sent to update
    if(firstName || lastName || password){
        var token = typeof(data.headers.token) == 'string' ? data.headers.token:false
        // Verify that the given token is valid for the phone number
        handlers._tokens.verifyToken(token,phone,function(tokenIsValid){
            if(tokenIsValid){
                _data.read('users',phone,function(err,data){
                if(!err && data){
                        // Lookup the user
                    _data.read('users',phone,function(err,userData){
                        if(!err && userData){
                        // Update the fields if necessary
                            if(firstName){
                                userData.firstName = firstName;
                            }
                            if(lastName){
                                userData.lastName = lastName;
                            }
                            if(password){
                                userData.hashedPassword = helpers.hash(password);
                            }
                            // Store the new updates
                            _data.update('users',phone,userData,function(err){
                                if(!err){
                                callback(200);
                                } else {
                                console.log(err);
                                callback(500,{'Error' : 'Could not update the user.'});
                                }
                            });
                        } else {
                        callback(400,{'Error' : 'Specified user does not exist.'});
                        }
                    });
                }
                    else {
                        callback(404)
                    }
                })
            }
            else{
                callback(403,{'Error':'Missing required token in header, or token is invalid'})
            }
        })      
     
    } else {
      callback(400,{'Error' : 'Missing fields to update.'});
    }
  } else {
    callback(400,{'Error' : 'Missing required field.'});
  }

}

// Required data: phone
// @TODO Only let an authenticated user delete their object. Dont let them delete update elses.
// @TODO Cleanup (delete) any other data files associated with the user
handlers._users.delete = function(data,callback){
    var phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;
    if(phone){
        // Get token from headers
        var token = typeof(data.headers.token) == 'string' ? data.headers.token:false
        // Verify that the given token is valid for the phone number
        handlers._tokens.verifyToken(token,phone,function(tokenIsValid){
             if(tokenIsValid){
                _data.read('users',phone,function(err,data){
                    if(!err && data){
                        _data.delete('users',phone,function(err){
                            if(!err){
                                callback(200)
                            }
                            else{
                                console.log(err)
                                callback(500,{'Error': "Could not delete the specified user"})
                            }
                        })
                    }
                    else{
                        console.log(err)
                        callback(400,{'Error' : "Could not find the specified user"})
                    }
                })
             }
             else{
                 callback(403,{'Error':'Missing required token in header, or token is invalid'})
             }
        })      
    } else {
        callback(400,{'Error' : 'Missing required field'}) 
    }
}



// ================================ Tokens =============================================
handlers.tokens = function(data,callback){
    var methods = ['get','post','put','delete']
    if(methods.indexOf(data.method)>-1){
        handlers._tokens[data.method](data,callback)
    }
    else{
        callback(405)
    }
}

// Container for the token submethods
handlers._tokens = {};

// Tokens -- post
// Required data: phone, password
// Optional data: none
handlers._tokens.post = function(data,callback){
    var phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
    var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

    if(phone && password){
        // Lookup the user who matches that phone number
        _data.read('users',phone, function(err,data){
            if(!err && data){
            // Hash the sent password, and compare it to the password stored in the user object
            var hashedPassword = helpers.hash(password)
            
                if(hashedPassword == data.hashedPassword){
                    // If valid, create a new token with a random name. Set expiration date 1 hour in the future.
                    var tokenID = helpers.createRandomString(20);
                    var expires = Date.now() + 1000 *60 *60;
                    var tokenObj = {
                        'phone':phone,
                        'id' : tokenID,
                        'expires': expires
                    }

                    //Store the token
                    _data.create('tokens',tokenID,tokenObj,function(err){
                        if(!err){
                            callback(200,tokenObj)
                        }else{
                            callback(500,{'Error' : 'Could not create the new token'})
                        }
                    })

                }else{
                    callback(400,{'Error':'Password did not match the specified user\s stored password'})
                }

            }else{
                callback(400,{'Error': 'Could not find the specified user'})
            }
        })
    } else {
        callback(400,{'Error': 'Missing required field(s)'})
    }
}

// Tokens -- get 
// Required data: id
// Optional data: none
handlers._tokens.get = function(data,callback){
    // Check the id is valid
    var id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;

    if(id){
        // Lookup the token
        _data.read('tokens',id,function(err,data){
            if(!err && data){
                callback(200,data)
            }
            else {
                callback(404)
            }
        })
    } else {
        callback(400,{'Error' : 'Missing required field'})
    }

}

// Tokens -- put
// Required data : id, extend
handlers._tokens.put = function(data,callback){
    var id = typeof(data.payload.id) == 'string' && data.payload.id.trim().length == 20 ? data.payload.id.trim() : false;
    var extend = typeof(data.payload.extend) == 'boolean' && data.payload.extend == true ? true : false;
    if( id && extend){
        // Lookup the token
        _data.read('tokens',id,function(err,data){
            if(!err && data){
                // Check the token isn't expired
                if(data.expires > Date.now()){
                    // Set the expiration an hour from now
                    data.expires=Date.now() + 1000 * 60 * 60;
                    // Store the new updates
                    _data.update('tokens',id,data,function(err){
                        if(!err){
                            callback(200)
                        }else{
                            callback(500,{'Error':'Could not update the token\'s expiration'})
                        }
                    })
                }else{
                    callback(400,{'Error':'The token has already expired.'})
                }
            }else{
                callback(400,{'Error': 'Specified token does not exist'})
            }
        })
    } else {
        callback(400,{'Error' : 'Missing required field(s) or field(s) are invalid'})
    }
}

// Tokens -- delete
// Required data: id
// Optional data: none
handlers._tokens.delete = function(data,callback){
     // Check the id is valid
     var id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;

     if(id){
        _data.read('tokens',id,function(err,data){
            if(!err && data){
                _data.delete('tokens',id,function(err){
                    if(!err){
                        callback(200)
                    }
                    else{
                        console.log(err)
                        callback(500,{'Error': "Could not delete the specified token"})
                    }
                })
            }
            else{
                console.log(err)
                callback(400,{'Error' : "Could not find the specified token"})
            }
        })
     }else{
         callback(400,{'Error':'Missing required field'})
     }
}

// Verify if a given token id is currently valid for a given user
handlers._tokens.verifyToken = function(id, phone, callback){
    // Lookup the token
    _data.read('tokens',id, function(err,data){
        if(!err && data){
            if(data.phone==phone && data.expires > Date.now()){
                callback(true)
            }
            else {
                callback(false)
            }
        } else {
            callback(false)
        }
    })
}





//Export the module
module.exports=handlers