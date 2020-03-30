
const WDIOReporter = require('@wdio/reporter').default;
const request = require('sync-request');
const fs = require('fs');

class CustomReporter extends WDIOReporter {
  constructor(options) {
    super(options);

    this.results = [];
    const requiredOptions = ['domain', 'username', 'password', 'projectId'];
    requiredOptions.forEach((requiredOption) => {
      if (!this.options[requiredOption]) throw new Error(`wdiov5testrail: Required reporter option "${requiredOption}" is not defined.`);
    });
    this.options.auth = `Basic ${Buffer.from(`${this.options.username}:${this.options.password}`).toString('base64')}`;
  }

  onTestEnd(test) {
    const strings = test.title.split(' ');
    const testCaseRegex = /\bC(\d+)\b/;

    strings.forEach((string) => {
      const matches = string.match(testCaseRegex);
      if (matches) {
        const result = {
          case_id: matches[1],
          elapsed: `${(test._duration || 0.01) / 1000}s`,
        };
        if (this.options.version) result.version = this.options.version.toString();
        if (test.state === 'passed') result.status_id = 1;
        else if (test.state === 'skipped') result.status_id = this.options.skippedStatusId || 4;
        else result.status_id = 5;
        this.results.push(result);

        fs.writeFileSync(`./testrailResults/tc-${result.case_id}.json`, JSON.stringify(result));
      }
    });
  }
}

exports.default = CustomReporter;
