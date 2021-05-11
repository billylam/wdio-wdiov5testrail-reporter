const fs = require('fs');
const del = require('del');
const request = require('sync-request');

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
  const auth = `Basic ${Buffer.from(
    `${options.username}:${options.password}`,
  ).toString('base64')}`;

  let response;
  const headers = {
    'Content-Type': 'application/json',
    Authorization: auth,
  };

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
  if (!options.title) {
    response = request(
      'GET',
      `https://${options.domain}/index.php?/api/v2/get_project/${options.projectId}`,
      { headers },
    );
    if (response.statusCode >= 300)
      console.error(JSON.parse(response.getBody()));
    options.title = `${JSON.parse(response.getBody()).name}: ${
      createTestPlan ? 'Automated Test Plan' : 'Automated Test Run'
    }`;
  }

  // If needed, create a test plan
  // POST index.php?/api/v2/add_plan/:project_id
  let planId = null;
  if (createTestPlan) {
    response = request(
      'POST',
      `https://${options.domain}/index.php?/api/v2/add_plan/${options.projectId}`,
      { headers, json: { name: options.title } },
    );
    planId = JSON.parse(response.getBody()).id;
  }

  groupedResults.forEach((resultSet) => {
    let results = [...resultSet];
    if (
      options.strictCaseMatching !== undefined &&
      options.strictCaseMatching !== true
    ) {
      response = request(
        'GET',
        `https://${options.domain}/index.php?/api/v2/get_cases/${
          options.projectId
        }${options.suiteId ? `&suite_id=${options.suiteId}` : ''}`,
        { headers },
      );
      const actualCaseIds = JSON.parse(response.getBody()).map(
        (testCase) => testCase.id,
      );
      results = resultSet.filter((result) =>
        actualCaseIds.includes(Number.parseInt(result.case_id, 10)),
      );
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
    // If there are duplicate test cases
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
      response = request(
        'GET',
        `https://${options.domain}/index.php?/api/v2/get_runs/${options.projectId}`,
        { headers },
      );
      options.runId = JSON.parse(response.getBody())[0].id;
    } else if (!options.runId || createTestPlan) {
      const json = {
        name: createTestPlan ? resultSet[0].browserName : options.title,
        suite_id: options.suiteId,
        description,
      };
      if (options.includeAll === false) {
        json.include_all = false;
        json.case_ids = results.map((currentResult) => currentResult.case_id);
        console.log('---------------------------------------- GOT HERE');
        console.log(json.case_ids);
      }
      // Add a new test run if no run id was specified
      response = request(
        'POST',
        createTestPlan
          ? `https://${options.domain}/index.php?/api/v2/add_plan_entry/${planId}`
          : `https://${options.domain}/index.php?/api/v2/add_run/${options.projectId}`,
        {
          suite_id: options.suiteId,
          headers,
          json,
        },
      );
      if (response.statusCode >= 300)
        console.error(JSON.parse(response.getBody()));
      options.runId = createTestPlan
        ? JSON.parse(response.getBody()).runs[0].id
        : JSON.parse(response.getBody()).id;
      const { url } = createTestPlan
        ? JSON.parse(response.getBody()).runs[0]
        : JSON.parse(response.getBody());
      console.log(`\n${url}`);
    }
    // Add results
    response = request(
      'POST',
      `https://${options.domain}/index.php?/api/v2/add_results_for_cases/${options.runId}`,
      {
        headers,
        json: {
          suite_id: options.suiteId,
          results,
        },
      },
    );
    if (response.statusCode >= 300)
      console.error(JSON.parse(response.getBody()));

    // Close test run in test rail if option is set to true
    if (options.closeTestRailRun === true) {
      response = request(
        'POST',
        `https://${options.domain}/index.php?/api/v2/close_run/${options.runId}`,
        {
          headers,
          json: {
            results,
          },
        },
      );
      if (response.statusCode >= 300)
        console.error(JSON.parse(response.getBody()));
    }
  });

  return options.runId;
};
