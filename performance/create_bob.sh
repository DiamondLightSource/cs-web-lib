#!/bin/bash

Help()
{
    echo " ************************************************************************ "
    echo " Script to create the performance test BOB file "

    echo " - Usage:"
    echo "       ./create_bob.sh <options...>"
    echo "     options:"
    echo "      -h | --help:      display this help message"
    echo "      -n | --npvs:      [optional] number of PVs to display. If not "
    echo "                         provided then default is 100."
    echo "      -s | --screens:   [optional] number of screens with unique PVs If not "
    echo "                         provided then default is 1."
    echo "     E.g."
    echo "      ./create_bob.sh -n 100"
    echo " ************************************************************************ "
}

# Parse command line options
VALID_ARGS=$(getopt -o hn:s: --long help,npvs:,screens:, -- "$@")
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
        -s | --screens)
            N_REPEATS="$2"
            shift 2
            ;;
        --) shift; 
            break 
            ;;
    esac
done

if [ -z $N_PVS ]; then
    N_PVS=100
    echo "Number of PVs not provided, defaulting to $N_PVS"
fi
if [ -z $N_REPEATS ]; then
    N_REPEATS=1
fi

N_COLS=20
N_ROWS=$(( ($N_PVS/$N_COLS) + 1 ))

for ((n=0;n<$N_REPEATS;n++))
do
    FILENAME="performanceTestPage.bob"
    JSON_FILE="public/performancePage.json"
    if [[ $n > 0 ]]; then
        FILENAME="performanceTestPage$n.bob"
        JSON_FILE="public/performancePage$n.json"
    fi

    # Create JSON file
    echo '
{
  "type": "flexcontainer",
  "position": "relative",
  "children": [
    {
      "type": "embeddedDisplay",
      "position": "relative",
      "margin": "10px",
      "file": {
        "path": "/'$FILENAME'",
        "macros": {},
        "defaultProtocol": "ca"
      }
    }
  ]
}
' >$JSON_FILE

    FILENAME="public/"$FILENAME

# Setup: create opi file for PVs
    echo "-> Creating BOB file with $N_PVS PVs"

# Add screen boilerplate
    echo '<?xml version="1.0" encoding="UTF-8"?>
<display version="2.0.0">
  <width>1300</width>
  <height>1500</height>
  <background_color>
    <color name="Canvas" red="200" green="200" blue="200">
    </color>
  </background_color>
  <actions>
  </actions>
  <grid_step_x>5</grid_step_x>
  <grid_step_y>5</grid_step_y>
  <widget type="label" version="2.0.0">
    <name>Label</name>
    <text>Performance Test Page - displaying '$N_PVS' PVs</text>
    <x>60</x>
    <width>700</width>
    <height>51</height>
    <font>
      <font name="Default Bold" family="Liberation Sans" style="BOLD" size="14.0">
      </font>
    </font>
    <vertical_alignment>1</vertical_alignment>
    <wrap_words>false</wrap_words>
    <actions>
    </actions>
    <border_color>
      <color red="0" green="128" blue="255">
      </color>
    </border_color>
  </widget>
  <widget type="label" version="2.0.0">
    <name>Label</name>
    <text>Test browser response:</text>
    <x>910</x>
    <y>13</y>
    <width>700</width>
    <height>51</height>
    <font>
      <font name="Default Bold" family="Liberation Sans" style="BOLD" size="14.0">
      </font>
    </font>
    <vertical_alignment>1</vertical_alignment>
    <wrap_words>false</wrap_words>
    <actions>
    </actions>
    <border_color>
      <color red="0" green="128" blue="255">
      </color>
    </border_color>
  </widget>' >$FILENAME

    HEIGHT=20 
    WIDTH=60
    YPOS=50
    XZERO=0
    COUNT=$(($N_PVS*$n))  
    for ((i=0;i<$N_ROWS;i++))
    do
        MARGIN=1
        if (( $i % 10 == 0 )); then
            MARGIN=10
        fi
        YPOS=$(( $YPOS + ($HEIGHT+$MARGIN) ))
        XPOS=XZERO
        for ((j=0;j<$N_COLS;j++))
        do
            if (( $COUNT >= $(($N_PVS*($n+1))) )); then 
                echo $COUNT
                break
            fi
            MARGIN=1
            if (( $j % 10 == 0 )); then
                MARGIN=10            
            fi
            XPOS=$(( $XPOS + ($WIDTH+$MARGIN) ))
            record_name="TEST:REC$COUNT"
            cat <<EOF
  <widget type="textupdate" version="2.0.0">
    <name>Text Update</name>
    <pv_name>$record_name</pv_name>
    <x>$XPOS</x>
    <y>$YPOS</y>
    <width>$WIDTH</width>
    <height>$HEIGHT</height>
    <font>
      <font name="Default Bold" family="Liberation Sans" style="BOLD" size="14.0">
      </font>
    </font>
    <foreground_color>
      <color name="Monitor: FG" red="96" green="255" blue="96">
      </color>
    </foreground_color>
    <background_color>
      <color name="Monitor: BG" red="64" green="64" blue="64">
      </color>
    </background_color>
    <horizontal_alignment>1</horizontal_alignment>
    <vertical_alignment>1</vertical_alignment>
    <wrap_words>false</wrap_words>
    <actions>
    </actions>
    <tooltip></tooltip>
    <border_alarm_sensitive>false</border_alarm_sensitive>
    <border_color>
      <color name="Black" red="0" green="0" blue="0">
      </color>
    </border_color>
  </widget>
EOF
            COUNT=$(( $COUNT + 1 ))
        done
    done >>$FILENAME

# Add a menu button to test browser response. Must come last as subscriptions happen in
# the order they appear in the OPI and we need TEST:REC0 to be first for performance
# debugging reasons
    echo '  <widget type="combo" version="2.0.0">
    <name>Menu Button</name>
    <pv_name>TEST:BO</pv_name>
    <x>1100</x>
    <y>25</y>
    <width>150</width>
    <background_color>
      <color red="240" green="240" blue="240">
      </color>
    </background_color>
    <border_alarm_sensitive>false</border_alarm_sensitive>
  </widget>
</display>' >>$FILENAME
done
