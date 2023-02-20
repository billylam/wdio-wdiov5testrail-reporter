const fs = require('fs');
const del = require('del');
const TestRailApi = require('./testrailApi');

module.exports.startup = function startup() {
  try {
    if (!fs.existsSync('./testrailResults')) fs.mkdirSync('./testrailResults');
  } catch (e) {
    console.log(e);
  }

  process.on('SIGINT', () => {
    if (fs.existsSync('./testrailResults')) del.sync('./testrailResults');
  });
};

module.exports.cleanup = function cleanup(config) {
  const options = config.reporters.find(
    (reporter) => reporter[0] === 'wdiov5testrail',
  )[1];

  const files = fs.readdirSync('./testrailResults');
  const rawResults = [];
  files.forEach((file) => {
    if (file.endsWith('json')) {
      rawResults.push(
        JSON.parse(fs.readFileSync(`./testrailResults/${file}`, 'utf8')),
      );
    }
  });
  del.sync('./testrailResults');

  if (rawResults.length === 0) {
    console.log(
      '[wdio-wdiov5testrail-reporter] No results to publish in TestRail.',
    );
    return;
  }

  let groupedResults = [];
  let createTestPlan = false;
  // If we have requested a test plan (cid and browserName present), group results
  if (
    rawResults &&
    Object.prototype.hasOwnProperty.call(rawResults[0], 'cid')
  ) {
    createTestPlan = true;
    rawResults.forEach((result) => {
      if (!groupedResults[result.cid]) groupedResults[result.cid] = [result];
      else groupedResults[result.cid].push(result);
    });
  } else groupedResults = [rawResults];

  // Create a title using project name if no better title is specified
  const testrail = new TestRailApi(options);
  testrail.createTitle(createTestPlan);

  let response = {};

  // If needed, create a test plan
  // POST index.php?/api/v2/add_plan/:project_id
  let planId = null;
  if (createTestPlan) {
    response = testrail.addPlan();
    planId = JSON.parse(response.getBody()).id;
  }

  let actualCaseIds = [];

  groupedResults.forEach((resultSet) => {
    let results = [...resultSet];
    if (
      options.strictCaseMatching !== undefined &&
      options.strictCaseMatching !== true ||
      options.casesFieldFilter
    ) {
      if (options.runId === undefined) {
        actualCaseIds = testrail.getCases();
      } else {
        actualCaseIds = testrail.getCasesFromTestRun();
      }
      results = resultSet.filter((result) =>
        actualCaseIds.includes(Number.parseInt(result.case_id, 10)),
      );
    } else if (options.strictCaseMatching === true) {
      actualCaseIds = testrail.getCases();
      results = resultSet.filter((result) =>
        actualCaseIds.includes(Number.parseInt(result.case_id, 10)),
      );

      const invalidFilteredTests = resultSet.filter((result) =>
        !actualCaseIds.includes(Number.parseInt(result.case_id, 10)),
      );

      let invalidTestCases = [];
      invalidFilteredTests.forEach(result => invalidTestCases.push(result.case_id));
      console.log(`Invalid Test Cases - ${invalidTestCases}`);
    }
    const passing = results.reduce(
      (total, currentResult) =>
        currentResult.status_id === 1 ? total + 1 : total,
      0,
    );
    const skipped = results.reduce(
      (total, currentResult) =>
        currentResult.status_id === (options.skippedStatusId || 4)
          ? total + 1
          : total,
      0,
    );
    const failing = results.reduce(
      (total, currentResult) =>
        currentResult.status_id === 5 ? total + 1 : total,
      0,
    );
    const total = results.length;

    // If there are duplicate test cases, first account for wdio retries
    //    by deduplicating by wdio cid/uid and taking only the newest test
    const deduplicatedResults = new Map();
    results.forEach((result) => {
      if (
        !deduplicatedResults.has(result.wdio_id) ||
        deduplicatedResults.get(result.wdio_id).start < result.start
      )
        deduplicatedResults.set(result.wdio_id, result);
    });

    results = Array.from(deduplicatedResults.values());

    // Get failures and replace any matching successes
    // For reporting purposes this should be done after stats are calculated
    const testCaseIds = results.map((result) => result.case_id);
    if (testCaseIds.length !== new Set(testCaseIds).size) {
      const failures = results
        .filter((result) => result.status_id === 5)
        .map((result) => result.case_id);
      results = results.map((result) =>
        failures.includes(result.case_id)
          ? { ...result, ...{ status_id: 5 } }
          : result,
      );
    }

    const description = `Execution summary:
    Passes: ${passing}
    Fails: ${failing}
    Skipped: ${skipped}
    Total: ${total}`;
    // Use latest run if requested
    if (options.useLatestRunId === true) {
      response = testrail.getRuns();
      options.runId = JSON.parse(response.getBody()).runs[0].id;
    } else if (!options.runId || createTestPlan) {
      const json = {
        name: createTestPlan ? resultSet[0].browserName : options.title,
        suite_id: options.suiteId,
        description
      };
      if (options.includeAll === false) {
        json.include_all = false;
        if (options.casesFieldFilter) {
          // including only filtered cases
          json.case_ids = actualCaseIds;
        } else {
          json.case_ids = results.map((currentResult) => currentResult.case_id);
        }
      }
      // Add a new test run if no run id was specified
      response = createTestPlan
        ? testrail.addPlanEntry(planId, json)
        : testrail.addRun(json);

      options.runId = createTestPlan
        ? JSON.parse(response.getBody()).runs[0].id
        : JSON.parse(response.getBody()).id;
      const { url } = createTestPlan
        ? JSON.parse(response.getBody()).runs[0]
        : JSON.parse(response.getBody());
      console.log(`\n${url}`);
    }
    // Add results
    response = testrail.addResults(options.runId, results);

    // Close test run in test rail if option is set to true
    if (options.closeTestRailRun === true) {
      testrail.closeTestrailRun();
    }
  });

  return options.runId;
};
