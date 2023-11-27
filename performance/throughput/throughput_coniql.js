// node throughput_coniql.js
const { createClient } = require("graphqurl");
const base64js = require("base64-js");

const TEST_SUBSCRIPTION_URL = "ws://localhost:8080/ws";
const PV = "test:waveform";

let count = 0;
let skip = 0;
let t1 = process.hrtime();
let process_results = true;

const onConnection = () => {
    console.log('Connected to '+TEST_SUBSCRIPTION_URL)
    client.subscribe(
    {
      subscription: `subscription {subscribeChannel(id: "test:waveform") {id value{base64Array{base64}}}}`,
    },
    eventCallback,
    errorCallback
  )
}

const client = createClient({
    websocket: {
        endpoint: TEST_SUBSCRIPTION_URL,
        onConnectionSuccess: onConnection,
        onConnectionError: () => console.log('Connection Error'),
    }
});

const eventCallback = (event) => {
    if (count == 0 && skip < 2) {
        // Skip to first 2 which will be the initial connection
        // updates. Make sure we are just getting the value
        // updates
        skip = skip + 1
        console.log("skip first 2")
    } else {
        if (process_results) {
            const bd = base64js.toByteArray(event.data.subscribeChannel.value.base64Array.base64);
            const numbers = new Float64Array(bd.buffer);
            if (count == 99) {
                console.log(numbers.length)
            }
        }
        if (count == 0 ) {
            this.t1 = process.hrtime();
        }
        if (count == 99) {
            const t2 = process.hrtime(this.t1);
            const executionTime = (t2[0] * 1000 + t2[1] / 1000000) / 1000;
            console.log(`Final count: ${count}`);
            console.log(`Execution Time: ${executionTime}`);
            const messageFreq = count / executionTime;
            console.info(`Measured frequency: ${messageFreq} Hz`);
        }
        count = count + 1;
    }
};

const errorCallback = (error) => {
  console.log('Error:', error)
};

