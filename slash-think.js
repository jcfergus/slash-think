/* global require */
'use strict';

/**
 * This is a really simple and dumb slack slash-action handler that converts:
 * 
 * /think Some message...
 * 
 * into:
 * 
 * . o O ( Some message... ) 
 * 
 * It replicates a command that used to exist in the LambdaMOO installation that I used to hang out in with
 * people I hang out in Slack with now. 
 * 
 **/

var qs = require('querystring');
var request = require('request');

/**
 * Validates the slack token on the incoming request. 
 */
function validateToken(verifyToken, token) {
  return new Promise((resolve, reject) => {
    if (token === verifyToken) {
      return resolve();
    } else {
      return reject(new Error("Couldn't validate security token."));
    }
  });
}

/**
 * Builds the thought bubble . o O ( message ) from the thought that was sent. 
 */
function buildMessage(data) {
  return new Promise((resolve, reject) => {
    if (!data.user_name || !data.text) {
      reject(new Error("No username or text data received."));
      return;
    } else {
      let message = " . o O ( " + data.text + " )"; 
      resolve(message);
    }
  });
}

/**
 * Sends the thought message to the incoming webhook url.  We have to do it this way instead of using the 
 * response hook so we can make it appear (mostly) as if it was from the user instead of appearing as from our bot.
 */
function sendMessageAsync(message, username, channel, responseUrl) {
  return new Promise((resolve, reject) => {
    if (!responseUrl) {
      reject(new Error("No response_url provided.")); 
      return;
    } else {
      let options = { method: 'post', 
                      url: responseUrl,
                      json: { response_type: 'in_channel',
                        username: username,
                        channel: "#" + channel,
                        text: message } };
                        
      console.log(options);
                      
      let req = request(options, (err, response) => {
                  console.log(response.body);
                  if (err) {
                    reject(err);
                  } else {
                    resolve();
                  }
      });
    }
  });
}


module.exports = function (context, req, res) {
  // Read the data posted in.  We're using this form because we want the ability to send back an empty response
  // if everything works right.  
  let postdata = "";
  req.on("data", (chunk) => {
    let data = chunk.toString('utf8');
    postdata = postdata + data;
  })
  .on("end", () => { 
    console.log("POST data: " + postdata);
    let body = qs.parse(postdata);
    validateToken(context.secrets.WEBHOOK_SECRET, body.token)
      .catch((error) => {
        console.log("Error happened: " + error );
        res.writeHead(403);
        res.end("Forbidden.");
        return Promise.reject(new Error("handled"));  // Keep the remainder of the chain from happening. 
      })
      .then(() => {
        // Build our message text.
        console.log("Building message.");
        return buildMessage(body);
      })
      .then((message) => {
        // Send our message text back to the INCOMING_WEBHOOK_URL.
        return sendMessageAsync(message, body.user_name, body.channel_name, context.meta.INCOMING_WEBHOOK_URL);
      })
      .then(() => {
        // Write a response. 
        console.log("Writing response.")
        res.writeHead(200);
        res.end();
        return;
      })
      .catch((error) => {
        // Handle any error that may have occurred, iff it's not something we've already handled.  
        if (error.toString() !== "handled") {
          console.log("Error happened: " + error.toString() );
          res.writeHead(500);
          res.end("I'm sorry, I didn't quite get that.");
        }
        return;
      });
  });
};
