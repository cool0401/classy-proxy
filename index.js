const axios = require('axios');
const express = require('express');
const http = require('http');
const app = express();

const InvidiousApi = 'https://api.invidious.io/instances.json?sort_by=type,health';

// Configuration Constants
const PORT = process.env.PORT || 3000;
//const TARGET_URL = 'https://invidious.fdn.fr/latest_version?id=gn_ounXBhF0&itag=22';

// Middleware to enable CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*'); // Set the appropriate origin here or use '*'
  res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// Define a route to handle proxy requests
app.get('/', (req, res) => {
  // Use Axios to make a request to the target URL
  if (req.query.id) {
    axios.get(InvidiousApi)
    .then(response => {
      // You can access the response data in the `data` property
      const responseData = response.data;

      if (responseData && responseData?.length > 0) {
        getVideo(responseData, req.query.id, 1, res);
      } else {
        console.error('Error fetching data from server');
      }
    })
    .catch(error => {
      console.error('Error fetching data:', error);
    });
  } else {
    console.error('unknown Video ID');
    res.status(500).send('unknown Video ID');
  }
});


function getVideo(responseData, id, index, res) {
  console.log(responseData[index][1].uri);
  var TARGET_URL = `${responseData[index][1].uri}/latest_version?id=${id}&itag=22`;
  axios({
    method: 'get',
    url: TARGET_URL,
    responseType: 'stream', // Set responseType to 'stream'
  })
    .then(response => {
      // Destructure headers
      const { 'content-type': contentType, 'content-length': contentLength } = response.headers;

      // Set the appropriate headers
      res.set({
        'Content-Type': contentType,
        'Content-Length': contentLength,
      });
      // Pipe the response stream from Axios to the response stream of the Express server
      response.data.pipe(res);
      // Handle errors
      response.data.on('error', err => {
        console.error('Error while streaming data:', err);
        res.end(); // End the response in case of an error
      });
    })
    .catch(error => {
      console.error('Proxy request error:', error);
      index ++;
      if (index < 15) {
        getVideo(responseData, id, index, res);
      } else 
        res.status(500).send('Proxy request failed');
    });
}

// Start the server
const server = http.createServer(app);
server.listen(PORT, () => {
  console.log(`Proxy server is listening on port ${PORT}`);
});