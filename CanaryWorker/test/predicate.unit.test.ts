import { describe, expect, test } from '@jest/globals';
import { Predicate, PredicateDefinition } from '../src/predicate';

describe('__CanaryWorker/Predicate__', () => {
    test('constructing a malformed predicate throws an error', () => {
        const definitions: [PredicateDefinition, string][] = [
            [{ property: null, operator: null, value: null }, 'invalid predicate: a property path is required'],
            [{ property: '', operator: null, value: null }, 'invalid predicate: a property path is required'],
            [{ property: 'a', operator: null, value: null }, 'invalid predicate: an operator is required'],
            [{ property: 'a[]', operator: null, value: null }, 'invalid predicate: an operator is required'],
            [{ property: 'a', operator: 'equals', value: null }, 'invalid predicate: an expected value is required'],
            [{ property: 'a', operator: null, value: 'a' }, 'invalid predicate: an operator is required'],
        ];

        for (const def of definitions) {
            expect(() => {
                new Predicate(def[0]);
            }).toThrow(def[1]);
        }
    });

    test('constructing valid predicates are successful', () => {
        let predicate;

        predicate = new Predicate({ property: 'a', operator: 'equals', value: 1 });
        expect(predicate.toString()).toEqual('(a equals 1)');
        expect(predicate.expected).toEqual(1);
        expect(predicate.received).toBeUndefined();

        predicate = new Predicate({ property: 'a', operator: 'notEquals', value: 1 });
        expect(predicate.toString()).toEqual('(a notEquals 1)');
        expect(predicate.expected).toEqual(1);
        expect(predicate.received).toBeUndefined();

        predicate = new Predicate({ property: 'a', operator: 'equals', value: 'a' });
        expect(predicate.toString()).toEqual('(a equals "a")');
        expect(predicate.expected).toEqual('a');
        expect(predicate.received).toBeUndefined();

        predicate = new Predicate({ property: 'a["b"]', operator: 'equals', value: 1 });
        expect(predicate.toString()).toEqual('(a["b"] equals 1)');
        expect(predicate.expected).toEqual(1);
        expect(predicate.received).toBeUndefined();

        predicate = new Predicate({ property: "a['b']", operator: 'equals', value: 1 });
        expect(predicate.toString()).toEqual("(a['b'] equals 1)");
        expect(predicate.expected).toEqual(1);
        expect(predicate.received).toBeUndefined();

        predicate = new Predicate({ property: 'a', operator: 'contains', value: 1 });
        expect(predicate.toString()).toEqual('(a contains 1)');
        expect(predicate.expected).toEqual(1);
        expect(predicate.received).toBeUndefined();
    });

    test('correct predicates execute successfully and return true', () => {
        let predicate;
        let context;

        predicate = new Predicate({ property: 'a', operator: 'equals', value: 1 });
        context = { a: 1 };
        expect(predicate.execute(context)).toEqual(true);
        expect(predicate.expected).toEqual(1);
        expect(predicate.received).toEqual(1);

        predicate = new Predicate({ property: 'a', operator: 'equals', value: 'x' });
        context = { a: 'x' };
        expect(predicate.execute(context)).toEqual(true);
        expect(predicate.expected).toEqual('x');
        expect(predicate.received).toEqual('x');

        predicate = new Predicate({ property: 'a', operator: 'contains', value: 'q' });
        context = { a: 'q' };
        expect(predicate.execute(context)).toEqual(true);
        expect(predicate.expected).toEqual('q');
        expect(predicate.received).toEqual('q');

        predicate = new Predicate({ property: 'a', operator: 'contains', value: 'uu' });
        context = { a: 'quux' };
        expect(predicate.execute(context)).toEqual(true);
        expect(predicate.expected).toEqual('uu');
        expect(predicate.received).toEqual('quux');

        predicate = new Predicate({ property: 'a', operator: 'contains', value: 'q' });
        context = { a: { q: 'z' } };
        expect(predicate.execute(context)).toEqual(true);
        expect(predicate.expected).toEqual('q');
        expect(predicate.received).toEqual({ q: 'z' });

        predicate = new Predicate({ property: 'a', operator: 'notContains', value: 'z' });
        context = { a: 'quux' };
        expect(predicate.execute(context)).toEqual(true);
        expect(predicate.expected).toEqual('z');
        expect(predicate.received).toEqual('quux');

        predicate = new Predicate({ property: 'a', operator: 'notContains', value: 'z' });
        context = { a: { q: 'z' } };
        expect(predicate.execute(context)).toEqual(true);
        expect(predicate.expected).toEqual('z');
        expect(predicate.received).toEqual({ q: 'z' });

        predicate = new Predicate({ property: 'a', operator: 'notEquals', value: 'b' });
        context = { a: 1 };
        expect(predicate.execute(context)).toEqual(true);
        expect(predicate.expected).toEqual('b');
        expect(predicate.received).toEqual(1);
    });

    test('incorrect predicates execute successfully and return false', () => {
        let predicate;
        let context;

        predicate = new Predicate({ property: 'a', operator: 'notEquals', value: 1 });
        context = { a: 1 };
        expect(predicate.execute(context)).toEqual(false);
        expect(predicate.expected).toEqual(1);
        expect(predicate.received).toEqual(1);

        predicate = new Predicate({ property: 'a', operator: 'notEquals', value: 'x' });
        context = { a: 'x' };
        expect(predicate.execute(context)).toEqual(false);
        expect(predicate.expected).toEqual('x');
        expect(predicate.received).toEqual('x');

        predicate = new Predicate({ property: 'a', operator: 'notContains', value: 'q' });
        context = { a: 'q' };
        expect(predicate.execute(context)).toEqual(false);
        expect(predicate.expected).toEqual('q');
        expect(predicate.received).toEqual('q');

        predicate = new Predicate({ property: 'a', operator: 'notContains', value: 'uu' });
        context = { a: 'quux' };
        expect(predicate.execute(context)).toEqual(false);
        expect(predicate.expected).toEqual('uu');
        expect(predicate.received).toEqual('quux');

        predicate = new Predicate({ property: 'a', operator: 'notContains', value: 'q' });
        context = { a: { q: 'z' } };
        expect(predicate.execute(context)).toEqual(false);
        expect(predicate.expected).toEqual('q');
        expect(predicate.received).toEqual({ q: 'z' });

        predicate = new Predicate({ property: 'a', operator: 'contains', value: 'z' });
        context = { a: 'quux' };
        expect(predicate.execute(context)).toEqual(false);
        expect(predicate.expected).toEqual('z');
        expect(predicate.received).toEqual('quux');

        predicate = new Predicate({ property: 'a', operator: 'contains', value: 'z' });
        context = { a: { q: 'z' } };
        expect(predicate.execute(context)).toEqual(false);
        expect(predicate.expected).toEqual('z');
        expect(predicate.received).toEqual({ q: 'z' });

        predicate = new Predicate({ property: 'a', operator: 'equals', value: 'b' });
        context = { a: 1 };
        expect(predicate.execute(context)).toEqual(false);
        expect(predicate.expected).toEqual('b');
        expect(predicate.received).toEqual(1);
    });
});
