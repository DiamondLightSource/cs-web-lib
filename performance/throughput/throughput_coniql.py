import asyncio
import time
import websockets
from graphql_client import GraphQLClient
import argparse
import base64
import json
import numpy as np

parser = argparse.ArgumentParser()
parser.add_argument("-p", "--process",action="store_true")
args = parser.parse_args()


TEST_SUBSCRIPTION_URL = "ws://localhost:8080/ws"

sinewave_subscription = f"""subscription {{
  subscribeChannel(id: "test:waveform") {{
    id
    value {{
        base64Array {{
          base64
        }}
    }}
  }}
}}
"""

def to_float_array(input_data):
    buffer = base64.decodebytes(input_data.encode("ascii"))
    return np.frombuffer(buffer, dtype=np.float64)

def decode(response, check_length):
    if check_length:
        print("Array length: ", len(to_float_array(response["payload"]["data"]["subscribeChannel"]["value"]["base64Array"]["base64"])))



count = 0
def add_count(id, data):
    if args.process:
        decode(data, True)
    global count
    count += 1

def main():
    with GraphQLClient('ws://localhost:8080/ws') as ws:
        sub_id = ws.subscribe(query=sinewave_subscription, callback=add_count)

        start_time = time.time()

        time.sleep(30)

        ws.stop_subscribe(sub_id)

        end_time = time.time()
        ws.close()

        recorded_time = end_time - start_time
        print(f"Final count: {count}")
        print(f"Execution Time: {recorded_time} s")
        message_freq = count / recorded_time
        print(f"Measured Frequency: {message_freq} Hz")


if __name__ == "__main__":
    main()
    #asyncio.get_event_loop().run_until_complete(main())