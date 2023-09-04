const mqtt = require('mqtt');

/* HiveMq setup */
const brokerUrl = 'mqtt://broker.hivemq.com:1883';
const clientId = 'clientId-qj7stXp84Y';
const topic = 'mikrotik/admin';

const client = mqtt.connect(brokerUrl, { clientId });

client.on('connect', () => {
    console.log('Connected to the broker');
    client.subscribe(topic, (error) => {
        if (!error) {
            console.log(`Subscribed to ${topic}`);
        }
    });
});

client.on('message', (receivedTopic, message) => {
    // socket.emit('mqtt_data', JSON.parse(message.toString()));
    console.log(`Received message on topic ${receivedTopic}: ${message.toString()}`);
    let data = JSON.parse(message.toString());
});

client.on('error', (error) => {
    console.error('Connection error:', error);
    client.end();
});

client.on('close', () => {
    console.log('Connection closed');
});
