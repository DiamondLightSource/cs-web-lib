# Front-end performance tests

The performance/ directory contains a set of scripts and a React performance application that can be used to facilitate performance testing of the front-end application. These tests can be run against both the Coniql and PVWS back-end servers.

All tests required a running IOC, a back-end server running (Coniql or PVWS) and the React performance app running at localhost:3000.

## Installation
The cs-web-lib library has been modified for performance tests to allow extra performance related debug statements. This requires the cs-web-lib to be built and packaged before it can be used by the performance tests in /performance.
To do this:
	
	cd cs-web-lib
	npm run rollup
	npm pack

This will create a dls-controls-cs-web-lib-0.1.XX.tgz file.

Next install the performance test application:

	cd performance
	npm install .

Uninstall the default version of cs-web-lib (pulled in from the npm repo) and install the newly built tgz cs-web-lib library:

	npm uninstall @dls-controls/cs-web-lib
	npm install ../dls-controls-cs-web-lib-0.1.XX.tgz

Configure the `.env` environment to connect to the back end and enable performance debug. If running Coniql/PVWS locally then use:

	REACT_APP_CONIQL_SOCKET=localhost:8080
	REACT_APP_CONIQL_SSL=false

	REACT_APP_PERFORMANCE_DEBUG=true	

Finally build an optimized version of the performance app:

	npm run build

Serve the build using:

	serve -s build

Open a web-browser and navigate to: localhost:3000/


## Measuring metrics

### CPU
The .`/cpu_monitor.sh` script can be used to monitor the CPU and memory usage of a process by passing the PID as an argument:

	./cpu_monitor.sh -p <PID>

The `-a` argument can also be used to average the CPU usage over 10 seconds.


### Rendering times
The time it takes for a webpage to render can either be timed manually by eye or by using the Console in the Developers Tool, where the render time with be printed as a debug statement.

## Configurations

### PVWS
If running these performance tests against PVWS, some of the default settings of PVWS need to be overwritten the defaults or not sufficient. If running the PVWS docker container, add the following settings to the pvws/docker/setenv.sh to lower the throttling and increase the max array size:

	export PV_THROTTLE_MS=10
	export PV_ARRAY_THROTTLE_MS=10
	export EPICS_CA_MAX_ARRAY_BYTES=10000000

### Python venv
To run the Python scripts, first create a virtual environment and pip install the dependencies:

	python -m venv venv
	source venv/bin/activate

	pip install numpy aioca asyncio py-graphql-client websockets

## Performance tests

### Single screen
A script can be used to create a DB file with _N_ EPICS PVs updating at a given rate and another can be used to create an OPI or BOB screen displaying  _N_ PVs:

	./create_db.sh -n <number-of-pvs> -r <rate>
	./create_opi.sh -n <number-of-pvs>
	./create_bob.sh -n <number-of-pvs>

The EPICS db can then be run with:

	softIoc -d performanceTestDb.db

The generated OPI/BOB file and associated JSON file are created under public. These must be moved to the build directory if using the `serve` command above to run the app. E.g.

	cp public/performance* build/


### Multiple screens
The `.create_opi.sh` and `/create_bob.sh` scripts can be used to create _M_ screens displaying _N_ PVs using the `-s` option:

	./create_opi.sh -n <number-of-pvs> -s <number-of-screens>
	./create_bob.sh -n <number-of-pvs> -s <number-of-screens>

These will be created under public/performanceTestPageXX.opi or public/performanceTestPageXX.bob and public/performancePageXX.json (the first file will have no index).

Remember to adjust the number of PVs in the DB file to match this (i.e. `<number-of-pvs> x <number-of-screens>`)

To display each of these in the web-browser, navigate to: localhost:3000/performancePage, localhost:3000/performancePage1, ... etc.


### Diamond representative screens
A set of more representative screens with a mixture of update rates and a plotting widget can be generated with:

	`./create_example_db.sh -n <number-of-screens>`
	`./create_example_opi.sh -n <number-of-screens>`
	`./create_example_bob.sh -n <number-of-screens>`

