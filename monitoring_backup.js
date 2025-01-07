const ping = require('ping');
const twilio = require('twilio');
const express = require('express');
const path = require('path');
const fs = require('fs');

// Create an Express app for the web interface
const app = express();
const port = 3000;
const interval = 60000;  // Check servers every minute
app.use(express.json());

// Define the servers to monitor
const servers = [
    { name: 'SCDE-MAVI-01', ip: '10.15.13.215' },
    { name: 'SCDE-MAVI-02', ip: '10.15.13.225' }
];

// Predefined phone number for SMS alert
const phoneNumber = '+32470255913'; // Replace with your technician's phone number

// Twilio credentials
const accountSid = 'AC43a1f8adb535467678c5d584fa9efc34';  // Get from Twilio console
const authToken = 'b5abe43adb34481b68e06ff6a25ed802';    // Get from Twilio console
const twilioNumber = '+1 229 850 5293'; // Your Twilio phone number

// Create a Twilio client
const client = twilio(accountSid, authToken);

// Serve static files (for the front-end)
app.use(express.static(path.join(__dirname, 'public')));

// Function to send SMS alert
function sendAlert(serverName, message) {
    client.messages.create({
        body: `${serverName} Alert: ${message}`,
        from: twilioNumber,
        to: phoneNumber
    })
    .then((message) => console.log(`Sent SMS alert to ${phoneNumber}: ${message.sid}`))
    .catch((error) => console.error('Error sending SMS:', error));
}

// Function to log server status and acknowledge errors
function logServerStatus(serverName, status) {
    const now = new Date();
    const server = servers.find(s => s.name === serverName);

    if (status === 'DOWN') {
        // Send alert only if we haven't sent an alert recently (within 10 minutes)
        if (!server.lastAlertTime || (now - server.lastAlertTime) > 600000) {
            sendAlert(serverName, `${serverName} is down! Please check.`);
            server.lastAlertTime = now;  // Update the last alert time
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
            sendAlert(server.name, `Error pinging ${server.name}.`);
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
