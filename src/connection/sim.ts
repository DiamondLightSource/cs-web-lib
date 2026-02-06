import log from "loglevel";
import {
  Connection,
  ConnectionState,
  ConnectionChangedCallback,
  ValueChangedCallback,
  nullConnCallback,
  nullValueCallback
} from "./plugin";
import { dtimeNow, DDisplay } from "../types/dtypes";
import {
  DType,
  dTypeCoerceDouble,
  dTypeGetDoubleValue,
  dTypeGetStringValue,
  newDType
} from "../types/dtypes/dType";
import {
  AlarmQuality,
  DAlarmMAJOR,
  DAlarmMINOR,
  DAlarmNONE,
  newDAlarm
} from "../types/dtypes/dAlarm";

type SimArgs = [
  string,
  ConnectionChangedCallback,
  ValueChangedCallback,
  number
];

abstract class SimPv {
  private onConnectionUpdate: ConnectionChangedCallback;
  private onValueUpdate: ValueChangedCallback;
  protected subscribed: boolean;
  public pvName: string;
  protected updateRate?: number;
  abstract getValue(): DType;
  public type: string | undefined;
  public constructor(
    pvName: string,
    onConnectionUpdate: ConnectionChangedCallback,
    onValueUpdate: ValueChangedCallback,
    updateRate?: number
  ) {
    this.pvName = pvName;
    this.onConnectionUpdate = onConnectionUpdate;
    this.onValueUpdate = onValueUpdate;
    this.updateRate = updateRate;
    this.publishConnection();
    this.subscribed = false;
  }

  public getConnection(): ConnectionState {
    return { isConnected: true, isReadonly: true };
  }

  public subscribe(): void {
    this.subscribed = true;
    this.publish();
  }

  public unsubscribe(): void {
    this.subscribed = false;
  }

  public publish(): void {
    if (this.subscribed) {
      this.onValueUpdate(this.pvName, this.getValue());
    }
  }

  public publishConnection(): void {
    this.onConnectionUpdate(this.pvName, this.getConnection());
  }

  public updateValue(_: DType): void {
    throw new Error(`Cannot set value on ${this.constructor.name}`);
  }

  protected maybeSetInterval(callback: () => void): void {
    if (this.updateRate !== undefined) {
      setInterval((): void => {
        callback();
      }, this.updateRate);
    }
  }
}

class SinePv extends SimPv {
  type = "VDouble";
  public constructor(...args: SimArgs) {
    super(...args);
    setInterval(this.publish.bind(this), this.updateRate);
  }

  public getValue(): DType {
    const val = Math.sin(
      new Date().getSeconds() + new Date().getMilliseconds() * 0.001
    );
    return newDType(
      { doubleValue: val },
      undefined,
      undefined,
      new DDisplay({
        units: "yoonits!"
      })
    );
  }
}

class SineArrayPv extends SimPv {
  type = "VDoubleArray";
  val: number[] = [];
  public constructor(...args: SimArgs) {
    super(...args);
    setInterval(this.publish.bind(this), this.updateRate);
  }

  public getValue(): DType {
    this.val.push(Math.sin(Date.now() * 0.001));
    if (this.val.length > 100) {
      this.val.shift();
    }
    return newDType({ arrayValue: Float64Array.from(this.val) });
  }
}

class RampPv extends SimPv {
  // Goes from 0-99 on a loop
  public constructor(...args: SimArgs) {
    super(...args);
    setInterval(this.publish.bind(this), this.updateRate);
  }

  public getValue(): DType {
    const d = new Date();
    const val =
      (d.getSeconds() % 10) * 10 + Math.floor(d.getMilliseconds() / 100);
    let rampAlarm = DAlarmNONE();
    if (val > 90 || val < 10) {
      rampAlarm = DAlarmMAJOR();
    } else if (val > 80 || val < 20) {
      rampAlarm = DAlarmMINOR();
    }
    return newDType({ doubleValue: val }, rampAlarm);
  }
}

