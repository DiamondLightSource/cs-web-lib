import React from "react";
import { Color } from "../../../types";
import classes from "./tank.module.css";

export const TankWithoutScale = (props: {
  emptyColor: Color;
  fillColor: Color;
  backgroundColor: Color;
  percent: number;
  outline: string;
}): JSX.Element => {
  const { emptyColor, fillColor, backgroundColor, percent, outline } = props;
  return (
    <span
      className={classes.TankBackground}
      style={{
        backgroundColor: backgroundColor.toString(),
        outline: outline
      }}
    >
      <span
        className={classes.EmptyTank}
        style={{
          height: "100%",
          width: "100%",
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
