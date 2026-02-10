import { newPV, pvQualifiedName, PVUtils } from "./pv";

describe("PV", (): void => {
  it("parses a local PV correctly", (): void => {
    const pv = PVUtils.parse("loc://test", "ca");
    expect(pv).toEqual(newPV("test", "loc"));
  });
  it("ignores protocol if name contains one", (): void => {
    const pv = newPV("loc://test", "ca");
    expect(pvQualifiedName(pv)).toEqual("loc://test");
  });
  it("default protocol is applied", (): void => {
    const pv = PVUtils.parse("pvName");
    expect(pv).toEqual(newPV("pvName", "ca"));
  });
  it("ignores nested pv", (): void => {
    const pv = PVUtils.parse("=3+4*`sim://ramp`");
    expect(pvQualifiedName(pv)).toEqual("eq://3+4*`sim://ramp`");
  });
});