class RandomPv extends SimPv {
  public constructor(...args: SimArgs) {
    super(...args);
    this.maybeSetInterval(this.publish.bind(this));
  }
  public getValue(): DType {
    return newDType({ doubleValue: Math.random() });
  }
}

class Disconnector extends SimPv {
  public constructor(...args: SimArgs) {
    super(...args);
    this.publish();
    this.maybeSetInterval(this.publishConnection.bind(this));
  }
  public getConnection(): ConnectionState {
    const randomBool = Math.random() >= 0.5;
    return { isConnected: randomBool, isReadonly: true };
  }

  public getValue(): DType {
    return newDType({ doubleValue: Math.random() });
  }
}

class SimEnumPv extends SimPv {
  type = "VEnum";
  private value: DType = newDType(
    { doubleValue: 0, stringValue: "one" },
    DAlarmNONE(),
    dtimeNow(),
    new DDisplay({ choices: ["one", "two", "three", "four"] })
  );
  public constructor(...args: SimArgs) {
    super(...args);
    this.publishConnection();
    this.publish();
    setInterval(this.publish.bind(this), this.updateRate);
  }
  public getValue(): DType {
    const newIndex = Math.floor(
      Math.random() * (this.value.display?.choices?.length || 0)
    );
    this.value = newDType(
      {
        doubleValue: newIndex,
        stringValue: (this.value.display?.choices as string[])[newIndex]
      },
      DAlarmNONE(),
      dtimeNow(),
      new DDisplay({
        choices: this.value.display?.choices
      })
    );
    return this.value;
  }
}

class EnumPv extends SimPv {
  type = "VEnum";
  private value: DType = newDType(
    { doubleValue: 0 },
    DAlarmNONE(),
    dtimeNow(),
    new DDisplay({ choices: ["one", "two", "three", "four"] })
  );

  public constructor(...args: SimArgs) {
    super(...args);
    this.publishConnection();
    setInterval(this.publish.bind(this), this.updateRate);
  }

  public getConnection(): ConnectionState {
    return { isConnected: true, isReadonly: false };
  }

  public updateValue(value: DType): void {
    // At the moment, if the value "0" arrived it won't be
    // interpreted as the index 0.
    const dval = dTypeGetDoubleValue(value);
    const sval = dTypeGetStringValue(value);
    // Allow updating choices?
    if (value.display?.choices) {
      this.value.display.choices = value.display.choices;
    }
    if (dval !== undefined && !isNaN(dval)) {
      // If it is a number, treat as index
      // Indexes outside the range to be ignored
      if (dval >= 0 && dval < (this.value.display?.choices?.length || 0)) {
        this.value.value.doubleValue = dval;
      }
    } else if (sval) {
      // If a string, see if that string is stored as a value in the enum
      // If it is, change index to index of the string
      // Otherwise ignore
      const valueIndex = this.value.display?.choices?.indexOf(sval);
      if (valueIndex !== -1) {
        this.value.value.doubleValue = valueIndex;
      }
    }
    this.publish();
  }

  public getValue(): DType {
    return this.value;
  }
}

class LocalPv extends SimPv {
  type = "VString";
  private value: DType;
  public constructor(...args: SimArgs) {
    super(...args);
    this.publishConnection();
    this.value = newDType({});
  }

  public getConnection(): ConnectionState {
    return { isConnected: true, isReadonly: false };
  }

  public getValue(): DType {
    return this.value;
  }

  public updateValue(value: DType): void {
    this.value = value;
    this.publish();
  }
}

class LimitData extends SimPv {
  type = "VDouble";
  private value: DType;
  // Class to provide PV value along with Alarm and Timestamp data
  // Initial limits will be 10, 20, 80 and 90 - with expected range between 0 and 100

  public constructor(...args: SimArgs) {
    super(...args);
    this.value = newDType({ doubleValue: 50 });
    this.publishConnection();
  }

  public getConnection(): ConnectionState {
    return { isConnected: true, isReadonly: false };
  }

