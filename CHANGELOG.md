### 1.0.34 (2022-06-30)

* Merge PR to filter included tests

### 1.0.33 (2022-06-30)

* Fix error output if no test cases are found

### 1.0.32 (2022-05-19)

* Fix bug with previous version (uniquely identify case with wdio uid, cid, as well as TestRail case_id)

### 1.0.31 (2022-05-18)

* Handle wdio retries

### 1.0.30 (2021-11-17)

* Fix bug with useLatestRunId

### 1.0.29 (2021-09-22)

* Handle change to TestRail bulk api return cap

### 1.0.28 (2021-09-21)

* Handle change to get_cases return data shape.  Also, refactor and move testrail api calls to own class.

### 1.0.27 (2021-08-13)

* Dependency update

### 1.0.26 (2021-07-08)

* Dependency update

### 1.0.25 (2021-05-11)

* Dependency update
### 1.0.24 (2020-12-01)

* Option to create test plans

### 1.0.23 (2020-07-16)

* Dependency update

### 1.0.22 (2020-07-07)

* Fix issue with some skipped tests

### 1.0.21 (2020-06-15)

* Use seconds instead of milliseconds

### 1.0.20 (2020-05-26)

* Ignore non-json files in ./testrailResults (e.g. .DS_Store)

### 1.0.18 (2020-05-21)

* Fix a bug where logging is repeating for subsequent tests in single describe block.

### 1.0.17 (2020-05-20)

* Add stack trace to TestRail comment for failing tests
* Allow method for adding to additional logging to TestRail comment

### 1.0.16 (2020-04-11)

* Allow include all option
* Allow loose test case matching (report generated even if some test case ids don't match)
* Allow multiple tests to be mapped to one case id

### 1.0.14 (2020-03-30)

* Allow custom skipped status ids

### 1.0.12 (2020-03-25)

* Merge PR for closeTestRailRun option (Thanks [@nemanjajeremic](https://github.com/nemanjajeremic))

### 1.0.11 (2020-03-18)

* Fix minimist vulnerability (https://npmjs.com/advisories/1179)

### 1.0.10 (2020-03-02)

* Account for TestRail not accepting 0s run times (skipped tests)

### 1.0.9 (2020-02-27)

* Previous commits didn't properly account for SIGINT

### 1.0.8 (2020-02-26)

* Always delete temp folder (potential stale / invalid results)

### 1.0.6 (2020-02-24)

* return run id from cleanup method

### 1.0.5 (2020-02-13)

* package.json metadata update

### 1.0.4 (2020-02-13)

* Initial published commit