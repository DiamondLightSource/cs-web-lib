#!/bin/bash

Help()
{
    echo " ************************************************************************ "
    echo " Script to run create performance test EPICS .db file "

    echo " - Usage:"
    echo "       ./create_db.sh <options...>"
    echo "     options:"
    echo "      -h | --help:      display this help message"
    echo "      -n | --npvs:      [optional] number of PVs to create. If not "
    echo "                         provided then default is 1000."
    echo "      -r | --rate:      [optional] PV update rate. If not "
    echo "                         provided then default is 0.1 Hz."
    echo "                         Options: "
    echo "                                 '.1 second', '.2 second','1 second'  "
    echo "     E.g."
    echo "      ./create_db.sh -n 1000 -r '.1 second'"
    echo " ************************************************************************ "
}

# Parse command line options
VALID_ARGS=$(getopt -o hn:r: --long help,npvs:,rate:, -- "$@")
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
            N_PVS="$2"
            if ! [[ $N_PVS =~ ^[0-9]+$ ]]; then
                echo "Number of PVs must be an integer"
                exit
            fi
            shift 2
            ;;
        -r | --rate)
            RATE="$2"
            shift 2
            ;;
        --) shift; 
            break 
            ;;
    esac
done

if [ -z $N_PVS ]; then
    N_PVS=1000
    echo "Number of PVs not provided, defaulting to $N_PVS"
fi
if [[ -z $RATE ]]; then
    RATE=".1 second"
    echo "Rate no provided, defaulting to $RATE"
fi

# Setup: create db file for EPICS 
echo "-> Creating EPICS db with $N_PVS PVs"
echo "record(bo, "TEST:BO"){
    field(ZNAM, "Off")
    field(ONAM, "On")
}" >performanceTestDb.db
for ((i=0;i<$N_PVS;i++))
do
    record_name="TEST:REC$i"
    cat <<EOF
record(calcout, "$record_name")
{
    field(DESC, "Performance test record")
    field(SCAN, "$RATE")
    field(A, "0")
    field(CALC, "A == 0 ? 1 : 0")
    field(OUT, "$record_name.A")
}
EOF
done >>performanceTestDb.db