  public updateValue(value: DType): void {
    // Set alarm status
    let alarmSeverity = AlarmQuality.VALID;
    const v = dTypeCoerceDouble(value);
    if (v !== undefined) {
      alarmSeverity =
        v < 10
          ? AlarmQuality.ALARM
          : v > 90
            ? AlarmQuality.ALARM
            : v < 20
              ? AlarmQuality.WARNING
              : v > 80
                ? AlarmQuality.WARNING
                : AlarmQuality.VALID;
      this.value = newDType(
        { doubleValue: v },
        newDAlarm(alarmSeverity, ""),
        dtimeNow()
      );
      this.publish();
    }
  }

  public getValue(): DType {
    return this.value;
  }
}

class FlipFlopPv extends SimPv {
  // Switches between true and false on a loop
  private value: DType = newDType({ doubleValue: 1 }, DAlarmNONE(), dtimeNow());

  public constructor(...args: SimArgs) {
    super(...args);
    setInterval(this.publish.bind(this), this.updateRate);
  }

  public getValue(): DType {
    let val = 1;
    if (this.value.value.doubleValue === 1) {
      val = 0;
    }
    this.value = newDType({ doubleValue: val });
    return this.value;
  }
}

class SimCache {
  private store: { [pvName: string]: SimPv | undefined };
  public constructor() {
    this.store = {};
  }
  public put(simPv: SimPv): void {
    this.store[simPv.pvName] = simPv;
  }
  public get(pvName: string): SimPv | undefined {
    return this.store[pvName];
  }
  public remove(pvName: string): void {
    delete this.store[pvName];
  }
}

export class SimulatorPlugin implements Connection {
  private simPvs: SimCache;
  private onConnectionUpdate: ConnectionChangedCallback;
  private onValueUpdate: ValueChangedCallback;
  private connected: boolean;

  public constructor(updateRate?: number) {
    this.simPvs = new SimCache();
    this.onConnectionUpdate = nullConnCallback;
    this.onValueUpdate = nullValueCallback;
    this.putPv = this.putPv.bind(this);
    this.connected = false;
  }

  public subscribe(pvName: string): string {
    const simulator = this.initSimulator(pvName);
    if (simulator !== undefined) {
      simulator.subscribe();
    }
    return (simulator && simulator.pvName) || pvName;
  }

  public connect(
    connectionCallback: ConnectionChangedCallback,
    valueCallback: ValueChangedCallback
  ): void {
    if (this.connected) {
      throw new Error("Can only connect once");
    }

    this.onConnectionUpdate = connectionCallback;
    this.onValueUpdate = valueCallback;
    this.connected = true;
  }

  public isConnected(): boolean {
    return this.onConnectionUpdate !== nullConnCallback;
  }

  public getDevice(device: string): void {
    log.info("getDevice not implemented on simulator");
  }

  public static parseName(pvName: string): {
    initialValue: any;
    protocol: string;
    keyName: string;
  } {
    const parts = pvName.split("#");
    let keyName;
    let protocol: string;
    let initial = undefined;
    if (pvName.startsWith("loc://")) {
      const matcher = new RegExp(
        "loc://([^<(]*)(?:<([^>]*)>)?(?:\\(([^)]*)\\))?"
      );
      const groups = matcher.exec(pvName);

      if (groups === null) {
        initial = undefined;
        keyName = pvName;
      } else if (groups[3] !== undefined) {
        const typeName = groups[2];
        initial = JSON.parse("[" + groups[3] + "]");
        keyName = "loc://" + groups[1];

        if (typeName === "VEnum") {
          initial = newDType(
            {
              doubleValue: initial[0] - 1
            },
            DAlarmNONE(),
            dtimeNow(),
            new DDisplay({ choices: initial.slice(1) })
          );
        } else if (initial.length === 1) {
          initial = newDType({ doubleValue: initial[0] });
        } else {
          initial = newDType({ arrayValue: initial });
        }
      } else {
        initial = undefined;
        keyName = pvName;
      }

      protocol = "loc://";
    } else {
      initial = undefined;
      keyName = pvName;
      protocol = parts[0];
    }
    return { initialValue: initial, protocol: protocol, keyName: keyName };
  }

