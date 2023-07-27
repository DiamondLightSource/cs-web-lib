#!/bin/bash

if [[ $# -eq 0 ]] ; then
    echo "No PID provided"
    exit 0
fi

PID="$1"

top -b -d 2 -p $PID | awk -v pid="$PID" '
    /^top -/{time = $3}
    $1+0>0 {printf "%s %s: CPU Usage: %d%%, Memory usage: %d MiB\n", \
            strftime("%Y-%m-%d"), time, $9, $6/1000
            }'
