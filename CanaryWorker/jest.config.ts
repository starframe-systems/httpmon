import { pathsToModuleNameMapper } from 'ts-jest';
import { compilerOptions } from './tsconfig.json';

module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>'],
    transform: {
        '^.+\\.tsx?$': 'ts-jest',
    },
    moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, { prefix: '<rootDir>/src' }),
    modulePathIgnorePatterns: ['<rootDir>/dist/'],
    moduleDirectories: ['node_modules', 'src', 'test'],
    reporters: [
        'default',
        [
            'jest-ctrf-json-reporter',
            {
                outputFile: 'test-report.json',
                outputDir: '/tmp',
            },
        ],
    ],
};