  protected makeSimulator(
    pvName: string,
    onConnectionUpdate: ConnectionChangedCallback,
    onValueUpdate: ValueChangedCallback
  ): { simulator: SimPv | undefined; initialValue: any } {
    let cls;
    const nameInfo = SimulatorPlugin.parseName(pvName);
    let initial;
    // Default update rate.
    let updateRate = 500;

    if (nameInfo.protocol === "loc://") {
      cls = LocalPv;

      if (
        nameInfo.initialValue !== undefined &&
        nameInfo.initialValue.display?.choices
      ) {
        cls = EnumPv;
      }
      if (nameInfo.initialValue !== undefined) {
        initial = nameInfo.initialValue;
      } else {
        initial = newDType({ doubleValue: 0 });
      }
    } else if (nameInfo.protocol === "sim://disconnector") {
      cls = Disconnector;
      initial = undefined;
    } else if (nameInfo.protocol === "sim://sine") {
      cls = SinePv;
      initial = undefined;
    } else if (nameInfo.protocol === "sim://sinearray") {
      cls = SineArrayPv;
      initial = undefined;
    } else if (nameInfo.protocol === "sim://enum") {
      cls = SimEnumPv;
      initial = undefined;
    } else if (nameInfo.protocol === "sim://random") {
      initial = undefined;
      cls = RandomPv;
    } else if (nameInfo.protocol === "sim://limit") {
      initial = undefined;
      cls = LimitData;
    } else if (nameInfo.protocol === "sim://ramp") {
      initial = undefined;
      updateRate = 100;
      cls = RampPv;
    } else if (nameInfo.protocol.includes("sim://flipflop")) {
      // Get the time in sec specified between ()
      const match = nameInfo.protocol.match(/\((.*)\)/);
      // Default interval if not defined is 1 sec
      const intervalSecStr = match?.pop() || "1";
      updateRate = parseFloat(intervalSecStr) * 1000;
      initial = undefined;
      cls = FlipFlopPv;
    } else {
      return { simulator: undefined, initialValue: undefined };
    }
    const result = new cls(
      nameInfo.keyName,
      onConnectionUpdate,
      onValueUpdate,
      updateRate
    );
    return { simulator: result, initialValue: initial };
  }

  public initSimulator(pvName: string): SimPv | undefined {
    const nameInfo = SimulatorPlugin.parseName(pvName);

    if (this.simPvs.get(nameInfo.keyName) === undefined) {
      const simulatorInfo = this.makeSimulator(
        pvName,
        this.onConnectionUpdate,
        this.onValueUpdate
      );

      if (simulatorInfo.simulator) {
        this.simPvs.put(simulatorInfo.simulator);
      }

      if (simulatorInfo.initialValue !== undefined) {
        if (simulatorInfo.simulator !== undefined) {
          simulatorInfo.simulator.updateValue(simulatorInfo.initialValue);
        }
      }
    }

    return this.simPvs.get(nameInfo.keyName);
  }

  public putPv(pvName: string, value: DType): void {
    const pvSimulator = this.initSimulator(pvName);
    if (pvSimulator !== undefined) {
      pvSimulator.updateValue(value);
    } else {
      throw new Error(
        `Could not create a simulated process variable for ${pvName}`
      );
    }
  }

  public getValue(pvName: string): DType | undefined {
    const pvSimulator = this.initSimulator(pvName);
    return pvSimulator && pvSimulator.getValue();
  }

  public unsubscribe(pvName: string): void {
    log.debug(`Unsubscribing from ${pvName}.`);
    const simulator = this.simPvs.get(pvName);
    if (simulator) {
      if (simulator) {
        simulator.unsubscribe();
      }
    }
  }
}
