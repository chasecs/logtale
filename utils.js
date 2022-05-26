const ora = require('ora');

TO_SECONDS = {
  's': 1,
  'm': 60,
  'h': 3600,
  'd': 24 * 3600,
  'w': 7 * 24 * 3600,
}

function date2timestamp(date) {
  const reMatch = date.match(/^(\d+)(s|m|h|d|w)$/)
  let timestamp
  if (reMatch) {
    let unit = reMatch.pop()
    let amount = reMatch.pop()
    timestamp = Date.now() - (amount * TO_SECONDS[unit] * 1000)
  } else {
    timestamp = Date.parse(date)
  }
  if (!timestamp) {
    console.error(`Invalid timestamp "${date}": must be ISO 8601 timestamp or a relative time`)
    process.exit(1)
  }
  return timestamp
}

let spinner
function loading() {
  spinner = ora().start();
}

function clearLoading() {
  spinner.clear()
}

module.exports = {
  date2timestamp,
  loading,
  clearLoading,
}