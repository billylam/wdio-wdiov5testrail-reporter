# wdio-wdiov5testrail-reporter

TestRail reporter for versions 5 and 6 of WebdriverIO

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
      // See below for additional options
    }],
  ],
```

### REQUIRED options
| Name | Description |
| --- | --- |
| domain | TestRail domain.  Do not include protocol. |
| username | TestRail username / email. |
| password | TestRail [API key](http://docs.gurock.com/testrail-api2/accessing#username_and_api_key). |
| projectId | TestRail project id. |

### OPTIONAL...  options
| Name | Description |
| --- | --- |
| suiteId | TestRail suite id.  Suite id for a multi-suite project  Mandatory in multi-suite projects.  Do not use in single-suite projects. |
| title | Title of test run (or plan) to create. |
| runId | TestRail run id.  Update a specific run instead of creating a new run.|
| useLatestRunId | true if updating latest run id instead of creating a new run.  Defaults to false.|
| version | Version tested, if required by TestRail instance. |
| createTestPlan | If true, creates a test plan to which runs are added.  Runs within are appended with the browser name. |
| includeAll | true to include all tests in run, regardless of whether actually run by Webdriver.io.  Defaults to true. |
| strictCaseMatching | false to NOT throw an error if a test case found is not apart of the suite.  Defaults to true. |
| skippedStatusId | A custom status id assigned to skipped tests.  If not assigned, skipped tests will be marked as status 4. |
| closeTestRailRun | true to close test run in Test Rail after tests are complete.  Defaults to false. | 
| casesFieldFilter | A {key:value} object to filter cases added to the test run, e.g. {'priority_id': 1, 'type_id': 2}. Values should be taken from TestRails. Running with empty value or with missing `closeTestRailRun` option will return a full list of cases |

### Prefix all test assertions you wish to map with the test number.
Include the letter C.
```
 it(`C123 Can load the page`, function() {}
```

### (optional) Add additional logging with addTestRailComment

```
const { addTestRailComment } = require('wdio-wdiov5testrail-reporter').default;
```

```
addTestRailComment('Will be added to test comment in TestRail');
```

## Acknowledgement
[@fijijavis]( https://github.com/fijijavis ) - his reporter provided a solution for compiling test results