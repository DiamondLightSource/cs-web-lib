#!/bin/bash


N_PV_10Hz=10
N_PV_5Hz=50
N_PV_1Hz=250
SHOW_PLOT=true

Help()
{
    echo " ************************************************************************ "
    echo " Script to create the performance test OPI file "

    echo " - Usage:"
    echo "       ./create_example_opi.sh <options...>"
    echo "     options:"
    echo "      -h | --help:      display this help message"
    echo "      -n | --screen:    [optional] number of screens. Default is 1"
    echo "     E.g."
    echo "      ./create_example_opi.sh"
    echo "      ./create_example_opi.sh -n 2"
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

    FILENAME="performanceTestPage$repeat.opi"
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
  <height>3000</height>
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
        
    done >>$FILENAME

     YPOS=450

if $SHOW_PLOT; then
      echo '
    <widget typeId="org.csstudio.opibuilder.widgets.xyGraph" version="1.0.0">
      <actions hook="false" hook_all="false" />
      <alarm_pulsing>false</alarm_pulsing>
      <axis_0_auto_scale>false</axis_0_auto_scale>
      <axis_0_auto_scale_threshold>0.0</axis_0_auto_scale_threshold>
      <axis_0_axis_color>
        <color red="0" green="0" blue="0" />
      </axis_0_axis_color>
      <axis_0_axis_title>Primary X Axis (0)</axis_0_axis_title>
      <axis_0_dash_grid_line>true</axis_0_dash_grid_line>
      <axis_0_grid_color>
        <color red="200" green="200" blue="200" />
      </axis_0_grid_color>
      <axis_0_log_scale>false</axis_0_log_scale>
      <axis_0_maximum>100.0</axis_0_maximum>
      <axis_0_minimum>0.0</axis_0_minimum>
      <axis_0_scale_font>
        <opifont.name fontName="Cantarell" height="11" style="0" pixels="false">Default</opifont.name>
      </axis_0_scale_font>
      <axis_0_scale_format></axis_0_scale_format>
      <axis_0_show_grid>true</axis_0_show_grid>
      <axis_0_time_format>0</axis_0_time_format>
      <axis_0_title_font>
        <opifont.name fontName="Cantarell" height="11" style="1" pixels="false">Default Bold</opifont.name>
      </axis_0_title_font>
      <axis_0_visible>true</axis_0_visible>
      <axis_1_auto_scale>true</axis_1_auto_scale>
      <axis_1_auto_scale_threshold>0.0</axis_1_auto_scale_threshold>
      <axis_1_axis_color>
        <color red="0" green="0" blue="0" />
      </axis_1_axis_color>
      <axis_1_axis_title>Primary Y Axis (1)</axis_1_axis_title>
      <axis_1_dash_grid_line>true</axis_1_dash_grid_line>
      <axis_1_grid_color>
        <color red="200" green="200" blue="200" />
      </axis_1_grid_color>
      <axis_1_log_scale>false</axis_1_log_scale>
      <axis_1_maximum>100.0</axis_1_maximum>
      <axis_1_minimum>0.0</axis_1_minimum>
      <axis_1_scale_font>
        <opifont.name fontName="Cantarell" height="11" style="0" pixels="false">Default</opifont.name>
      </axis_1_scale_font>
      <axis_1_scale_format></axis_1_scale_format>
      <axis_1_show_grid>true</axis_1_show_grid>
      <axis_1_time_format>0</axis_1_time_format>
      <axis_1_title_font>
        <opifont.name fontName="Cantarell" height="11" style="1" pixels="false">Default Bold</opifont.name>
      </axis_1_title_font>
      <axis_1_visible>true</axis_1_visible>
      <axis_count>2</axis_count>
      <backcolor_alarm_sensitive>false</backcolor_alarm_sensitive>
      <background_color>
        <color red="240" green="240" blue="240" />
      </background_color>
      <border_alarm_sensitive>true</border_alarm_sensitive>
      <border_color>
        <color red="0" green="128" blue="255" />
      </border_color>
      <border_style>0</border_style>
      <border_width>1</border_width>
      <enabled>true</enabled>
      <forecolor_alarm_sensitive>false</forecolor_alarm_sensitive>
      <foreground_color>
        <color red="0" green="0" blue="255" />
      </foreground_color>
      <height>300</height>
      <name>XY Graph</name>
      <plot_area_background_color>
        <color red="255" green="255" blue="255" />
      </plot_area_background_color>
      <pv_name>TEST:ARR'$repeat'</pv_name>
      <pv_value />
      <rules />
      <scale_options>
        <width_scalable>true</width_scalable>
        <height_scalable>true</height_scalable>
        <keep_wh_ratio>false</keep_wh_ratio>
      </scale_options>
      <scripts />
      <show_legend>true</show_legend>
      <show_plot_area_border>false</show_plot_area_border>
      <show_toolbar>true</show_toolbar>
      <title></title>
      <title_font>
        <opifont.name fontName="Cantarell" height="11" style="1" pixels="false">Default Bold</opifont.name>
      </title_font>
      <tooltip>$(trace_0_y_pv)
  $(trace_0_y_pv_value)</tooltip>
      <trace_0_anti_alias>true</trace_0_anti_alias>
      <trace_0_buffer_size>2000</trace_0_buffer_size>
      <trace_0_concatenate_data>false</trace_0_concatenate_data>
      <trace_0_line_width>1</trace_0_line_width>
      <trace_0_name>$(trace_0_y_pv)</trace_0_name>
      <trace_0_plot_mode>0</trace_0_plot_mode>
      <trace_0_point_size>4</trace_0_point_size>
      <trace_0_point_style>0</trace_0_point_style>
      <trace_0_trace_color>
        <color red="21" green="21" blue="196" />
      </trace_0_trace_color>
      <trace_0_trace_type>0</trace_0_trace_type>
      <trace_0_update_delay>100</trace_0_update_delay>
      <trace_0_update_mode>0</trace_0_update_mode>
      <trace_0_visible>true</trace_0_visible>
      <trace_0_x_axis_index>0</trace_0_x_axis_index>
      <trace_0_x_pv></trace_0_x_pv>
      <trace_0_x_pv_value />
      <trace_0_y_axis_index>1</trace_0_y_axis_index>
      <trace_0_y_pv>$(pv_name)</trace_0_y_pv>
      <trace_0_y_pv_value />
      <trace_count>1</trace_count>
      <transparent>false</transparent>
      <trigger_pv></trigger_pv>
      <trigger_pv_value />
      <visible>true</visible>
      <widget_type>XY Graph</widget_type>
      <width>711</width>
      <wuid>22a9b511:18a4ba4f815:-7e8a</wuid>
      <x>185</x>
      <y>'$YPOS'</y>
    </widget>
  </display>' >>$FILENAME
else
  echo '</display>' >>$FILENAME
fi
done



