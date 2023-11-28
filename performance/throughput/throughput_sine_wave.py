import numpy as np
import wave, math
from aioca import caput, run
import time
import datetime
import argparse

parser = argparse.ArgumentParser()
parser.add_argument("-n", "--nSamples", type=int)
args = parser.parse_args()

pv="test:waveform"
freq = 10
amp = 1
numPeriods = 10
numSamples = args.nSamples
# As we increase the array size the caput takes longer so need to 
# decrease the sleep time
if numSamples == 1000000:
    rate = 0.0858
elif numSamples == 1000:
    rate = 0.098
elif numSamples == 10000:
    rate = 0.098
elif numSamples == 100000:
    rate = 0.097
elif numSamples == 200000:
    rate = 0.096
elif numSamples == 500000:
    rate = 0.093
else:
	rate = 0.1

# Create the x axis from 0 to numPeriods, divided into numSamples samples.
x = np.linspace(0, numPeriods, numSamples)

f1 = lambda x: amp*np.sin(freq*2*np.pi*x)
sine_wave = [f1(i) for i in x]
sine_wave = np.roll(sine_wave, 1)

print("Array size: ", numSamples)

async def put_to_pv(sine_wave):
	i=0
	total = 0
	while True:
		start = time.time()
		await caput(pv, sine_wave)
		i=i+1
		sine_wave = np.roll(sine_wave, 1)
		time.sleep(rate)
		total = total + (time.time() - start)
		if i % 50 == 0:
			# Monitor current frequency update to console
			print("Current rate: ",i/total)
			total = 0
			i = 0

run(put_to_pv(sine_wave))


