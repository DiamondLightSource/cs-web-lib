#!/bin/bash

# Parameters
N_PV_10Hz=10
N_PV_5Hz=50
N_PV_1Hz=250


N_PVS=$(($N_PV_10Hz+$N_PV_5Hz+$N_PV_1Hz))


# Setup: create db file for EPICS 
echo "-> Creating EPICS db with $N_PVS PVs:"
echo "    $N_PV_10Hz @ 10Hz,"
echo "    $N_PV_5Hz @ 5Hz,"
echo "    $N_PV_1Hz @ 1Hz"

# Empty file
echo "" >performanceTestDbCustom.db


for ((i=0;i<$N_PVS;i++))
do
    record_name="TEST:REC$i"
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
record(waveform, "TEST:ARR0")
{
    field(DESC, "Performance test record")
    field(NELM,"3000")
    field(FTVL, "SHORT")

}' >>performanceTestDbCustom.db
