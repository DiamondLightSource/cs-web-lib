#!/bin/bash

Help()
{
    echo " ************************************************************************ "
    echo " Script to create the performance test OPI file "

    echo " - Usage:"
    echo "       ./create_opi.sh <options...>"
    echo "     options:"
    echo "      -h | --help:      display this help message"
    echo "      -n | --npvs:      [optional] number of PVs to display. If not "
    echo "                         provided then default is 100."
    echo "     E.g."
    echo "      ./create_opi.sh -n 100"
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
    FILENAME="performanceTestPage.opi"
    JSON_FILE="public/performancePage.json"
    if [[ $n > 0 ]]; then
        FILENAME="performanceTestPage$n.opi"
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
    echo "-> Creating OPI filewith $N_PVS PVs"

# Add screen boilerplate
    echo '<?xml version="1.0" encoding="UTF-8"?>
<display typeId="org.csstudio.opibuilder.Display" version="1.0.0">
  <actions hook="false" hook_all="false" />
    <auto_scale_widgets>
      <auto_scale_widgets>false</auto_scale_widgets>
      <min_width>-1</min_width>
      <min_height>-1</min_height>
    </auto_scale_widgets>  
  <auto_zoom_to_fit_all>false</auto_zoom_to_fit_all>
  <background_color>
    <color name="Canvas" red="200" green="200" blue="200" />
  </background_color>  <boy_version>5.1.0</boy_version>
  <foreground_color>
    <color red="192" green="192" blue="192" />
  </foreground_color>
  <grid_space>5</grid_space>
  <height>1500</height>
  <macros>
    <include_parent_macros>true</include_parent_macros>
  </macros>
  <name></name>
  <rules />
  <scripts />
  <show_close_button>true</show_close_button>
  <show_edit_range>true</show_edit_range>
  <show_grid>true</show_grid>
  <show_ruler>true</show_ruler>
  <snap_to_geometry>true</snap_to_geometry>
  <widget_type>Display</widget_type>
  <width>1300</width>
  <wuid>-ce4904c:14ae2b12720:-7dc6</wuid>
  <x>0</x>
  <y>0</y>
  <widget typeId="org.csstudio.opibuilder.widgets.Label" version="1.0.0">
    <actions hook="false" hook_all="false" />
    <auto_size>false</auto_size>
    <background_color>
      <color red="255" green="255" blue="255" />
    </background_color>
    <border_color>
      <color red="0" green="128" blue="255" />
    </border_color>
    <border_style>0</border_style>
    <border_width>1</border_width>
    <enabled>true</enabled>
    <font>
      <opifont.name fontName="Cantarell" height="25" style="1" pixels="false">Default Bold</opifont.name>
    </font>
    <foreground_color>
      <color red="0" green="0" blue="0" />
    </foreground_color>
    <height>51</height>
    <horizontal_alignment>0</horizontal_alignment>
    <name>Label</name>
    <rules />
    <scale_options>
      <width_scalable>true</width_scalable>
      <height_scalable>true</height_scalable>
      <keep_wh_ratio>false</keep_wh_ratio>
    </scale_options>
    <scripts />
    <text>Performance Test Page - displaying '$N_PVS' PVs</text>
    <tooltip></tooltip>
    <transparent>true</transparent>
    <vertical_alignment>1</vertical_alignment>
    <visible>true</visible>
    <widget_type>Label</widget_type>
    <width>700</width>
    <wrap_words>false</wrap_words>
    <wuid>-191a3662:18968ec162f:-7fc5</wuid>
    <x>60</x>
    <y>0</y>
  </widget>
  <widget typeId="org.csstudio.opibuilder.widgets.Label" version="1.0.0">
    <actions hook="false" hook_all="false" />
    <auto_size>false</auto_size>
    <background_color>
      <color red="255" green="255" blue="255" />
    </background_color>
    <border_color>
      <color red="0" green="128" blue="255" />
    </border_color>
    <border_style>0</border_style>
    <border_width>1</border_width>
    <enabled>true</enabled>
    <font>
      <opifont.name fontName="Cantarell" height="16" style="1" pixels="false">Default Bold</opifont.name>
    </font>
    <foreground_color>
      <color red="0" green="0" blue="0" />
    </foreground_color>
    <height>51</height>
    <horizontal_alignment>0</horizontal_alignment>
    <name>Label</name>
    <rules />
    <scale_options>
      <width_scalable>true</width_scalable>
      <height_scalable>true</height_scalable>
      <keep_wh_ratio>false</keep_wh_ratio>
    </scale_options>
    <scripts />
    <text>Test browser response:</text>
    <tooltip></tooltip>
    <transparent>true</transparent>
    <vertical_alignment>1</vertical_alignment>
    <visible>true</visible>
    <widget_type>Label</widget_type>
    <width>700</width>
    <wrap_words>false</wrap_words>
    <wuid>-191a3662:18968ec162f:-7fc5</wuid>
    <x>910</x>
    <y>13</y>
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
  <widget typeId="org.csstudio.opibuilder.widgets.TextUpdate" version="1.0.0">
    <actions hook="false" hook_all="false" />
    <alarm_pulsing>false</alarm_pulsing>
    <auto_size>false</auto_size>
    <backcolor_alarm_sensitive>false</backcolor_alarm_sensitive>
    <background_color>
      <color name="Monitor: BG" red="64" green="64" blue="64" />
    </background_color>
    <border_alarm_sensitive>false</border_alarm_sensitive>
    <border_color>
      <color name="Black" red="0" green="0" blue="0" />
    </border_color><border_style>0</border_style>
    <border_width>0</border_width>
    <enabled>true</enabled>
    <font>
      <opifont.name fontName="Liberation Sans" height="15" style="1" pixels="true">Default Bold</opifont.name>
    </font>
    <forecolor_alarm_sensitive>true</forecolor_alarm_sensitive>
    <foreground_color>
      <color name="Monitor: FG" red="96" green="255" blue="96" />
    </foreground_color>
    <format_type>0</format_type>
    <height>$HEIGHT</height>
    <horizontal_alignment>1</horizontal_alignment>
    <name>Text Update</name>
    <precision>1</precision>
    <precision_from_pv>true</precision_from_pv>
    <pv_name>$record_name</pv_name>
    <pv_value />
    <rotation_angle>0.0</rotation_angle>
    <rules />
    <scale_options>
      <width_scalable>true</width_scalable>
      <height_scalable>true</height_scalable>
      <keep_wh_ratio>false</keep_wh_ratio>
    </scale_options>
    <scripts />
    <show_units>true</show_units>
    <text>######</text>
    <tooltip></tooltip>
    <transparent>false</transparent>
    <vertical_alignment>1</vertical_alignment>
    <visible>true</visible>
    <widget_type>Text Update</widget_type>
    <width>$WIDTH</width>
    <wrap_words>false</wrap_words>
    <wuid>7d5403a8:180b3a7485e:-7fc6</wuid>
    <x>$XPOS</x>
    <y>$YPOS</y>  
  </widget>
EOF
            COUNT=$(( $COUNT + 1 ))
        done
    done >>$FILENAME

# Add a menu button to test browser response. Must come last as subscriptions happen in
# the order they appear in the OPI and we need TEST:REC0 to be first for performance
# debugging reasons
    echo '  <widget typeId="org.csstudio.opibuilder.widgets.MenuButton" version="1.0.0">
    <actions_from_pv>true</actions_from_pv>
    <alarm_pulsing>false</alarm_pulsing>
    <backcolor_alarm_sensitive>false</backcolor_alarm_sensitive>
    <background_color>
      <color red="240" green="240" blue="240" />
    </background_color>
    <border_alarm_sensitive>false</border_alarm_sensitive>
    <border_color>
      <color red="0" green="128" blue="255" />
    </border_color>
    <border_style>6</border_style>
    <border_width>1</border_width>
    <enabled>true</enabled>
    <font>
      <opifont.name fontName="Cantarell" height="11" style="0" pixels="false">Default</opifont.name>
    </font>
    <forecolor_alarm_sensitive>false</forecolor_alarm_sensitive>
    <foreground_color>
      <color red="0" green="0" blue="0" />
    </foreground_color>
    <height>30</height>
    <label>Select</label>
    <name>Menu Button</name>
    <pv_name>TEST:BO</pv_name>
    <pv_value />
    <rules />
    <scale_options>
      <width_scalable>true</width_scalable>
      <height_scalable>true</height_scalable>
      <keep_wh_ratio>false</keep_wh_ratio>
    </scale_options>
    <scripts />
    <show_down_arrow>true</show_down_arrow>
    <tooltip>$(pv_name)
$(pv_value)</tooltip>
    <transparent>false</transparent>
    <visible>true</visible>
    <widget_type>Menu Button</widget_type>
    <width>150</width>
    <wuid>6e45b1be:189b636fed5:-7d76</wuid>
    <x>1100</x>
    <y>25</y>
  </widget>
</display>' >>$FILENAME
done
