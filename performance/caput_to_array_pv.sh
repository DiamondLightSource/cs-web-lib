#!/bin/bash

VALID_ARGS=$(getopt -o n: --long nrepeats:, -- "$@")
if [[ $? -ne 0 ]]; then
    exit 1;
fi

eval set -- "$VALID_ARGS"
while [ : ]; do
    case "$1" in
        -n | --nrepeats)
            N_REPEATS="$2"
            shift 2
            ;;
        --) shift; 
            break 
            ;;
    esac
done

if [ -z $N_REPEATS ]; then
    N_REPEATS=1
fi

count=0
while [ true ]
do
    for ((i=0;i<$N_REPEATS;i++))
    do
        if [[ $count -eq 0 ]]; then
	    caput -at TEST:ARR$i 3000 1 0 1 0 1 0 1 0 1 0 1 0 1 0 1 0 1 0 1 0 1 0 1 0 1 0 1 0 1 0 1 0 1 0 1 0 1 0 1 0 1 0 1 0 1 0 1 0 1 0 1 0 1 0 1 0 1 0 1 0 1 0 1 0 1 0 1 0 1 0 1 0 1 0 1 0 1 0 1 0 1 0 1 0 1 0 1 0 1 0 1 0 1 0 1 0 1 0 1 0 > /dev/null >&1
        else
	    caput -at TEST:ARR$i 3000 0 1 0 1 0 1 0 1 0 1 0 1 0 1 0 1 0 1 0 1 0 1 0 1 0 1 0 1 0 1 0 1 0 1 0 1 0 1 0 1 0 1 0 1 0 1 0 1 0 1 0 1 0 1 0 1 0 1 0 1 0 1 0 1 0 1 0 1 0 1 0 1 0 1 0 1 0 1 0 1 0 1 0 1 0 1 0 1 0 1 0 1 0 1 0 1 0 1 0 1 > /dev/null >&1
        fi
    done
    if [[ $count -eq 0 ]]; then
        count=1    
    else
        count=0
    fi
    sleep 1
done

