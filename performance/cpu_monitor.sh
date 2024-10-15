#!/bin/bash

Help()
{
    echo " ************************************************************************ "
    echo " Script to monitor the CPU and memory of a process using top "

    echo " - Usage:"
    echo "       ./cpu_monitor.sh <options...>"
    echo "     options:"
    echo "      -h | --help:      display this help message"
    echo "      -p | --pid:       process ID to monitor."
    echo "      -a | --average:   [optional] average CPU usage over 10 seconds."
    echo "                         Useful if CPU fluctuates."
    echo "     E.g."
    echo "      ./cpu_monitor.sh -p 13370"
    echo " ************************************************************************ "
}

# Parse command line options
VALID_ARGS=$(getopt -o hp:a --long help,pid:,average -- "$@")
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
        -p | --pid)
            PID="$2"
            shift 2
            ;;
        -a | --average)
            SAMPLE=true
            shift 1
            ;;
        --) shift; 
            break 
            ;;
    esac
done

if [ -z $PID ]; then
    echo "No PID provided"
    exit 1
fi
if [ -z $SAMPLE ]; then
    SAMPLE=false
fi

if [ $SAMPLE == true ]; then
    COUNT=0
    top -b -d 1 -p $PID | awk -v pid="$PID" '
        /^top -/{time = $3}
        $1+0>0 {++COUNT
                TOTAL=TOTAL+$9
                if (COUNT % 10 == 0) {
                    if ($6 ~ /g/) {
		        printf "%s %s: Average CPU Usage: %d%%, Memory usage: %.2f GiB\n", \
		        strftime("%Y-%m-%d"), time, TOTAL/COUNT, $6
                    } else {
                   	printf "%s %s: Average CPU Usage: %d%%, Memory usage: %d MiB\n", \
		        strftime("%Y-%m-%d"), time, TOTAL/COUNT, $6/1000
                    }
                    TOTAL=0
                    COUNT=0
                }
            }'
else 
    top -b -d 2 -p $PID | awk -v pid="$PID" '
        /^top -/{time = $3}
        $1+0>0 {if ($6 ~ /g/) {
		        printf "%s %s: CPU Usage: %d%%, Memory usage: %.2f GiB\n", \
		        strftime("%Y-%m-%d"), time, $9, $6
                    } else {
                   	printf "%s %s: CPU Usage: %d%%, Memory usage: %d MiB\n", \
		        strftime("%Y-%m-%d"), time, $9, $6/1000
                    }
	}'
fi
