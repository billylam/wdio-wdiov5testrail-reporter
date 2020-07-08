const WDIOReporter = require('@wdio/reporter').default;
const request = require('sync-request');
const fs = require('fs');

class CustomReporter extends WDIOReporter {
  constructor(options) {
    super(options);

    const requiredOptions = ['domain', 'username', 'password', 'projectId'];
    requiredOptions.forEach((requiredOption) => {
      if (!this.options[requiredOption])
        throw new Error(
          `wdiov5testrail: Required reporter option "${requiredOption}" is not defined.`,
        );
    });
    this.options.auth = `Basic ${Buffer.from(
      `${this.options.username}:${this.options.password}`,
    ).toString('base64')}`;

    process.on(
      'wdio-wdiov5testrail-reporter:addTestRailComment',
      this.addComment.bind(this),
    );
  }

  onTestStart(test) {
    this.results = [];
    this.comment = [];
  }

  onTestSkip(test) {
    this.results = [];
    this.comment = [];
  }

  onTestEnd(test) {
    const strings = test.title.split(' ');
    const testCaseRegex = /\bC(\d+)\b/;

    strings.forEach((string) => {
      const matches = string.match(testCaseRegex);
      if (matches) {
        const result = {
          case_id: matches[1],
          elapsed: `${
            // eslint-disable-next-line no-underscore-dangle
            test._duration >= 1000 ? Math.round(test._duration / 1000) : 1
          }s`,
        };
        if (this.options.version)
          result.version = this.options.version.toString();
        if (test.state === 'passed') result.status_id = 1;
        else if (test.state === 'skipped')
          result.status_id = this.options.skippedStatusId || 4;
        else {
          result.status_id = 5;
          if (test.error && test.error.stack)
            this.comment.unshift(test.error.stack);
        }
        if (this.comment.length > 0) result.comment = this.comment.join('\n\n');
        this.results.push(result);

        fs.writeFileSync(
          `./testrailResults/tc-${result.case_id}-${Date.now()}.json`,
          JSON.stringify(result),
        );
      }
    });
  }

  addComment(comment) {
    this.comment.push(comment);
  }

  static addTestRailComment(comment) {
    process.emit('wdio-wdiov5testrail-reporter:addTestRailComment', comment);
  }
}

exports.default = CustomReporter;
