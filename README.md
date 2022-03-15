# cs-web-lib
An npm library for Control Systems web applications

## Installation
Install via npm:
    `npm install @dls-controls/cs-web-lib`
    
## Development
To develop on the library code first clone this repo, install the npm package dependencies and then make changes:

    cd cs-web-lib/
    npm install

### Pushing changes
Before pushing any changes check that the update code conforms to the formatter checks and that the unit tests all pass:

    npm run all-checks
    npm run tests
    
### Publishing to npm
To publish a new version of the @dls-controls/cs-web-lib package you must first have an npm account and be a member of the dls-controls organisation. Then:
1. Update the package version in package.json (follow the major.minor.patch versioning terminology).
2. Run the rollup command to package the library: `npm run rollup`.
3. Login to your npm account: `npm adduser`
4. Publish as a public-scoped packages: `npm publish --access public --registry=https://registry.npmjs.org`
