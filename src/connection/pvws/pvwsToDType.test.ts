import { describe, it, expect, vi, beforeEach } from "vitest";
import base64js from "base64-js";
import { pvwsToDType } from "./pvwsToDType"; // Adjust path
import {
  AlarmQuality,
  newDAlarm,
  newDDisplay,
  newDRange,
  newDTime,
  newDType
} from "../../types/dtypes";

// Mock the dependencies
vi.mock("base64-js");
vi.mock("../../types/dtypes", () => ({
  AlarmQuality: {
    ALARM: "ALARM",
    WARNING: "WARNING",
    VALID: "VALID"
  },
  newDAlarm: vi.fn((quality, message) => ({ quality, message })),
  newDDisplay: vi.fn(config => ({ ...config })),
  newDRange: vi.fn((low, high) => ({ low, high })),
  newDTime: vi.fn(date => ({ date })),
  newDType: vi.fn((values, alarm, time, display, isPartial) => ({
    values,
    alarm,
    time,
    display,
    isPartial
  }))
}));

describe("pvwsToDType", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Alarm handling", () => {
    it("should create ALARM quality for MAJOR severity", () => {
      const data = { severity: "MAJOR", value: 10 };

      pvwsToDType(data);

      expect(newDAlarm).toHaveBeenCalledWith(AlarmQuality.ALARM, "");
    });

    it("should create WARNING quality for MINOR severity", () => {
      const data = { severity: "MINOR", value: 10 };

      pvwsToDType(data);

      expect(newDAlarm).toHaveBeenCalledWith(AlarmQuality.WARNING, "");
    });

    it("should create VALID quality for other severity values", () => {
      const data = { severity: "NONE", value: 10 };

      pvwsToDType(data);

      expect(newDAlarm).toHaveBeenCalledWith(AlarmQuality.VALID, "");
    });

    it("should not create alarm when severity is undefined", () => {
      const data = { value: 10 };

      pvwsToDType(data);

      expect(newDAlarm).not.toHaveBeenCalled();
    });
  });

  describe("Display configuration", () => {
    it("should create display with alarm range when provided", () => {
      const data = {
        value: 10,
        alarm_low: 0,
        alarm_high: 100
      };

      pvwsToDType(data);

      expect(newDRange).toHaveBeenCalledWith(0, 100);
      expect(newDDisplay).toHaveBeenCalledWith(
        expect.objectContaining({
          alarmRange: { low: 0, high: 100 }
        })
      );
    });

    it("should create display with warning range when provided", () => {
      const data = {
        value: 10,
        warn_low: 10,
        warn_high: 90
      };

      pvwsToDType(data);

      expect(newDRange).toHaveBeenCalledWith(10, 90);
      expect(newDDisplay).toHaveBeenCalledWith(
        expect.objectContaining({
          warningRange: { low: 10, high: 90 }
        })
      );
    });

    it("should include units and precision in display", () => {
      const data = {
        value: 10,
        units: "meters",
        precision: 2
      };

      pvwsToDType(data);

      expect(newDDisplay).toHaveBeenCalledWith(
        expect.objectContaining({
          units: "meters",
          precision: 2
        })
      );
    });

    it("should include choices when labels are provided", () => {
      const data = {
        value: 1,
        labels: ["OFF", "ON"]
      };

      pvwsToDType(data);

      expect(newDDisplay).toHaveBeenCalledWith(
        expect.objectContaining({
          choices: ["OFF", "ON"]
        })
      );
    });

    it("should set undefined fields correctly", () => {
      const data = { value: 10 };

      pvwsToDType(data);

      expect(newDDisplay).toHaveBeenCalledWith(
        expect.objectContaining({
          description: undefined,
          role: undefined,
          controlRange: undefined,
          alarmRange: undefined,
          warningRange: undefined,
          form: undefined,
          choices: undefined
        })
      );
    });
  });

  describe("Array value handling", () => {
    it("should decode b64int to Int32Array", () => {
      const mockByteArray = new Uint8Array([1, 0, 0, 0, 2, 0, 0, 0]);
      vi.mocked(base64js.toByteArray).mockReturnValue(mockByteArray);

      const data = { b64int: "AQAAAAIAAAA=" };

      pvwsToDType(data);

      expect(base64js.toByteArray).toHaveBeenCalledWith("AQAAAAIAAAA=");
      expect(newDType).toHaveBeenCalledWith(
        expect.objectContaining({
          arrayValue: expect.any(Int32Array)
        }),
        undefined,
        undefined,
        expect.any(Object),
        true
      );
    });

    it("should decode b64dbl to Float64Array", () => {
      const mockByteArray = new Uint8Array(16);
      vi.mocked(base64js.toByteArray).mockReturnValue(mockByteArray);

      const data = { b64dbl: "encoded_data" };

      pvwsToDType(data);

      expect(base64js.toByteArray).toHaveBeenCalledWith("encoded_data");
      expect(newDType).toHaveBeenCalledWith(
        expect.objectContaining({
          arrayValue: expect.any(Float64Array)
        }),
        undefined,
        undefined,
        expect.any(Object),
        true
      );
    });

    it("should decode b64flt to Float32Array", () => {
      const mockByteArray = new Uint8Array(8);
      vi.mocked(base64js.toByteArray).mockReturnValue(mockByteArray);

      const data = { b64flt: "encoded_data" };

      pvwsToDType(data);

      expect(base64js.toByteArray).toHaveBeenCalledWith("encoded_data");
      expect(newDType).toHaveBeenCalledWith(
        expect.objectContaining({
          arrayValue: expect.any(Float32Array)
        }),
        undefined,
        undefined,
        expect.any(Object),
        true
      );
    });

    it("should decode b64srt to Int16Array", () => {
      const mockByteArray = new Uint8Array(4);
      vi.mocked(base64js.toByteArray).mockReturnValue(mockByteArray);

      const data = { b64srt: "encoded_data" };

      pvwsToDType(data);

      expect(base64js.toByteArray).toHaveBeenCalledWith("encoded_data");
      expect(newDType).toHaveBeenCalledWith(
        expect.objectContaining({
          arrayValue: expect.any(Int16Array)
        }),
        undefined,
        undefined,
        expect.any(Object),
        true
      );
    });

    it("should decode b64byt to Int8Array", () => {
      const mockByteArray = new Uint8Array(2);
      vi.mocked(base64js.toByteArray).mockReturnValue(mockByteArray);

      const data = { b64byt: "encoded_data" };

      pvwsToDType(data);

      expect(base64js.toByteArray).toHaveBeenCalledWith("encoded_data");
      expect(newDType).toHaveBeenCalledWith(
        expect.objectContaining({
          arrayValue: expect.any(Int8Array)
        }),
        undefined,
        undefined,
        expect.any(Object),
        true
      );
    });

    it("should leave arrayValue undefined when no base64 data provided", () => {
      const data = { value: 10 };

      pvwsToDType(data);

      expect(base64js.toByteArray).not.toHaveBeenCalled();
      expect(newDType).toHaveBeenCalledWith(
        expect.objectContaining({
          arrayValue: undefined
        }),
        undefined,
        undefined,
        expect.any(Object),
        true
      );
    });
  });

  describe("Time handling", () => {
    it("should create DTime from seconds timestamp", () => {
      const data = { value: 10, seconds: 1609459200 }; // 2021-01-01 00:00:00 UTC

      pvwsToDType(data);

      expect(newDTime).toHaveBeenCalledWith(new Date(1609459200000));
    });

    it("should leave dtime undefined when seconds not provided", () => {
      const data = { value: 10 };

      pvwsToDType(data);

      expect(newDTime).not.toHaveBeenCalled();
    });
  });

  describe("String value handling", () => {
    it("should use text field as stringValue when provided", () => {
      const data = { text: "Hello World", value: 42 };

      pvwsToDType(data);

      expect(newDType).toHaveBeenCalledWith(
        expect.objectContaining({
          stringValue: "Hello World",
          doubleValue: 42
        }),
        undefined,
        undefined,
        expect.any(Object),
        true
      );
    });

    it("should convert value to string when text not provided", () => {
      const data = { value: 42.5 };

      pvwsToDType(data);

      expect(newDType).toHaveBeenCalledWith(
        expect.objectContaining({
          stringValue: "42.5",
          doubleValue: 42.5
        }),
        undefined,
        undefined,
        expect.any(Object),
        true
      );
    });

    it("should leave stringValue undefined when neither text nor value provided", () => {
      const data = {};

      pvwsToDType(data);

      expect(newDType).toHaveBeenCalledWith(
        expect.objectContaining({
          stringValue: undefined,
          doubleValue: undefined
        }),
        undefined,
        undefined,
        expect.any(Object),
        true
      );
    });
  });

  describe("Complete DType creation", () => {
    it("should always set isPartial to true", () => {
      const data = { value: 10 };

      pvwsToDType(data);

      const calls = vi.mocked(newDType).mock.calls;
      expect(calls[0][4]).toBe(true);
    });

    it("should create complete DType with all fields", () => {
      const mockByteArray = new Uint8Array([1, 0, 0, 0]);
      vi.mocked(base64js.toByteArray).mockReturnValue(mockByteArray);

      const data = {
        severity: "MAJOR",
        value: 42.5,
        text: "Test Value",
        b64int: "AQAAAA==",
        seconds: 1609459200,
        units: "volts",
        precision: 2,
        alarm_low: 0,
        alarm_high: 100,
        warn_low: 10,
        warn_high: 90,
        labels: ["Low", "High"]
      };

      pvwsToDType(data);

      expect(newDType).toHaveBeenCalledWith(
        {
          stringValue: "Test Value",
          doubleValue: 42.5,
          arrayValue: new Int32Array([1])
        },
        { quality: AlarmQuality.ALARM, message: "" },
        { date: new Date(1609459200000) },
        expect.objectContaining({
          units: "volts",
          precision: 2,
          alarmRange: { low: 0, high: 100 },
          warningRange: { low: 10, high: 90 },
          choices: ["Low", "High"]
        }),
        true
      );
    });
  });
});
