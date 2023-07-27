#!/bin/bash

Help()
{
    echo " ************************************************************************ "
    echo " Script to open multiple firefox windos "
    echo " - Usage:"
    echo "       ./start_browser.sh <options...>"
    echo "     options:"
    echo "      -h | --help:      display this help message"
    echo "      -n | --npvs:      [optional] number of browser tabs to open. If not "
    echo "                         provided then default is 1."
    echo " ************************************************************************ "
}

# Parse command line options
VALID_ARGS=$(getopt -o hn: --long help,npvs:, -- "$@")
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
        -n | --npvs)
            N_WINDOWS="$2"
            if ! [[ $N_WINDOWS =~ ^[0-9]+$ ]]; then
                echo "Number of windows must be an integer"
                exit
            fi
            shift 2
            ;;
        --) shift; 
            break 
            ;;
    esac
done

if [ -z $N_WINDOWS ]; then
    N_WINDOWS=1
    echo "Number of windows not provided, defaulting to $N_WINDOWS"
fi

COUNT=0
URL=http://localhost:3000/performancePage
for ((i=0;i<$N_WINDOWS;i++))
do
    if (( $COUNT % 5 == 0)); then
      firefox -new-window $URL
      sleep 2
    else
      firefox --url $URL
    fi
    COUNT=$(( $COUNT + 1 ))
done
