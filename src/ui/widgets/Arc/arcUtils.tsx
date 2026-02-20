export function calculateArc(
  width: number,
  height: number,
  startAngle: number,
  totalAngle: number
) {
  const rx = Math.floor(width / 2);
  const ry = Math.floor(height / 2);

  // Need to split into two half arcs if full 360
  if (totalAngle === 360) {
    return [

    ].join(" ")
  }

  const start = polarToCartesian(rx, ry, startAngle);
  const end = polarToCartesian(
    rx,
    ry,
    totalAngle >= 0 ? startAngle + totalAngle : startAngle - totalAngle
  );

  const largeArcFlag = Math.abs(totalAngle) > 180 ? 1 : 0;
  const sweepFlag = totalAngle >= 0 ? 1 : 0;

  const edge = [
    " L",
    rx,
    ry,
    "L",
    start.x,
    start.y
  ].join(" ");

  const arc = totalAngle === 360 ? [
    "M",
    start.x,
    start.y,
    "A",
    rx,
    ry,
    0,
    largeArcFlag,
    sweepFlag,
    end.x,
    end.y,
  ].join(" ") :
  [
    "M",
    start.x,
    start.y,
    "A",
    rx,
    ry,
    0,
    largeArcFlag,
    sweepFlag,
    end.x,
    end.y,
  ].join(" ");

  return [arc, edge];
}

/**
 * Convert angles into x y positions on arc
 * @param rx x radius and centre position
 * @param ry y radius and centre position
 * @param angleInDegrees angle to use
 * @returns array of [x, y] coordinates
 */
function polarToCartesian(rx: number, ry: number, angleInDegrees: number) {
  const angleInRadians = (angleInDegrees * Math.PI) / 180.0;

  return {
    x: Math.floor(rx + rx * Math.cos(angleInRadians)),
    y: Math.floor(ry + ry * Math.sin(angleInRadians))
  };
}

/**
 * Determine whether to use fill or transparent prop
 * for filling Arc
 */
export function findFillOption(
  bobOpt: boolean | undefined,
  opiOpt: boolean | undefined
): boolean {
  if (bobOpt !== undefined) {
    // Return opposite of what value transparent has
    return !bobOpt;
  } else if (opiOpt !== undefined) {
    return opiOpt;
  }
  // If neither present, fill
  return true;
}
