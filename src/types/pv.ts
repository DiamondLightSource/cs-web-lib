export class PV {
  public static DELIMITER = "://";
  public name: string;
  public protocol = "ca";

  public constructor(name: string, protocol?: string) {
    this.name = name;

    // default protocol of "ca" so only change if protocol is
    // passed in
    if (protocol !== undefined) {
      this.protocol = protocol;
    }
  }

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
      return new PV(pvName.slice(1), "eq");
    }
    if (pvName.includes(PV.DELIMITER)) {
      // "protocol://name" -> ["protocol://name", "protocol", "name"]
      const parts = /^(.*):\/\/(.*)$/.exec(pvName);
      if (parts) {
        return new PV(parts[2], parts[1]);
      }
      return new PV(pvName, defaultProtocol);
    } else {
      return new PV(pvName, defaultProtocol);
    }
  }

  /**
   * Create qualifiedName from properties on PV
   * @returns protocol://name
   * @example const pv = new PV("name", "loc")
   * pv.qualifiedName() -> "loc://name"
   */
  public qualifiedName(): string {
    // This can happen if the name is substituted by a macro
    // after the PV object has been created.
    // Need to make sure that the PV.DELIMITER is not associated with a nested PV.
    if (
      this.name.includes(PV.DELIMITER) &&
      !this.name.includes("`") &&
      !this.name.includes("'")
    ) {
      return this.name;
      // In case the name has been substituted with another formula
    } else if (this.name.startsWith("eq://")) {
      return this.name;
    } else if (this.name.startsWith("=")) {
      return this.name.replace("=", "eq://");
    } else {
      return `${this.protocol}${PV.DELIMITER}${this.name}`;
    }
  }

  /**
   * Wrapper function for qualifiedName
   */
  public toString(): string {
    return this.qualifiedName();
  }
}
