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
    return this.get(`get_runs/${this.options.projectId}`);
  }

  getRun(runId) {
    return this.get(`get_run/${this.options.runId}`);
  }

  closeTestrailRun() {
    return this.post(`close_run/${this.options.runId}`);
  }

  getCases() {
    return this.get(
      `get_cases/${this.options.projectId}${
        this.options.suiteId ? `&suite_id=${this.options.suiteId}` : ''
      }`,
    );
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

  addResults(runId, results) {
    return this.post(`add_results_for_cases/${this.options.runId}`, {
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
