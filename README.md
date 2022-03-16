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
To publish a new version of the @dls-controls/cs-web-lib package you must first have an npm account and be a member of the dls-controls organisation. Then:
1. Update the package version in package.json (follow the major.minor.patch versioning terminology).
2. Run the rollup command to package the library: `npm run rollup`.
3. Login to your npm account: `npm adduser`
4. Publish as a public-scoped packages: `npm publish --access public --registry=https://registry.npmjs.org`
