# httpmon, a simple health check service

**httpmon** is a liveness canary service implemented as an AWS Lambda.

## Console

The console manages configuring the target and schedule of health check events.

## Function

Payload schema:

```json
{
  "requests": [
    {
      "url": "https://www.iana.org/help/example-domains",
      "method": "GET",
      "params": {},
      "timeout": 15000
    },
    {
      "url": "https://www.google.com/search",
      "method": "GET",
      "params": {
        "q": "httpmon"
      },
      "expect": [
        {
          "property": "body",
          "operator": "contains",
          "value": "starframe"
        }
      ]
    }
  ]
}
```

Each request dictionary may contain the following keys:

- `url` -- the URL to request **(required)**
- `method` -- the HTTP method to use: `GET`, `POST`, `PUT`, `OPTIONS`, or `HEAD` **(optional; `GET` is default)**
- `params` -- a dictionary of query string parameters **(optional)**
- `timeout` -- length of time to wait for a response in milliseconds **(optional; 15000 is default)**
