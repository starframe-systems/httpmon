type OperatorName = 'equals' | 'notEquals' | 'contains' | 'notContains';
type OperatorFn = (a0: any, a1: any) => boolean;

const propPattern = /^([a-zA-Z_][a-zA-Z0-9_]*)(?:\[(['"])([a-zA-Z_][a-zA-Z0-9_]*)\2\])?$/;

export type PredicateDefinition = {
    property: string;
    operator: OperatorName;
    value: string | number;
};

const operators: { [name in OperatorName]: OperatorFn } = {
    equals: (a, b) => a === b,
    notEquals: (a, b) => a !== b,
    contains: (a, b) => (Array.isArray(a) || typeof a === 'string' ? a.includes(b) : a.hasOwnProperty(b)),
    notContains: (a, b) => !(Array.isArray(a) || typeof a === 'string' ? a.includes(b) : a.hasOwnProperty(b)),
};

export class Predicate {
    #operator: OperatorFn;
    #operatorName: OperatorName;
    #property: string;
    #propertyLookup: (a0: any) => any;
    #value: string | number;
    received?: string | number;

    constructor(opts: PredicateDefinition) {
        this.#operatorName = opts.operator;
        this.#operator = operators[opts.operator] || (() => false);
        this.#value = opts.value;
        this.#property = opts.property;

        if (!opts.property) {
            throw new Error(`invalid predicate: a property path is required`);
        }

        if (!opts.operator) {
            throw new Error(`invalid predicate: an operator is required`);
        }

        if (opts.value == null) {
            throw new Error(`invalid predicate: an expected value is required`);
        }

        const propertyMatch = opts.property.match(propPattern);

        if (!propertyMatch) {
            throw new Error(`invalid property path \`${opts.property}\``);
        }

        if (propertyMatch[1] && propertyMatch[3]) {
            this.#propertyLookup = (context: any) => {
                return context[propertyMatch[1]][propertyMatch[3]];
            };
        } else if (propertyMatch[1] && !propertyMatch[3]) {
            this.#propertyLookup = (context: any) => {
                return context[propertyMatch[1]];
            };
        } else {
            throw new Error(`invalid property path \`${opts.property}\``);
        }
    }

    toString() {
        return `(${this.#property} ${this.#operatorName} ${JSON.stringify(this.#value)})`;
    }

    get expected() {
        return this.#value;
    }

    execute(context: { [key: string]: any }): boolean {
        this.received = this.#propertyLookup(context);
        return this.#operator(this.received, this.#value);
    }
}
