/* global require */
'use strict';

var qs = require('querystring');
var request = require('request');

function validateToken(verifyToken, token) {
  return new Promise((resolve, reject) => {
    if (token === verifyToken) {
      resolve();
    } else {
      reject();
    }
    return;
  });
}

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
    // console.log(req);
    let body = qs.parse(postdata);
    console.log('slack request: ', body);
    validateToken(context.secrets.slackToken, body.token)
      .then(() => {
        // Build our message text.
        return buildMessage(body);
      })
      .then((message) => {
        // Send our message text back to the INCOMING_WEBHOOK_URL.
        return sendMessageAsync(message, body.user_name, body.channel, context.meta.INCOMING_WEBHOOK_URL);
      })
      .then(() => {
        res.writeHead(200);
        res.end();
        return;
      })
      .catch((error) => {
        console.log("Error happened: " + error.toString() );
        res.writeHead(500);
        res.end("I'm sorry, I didn't quite get that.");
        return;
      });
  });
};
