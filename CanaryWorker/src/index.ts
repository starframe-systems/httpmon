import { Context, Handler } from 'aws-lambda';
import { request } from './request';
import { URL } from 'url';
import { stringify } from 'querystring';
import { Predicate, PredicateDefinition } from './predicate';

const defaults = {
    httpRequestTimeout: 15000,
    httpMethod: 'GET',
    httpUserAgentString: 'httpmon/1.0.0',
};

type Detail = {
    pass?: string;
    fail?: string;
    expected?: string | number;
    found?: string | number;
};

type Event = {
    requests: [Request];
};

type Request = {
    url: string;
    method?: 'GET' | 'POST' | 'PUT' | 'OPTIONS';
    params?: { [key: string]: string };
    data?: any;
    timeout?: number;
    expect?: PredicateDefinition[];
};

export const handler: Handler = async (event: Event, context: Context): Promise<void> => {
    console.log({ event, context });

    for (const req of event.requests ?? []) {
        if (!req.url) {
            console.error(JSON.stringify({ message: 'Request in payload is missing URL' }, null, 2));
            continue;
        }

        const url = new URL(req.url);
        const query = req.params ? '?' + stringify(req.params) : '';

        const opts = {
            protocol: url.protocol,
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + query,
            method: req.method || defaults.httpMethod,
            headers: {
                'User-Agent': defaults.httpUserAgentString,
            },
            timeout: req.timeout || defaults.httpRequestTimeout,
        };

        let response;

        try {
            response = await request(opts, req.data);
        } catch (err) {
            console.error(JSON.stringify({ message: err }, null, 2));
            continue;
        }

        const details: Detail[] = [];
        let count = 0;
        let failed = 0;

        for (const definition of req.expect) {
            try {
                const predicate = new Predicate(definition);
                count += 1;

                if (predicate.execute(response)) {
                    details.push({ pass: `${predicate}`, expected: predicate.expected, found: predicate.received });
                } else {
                    details.push({ fail: `${predicate}`, expected: predicate.expected, found: predicate.received });
                    failed += 1;
                }
            } catch (err) {
                console.error(JSON.stringify({ message: err }, null, 2));
                continue;
            }
        }

        if (failed === 0) {
            console.log({
                message: `${count === 1 ? '1 test' : 'all ' + count + ' tests'} passed`,
                request: req,
                response,
                details,
            });
        } else {
            console.error({
                message: `${failed} of ${count} test${count === 1 ? 's' : ''} failed`,
                request: req,
                response,
                details,
            });
        }
    }
};
