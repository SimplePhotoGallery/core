/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  testMatch: ['**/tests/**/*.test.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  transformIgnorePatterns: ['node_modules/(?!(@simple-photo-gallery/common)/)'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^@simple-photo-gallery/common$': '<rootDir>/../common/src/gallery.ts',
    '^@simple-photo-gallery/common/theme$': '<rootDir>/../common/src/theme/index.ts',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: {
          module: 'ES2022',
        },
      },
    ],
  },
  // Run tests serially to avoid race conditions with file system operations
  maxWorkers: 1,
};
