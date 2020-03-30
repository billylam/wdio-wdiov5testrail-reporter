# wdio-wdiov5testrail-reporter

TestRail reporter for version 5 of WebdriverIO

## Installation

`npm install wdio-wdiov5testrail-reporter --save-dev`

## Usage

### Add the following to wdio.conf

```
const testrailUtil = require('wdio-wdiov5testrail-reporter/lib');
```

```
  beforeSession: function (config, capabilities, specs) {
    testrailUtil.startup();
  },
```

```
  onComplete: (exitCode, conf, capabilities, results) => {
    testrailUtil.cleanup(conf); // This method returns the run id used
  },
```

```
  reporters: [
    ['wdiov5testrail', {
      domain: 'your domain',
      username: 'your testrail username',
      password: 'your testrail password (or api key)',
      projectId: your testrail project id,
      suiteId: (optional) your suite id for a multi-suite project,
      title: (optional) name of your test run,
      runId: (optional) specific run id to use if updating an old run instead of creating a new run,
      useLatestRunId: (optional) true if updating latest run id instead of creating a new run,
      version: (optional) version of api under test,
      closeTestRailRun: (optional) close test run in Test Rail (if not set to true, test run will stay open)
      skippedStatusId: (optional) A custom status id assigned to skipped tests.  If not assigned, skipped tests will be marked as status 4 (Retest)
    }],
  ],
```

### Prefix all test assertions you wish to map with the test number.
Include the letter C.
```
 it(`C123 Can load the page`, function() {}
```

## Acknowledgement
[@fijijavis]( https://github.com/fijijavis ) - his reporter provided a solution for compiling test results