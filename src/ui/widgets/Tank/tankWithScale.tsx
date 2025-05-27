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
        className={classes.ScaleMarker}
        style={{
          height: "30px",
          width: "100px",
          top: "10%",
          color: foregroundColor.toString(),
          transform: "rotate(-90deg) translateX(15px) translateY(-35px)",
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
          height: "30px",
          width: "100px",
          top: "50%",
          color: foregroundColor.toString(),
          transform: "rotate(-90deg) translateX(15px) translateY(-35px)",
          ...font?.css()
        }}
      >
        {logScale
          ? Number(max / 2).toExponential(0)
          : Number(max / 2).toFixed(1)}
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
          height: "30px",
          width: "100px",
          top: "90%",
          color: foregroundColor.toString(),
          transform: "rotate(-90deg) translateX(15px) translateY(-35px)",
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
