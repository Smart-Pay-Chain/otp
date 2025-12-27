# Contributing to @smartpaychain/otp-sdk

Thank you for your interest in contributing to the Smart Pay Chain OTP SDK! We welcome contributions from the community.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Making Changes](#making-changes)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)
- [Coding Guidelines](#coding-guidelines)
- [Release Process](#release-process)

## Code of Conduct

This project adheres to a code of conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to support@smartpaychain.com.

## Getting Started

1. Fork the repository on GitHub
2. Clone your fork locally
3. Create a new branch for your changes
4. Make your changes
5. Push to your fork
6. Submit a pull request

## Development Setup

### Prerequisites

- Node.js >= 16.0.0
- npm or yarn
- Git

### Installation

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/otp.git
cd otp

# Install dependencies
npm install

# Run tests to ensure everything works
npm test
```

### Project Structure

```
otp/
├── src/              # Source code
│   ├── types.ts      # Type definitions
│   ├── errors.ts     # Error classes
│   ├── http-client.ts # HTTP client
│   ├── otp-client.ts # Main OTP client
│   └── index.ts      # Exports
├── tests/            # Test files
├── examples/         # Usage examples
└── dist/             # Compiled output (generated)
```

## Making Changes

### Creating a Branch

Create a descriptive branch name:

```bash
git checkout -b feature/add-new-feature
git checkout -b fix/fix-bug-description
git checkout -b docs/improve-documentation
```

### Writing Code

1. Follow the existing code style
2. Add TypeScript types for all new code
3. Write clear, descriptive comments
4. Keep functions small and focused
5. Avoid breaking changes when possible

### Adding Features

When adding a new feature:

1. Add types in `src/types.ts`
2. Implement the feature in the appropriate file
3. Export from `src/index.ts` if public
4. Add comprehensive tests
5. Add examples in `examples/`
6. Update documentation in `README.md`

### Fixing Bugs

When fixing a bug:

1. Add a test that reproduces the bug
2. Fix the bug
3. Ensure the test now passes
4. Add a comment explaining the fix

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm test -- --coverage
```

### Writing Tests

- Place tests in the `tests/` directory
- Name test files as `*.test.ts`
- Aim for high test coverage (>80%)
- Test both success and error cases
- Use descriptive test names

Example test:

```typescript
describe('OtpClient', () => {
  describe('sendOtp', () => {
    it('should send OTP successfully', async () => {
      // Arrange
      const client = new OtpClient({ apiKey: 'test' });
      
      // Act
      const result = await client.sendOtp({
        phoneNumber: '+995555123456',
      });
      
      // Assert
      expect(result.requestId).toBeDefined();
    });
  });
});
```

## Submitting Changes

### Before Submitting

1. Run tests: `npm test`
2. Run linter: `npm run lint`
3. Format code: `npm run format`
4. Build successfully: `npm run build`
5. Update documentation if needed

### Pull Request Process

1. Update the README.md with details of changes if applicable
2. Update the CHANGELOG.md with your changes
3. Ensure all tests pass
4. Request review from maintainers
5. Address any feedback

### Pull Request Guidelines

- Use a clear, descriptive title
- Reference any related issues
- Describe what changed and why
- Include screenshots for UI changes
- Keep PRs focused on a single concern

Example PR description:

```markdown
## Description
Add support for custom timeout configuration

## Motivation
Users need to configure longer timeouts for certain network conditions

## Changes
- Added `timeout` option to `OtpClientConfig`
- Updated documentation
- Added tests

## Related Issues
Closes #123
```

## Coding Guidelines

### TypeScript

- Use strict TypeScript settings
- Define types for all function parameters and return values
- Avoid `any` type when possible
- Use interfaces for object types
- Use enums for fixed sets of values

### Naming Conventions

- Classes: `PascalCase`
- Interfaces: `PascalCase`
- Functions: `camelCase`
- Constants: `UPPER_SNAKE_CASE`
- Files: `kebab-case.ts`

### Code Style

- Use 2 spaces for indentation
- Use single quotes for strings
- Add trailing commas in multiline objects/arrays
- Use semicolons
- Max line length: 100 characters

### Documentation

- Add JSDoc comments for all public APIs
- Include examples in documentation
- Keep README.md up to date
- Document breaking changes

Example documentation:

```typescript
/**
 * Send an OTP to a phone number
 *
 * @param options - Options for sending the OTP
 * @returns Promise resolving to the OTP request details
 *
 * @example
 * ```typescript
 * const result = await client.sendOtp({
 *   phoneNumber: '+995555123456',
 * });
 * ```
 */
async sendOtp(options: SendOtpOptions): Promise<SendOtpResponse> {
  // Implementation
}
```

## Release Process

Releases are handled by maintainers:

1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Create a git tag
4. Push to GitHub
5. Publish to npm
6. Create GitHub release

Version numbering follows [Semantic Versioning](https://semver.org/):

- MAJOR: Breaking changes
- MINOR: New features (backward compatible)
- PATCH: Bug fixes (backward compatible)

## Questions?

If you have questions:

1. Check existing issues and discussions
2. Review the documentation
3. Ask in a new GitHub issue
4. Email support@smartpaychain.com

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

