export interface PV {
  name: string;
  protocol: string;
}

export const newPV = (name: string, protocol?: string) => ({
  name,
  protocol: protocol ?? PVUtils.defaultProtocol
});

export class PVUtils {
  public static DELIMITER = "://";
  public static defaultProtocol = "ca";

  /**
   * Creates a new PV object with the protocol extracted if present
   * on pvName else the default protocol is used
   * @param pvName
   * @param defaultProtocol
   * @returns PV object
   * @example PV.parse("protocol://pvName")
   * PV.parse("pvName", "protocol")
   * PV.parse("pvName")
   */
  public static parse(pvName: string, defaultProtocol = "ca"): PV {
    if (pvName.startsWith("=")) {
      return newPV(pvName.slice(1), "eq");
    }
    if (pvName.includes(PVUtils.DELIMITER)) {
      // "protocol://name" -> ["protocol://name", "protocol", "name"]
      const parts = /^(.*):\/\/(.*)$/.exec(pvName);
      if (parts) {
        return newPV(parts[2], parts[1]);
      }
      return newPV(pvName, defaultProtocol);
    } else {
      return newPV(pvName, defaultProtocol);
    }
  }
}

/**
 * Create qualifiedName from properties on PV
 * @returns protocol://name
 * @example const pv = newPV("name", "loc")
 * pv.qualifiedName() -> "loc://name"
 */
export const pvQualifiedName = (pv: PV): string => {
  // This can happen if the name is substituted by a macro
  // after the PV object has been created.
  // Need to make sure that the PV.DELIMITER is not associated with a nested PV.
  if (
    pv.name.includes(PVUtils.DELIMITER) &&
    !pv.name.includes("`") &&
    !pv.name.includes("'")
  ) {
    return pv.name;
    // In case the name has been substituted with another formula
  } else if (pv.name.startsWith("eq://")) {
    return pv.name;
  } else if (pv.name.startsWith("=")) {
    return pv.name.replace("=", "eq://");
  } else {
    return `${pv.protocol}${PVUtils.DELIMITER}${pv.name}`;
  }
};
