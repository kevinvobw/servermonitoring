# Server Monitoring with Slack Alerts

This is a Node.js-based server monitoring tool that periodically pings a list of servers to check their status. If a server goes down, it sends an alert to a specified Slack channel using a webhook. The tool also provides a web interface and API to monitor and acknowledge server statuses.

## Features

- Periodically pings servers to check their availability.
- Sends alerts to a Slack channel when a server is down.
- Web interface to monitor server statuses.
- API endpoints to fetch server statuses and acknowledge errors.
- Configurable via an external `config` file.

## Prerequisites

- Node.js (v19 or later)
- Docker (optional, for containerized deployment)
- A Slack Incoming Webhook URL

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/kevinvobw/servermonitoring.git
   cd servermonitoring

2. Install dependencies:

    ```bash
    npm install

3. Create a config.js file in the root directory. Use the following template (change the ipadresses of the servers in the config.js):

    ```javascript
    const devices = {
    metadata: {
        port: 3000, // Port for the web server
        interval: 60000 // Interval for server checks in milliseconds
    },
    servers: [
        { name: 'Server1', ip: '192.168.1.1' },
        { name: 'Server2', ip: '192.168.1.2' }
    ],
    webhookUrl: 'https://hooks.slack.com/services/your/webhook/url' // Replace with your Slack webhook URL
    };

    module.exports = devices;

4. Start the application:

    ```bash
    node monitoring.js

## Questions

If you have any questions, please contact me at https://studio.volt-it.be/#Contact
