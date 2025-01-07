const ping = require('ping');
const twilio = require('twilio');

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

// Function to ping servers and check their status
async function checkServers() {
    for (let server of servers) {
        try {
            const res = await ping.promise.probe(server.ip);
            if (!res.alive) {
                console.log(`${server.name} is down!`);
                sendAlert(server.name, `${server.name} is down! Please check.`);
            } else {
                console.log(`${server.name} is up.`);
            }
        } catch (error) {
            console.error(`Error pinging ${server.name}:`, error);
            sendAlert(server.name, `Error pinging ${server.name}.`);
        }
    }
}

// Function to start monitoring the servers 24/7
function startMonitoring() {
    // Check servers every minute (60000ms)
    setInterval(checkServers, 10000);
    console.log('Started monitoring servers...');
}

// Start the monitoring process
startMonitoring();
