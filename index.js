#!/usr/bin/env node
const { program, Option } = require('commander');
const { tail, groupList } = require('./cmd')
const inquirer = require('inquirer');
const chalk = require('chalk');

program
  .argument('<group>', 'The name of the CloudWatch log group to search')
  .option('--startTime <timestamp>', 'The start of the time range, expressed as ISO 8601 timestamp')
  .option('--endTime <timestamp>', 'The end of the time range, expressed as ISO 8601 timestamp')
  .option('-f, --filter <string>', 'The aws filter pattern to filter logs')
  .option('-r, --regExp <string>', 'Regular expression to filter logs')
  .addOption(new Option('--since <string>', 'From what time to begin displaying logs, ISO 8601 timestamp or relative time')
    .conflicts(['startTime', 'endTime'])
  )
  .addOption(new Option('-a, --around <timestamp, seconds...>', 'Display logs around a specified time with a range, default range 1 second')
    .conflicts(['since', 'startTime', 'endTime'])
  )
  .action(async (logGroup) => {
    let groupNames
    try {
      groupNames = await groupList()
    } catch (e) {
      console.error(e.toString())
      process.exit(1)
    }
    let candidates = groupNames.filter(g => g.match(logGroup))
    let target
    if (candidates.length > 1) {
      try {
        const answers = await inquirer.prompt({
          type: "rawlist",
          name: "logGroup",
          message: `Select logGroup:`,
          choices: candidates
        })
        target = answers['logGroup']
      } catch (e) {
        console.error(e.toString())
        process.exit(1)
      }
    } else if (candidates.length === 1) {
      target = candidates[0]
      console.log(`Displaying logs of ${chalk.green(target)}`)
    } else {
      return console.log(`logGroup: ${chalk.green(logGroup)} not found`)
    }
    tail(target, program.opts())
  });

program.parse();
