const ping = require('ping');
const axios = require('axios');
const express = require('express');
const path = require('path');
const fs = require('fs');
const devices = require('./config');

// Create an Express app for the web interface
const app = express();
const port = 3000;
const interval = 60000; // Check servers every minute
app.use(express.json());

// Define the servers to monitor
//const servers = [
  //  { name: 'SCDE-MAVI-01', ip: '10.15.13.215' },
  //  { name: 'SCDE-MAVI-02', ip: '10.15.13.225' }
// ];

const servers = devices.servers;

// Slack Webhook URL
const slackWebhookUrl = 'https://hooks.slack.com/services/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'; // Replace with your Slack webhook URL

// Function to send a Slack alert
async function sendSlackAlert(serverName, message) {
    const payload = {
        text: `*Alert: ${serverName}*\n${message}`,
    };

    try {
        const response = await axios.post(slackWebhookUrl, payload, {
            headers: { 'Content-Type': 'application/json' },
        });
        console.log(`Sent Slack alert: ${response.status}`);
    } catch (error) {
        console.error('Error sending Slack alert:', error.response ? error.response.data : error.message);
    }
}

// Function to log server status and acknowledge errors
function logServerStatus(serverName, status) {
    const now = new Date();
    const server = servers.find(s => s.name === serverName);

    if (status === 'DOWN') {
        // Send alert only if we haven't sent an alert recently (within 10 minutes)
        if (!server.lastAlertTime || (now - server.lastAlertTime) > 600000) {
            sendSlackAlert(serverName, `${serverName} is down! Please check.`);
            server.lastAlertTime = now; // Update the last alert time
        }
    } else {
        console.log(`${serverName} is up.`);
    }
}

// Function to ping servers and check their status
async function checkServers() {
    for (let server of servers) {
        try {
            const res = await ping.promise.probe(server.ip);
            const status = res.alive ? 'UP' : 'DOWN';

            // Log the server status and send alerts accordingly
            logServerStatus(server.name, status);
        } catch (error) {
            console.error(`Error pinging ${server.name}:`, error);
            sendSlackAlert(server.name, `Error pinging ${server.name}.`);
        }
    }
}

// Function to start monitoring the servers 24/7
function startMonitoring() {
    // Check servers every minute (60000ms)
    setInterval(checkServers, interval);
    console.log('Started monitoring servers...');
}

// Acknowledge error via an endpoint
app.post('/acknowledge/:serverName', (req, res) => {
    const serverName = req.params.serverName;
    const server = servers.find(s => s.name === serverName);

    if (server) {
        // Acknowledge the error and reset lastAlertTime
        server.lastAlertTime = null;
        console.log(`${serverName} error acknowledged and reset.`);
        res.status(200).send(`${serverName} error acknowledged.`);
    } else {
        res.status(404).send('Server not found.');
    }
});

// API to fetch the status of the servers
app.get('/api/status', (req, res) => {
    const statusData = servers.map(server => ({
        server_name: server.name,
        lastAlertTime: server.lastAlertTime
    }));
    res.json(statusData);
});

// Render the status page (HTML)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the web server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

// Start the monitoring process
startMonitoring();
