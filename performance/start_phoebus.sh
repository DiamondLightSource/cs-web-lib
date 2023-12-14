#!/bin/bash

# Parse command line options
VALID_ARGS=$(getopt -o hn: --long help:nscreens:, -- "$@")
if [[ $? -ne 0 ]]; then
    exit 1;
fi

eval set -- "$VALID_ARGS"
while [ : ]; do
    case "$1" in
        -h | --help)
            Help
            exit 1
            ;;
        -n | --nscreens)
            N_SCREENS="$2"
            if ! [[ $N_SCREENS =~ ^[0-9]+$ ]]; then
                echo "Screen index must be an integer"
                exit
            fi
            shift 2
            ;;
        --) shift; 
            break 
            ;;
    esac
done

if [ -z $N_SCREENS ]; then
    N_SCREENS=1
fi

#/home/cnuser/Downloads/phoebus-4.7.3-SNAPSHOT/phoebus.sh -resource file:/home/cnuser/cs-web-performance-tests/cs-web-lib/performance/public/performanceTestPage.bob?target=window
for ((i=0;i<$N_SCREENS;i++))
do
	/home/cnuser/Downloads/phoebus-4.7.3-SNAPSHOT/phoebus.sh -resource file:/home/cnuser/cs-web-performance-tests/cs-web-lib/performance/public/performanceTestPage$i.bob?target=window
	#/home/cnuser/Downloads/phoebus-4.7.3-SNAPSHOT/phoebus.sh -resource file:/home/cnuser/cs-web-performance-tests/cs-web-lib/performance/public/performanceTestPage.bob?target=window
done