This will generate a set of screens each with unique PVs. Again, these will be generated in the public/ directory and will need to be copied to the build/ directory to be available at: localhost:3000/performancePage0, localhost:3000/performancePage1, localhost:3000/performancePage2, ... etc.

In order to update the plotting widget with array data, also run the `./update_array_pv.py` script with `-n` for the number of array elements to update (i.e. array size) and `-s` to indicate the number of separate array PVs to update (i.e. number of screens as each screen displays a different array PV):

	./update_array_pv.py -n <array-size> -s <number-of-screens>


### Starting Firefox windows from the terminal
There are two methods of starting up _M_ screens automatically from the terminal.

1. Use the `./start_browser.sh` script as:

	    ./start_browser.sh -s <number-of-screens> -w <number-of-windows>

    These can be opened in separate windows or tabs using the arguments `-w` or `-t` respectively.
   The number-of-screens specifies how many of the unique OPI screens should be opened (i.e. those generated from [Multiple screens](#multiple-screens) or [Diamond representative screens](#diamond-representative-screens)). In this case the <number-of-screens> and <number-of-windows> should match as each unique screen will be opened in a new window, e.g `./start_browser.sh -s 10 -w 10`.

    This method is slightly less efficient than that described next due to requiring a pause between each window opening.

2. Use the `open_windows/open_ff_windows.html`

	First modify the `open_windows/open_ff_windows.js` script and update the `nPages` variable to reflect the number of performance pages to be opened.

	Configure Firefox: by default this script will open the new screens in new tabs. To force them to be opened as new windows, a Firefox preference needs to be changed:

	- From a browser navigate to: `about:config`
	- Search for the preference: `browser.link.open_newwindow` and set this to `2` (default is `3`).

	Now start the `open_windows/open_ff_windows.html` to open the windows.


### Throughput of array data
This test measures the rate at which data can be received from the back-end server for increasing array sizes.

The `throughput/throughput.db` file contains a single waveform record. Run this in an IOC: `softIoc -d throughput/throughput.db`

Prior to running these test the IOC must be started and the throughput/throughput_sine_wave.py Python script should be run in separate terminals using the virtual environment created below.

	python throughput/throughput_sine_wave.py -n <array-size>

The Python script will put data to the waveform array at a rate of 10Hz. 

There are two sets of tests, one against the Coniql back-end server and another against the PVWS back-end server. For each there are two types of test, one in Python and the other in Javascript.

After activating the Python venv (details [above](#python-venv)), run the Python test with:

	python throughput/throughput_XXX.py

To run the Javascript code run:

	node throughput/throughput_XXX.js

These tests can take up to 30 seconds to run. The rate at which data is received by the client will be printed to the console at the end of the test. The argument `-p` can be appended to both of the above commands to indicate that processing/decoding of the incoming result should be done. This tests the impact of decoding the result on the performance.


### Opening Phoebus standalone windows
There is a script to open multiple Phoebus screens: `./start_phoebus.sh `. Use as:

	./start_phoebus.sh -n <number-of-screens>

By default, the state of Phoebus persists when re-opened. To prevent this, first open Phoebus with the argument:

	phoebus -clear

After this, run the above script to open _n_ windows.

Note that an alternative way of doing this would be using Phoebus _layouts_ (see https://control-system-studio.readthedocs.io/en/latest/running.html)


### Electron
Install dependencies with npm:

	cd electron
	npm install .

Start with:

	npm run start

If an error occurs when starting:

	The SUID sandbox helper binary was found, but is not configured correctly. 
	Rather than run without sandboxing I'm aborting now. You need to make sure 
	that /home/cnuser/cs-web-performance-tests/cs-web-lib/performance/electron/node_modules/electron/dist/chrome-sandbox 
	is owned by root and has mode 4755.

Fix with:

 	sudo chown root:root node_modules/electron/dist/chrome-sandbox
 	sudo chmod 4755 node_modules/electron/dist/chrome-sandbox

 To open multiple pages with Electron, update the `nPages` value in the `electron/main.js` script.
