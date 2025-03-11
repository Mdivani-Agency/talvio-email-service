module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: ['src/**/*.{js,ts}', '!src/repositories/*.{js,ts}'],
  collectCoverage: true,
  testTimeout: 60000,
  moduleDirectories: ['node_modules', 'src', 'test'],
  setupFiles: ['<rootDir>/.jest/setEnvVars.ts'],
  testMatch: ['<rootDir>/src/**/*.spec.{ts,js}'],
  modulePaths: ['<rootDir>/test/'],
  coverageThreshold: {
    global: {
      statements: 40,
    },
  },
};
