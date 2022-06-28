/* eslint-disable no-underscore-dangle */
const request = require('sync-request');

class TestRailApi {
  constructor(options) {
    this.options = options;

    this.auth = Buffer.from(
      `${this.options.username}:${this.options.password}`,
    ).toString('base64');
    this.headers = {
      'User-Agent': 'wdio-wdiov5testrail-reporter',
      'Content-Type': 'application/json',
      Authorization: `Basic ${this.auth}`,
    };
  }

  getProjectInfo() {
    const path = this.options.suiteId
      ? `get_suite/${this.options.suiteId}`
      : `get_project/${this.options.projectId}`;

    return this.get(path);
  }

  createTitle(isTestPlan) {
    if (!this.options.title) {
      const path = this.options.suiteId
        ? `get_suite/${this.options.suiteId}`
        : `get_project/${this.options.projectId}`;

      const response = this.get(path);
      if (response.statusCode >= 300)
        console.error(JSON.parse(response.getBody()));
      this.options.title = `${JSON.parse(response.getBody()).name}: ${
        isTestPlan ? 'Automated Test Plan' : 'Automated Test Run'
      }`;
    }
  }

  getRuns() {
    return this.get(`get_runs/${this.options.projectId}&is_completed=0`);
  }

  getRun(runId = this.options.runId) {
    return this.get(`get_run/${runId}`);
  }

  closeTestrailRun() {
    return this.post(`close_run/${this.options.runId}`);
  }

  // "As of February 26, 2021 the data structure returned by bulk GET API
  // endpoints will change. These bulk endpoints will no longer return an array of all entities,
  // but will instead return an object with additional pagination fields and an array of up to 250 entities."
  //  -https://www.gurock.com/testrail/docs/api/reference/cases#getcases
  /** *
   * Unlike other methods in this class, returns an array of cases rather than a response object.
   */
   getCases() {
    let cases = [];
    const {
      projectId, 
      suiteId,
      casesFieldFilter: filter
    } = this.options;
    let response = null;
    let nextUrl = `get_cases/${projectId}${suiteId ? `&suite_id=${suiteId}` : ''}`;
    do {
      response = JSON.parse(this.get(nextUrl).getBody());
      const currentCases = response.cases.filter((testCase) => {
        if (filter && typeof filter === 'object'&& !Array.isArray(filter) && filter !== {}) {
          const keys = Object.keys(filter);
          for(let i = 0; i < keys.length; i = i + 1) {
            if (testCase[keys[i]] !== filter[keys[i]]) {
              return false;
            }
          }
        }
        return true;
      }).map((testCase) => testCase.id);
      cases = cases.concat(currentCases);

      nextUrl = response._links.next
        ? response._links.next.substring(
            response._links.next.indexOf('get_cases'),
          )
        : null;
    } while (nextUrl);

    return cases;
  }

  addPlan() {
    return this.post(`add_plan/${this.options.projectId}`, {
      name: this.options.title,
    });
  }

  addRun(json) {
    return this.post(`add_run/${this.options.projectId}`, json, {
      suite_id: this.options.suiteId,
    });
  }

  addPlanEntry(planId, json) {
    return this.post(`add_plan_entry/${planId}`, json, {
      suite_id: this.options.suiteId,
    });
  }

  addResults(runId = this.options.runId, results) {
    return this.post(`add_results_for_cases/${runId}`, {
      results,
    });
  }

  get(path) {
    const response = request(
      'GET',
      `https://${this.options.domain}/index.php?/api/v2/${path}`,
      { headers: this.headers },
    );
    if (response.statusCode >= 300) console.error(response.getBody());
    return response;
  }

  post(path, json, otherHeaders) {
    const response = request(
      'POST',
      `https://${this.options.domain}/index.php?/api/v2/${path}`,
      {
        headers: this.headers,
        json,
        ...otherHeaders,
      },
    );
    if (response.statusCode >= 300) console.error(response.getBody());
    return response;
  }
}

module.exports = TestRailApi;
