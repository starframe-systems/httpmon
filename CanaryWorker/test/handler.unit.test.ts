import { Context } from 'aws-lambda';
import { describe, expect, test } from '@jest/globals';
import { Event, Request, handler } from '../src/index';
import * as request from '../src/request';
import { PredicateDefinition } from '@/predicate';

describe('__CanaryWorker/handler()__', () => {
    let consoleLog;
    let httpRequest;

    beforeEach(() => {
        consoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
        httpRequest = jest.spyOn(request, 'request');
    });

    afterEach(() => {
        consoleLog.mockRestore();
        httpRequest.mockRestore();
    });

    test('accepts empty events', async () => {
        const event: Event = { requests: [] as Request[] };
        const context = {};

        const result = await handler(event, context as Context);

        expect(consoleLog).toBeCalledWith({
            event,
            context,
        });

        expect(httpRequest).not.toBeCalled();
    });

    test('logs an error if a request is missing a `url` property', async () => {
        const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

        const event: Event = { requests: [{ url: null }] };
        const context = {};

        const result = await handler(event, context as Context);

        expect(consoleLog).toBeCalledWith({
            event,
            context,
        });

        const errorJson = JSON.stringify({ message: 'Request in payload is missing URL' }, null, 2);

        expect(consoleError).lastCalledWith(errorJson);
        expect(httpRequest).not.toBeCalled();
        consoleError.mockRestore();
    });

    test('a request event triggers an http request', async () => {
        const context = {};
        const request = {
            url: 'https://jsonplaceholder.typicode.com/todos/1',
            timeout: 100,
        };
        const event: Event = {
            requests: [request],
        };
        const response = {
            body: '{\n  "userId": 1,\n  "id": 1,\n  "title": "delectus aut autem",\n  "completed": false\n}',
        };

        httpRequest.mockResolvedValue(response);
        const result = await handler(event, context as Context);

        expect(httpRequest).toBeCalledWith(
            {
                timeout: 100,
                protocol: 'https:',
                port: '',
                path: '/todos/1',
                method: 'GET',
                hostname: 'jsonplaceholder.typicode.com',
                headers: {
                    'User-Agent': 'httpmon/1.0.0',
                },
            },
            undefined
        );
        expect(consoleLog).nthCalledWith(1, {
            event,
            context,
        });
        expect(consoleLog).nthCalledWith(2, {
            message: 'request succeeded',
            request,
            response,
            details: [],
        });
    });

    test('supports GET requests with query arguments', async () => {
        const context = {};
        const request = {
            url: 'https://jsonplaceholder.typicode.com/posts',
            params: {
                userId: 1,
            },
            timeout: 100,
        };
        const event: Event = {
            requests: [request],
        };
        const response = {
            body: '{\n  "userId": 1,\n  "id": 1,\n  "title": "delectus aut autem",\n  "completed": false\n}',
        };

        httpRequest.mockResolvedValue(response);
        const result = await handler(event, context as Context);

        expect(httpRequest).toBeCalledWith(
            {
                timeout: 100,
                protocol: 'https:',
                port: '',
                path: '/posts?userId=1',
                method: 'GET',
                hostname: 'jsonplaceholder.typicode.com',
                headers: {
                    'User-Agent': 'httpmon/1.0.0',
                },
            },
            undefined
        );
        expect(consoleLog).nthCalledWith(1, {
            event,
            context,
        });
        expect(consoleLog).nthCalledWith(2, {
            message: 'request succeeded',
            request,
            response,
            details: [],
        });
    });

    test('supports POST requests with body arguments', async () => {
        const context = {};
        const data = {
            title: 'foo',
            body: 'bar',
            userId: 1,
        };
        const request: Request = {
            url: 'https://jsonplaceholder.typicode.com/posts',
            method: 'POST',
            headers: {
                'Content-type': 'application/json; charset=UTF-8',
            },
            data: JSON.stringify(data),
            timeout: 100,
        };
        const event: Event = {
            requests: [request],
        };
        const response = {
            body: '{\n  "id": 101\n}',
            statusCode: 201,
            headers: {
                'content-type': 'application/json; charset=utf-8',
                'content-length': '15',
                connection: 'keep-alive',
            },
        };

        httpRequest.mockResolvedValue(response);
        const result = await handler(event, context as Context);

        expect(httpRequest).toBeCalledWith(
            {
                timeout: 100,
                protocol: 'https:',
                port: '',
                path: '/posts',
                method: 'POST',
                hostname: 'jsonplaceholder.typicode.com',
                headers: {
                    'User-Agent': 'httpmon/1.0.0',
                    'Content-type': 'application/json; charset=UTF-8',
                },
            },
            JSON.stringify(data)
        );
        expect(consoleLog).nthCalledWith(1, {
            event,
            context,
        });
        expect(consoleLog).nthCalledWith(2, {
            message: 'request succeeded',
            request,
            response,
            details: [],
        });
    });

    test('multiple requests initiate HTTP requests for each definition', async () => {
        const context = {};
        const requests = [
            {
                url: 'https://jsonplaceholder.typicode.com/todos/1',
                timeout: 100,
            },
            {
                url: 'https://jsonplaceholder.typicode.com/todos/2',
                timeout: 100,
            },
        ];
        const event: Event = { requests };
        const response = {
            body: '{\n  "userId": 1,\n  "id": 1,\n  "title": "delectus aut autem",\n  "completed": false\n}',
            statusCode: 200,
            headers: {
                'content-type': '',
            },
        };

        httpRequest.mockResolvedValue(response);
        const result = await handler(event, context as Context);

        expect(httpRequest).nthCalledWith(
            1,
            {
                timeout: 100,
                protocol: 'https:',
                port: '',
                path: '/todos/1',
                method: 'GET',
                hostname: 'jsonplaceholder.typicode.com',
                headers: {
                    'User-Agent': 'httpmon/1.0.0',
                },
            },
            undefined
        );

        expect(httpRequest).nthCalledWith(
            2,
            {
                timeout: 100,
                protocol: 'https:',
                port: '',
                path: '/todos/2',
                method: 'GET',
                hostname: 'jsonplaceholder.typicode.com',
                headers: {
                    'User-Agent': 'httpmon/1.0.0',
                },
            },
            undefined
        );

        expect(consoleLog).nthCalledWith(1, {
            event,
            context,
        });

        expect(consoleLog).nthCalledWith(2, {
            message: 'request succeeded',
            request: requests[0],
            response,
            details: [],
        });

        expect(consoleLog).nthCalledWith(3, {
            message: 'request succeeded',
            request: requests[1],
            response,
            details: [],
        });
    });

    test('requests with predicates execute tests against the HTTP response', async () => {
        const context = {};
        const request = {
            url: 'https://jsonplaceholder.typicode.com/todos/1',
            timeout: 100,
            expect: [
                { property: 'statusCode', operator: 'equals', value: 200 } as PredicateDefinition,
                { property: 'headers', operator: 'contains', value: 'content-type' } as PredicateDefinition,
            ],
        };
        const event: Event = {
            requests: [request],
        };
        const response = {
            body: '{\n  "userId": 1,\n  "id": 1,\n  "title": "delectus aut autem",\n  "completed": false\n}',
            statusCode: 200,
            headers: {
                'content-type': '',
            },
        };

        httpRequest.mockResolvedValue(response);
        const result = await handler(event, context as Context);

        expect(httpRequest).toBeCalledWith(
            {
                timeout: 100,
                protocol: 'https:',
                port: '',
                path: '/todos/1',
                method: 'GET',
                hostname: 'jsonplaceholder.typicode.com',
                headers: {
                    'User-Agent': 'httpmon/1.0.0',
                },
            },
            undefined
        );

        expect(consoleLog).nthCalledWith(1, {
            event,
            context,
        });

        expect(consoleLog).nthCalledWith(2, {
            message: 'all 2 tests passed',
            request,
            response,
            details: [
                {
                    pass: '(statusCode equals 200)',
                    expected: 200,
                    found: 200,
                },
                {
                    pass: '(headers contains "content-type")',
                    expected: 'content-type',
                    found: {
                        'content-type': '',
                    },
                },
            ],
        });
    });

    test('requests with failing predicates log errors', async () => {
        const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

        const context = {};
        const request = {
            url: 'https://jsonplaceholder.typicode.com/todos/1',
            timeout: 100,
            expect: [
                { property: 'statusCode', operator: 'equals', value: 200 } as PredicateDefinition,
                { property: 'headers', operator: 'contains', value: 'etag' } as PredicateDefinition,
            ],
        };
        const event: Event = {
            requests: [request],
        };
        const response = {
            body: '{\n  "error": "bad request"\n}',
            statusCode: 400,
            headers: {
                'content-type': '',
            },
        };

        httpRequest.mockResolvedValue(response);
        const result = await handler(event, context as Context);

        expect(httpRequest).toBeCalledWith(
            {
                timeout: 100,
                protocol: 'https:',
                port: '',
                path: '/todos/1',
                method: 'GET',
                hostname: 'jsonplaceholder.typicode.com',
                headers: {
                    'User-Agent': 'httpmon/1.0.0',
                },
            },
            undefined
        );

        expect(consoleLog).nthCalledWith(1, {
            event,
            context,
        });

        expect(consoleError).nthCalledWith(1, {
            message: '2 of 2 tests failed',
            request,
            response,
            details: [
                {
                    fail: '(statusCode equals 200)',
                    expected: 200,
                    found: 400,
                },
                {
                    fail: '(headers contains "etag")',
                    expected: 'etag',
                    found: {
                        'content-type': '',
                    },
                },
            ],
        });

        consoleError.mockRestore();
    });
});
