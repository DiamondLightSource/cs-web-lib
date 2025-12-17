# cs-web-lib
cs-web-lib is a React component library for EPICS Control Systems web applications, based off CSStudio Phoebus.

 - [Features](https://github.com/DiamondLightSource/cs-web-lib#Features)
 - [Installation](https://github.com/DiamondLightSource/cs-web-lib#Installation)
 - [Development](https://github.com/DiamondLightSource/cs-web-lib#Development)

## Features 

cs-web-lib does not contain the full suite of features and widgets provided by Phoebus. The tables below describes which features are currently included, are planned to be added, and which will not be added.

**Widgets**

| Category          | Widget            | Included | Reason              |
| :---------------- | :---------------: | :------: | :-----------------: |
| Graphics          | Arc               | &#9989;  |                     |
|                   | Ellipse           | &#9989;  |                     |
|                   | Label             | &#9989;  |                     |
|                   | Picture           | &#9989;  |                     |
|                   | Polygon           | &#9989;  |                     |
|                   | Polyline          | &#9989;  |                     |
|                   | Rectangle         | &#9989;  |                     |
| Monitors          | Byte Monitor      | &#9989;  |                     |
|                   | LED               | &#9989;  |                     |
|                   | Linear Meter      | &#9989;  |                     |
|                   | Multi State LED   | &#10060; | Add later           |
|                   | Meter             | &#9989;  |                     |
|                   | Progress Bar      | &#9989;  |                     |
|                   | Symbol            | &#9989;  |                     |
|                   | Table             | &#9989;  |                     |
|                   | Tank              | &#9989;  |                     |
|                   | Text Symbol       | &#10060; | Add later           |
|                   | Text Update       | &#9989;  |                     | 
|                   | Thermometer       | &#9989;  |                     |
| Controls          | Action Button     | &#9989;  |                     |
|                   | Boolean Button    | &#9989;  |                     |
|                   | Check Box         | &#9989;  |                     |
|                   | Choice Button     | &#9989;  |                     |
|                   | Combo Box         | &#9989;  |                     |
|                   | File Selector     | &#10060; | Add later           |
|                   | Radio Button      | &#9989;  |                     |
|                   | Scaled Slider     | &#9989;  |                     |
|                   | Scrollbar         | &#10060; | Add later           |
|                   | Slide Button      | &#10060; | Add later (date unknown, low priority) |
|                   | Spinner           | &#10060; | Add later (date unknown, low priority) |
|                   | Text Entry        | &#9989;  |                     |
|                   | Thumbwheel        | &#10060; | Add later (date unknown, low priority) |
| Plots             | Data Browser      | &#9989;  | Basic Implementation |
|                   | Image             | &#10060; | Unknown             |
|                   | Stripchart        | &#9989;  |                     |
|                   | XY Plot           | &#9989;  |                     |
| Structure         | Array             | &#10060; | Add later           |
|                   | Embedded Display  | &#9989;  |                     |
|                   | Group             | &#9989;  |                     |
|                   | Navigation Tabs   | &#9989;  |                     |
|                   | Tabs              | &#9989;  |                     |
|                   | Template/Instance | &#10060; | Unknown             |

**Methods**

| Widget      | Included | Reason                  |
| :---------: | :------: | :---------------------: |
| Actions     | &#9989;  | Some actions may not be supported. Please open an issue for any issues noticed. |
| Formulas    | &#9989;  | `sim://`, `eq://` and `loc://` PVs are supported. |
| Rules       | &#9989;  | Partial support. Please open an issue for any issues noticed.|
| Scripts     | &#10060; | Basic PoC for scripting is currently implemented, which works for background colour and position ONLY. |

## Installation

Install via npm:

`npm install @diamondlightsource/cs-web-lib`

To use cs-web-lib in a client project, you will need:
 - React 18
 - Vite 
 - A separate running instance of [PVWS](https://github.com/ornl-epics/pvws) 

**Configuring PVWS**

To make use of PVs in cs-web-lib widgets, you need to connect to PVWS. The basic configuration parameters for this will be loaded at runtime from a JSON file. This should be located somewhere accessible at runtime such as `/public` directory. The schema/structure of the configuration file is:

```
{
  PVWS_SOCKET: string
  PVWS_SSL: boolean,
  THROTTLE_PERIOD: integer
}
```

The configuration parameters are:

| Parameter | type | Description |
|- | -| - |
| PVWS_SOCKET | string | The fully qualified hostname and port of the instance of the PVWS web service |
| PVWS_SSL | boolean | If true use https, if false use http for connecting to the PVWS web service |
| THROTTLE_PERIOD | integer | The period in milliseconds between updates of the PV state variables |

At the root of your client app, create a `config.ts` file to load the config from this file.

```
import { CsWebLibConfig } from "@diamondlightsource/cs-web-lib";

export const loadConfig = async (): Promise<CsWebLibConfig> => {
  if (config) {
    return config;
  }

  try {
    // Point towards your file location
    const response = await fetch("/config/config.json");
    config = await response.json();
  } catch (error) {
    console.warn("Configuration not found falling back to defaults", error);
    // Set defaults here if necessary
    config = {
      PVWS_SOCKET: undefined,
      PVWS_SSL: undefined,
      THROTTLE_PERIOD: undefined
    };
  }

  return config as CsWebLibConfig;
};
```

The final step is to wrap your application in a Redux Provider and pass in the loaded config and cs-web-lib PV store. This allows your application to access the store which handles subscribing to PVs and storing updates to values.

```
import { store, CsWebLibConfig } from "@diamondlightsource/cs-web-lib";
import { Provider } from "react-redux";
import { loadConfig } from "./config";

function App({}) {
  const [config, setConfig] = useState<CsWebLibConfig | null>(null);
  useEffect(() => {
    loadConfig().then(config => {
      setConfig(config);
    });
  }, []);

  return (
    <Provider store={store(config)}>
        // Your app goes here
    </Provider>
  );
}

export default App;
```

Now you can use cs-web-lib to display .bob files and see updates to PV values.

**Displaying a .bob file**

To view a file in the client application, make use of the display components. These are:

 - **Embedded Display**
    This displays a single screen, passed in via a filepath.
    ```
    <EmbeddedDisplay
        file={{
          path: "/my/file.bob",
          defaultProtocol: "ca" // Or "pva",
          macros: {}
        }}
        position={new RelativePosition("0", "0", "100%", "100%")}
        scroll={false}
        resize={"scroll-content"}
      />

    ```
 - **Dynamic Page**
   This component allows dynamic loading of different files, using a FileContext to store which file is currently displayed. The application must be wrapped in the FileProvider to access this context. The executeAction function can be called to trigger changes in displayed files.
   ```
    import { FileProvider } from "@diamondlightsource/cs-web-lib";

    const INITIAL_SCREEN_STATE = {
        main: {
            path: "/my/file.bob",
            macros: {},
            defaultProtocol: "ca"
        }
    };

   function DemoDynamicPage() {
    const fileContext = useContext(FileContext);

    // Use executeAction to update the displayed file
    const handleClick = () => {
      executeAction(
        {
            type: "OPEN_PAGE",
            dynamicInfo: {
            name: "new",
            location: "main",
            description: undefined,
            file: {
                path: "/my/new_file.bob
                macros: {},
                defaultProtocol: "ca"
            }
          }
        },
        fileContext,
        undefined,
        {},
        "
      );
    };

    return (
        <FileProvider initialPageState={INITIAL_SCREEN_STATE}>
            <Button onClick={handleClick}>
            <DynamicPageWidget
                location={"main"}
                position={new RelativePosition()}
                scroll={false}
                showCloseButton={false}
            />
        </FileProvider>
        );
    }
   ```


**Using Standalone widgets**

cs-web-lib widgets can also be used independently of an Embedded Display or Dynamic Page widget, simply by treating them as any other React component. These must be initialised with a position, using either an `AbsolutePosition` or a `RelativePosition` object, and can be passed other properties.

## Development

**Install Node**

Install Node.js version 22+, if it is not already installed on your machine.

**Clone the repository**
```
git clone https://github.com/DiamondLightSource/cs-web-lib.git
```

**Install the dependencies, from the root folder of the repo run:**
```
npm ci
```

**To run the unit tests:**
```
npm run test
```

**To run the static analysis and code style checks:**
```
npm run all-checks
```

**To test your development version**

You can install a local version of cs-web-lib into a project to test out any changes:
```
npm run rollup
npm pack
cd <PROJECT_REPO_DIR>
npm install <CS_WEB_LIB_REPO_DIR>/cs-web-lib/diamondlightsource-cs-web-lib-*.*.*.tar.gz
```


### Publishing to NPM
**Workflow**
A GitHub workflow has been setup to automatically publish a new package version to the NPM registry on the push of a new tag. This should be used as the preferred method of release a new package.
1. Increment the package version in package.json
`npm version <major|minor|patch> -no-git-tag-version`

2. Commit and push this to GitHub:
```
git add package.json
git commit -m "..." package.json
git push <remote> <branch>
```

3. Create a new tag and push to GitHub
```
git tag -a vX.XX.xx -m "..."
git push tag <remote> vX.XX.xx 
```
This will trigger a job on GitHub to publish a new version of the cs-web-lib to NPM. Check that this job passes.

**Locally**
To publish a new version of the @diamondlightsource/cs-web-lib package you must first have an npm account and be a member of the DiamondLightSource organisation. Then:
1. Update the package version in package.json (follow the major.minor.patch versioning terminology).
2. Run the rollup command to package the library: `npm run rollup`.
3. Login to your npm account: `npm adduser`
4. Publish as a public-scoped packages: `npm publish --access public --registry=https://registry.npmjs.org`
