#!/bin/bash

Help()
{
    echo " ************************************************************************ "
    echo " Script to open multiple firefox windos "
    echo " - Usage:"
    echo "       ./start_browser.sh <options...>"
    echo "     options:"
    echo "      -h | --help:      display this help message"
    echo "      -w | --windows:   [optional] number of browser windows to open. If "
    echo "                         not provided then default is 1."
    echo "      -t | --tabs:      [optional] number of tabs to open in a single  "
    echo "                         window. If not provided then default is 1."
    echo " ************************************************************************ "
}

# Parse command line options
VALID_ARGS=$(getopt -o hw:t:s: --long help,windows:tabs:,screens:, -- "$@")
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
        -w | --windows)
            N_WINDOWS="$2"
            if ! [[ $N_WINDOWS =~ ^[0-9]+$ ]]; then
                echo "Number of windows must be an integer"
                exit
            fi
            shift 2
            ;;
        -t | --tabs)
            N_TABS="$2"
            if ! [[ $N_TABS =~ ^[0-9]+$ ]]; then
                echo "Number of tabs must be an integer"
                exit
            fi
            shift 2
            ;;
        -s | --screens)
            N_SCREENS="$2"
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
if [ -z $N_TABS ]; then
    N_TABS=1
    echo "Number of tabs not provided, defaulting to $N_TABS"
fi
if [ -z $N_SCREENS ]; then
    N_SCREENS=1
fi


URL=http://localhost:3000/performancePage
for ((i=0;i<$N_WINDOWS;i++))
do
    if [[ $N_SCREENS > 1 ]] && [[ $i > 0 ]]; then
        URL=http://localhost:3000/performancePage$i
    fi
    firefox -new-window $URL
    sleep 0.5
    for ((j=1;j<$N_TABS;j++))
    do
        firefox --url $URL
    done
done
