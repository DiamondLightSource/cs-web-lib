# cs-web-lib
An npm library for Control Systems web applications

## Installation

:warning: cs-web-lib is **NOT** compatible with projects using create-react-app. Vite should be used instead.

Install via npm:
    `npm install @diamondlightsource/cs-web-lib`

We use React 18. cs-web-lib requires several environment variables to be set in order to connect to PVWS and fetch PV value updates.

  - `VITE_PVWS_SOCKET` - point to the server hosting the PVWS application.
  - `VITE_PVWS_SSL` - set this to false if running a local PVWS instance e.g. localhost:8080 without SSL, otherwise true

These should be provided in a .env file at the root of your project.

Inside your application, create a screen by passing a .opi, .bob or .json file to the EmbeddedDisplay widget. 

## Legacy Installation

PVWS was introduced in version 0.4.0. Versions prior to this used [Coniql](https://github.com/DiamondLightSource/coniql), and the .env variables used were `VITE_CONIQL_SOCKET` and `VITE_CONIQL_SSL`.

React 17 was supported until version  < 0.5.0.

## Features 

cs-web-lib does not contain the full suite of features and widgets provided by Phoebus. The tables below describes which features are currently included, are planned to be added, and which will not be added.

#### Widgets

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
|                   | Multi State LED   | &#10060; | Add later           |
|                   | Meter             | &#10060; | Add later (date unknown, low priority) |
|                   | Progress Bar      | &#9989;  |                     |
|                   | Symbol            | &#9989;  |                     |
|                   | Table             | &#9989;  |                     |
|                   | Tank              | &#10060; | Add later (date unknown, low priority) |
|                   | Text Symbol       | &#10060; | Add later           |
|                   | Text Update       | &#9989;  |                     | 
|                   | Thermometer       | &#10060; | Add later (date unknown, low priority) |
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
| Plots             | Data Browser      | &#10060; | Add later (date unknown, low priority) |
|                   | Image             | &#10060; | Unknown             |
|                   | Stripchart        | &#10060; | Unknown             |
|                   | XY Plot           | &#9989;  |                     |
| Structure         | Array             | &#10060; | Add later           |
|                   | Embedded Display  | &#9989;  |                     |
|                   | Group             | &#9989;  |                     |
|                   | Navigation Tabs   | &#9989;  |                     |
|                   | Tabs              | &#9989;  |                     |
|                   | Template/Instance | &#10060; | Unknown             |

#### Features

| Widget      | Included | Reason                  |
| :---------: | :------: | :---------------------: |
| Actions     | &#9989;  | Some actions may not be supported. Please open an issue for any issues noticed. |
| Formulas    | &#10060; | `sim://` PVs are supported, but not `eq://`. This will be added in future. |
| Rules       | &#9989;  | Partial support. x, y and Font rules are currently not supported. This will be added in future. Please open an issue for any issues noticed.|
| Scripts     | &#10060; | The use of scripting is recommended against in general by CSS Developers. Formulae should be able to handle most use cases.  |

## Development
To develop on the library code first clone this repo, install the npm package dependencies and then make changes:

    cd cs-web-lib/
    npm install

### Pushing changes
Before pushing any changes check that the update code conforms to the formatter checks and that the unit tests all pass:

    npm run all-checks
    npm run tests
    
If making changes to the build process, check that the package is built correctly with:

    npm run rollup
    npm pack

You can then install the generated tar.gz file into another project and check that all functionality expected is there.

### Publishing to NPM (PREFERRED METHOD)
A GitHub workflow has been setup to automatically publish a new package version to the NPM registry on the push of a new tag. This should be used as the preferred method of release a new package.
1. Update/increase the package version in package.json (see https://docs.npmjs.com/cli/v8/commands/npm-version for further details on this npm command):

        npm version <major|minor|patch> -no-git-tag-version
2. Commit and push this to GitHub:

        git add package.json
        git commit -m "..." package.json
        git push <remote> <branch>
3. Create a new tag and push to GitHub

        git tag -a vX.XX.xx -m "..."
        git push <remote> vX.XX.xx 
This will trigger a job on GitHub to publish a new version of the cs-web-lib to NPM. Check that this job passes.

### Publishing to NPM locally
To publish a new version of the @diamondlightsource/cs-web-lib package you must first have an npm account and be a member of the DiamondLightSource organisation. Then:
1. Update the package version in package.json (follow the major.minor.patch versioning terminology).
2. Run the rollup command to package the library: `npm run rollup`.
3. Login to your npm account: `npm adduser`
4. Publish as a public-scoped packages: `npm publish --access public --registry=https://registry.npmjs.org`
