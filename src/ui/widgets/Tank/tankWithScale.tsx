import React from "react";
import { Color, Font } from "../../../types";
import classes from "./tank.module.css";

export const TankWithScale = (props: {
  min: number;
  max: number;
  emptyColor: Color;
  fillColor: Color;
  foregroundColor: Color;
  backgroundColor: Color;
  font: Font | undefined;
  percent: number;
  width: number;
  outline: string;
  logScale: boolean;
}): JSX.Element => {
  const {
    min,
    max,
    emptyColor,
    fillColor,
    foregroundColor,
    backgroundColor,
    font,
    percent,
    width,
    outline,
    logScale
  } = props;
  return (
    <span
      className={classes.TankBackground}
      style={{
        backgroundColor: backgroundColor.toString(),
        outline: outline
      }}
    >
      <span
        id="maxMarker"
        className={classes.ScaleMarker}
        style={{
          top: "10%",
          color: foregroundColor.toString(),
          writingMode: "vertical-lr",
          scale: "-1",
          transform: "translateY(50%)",
          ...font?.css()
        }}
      >
        {logScale ? Number(max).toExponential(0) : Number(max).toFixed(1)}
      </span>
      <span
        className={classes.ScaleTick}
        style={{
          top: "10%"
        }}
      />
      <span
        className={classes.ScaleMarker}
        style={{
          top: "50%",
          color: foregroundColor.toString(),
          writingMode: "vertical-lr",
          scale: "-1",
          transform: "translateY(50%)",
          ...font?.css()
        }}
      >
        {logScale
          ? Number((max - min) / 2).toExponential(0)
          : Number((max - min) / 2).toFixed(1)}
      </span>
      <span
        className={classes.ScaleTick}
        style={{
          top: "50%"
        }}
      />
      <span
        className={classes.ScaleMarker}
        style={{
          top: "90%",
          color: foregroundColor.toString(),
          writingMode: "vertical-lr",
          scale: "-1",
          transform: "translateY(50%)",
          ...font?.css()
        }}
      >
        {logScale ? Number(min).toExponential(0) : Number(min).toFixed(1)}
      </span>
      <span
        className={classes.ScaleTick}
        style={{
          top: "90%"
        }}
      />
      <span
        className={classes.EmptyTank}
        style={{
          height: "80%",
          width: `${width - 30}px`,
          top: "10%",
          right: "0%",
          backgroundColor: emptyColor.toString()
        }}
      >
        <span
          className={classes.TankFill}
          style={{
            backgroundColor: fillColor.toString(),
            top: `${100 - percent}%`
          }}
        ></span>
      </span>
    </span>
  );
};
