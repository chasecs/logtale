const {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
  FilterLogEventsCommand
} = require("@aws-sdk/client-cloudwatch-logs");
const { date2timestamp, clearLoading, loading } = require('./utils')
const chalk = require('chalk');
const error = chalk.bold.red;
const green = chalk.keyword('green');
const client = new CloudWatchLogsClient({ region: process.env.AWS_REGION });

const TEM_MIN = 10 * 60 * 1000
/**
 * @key {number} LatestTimeEventIds.timestamp 
 * @key {Array} LatestTimeEventIds.ids 
 */
let LatestTimeEventIds = null
let HasEnding = false
//https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-cloudwatch-logs/classes/describeloggroupscommand.html
function groupList() {
  let list = []
  function group(next) {
    return client.send(new DescribeLogGroupsCommand({ nextToken: next }))
      .then((data) => {
        data.logGroups.forEach(i => list.push(i.logGroupName))
        if (data.nextToken) {
          return group(data.nextToken)
        }
        return list
      })
  }
  return group()
}

function _getLastestTimeEventIds(events) {
  const len = events.length
  if (len === 0) {
    return null
  }
  let latestIds = {
    timestamp: events[len - 1].timestamp,
    ids: [events[len - 1].eventId]
  }
  let count = len - 2
  while (count >= 0 && events[count].timestamp === latestIds.timestamp) {
    latestIds.ids.push(events[count].eventId)
    count--
  }
  return latestIds
}

function _printLogs(events) {
  if (events.length > 0) {
    let logs = events.map(eve => {
      let log = green(new Date(eve.timestamp).toISOString())
      let msg = eve.message
      log = log + ' ' + (msg.match(/ERROR/i) ? error(msg) : msg)
      return log
    })
    console.log(logs.join('\n'))
  }
}


function _initialParams(options) {
  let { logGroupName, startTime, endTime, filter: filterPattern, since, around } = options
  let params = { filterPattern, logGroupName }
  if (around && around.length > 0) {
    let midTime = date2timestamp(around[0])
    const range = +(around[1] || 1) * 1000
    params.startTime = midTime - range
    params.endTime = midTime + range
    HasEnding = true
  } else if (since) {
    params.startTime = date2timestamp(since)
  } else if (startTime) {
    params.startTime = date2timestamp(startTime)
    if (endTime) {
      params.endTime = date2timestamp(endTime)
      HasEnding = true
    }
  } else {
    params.startTime = Date.now() - TEM_MIN //defaultStart
  }
  return params
}

function _nextParams(options, nextToken) {
  return {
    logGroupName: options.logGroupName,
    filterPattern: options.filterPattern,
    endTime: options.endTime,
    nextToken
  }
}

function _pollingParams(options, lastestTimestamp) {
  if (!lastestTimestamp) {
    throw new Error('Polling logs error')
  }
  return {
    logGroupName: options.logGroupName,
    filterPattern: options.filterPattern,
    startTime: lastestTimestamp
  }
}

/**
 * request logs from AWS
 * @param {Object} FilterLogEventsCommandInput 
 */
function query(params) {
  const command = new FilterLogEventsCommand(params)
  loading()
  return client.send(command)
    .then((data) => {
      clearLoading()
      let next = data.nextToken
      if (!next && HasEnding) {
        //hit the end
        process.exit(0)
      }
      if (data.events.length > 0) {
        //Filter possible duplicated eventLogs.
        //Duplicate logs might appears when polling logs with the startTime
        //that came from the latest received event.
        let ids = LatestTimeEventIds && LatestTimeEventIds.ids
        let events = data.events
        if (ids && ids.length > 0) {
          events = events.filter(i => !ids.includes(i.eventId))
        }

        if (events.length > 0) {
          LatestTimeEventIds = _getLastestTimeEventIds(events)
          _printLogs(events)
        }
      }
      return next
    })
    .then(nextToken => {
      if (nextToken) {
        setTimeout(query, 500, _nextParams(params, nextToken))
      } else {
        if (!LatestTimeEventIds) {
          process.exit(0)
        }
        setTimeout(query, 2000, _pollingParams(params, LatestTimeEventIds.timestamp))
      }
    })
    .catch((error) => {
      clearLoading()
      console.error(error.toString())
      process.exit(1)
    })
}

// Docs:
// https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-cloudwatch-logs/classes/filterlogeventscommand.html
function tail(group, options) {
  const params = _initialParams(Object.assign({}, options, { logGroupName: group }))
  return query(params)
}


module.exports = {
  groupList,
  tail
}

