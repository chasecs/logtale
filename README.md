# Logtale

A handy command-line tool for watching AWS CloudWatch logs

# Features
- Continuing display real-time logs, with options, as `tail` command do 
- Support blur search for log group names
- List logs around specified timestamp
  - e.g.`$logtale <GROUP_NAME> --around "2022-05-16T00:21:40.321Z" 10`

# Prerequisite 

**AWS configuration**

Use environment variables to setup your configuration
```sh
export AWS_ACCESS_KEY_ID = "Your AWS Access Key ID"
export AWS_SECRET_ACCESS_KEY = "Your AWS Secret Access Key"
export AWS_REGION = "Your Region" 
```

[Configuration basics](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-quickstart.html)

# Installation
```sh
$ npm i -g logtale
```
# Usage:

## Basic Command
To display logs of `logGroup`
```sh
$ logtale <GROUP_NAME> 
```

A list of choices is provided for selection if several groups are found:
```sh
$ logtale web
Select logGroup :
  1) /web-server
  2) /web-api
```

Directly Display logs if only one group name matched, for example: 
```sh
$ logtale server # or fullname: /web-server 
Displaying logs of /web-server 
...
```
## Filter

filter logs with AWS filter pattern
```sh
$ logtale <GROUP_NAME> -f "content"
```

## Time range
From what time to begin displaying logs, supported units:
- `s` - seconds
- `m` - minutes
- `h` - hours
- `d` - days
- `w` - weeks
```sh
$ logtale <GROUP_NAME> --since 30m
```

Display logs at the range of start time and end time
```sh
$ logtale <GROUP_NAME> --startTime 2022-04-15 --endTime 2022-04-16
```

Display logs around the specified time, at a range of 10 seconds
```sh
$ logtale <GROUP_NAME> --around 2022-05-16T00:21:40.321Z 10
```

More usage
```sh
$ logtale -h
```

# Reference
- [@aws-sdk/client-cloudwatch-logs](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-cloudwatch-logs/index.html#aws-sdkclient-cloudwatch-logs)
- [logs](https://docs.aws.amazon.com/cli/latest/reference/logs/index.html)
- [tail](https://awscli.amazonaws.com/v2/documentation/api/latest/reference/logs/tail.html)