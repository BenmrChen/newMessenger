'use strict';
// Imports dependencies and set up http server
const
  express = require('express'),
  bodyParser = require('body-parser'),
  app = express().use(bodyParser.json()), // creates express http server
  port = 5000,
  // 把原本是process.env.port (應該是要require process檔案 去指向裡面的.env，再指向以port為key的值) 直接改掉寫死 (node.js裡面的點點大概可以想成php的->) 
  page_access_token = 'EAAh84HrF238BAEsGvODMhMVvUbk8jT4czB99LTwM7lp2B6rt8bfaA4leyF2dU7e99VZCvSNS48eRAPzTnve8jN9Xhkz8IPJNX7IIvhJ44sUWiAHYL6CMVBa9QJ8yyKBDOvTak0Q0P4QMv9ssKD8rT72DiI8oPV16UZCJ4HZAwZDZD',
  request = require('request');
  // 這邊原本是要設環境變數 後來是直接把它寫成常數放這
// Sets server port and logs message on success
app.listen(port || 1337, () => console.log('webhook is listening'));

// Creates the endpoint for our webhook 
app.post('/webhook', (req, res) => {  
                    // 這是個callback，可以想像成前面有function以及function name被省略了，而裡面有兩個參數，一個是req (request)，一個是res (respond)
  let body = req.body;
                    // 把req參數裡的body存到body變數裡
  // Checks this is an event from a page subscription
  if (body.object === 'page') {
       // 可以想成body->object的值要等於'page'
    // Iterates over each entry - there may be multiple if batched
    body.entry.forEach(function(entry) {
       // body->entry，並foreach出來，可以想成foreach (entry as entry) {},後面的花括號才是要做的事
      // Gets the message. entry.messaging is an array, but 
      // will only ever contain one message, so we get index 0
      let webhook_event = entry.messaging[0];
      
      // entry.messaging裡面可能不只放一個東西(可能會放是誰傳的、何時傳的...目前的範例是只有放一個訊息)，但我們只要一個，而這個是訊息，所以設參數0
      console.log(webhook_event);
      
      // Get the sender PSID
      let sender_psid = webhook_event.sender.id;
      console.log('Sender PSID: ' + sender_psid);

      // Check if the event is a message or postback and
      // pass the event to the appropriate handler function
      if (webhook_event.message) {
        handleMessage(sender_psid, webhook_event.message);        
      } else if (webhook_event.postback) {
        handlePostback(sender_psid, webhook_event.postback);
      }
        });

    // Returns a '200 OK' response to all requests
    res.status(200).send('EVENT_RECEIVED');
  } else {
    // Returns a '404 Not Found' if event is not from a page subscription
    res.sendStatus(404);
  }

});

// Adds support for GET requests to our webhook
app.get('/webhook', (req, res) => {
  // 也是一樣有callback, 傳req和res進來，只是是用query string傳，傳進來後會變成array
  // Your verify token. Should be a random string.
  let verify_token = "newMessenger"
    
  // Parse the query params
  let mode = req.query['hub.mode'];
  // 由於透過 query string 傳進來會是array，所以這邊用array的方式取值 (key是'hub.mode', value在此例是'subscribe')
  let token = req.query['hub.verify_token'];
  let challenge = req.query['hub.challenge'];
    
  // Checks if a token and mode is in the query string of the request
  if (mode && token) {
    // Checks the mode and token sent is correct
    if (mode === 'subscribe' && token === verify_token) {
      
      // Responds with the challenge token from the request
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);
    
    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403);      
    }
  }
});

// Handles messages events
function handleMessage(sender_psid, received_message) {
  let response;

  // Check if the message contains text
  if (received_message.text) {    

    // Create the payload for a basic text message
    response = {
      "text": `${received_message.text}哥就是帥! 帥到沒朋友! 溼到沒褲子!`
    }
  }  
  
  // Sends the response message
  callSendAPI(sender_psid, response);    
}

// Handles messaging_postbacks events
function handlePostback(sender_psid, received_postback) {

}

function callSendAPI(sender_psid, response) {
  // Construct the message body
  let request_body = {
    "recipient": {
      "id": sender_psid
    },
    "message": response
  }

  // Send the HTTP request to the Messenger Platform
  request({
    "uri": "https://graph.facebook.com/v2.6/me/messages",
    "qs": { "access_token": page_access_token },
    "method": "POST",
    "json": request_body
  }, (err, res, body) => {
    if (!err) {
      console.log('message sent!')
    } else {
      console.error("Unable to send message:" + err);
    }
  }); 
}

