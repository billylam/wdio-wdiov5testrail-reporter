
const fs = require('fs');
const del = require('del');
const request = require('sync-request');

module.exports.startup = function startup() {
  try {
    if (fs.existsSync('./testrailResults')) del.sync('./testrailResults');
    fs.mkdirSync('./testrailResults');
  } catch (e) { console.log(e); }
};

module.exports.cleanup = function cleanup(config) {
  const files = fs.readdirSync('./testrailResults');
  const results = [];
  files.forEach(file => results.push(JSON.parse(fs.readFileSync(`./testrailResults/${file}`, 'utf8'))));
  const passing = results.reduce((total, currentResult) => (currentResult.status_id === 1 ? total + 1 : total), 0);
  const skipped = results.reduce((total, currentResult) => (currentResult.status_id === 4 ? total + 1 : total), 0);
  const failing = results.reduce((total, currentResult) => (currentResult.status_id === 5 ? total + 1 : total), 0);
  const total = results.length;
  del.sync('./testrailResults');

  const description = `Execution summary:
  Passes: ${passing}
  Fails: ${failing}
  Skipped: ${skipped}
  Total: ${total}`;

  const options = config.reporters.find(reporter => reporter[0] === 'wdiov5testrail')[1];
  const auth = `Basic ${Buffer.from(`${options.username}:${options.password}`).toString('base64')}`;

  let response;
  // Create a title using project name if no better title is specified
  if (!options.title) {
    response = request('GET', `https://${options.domain}/index.php?/api/v2/get_project/${options.projectId}`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: auth,
      },
    });
    if (response.statusCode >= 300) console.error(JSON.parse(response.getBody()));
    options.title = `${JSON.parse(response.getBody()).name}: Automated Test Run`;
  }

  if (options.useLatestRunId === true) {
    response = request('GET', `https://${options.domain}/index.php?/api/v2/get_runs/${options.projectId}`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: auth,
      },
    });
    options.runId = JSON.parse(response.getBody())[0].id;
  } else if (!options.runId) {
    // Add a new test run if no run id was specified
    response = request('POST', `https://${options.domain}/index.php?/api/v2/add_run/${options.projectId}`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: auth,
      },
      json: {
        name: options.title,
        suite_id: options.suiteId,
        description,
      },
    });
    if (response.statusCode >= 300) console.error(JSON.parse(response.getBody()));
    options.runId = JSON.parse(response.getBody()).id;
    const { url } = JSON.parse(response.getBody());
    console.log(`\n${url}`);
  }

  // Add results
  response = request('POST', `https://${options.domain}/index.php?/api/v2/add_results_for_cases/${options.runId}`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: auth,
    },
    json: {
      results,
    },
  });
  if (response.statusCode >= 300) console.error(response.getBody());

  return options.runId;
};
