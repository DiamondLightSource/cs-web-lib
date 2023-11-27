// node throughput_pvws.js
const WebSocket = require('ws');

const TEST_SUBSCRIPTION_URL = "ws://localhost:8080/pvws/pv";
const PV = "test:waveform";

let socket;
let count = 0;
let skip = 0;
let t1 = process.hrtime();

function open() {
	this.socket = new WebSocket(TEST_SUBSCRIPTION_URL);
	this.socket.onopen = event => handleConnection();
	this.socket.onmessage = event => handleMessage(event.data);
}

function handleConnection()
{
    console.log("Connected to " + this.socket.url);
    this.socket.send(JSON.stringify({ type: "subscribe", pvs: [PV] }));
	sendSubscription();
}

function sendSubscription()
{
    console.log("Subscribing to " + PV);
    this.socket.send(JSON.stringify({ type: "subscribe", pvs: [PV] }));
}

function unsubscribe()
{
    console.log("Unsubscribing from " + PV);
    this.socket.send(JSON.stringify({ type: "clear", pvs: [PV] }));
}

function handleMessage(message) {
    if (count == 0 && skip < 2) {
    	// Skip to first 2 which will be the initial connection
    	// updates. Make sure we are just getting the value
    	// updates
    	skip = skip + 1
    	console.log("skip first 2")
    } else {
    	if (count == 0 ) {
    		this.t1 = process.hrtime();
    	}
    	if (count == 99) {
    		unsubscribe();
    		const t2 = process.hrtime(this.t1);
    		const executionTime = (t2[0] * 1000 + t2[1] / 1000000) / 1000;
          	console.log(`Final count: ${count}`);
          	console.log(`Execution Time: ${executionTime}`);
          	const messageFreq = count / executionTime;
          	console.info(`Measured frequency: ${messageFreq} Hz`);
    	}
    	count = count + 1;
	}
}

open();

