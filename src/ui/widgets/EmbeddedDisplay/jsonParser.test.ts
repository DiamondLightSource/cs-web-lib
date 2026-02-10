import { Label } from "..";
import { parseJson } from "./jsonParser";
import { Font, FontStyle } from "../../../types/font";
import { BorderStyle, newBorder } from "../../../types/border";
import { PV } from "../../../types/pv";
import { WidgetDescription } from "../createComponent";
import {
  newAbsolutePosition,
  newRelativePosition
} from "../../../types/position";

const PREFIX = "prefix";

describe("json widget parser", (): void => {
  const displayString = `{
  "type": "display",
  "position": "relative",
  "overflow": "auto",
  "border": {
    "style": "line",
    "width": 3,
    "color": "red"
  },
  "font": {
    "size": "13",
    "style": "bold"
  }
}`;

  /* We need to import widgets to register them... */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const label = Label;

  it("parses a display widget", async (): Promise<void> => {
    const widget = await parseJson(displayString, "ca", PREFIX);
    expect((await widget).type).toEqual("display");
    // Position type
    expect(widget.position).toEqual(newRelativePosition());
    // Font type not present on Display widget.
    expect(widget.font).toBeUndefined();
  });

  const fontLabelString = `{
    "type": "display",
    "children": [
      {
        "type": "label",
        "position": "absolute",
        "x": "10",
        "y": "20",
        "width": "30",
        "height": "40",
        "font": {
          "size": 13,
          "style": "bold"
        }
      }
    ]
  }`;
  it("handles font and position on a label widget", async (): Promise<void> => {
    const widget = (await parseJson(fontLabelString, "ca", PREFIX))
      .children?.[0] as WidgetDescription;
    expect(widget.font).toEqual(new Font(13, FontStyle.Bold));
    expect(widget.position).toEqual(
      newAbsolutePosition("10", "20", "30", "40")
    );
  });
  const ruleString = `{
    "type": "display",
    "rules": [
      {
        "name": "border rule",
        "prop": "border",
        "outExp": false,
        "pvs": [
          {
            "pvName": "loc://rulepv",
            "trigger": true
          }
        ],
        "expressions": [
          {
            "boolExp": "pv0 > 0",
            "value": {
              "style": "line",
              "width": 1,
              "color": "red"
            }
          }
        ]
      }
    ]
  }`;
  it("handles a rule on a display widget", async (): Promise<void> => {
    const widget = await parseJson(ruleString, "ca", PREFIX);
    const rule = {
      name: "border rule",
      prop: "border",
      outExp: false,
      pvs: [
        {
          pvName: PV.parse("loc://rulepv"),
          trigger: true
        }
      ],
      expressions: [
        {
          boolExp: "pv0 > 0",
          value: {
            style: "line",
            width: 1,
            color: "red"
          },
          convertedValue: newBorder(
            BorderStyle.Line,
            widget.rules[0].expressions[0].convertedValue.color,
            1
          )
        }
      ]
    };
    expect(widget.rules[0]).toEqual(rule);
  });
});
