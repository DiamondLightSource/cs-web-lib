#!/bin/bash


N_PV_10Hz=10
N_PV_5Hz=50
N_PV_1Hz=250


Help()
{
    echo " ************************************************************************ "
    echo " Script to create the performance test BOB file "

    echo " - Usage:"
    echo "       ./create_example_bob.sh <options...>"
    echo "     options:"
    echo "      -h | --help:      display this help message"
    echo "      -n | --screen:    [optional] number of screens. Default is 1"
    echo "     E.g."
    echo "      ./create_example_bob.sh"
    echo "      ./create_example_bob.sh -n 2"
    echo " ************************************************************************ "
}

# Parse command line options
VALID_ARGS=$(getopt -o hs:n: --long help,start:nscreens:, -- "$@")
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


N_PVS=$(($N_PV_10Hz+$N_PV_5Hz+$N_PV_1Hz))
N_COLS=30

# Setup: create opi file for PVs
echo "-> Creating OPI filewith $N_PVS PVs"


for ((repeat=0;repeat<$N_SCREENS;repeat++))
do 
    echo "Creating repeat: $repeat"
    START=$(($N_PVS*$repeat))

    FILENAME="performanceTestPage$repeat.bob"
    JSON_FILE="public/performancePage$repeat.json"

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

# Add screen boilerplate
    echo '<?xml version="1.0" encoding="UTF-8"?>
<display version="2.0.0">
  <width>1300</width>
  <height>3000</height>
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
  </widget>' >$FILENAME

    HEIGHT=20 
    WIDTH=40
    YPOS=100
    XZERO=0
    COL_COUNT=0
      
    for ((i=0;i<$N_PVS;i++))
    do
        MARGIN=1
        if [[ $i -eq $(($N_PV_10Hz+$N_PV_5Hz)) ]]; then 
            YPOS=$(( $YPOS + ($HEIGHT+20) ))
            XPOS=$XZERO
            COL_COUNT=0
        elif [[ $i -eq $(($N_PV_10Hz)) ]]; then
            YPOS=$(( $YPOS + ($HEIGHT+20) ))
            XPOS=$XZERO
            COL_COUNT=0
        elif [[ $i -eq 0 ]]; then
            XPOS=$XZERO
        else 
	        if [[ $COL_COUNT -eq $(($N_COLS)) ]]; then
                    MARGIN=1
                    COL_COUNT=0
            	    YPOS=$(( $YPOS + ($HEIGHT+$MARGIN) ))
                  XPOS=$XZERO
                else
                    if [[ $COL_COUNT -eq $(($N_COLS/2)) ]]; then
                        MARGIN=20
                    fi
	            XPOS=$(( $XPOS + ($WIDTH+$MARGIN) ))
                fi
            fi
        COL_COUNT=$(( $COL_COUNT + 1 ))
        echo $COL_COUNT
        
	    index=$(($START+$i))
        record_name="TEST:REC$index"
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
        
    done >>$FILENAME

    YPOS=450

    echo '

    <widget type="xyplot" version="3.0.0">
    <name>XY Graph</name>
    <x>185</x>
    <y>'$YPOS'</y>
    <width>711</width>
    <title_font>
      <font name="Default Bold" family="Liberation Sans" style="BOLD" size="14.0">
      </font>
    </title_font>
    <show_toolbar>true</show_toolbar>
    <actions>
    </actions>
    <x_axis>
      <title>Primary X Axis (0)</title>
      <autoscale>true</autoscale>
      <log_scale>false</log_scale>
      <minimum>0.0</minimum>
      <maximum>200000.0</maximum>
      <show_grid>true</show_grid>
      <title_font>
        <font name="Default Bold" family="Liberation Sans" style="BOLD" size="14.0">
        </font>
      </title_font>
      <scale_font>
        <font name="Default" family="Liberation Sans" style="REGULAR" size="14.0">
        </font>
      </scale_font>
      <visible>true</visible>
    </x_axis>
    <y_axes>
      <y_axis>
        <title>Primary Y Axis (1)</title>
        <autoscale>true</autoscale>
        <log_scale>false</log_scale>
        <minimum>0.0</minimum>
        <maximum>100.0</maximum>
        <show_grid>true</show_grid>
        <title_font>
          <font name="Default Bold" family="Liberation Sans" style="BOLD" size="14.0">
          </font>
        </title_font>
        <scale_font>
          <font name="Default" family="Liberation Sans" style="REGULAR" size="14.0">
          </font>
        </scale_font>
        <on_right>false</on_right>
        <visible>true</visible>
        <color>
          <color name="Text" red="0" green="0" blue="0">
          </color>
        </color>
      </y_axis>
    </y_axes>
    <traces>
      <trace>
        <name>$(traces[0].y_pv)</name>
        <x_pv></x_pv>
        <y_pv>TEST:ARR'$repeat'</y_pv>
        <err_pv></err_pv>
        <axis>0</axis>
        <trace_type>1</trace_type>
        <color>
          <color red="21" green="21" blue="196">
          </color>
        </color>
        <line_width>1</line_width>
        <line_style>0</line_style>
        <point_type>0</point_type>
        <point_size>4</point_size>
        <visible>true</visible>
      </trace>
    </traces>
  </widget>
</display>' >>$FILENAME
done





