import numpy as np
import wave, math
from aioca import caput, run
import time
import datetime
import argparse

parser = argparse.ArgumentParser()
parser.add_argument("-n", "--nSamples", type=int, default=10)
args = parser.parse_args()

pv="test:waveform"
freq = 10
amp = 1
numPeriods = 10
numSamples = args.nSamples
rate = 0.1

# Create the x axis from 0 to numPeriods, divided into numSamples samples.
x = np.linspace(0, numPeriods, numSamples)

f1 = lambda x: amp*np.sin(freq*2*np.pi*x)
sine_wave = [f1(i) for i in x]
sine_wave = np.roll(sine_wave, 1)

print("Array size: ", numSamples)

async def put_to_pv(sine_wave):
	count = 0
	total = 0
	start = time.time()
	while True:
		time.sleep(0.001)
		elapsed = time.time() - start
		if elapsed > rate:
			start = time.time()
			await caput(pv, sine_wave)
			sine_wave = np.roll(sine_wave, 1)
			count = count + 1
			total = total + elapsed
			if count % 50 == 0:
				print("Current rate: ",count/total)

run(put_to_pv(sine_wave))


