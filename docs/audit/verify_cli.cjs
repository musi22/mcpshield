// Execute the actual CLI with a synthetic transport; no sockets or real scans.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { EventEmitter } = require('events');
const source = fs.readFileSync(path.resolve(__dirname, '../../cli/bin/mcpshield.js'), 'utf8');
const report = {risk_score: 90, critical_count: 1, high_count: 0, medium_count: 0, low_count: 0, findings: [], sarif_output: {version: '2.1.0', runs: []}};
async function run(format) {
  let code = 0;
  const fakeHttp = {request: (url, options, callback) => {
    const request = new EventEmitter();
    request.write = () => {};
    request.end = () => queueMicrotask(() => {
      const response = new EventEmitter();
      response.statusCode = 200;
      callback(response);
      response.emit('data', JSON.stringify(report));
      response.emit('end');
    });
    return request;
  }};
  vm.runInNewContext(source, {
    require: name => ['http', 'https'].includes(name) ? fakeHttp : require(name),
    process: {argv: ['node', 'mcpshield', 'scan', 'http://audit.invalid', ...(format ? [format] : []), '--fail-on', 'high'], env: {}, exit: value => {code = value;}},
    console: {log() {}, error() {}},
    setInterval, clearInterval,
  });
  await new Promise(resolve => setImmediate(resolve));
  return {format: format || 'text', critical_findings: 1, expected_exit: 1, observed_exit: code};
}
(async () => console.log(JSON.stringify(await Promise.all(['', '--json', '--sarif'].map(run)), null, 2)))();
