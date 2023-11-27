import asyncio
import json
import time
import base64
import numpy as np
import websockets
import argparse


TEST_SUBSCRIPTION_URL = "ws://localhost:8080/pvws/pv"
PV = "test:waveform"

parser = argparse.ArgumentParser()
parser.add_argument("-p", "--process",action="store_true")
args = parser.parse_args()


def to_float_array(input_data):
    buffer = base64.decodebytes(input_data.encode("ascii"))
    return np.frombuffer(buffer, dtype=np.float64)

def decode(response, check_length):
    data = json.loads(response);
    if "b64dbl" in data and check_length:
        print("Array length: " + str(len(to_float_array(data["b64dbl"]))))

async def main():
    async with websockets.connect(TEST_SUBSCRIPTION_URL, max_size=1_000_000_000) as websocket:
        await websocket.send(
            json.dumps({ 
                "type": "subscribe",
                "pvs": [PV], 
            })
        )

        response = await websocket.recv()
        response = await websocket.recv()
        start_time = time.time()
        check_length = False
        for i in range(100):
            response = await websocket.recv()
            if args.process:
                if i == 99:
                    check_length = True
                decode(response, check_length)

        end_time = time.time()
        print(f"Time taken: {end_time - start_time:2f} s")
        print(f"Frequency: {100 / (end_time - start_time):3f} Hz")


if __name__ == "__main__":
    asyncio.get_event_loop().run_until_complete(main())