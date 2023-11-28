#!/bin/bash

# Parameters
N_PV_10Hz=10
N_PV_5Hz=50
N_PV_1Hz=250


Help()
{
    echo " ************************************************************************ "
    echo " Script to run create performance test EPICS .db file "

    echo " - Usage:"
    echo "       ./create_example_db.sh <options...>"
    echo "     options:"
    echo "      -h | --help:      display this help message"
    echo "      -n | --nrepeats: [optional] number of repeats. If not "
    echo "                         provided then default is 1."
    echo "     E.g."
    echo "      ./create_example_db.sh"
    echo "      ./create_example_db.sh -n 2"
    echo " ************************************************************************ "
}

VALID_ARGS=$(getopt -o hn: --long help,nrepeats:, -- "$@")
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

N_PVS=$(($N_PV_10Hz+$N_PV_5Hz+$N_PV_1Hz))

# Setup: create db file for EPICS 
echo "-> Creating EPICS db with $N_PVS PVs:"
echo "    $N_PV_10Hz @ 10Hz,"
echo "    $N_PV_5Hz @ 5Hz,"
echo "    $N_PV_1Hz @ 1Hz"


# Empty file
echo "" >performanceTestDbCustom.db

for ((repeat=0;repeat<$N_REPEATS;repeat++))
do 
    echo "Creating repeat: $repeat"
    START=$(($N_PVS*$repeat))

    for ((i=0;i<$N_PVS;i++))
    do
        index=$(($START+$i))
        record_name="TEST:REC$index"
        RATE=".1 second"
        
        if [[ $i -ge $(($N_PV_10Hz+$N_PV_5Hz)) ]]; then 
            RATE="1 second"
        elif [[ $i -ge $(($N_PV_10Hz)) ]]; then
            RATE=".5 second"
        fi
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
    done >>performanceTestDbCustom.db

    echo '
record(waveform, "TEST:ARR'$repeat'")
{
    field(DESC, "Performance test record")
    field(NELM,"3000")
    field(FTVL, "SHORT")
}' >>performanceTestDbCustom.db
done
