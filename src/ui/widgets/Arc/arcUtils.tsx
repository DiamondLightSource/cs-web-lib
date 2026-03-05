export function calculateArc(
  width: number,
  height: number,
  startAngle: number,
  totalAngle: number,
  lineWidth: number
) {
  const rx = Math.floor(width / 2) - lineWidth / 2;
  const ry = Math.floor(height / 2) - lineWidth / 2;
  const cx = Math.floor(width / 2);
  const cy = Math.floor(height / 2);

  const isFullCircle = Math.abs(totalAngle) === 360;
  const start = polarToCartesian(rx, ry, cx, cy, startAngle);

  const sweepFlag = totalAngle >= 0 ? 1 : 0;
  let largeArcFlag = Math.abs(totalAngle) > 180 ? 1 : 0;

  // Cannot generate a full circle in a single command
  // So split into two 180 arcs
  if (isFullCircle) {
    const midAngle = startAngle + totalAngle / 2;
    const mid = polarToCartesian(rx, ry, cx, cy, midAngle);

    largeArcFlag = 1;

    const arc = [
      "M",
      start.x,
      start.y,
      "A",
      rx,
      ry,
      0,
      largeArcFlag,
      sweepFlag,
      mid.x,
      mid.y,
      "A",
      rx,
      ry,
      0,
      largeArcFlag,
      sweepFlag,
      start.x,
      start.y
    ].join(" ");

    const edge = [" L", rx, ry, "L", start.x, start.y].join(" ");

    return [arc, edge];
  }

  const end = polarToCartesian(rx, ry, cx, cy, startAngle + totalAngle);

  const edge = [" L", rx, ry, "L", start.x, start.y].join(" ");

  const arc = [
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
    end.y
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
export function polarToCartesian(
  rx: number,
  ry: number,
  cx: number,
  cy: number,
  angleInDegrees: number
) {
  const angleInRadians = (angleInDegrees * Math.PI) / 180.0;

  return {
    x: Math.floor(cx + rx * Math.cos(angleInRadians)),
    y: Math.floor(cy + ry * Math.sin(angleInRadians))
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
