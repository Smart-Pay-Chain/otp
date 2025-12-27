# Publishing Guide

This guide explains how to publish the @smartpaychain/otp-sdk package to npm.

## Prerequisites

Before publishing, ensure you have:

1. **npm Account**: Create one at [npmjs.com](https://www.npmjs.com/signup)
2. **Organization Access**: Request access to `@smartpaychain` organization
3. **2FA Enabled**: Enable two-factor authentication for security
4. **npm Login**: Login to npm CLI

```bash
npm login
```

## Pre-Publishing Checklist

Before publishing a new version, complete these steps:

### 1. Update Version

Update the version in `package.json` following [Semantic Versioning](https://semver.org/):

```bash
# For bug fixes
npm version patch

# For new features (backward compatible)
npm version minor

# For breaking changes
npm version major
```

Or manually update `package.json`:

```json
{
  "version": "1.0.0"
}
```

### 2. Update Changelog

Update `CHANGELOG.md` with:
- Version number and date
- List of changes (Added, Changed, Fixed, Removed)
- Breaking changes (if any)

Example:

```markdown
## [1.0.0] - 2025-12-25

### Added
- Initial release
- Support for SMS, WhatsApp, and Voice channels
- Comprehensive error handling
- TypeScript support

### Changed
- None

### Fixed
- None
```

### 3. Run Tests

Ensure all tests pass:

```bash
npm test
```

### 4. Build the Package

Build the package to generate distribution files:

```bash
npm run build
```

This will:
- Run tests (via `prebuild` script)
- Compile TypeScript to JavaScript
- Generate type definitions
- Output to `dist/` directory

### 5. Lint and Format

Ensure code quality:

```bash
npm run lint
npm run format
```

### 6. Test the Package Locally

Test the package locally before publishing:

```bash
# Pack the package
npm pack

# This creates a .tgz file like smartpaychain-otp-sdk-1.0.0.tgz
# Install it in a test project
cd /path/to/test/project
npm install /path/to/otp/smartpaychain-otp-sdk-1.0.0.tgz

# Test that it works
```

### 7. Review Package Contents

Check what will be published:

```bash
npm pack --dry-run
```

Ensure only necessary files are included:
- ✅ `dist/` - Compiled JavaScript and types
- ✅ `README.md` - Documentation
- ✅ `LICENSE` - License file
- ✅ `package.json` - Package metadata
- ❌ `src/` - Source TypeScript files (excluded)
- ❌ `tests/` - Test files (excluded)
- ❌ `node_modules/` - Dependencies (excluded)

## Publishing

### First-time Setup

If this is the first time publishing:

1. **Create Organization** (if it doesn't exist):
```bash
npm org create smartpaychain
```

2. **Set Package Access**:
For scoped packages, set to public:
```bash
npm access public @smartpaychain/otp-sdk
```

### Publish to npm

#### Option 1: Standard Release

```bash
npm publish --access public
```

#### Option 2: Beta Release

For pre-release versions:

```bash
# Update version to beta
npm version 1.1.0-beta.0

# Publish with beta tag
npm publish --tag beta --access public
```

Users can install beta versions:
```bash
npm install @smartpaychain/otp-sdk@beta
```

### Post-Publishing Steps

1. **Verify Publication**:
```bash
npm info @smartpaychain/otp-sdk
```

2. **Create Git Tag**:
```bash
git tag v1.0.0
git push origin v1.0.0
```

3. **Create GitHub Release**:
- Go to GitHub repository
- Create new release from tag
- Add release notes from CHANGELOG
- Attach any relevant files

4. **Update Documentation**:
- Update website documentation
- Update API documentation
- Announce on social media/blog

## Versioning Strategy

Follow [Semantic Versioning 2.0.0](https://semver.org/):

### Version Format: MAJOR.MINOR.PATCH

- **MAJOR** (1.x.x): Breaking changes
  - API changes that break backward compatibility
  - Removed features
  - Changed function signatures

- **MINOR** (x.1.x): New features
  - New functionality (backward compatible)
  - New methods or options
  - Deprecations (with backward compatibility)

- **PATCH** (x.x.1): Bug fixes
  - Bug fixes
  - Performance improvements
  - Documentation updates

### Pre-release Versions

- `1.0.0-alpha.1` - Alpha version
- `1.0.0-beta.1` - Beta version
- `1.0.0-rc.1` - Release candidate

## Troubleshooting

### "You do not have permission to publish"

```bash
# Login to npm
npm login

# Verify you're logged in
npm whoami

# Check organization membership
npm org ls smartpaychain
```

### "Package name already exists"

The package name is already taken. Choose a different name in `package.json`.

### "prepublishOnly script failed"

This means tests or build failed. Fix the issues before publishing:

```bash
npm test
npm run build
```

### "Invalid version"

Ensure version in `package.json` follows semver:
- ✅ `1.0.0`
- ✅ `1.0.0-beta.1`
- ❌ `v1.0.0`
- ❌ `1.0`

## Unpublishing

⚠️ **Warning**: Unpublishing is discouraged and has restrictions.

You can only unpublish within 72 hours of publishing:

```bash
npm unpublish @smartpaychain/otp-sdk@1.0.0
```

To unpublish the entire package:

```bash
npm unpublish @smartpaychain/otp-sdk --force
```

**Better alternative**: Deprecate instead of unpublishing:

```bash
npm deprecate @smartpaychain/otp-sdk@1.0.0 "This version has been deprecated. Please use 1.0.1+"
```

## CI/CD Automation

For automated publishing via GitHub Actions:

1. **Create `.github/workflows/publish.yml`**:

```yaml
name: Publish to npm

on:
  release:
    types: [created]

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          registry-url: 'https://registry.npmjs.org'
      
      - run: npm ci
      - run: npm test
      - run: npm run build
      
      - run: npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

2. **Add npm token to GitHub secrets**:
- Create npm access token: `npm token create`
- Add to GitHub repository secrets as `NPM_TOKEN`

## Security Best Practices

1. **Enable 2FA** on your npm account
2. **Use access tokens** instead of passwords in CI/CD
3. **Review dependencies** regularly: `npm audit`
4. **Sign commits** with GPG keys
5. **Never commit** `.env` files or secrets
6. **Use `.npmignore`** or `files` in `package.json` to exclude sensitive files

## Support

For publishing issues:

- npm support: https://www.npmjs.com/support
- GitHub Issues: https://github.com/Smart-Pay-Chain/otp/issues
- Email: support@smartpaychain.com

