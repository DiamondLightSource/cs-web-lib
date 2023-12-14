import numpy as np
import wave, math
from aioca import caput, run
import time
import datetime
import argparse

parser = argparse.ArgumentParser()
parser.add_argument("-n", "--nSamples", type=int, default=10)
parser.add_argument("-s", "--nScreens", type=int, default=1)
args = parser.parse_args()

pv="TEST:ARR0"
pv_base="TEST:ARR"
freq = 10
amp = 10
numPeriods = 1
numSamples = args.nSamples
nScreens = args.nScreens
rate = 0.1	
shift = 1
if numSamples >= 10000:
	shift = 100

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
			for i in range(nScreens):
				await caput(pv_base+str(i), sine_wave)
			sine_wave = np.roll(sine_wave, shift)
			count = count + 1
			total = total + elapsed
			if count % 50 == 0:
				print("Current rate: ",count/total)
			

run(put_to_pv(sine_wave))


