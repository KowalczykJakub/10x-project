# GitHub Actions CI/CD Configuration

This directory contains GitHub Actions workflows for automated testing, building, and deployment of the 10x-project.

## Workflows

### CI Pipeline (`ci.yml`)

The main CI pipeline runs on every push to `master` and on all pull requests. It consists of the following jobs:

#### 1. Lint
- Runs ESLint to check code quality
- Uses Node.js version from `.nvmrc` (22.14.0)
- Fails the build if linting errors are found

#### 2. Unit Tests
- Runs Vitest unit tests
- Generates code coverage reports
- Uploads coverage to Codecov (optional, requires setup)
- Uses the configuration from `vitest.config.ts`

#### 3. API Tests
- Runs API integration tests using Vitest
- Requires Supabase and OpenRouter credentials
- Uses the configuration from `vitest.api.config.ts`

#### 4. E2E Tests
- Runs end-to-end tests using Playwright
- Tests against Chromium browser
- Automatically starts dev server before tests
- Uploads test reports and screenshots on failure
- Artifacts are retained for 30 days

#### 5. Build
- Builds the Astro application
- Runs only after lint and tests pass
- Uploads build artifacts (retained for 7 days)
- Can be used for deployment

## Required Secrets

To run the workflows successfully, configure the following secrets in your GitHub repository settings (`Settings > Secrets and variables > Actions`):

### Supabase Configuration
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous/public key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (for API tests)

### External APIs
- `OPENROUTER_API_KEY` - OpenRouter API key for AI features

## Setting Up Secrets

1. Go to your repository on GitHub
2. Navigate to `Settings > Secrets and variables > Actions`
3. Click `New repository secret`
4. Add each secret with the exact name shown above
5. Save each secret

## Artifacts

The workflows produce several artifacts that can be downloaded from the Actions tab:

- **playwright-report**: HTML report of E2E test results (30 days retention)
- **test-results**: Raw Playwright test results and screenshots (30 days retention)
- **dist**: Production build of the application (7 days retention)

## Caching

The workflows use caching to speed up builds:

- **npm cache**: Caches `node_modules` based on `package-lock.json`
- **Playwright browsers**: Caches browser binaries to avoid re-downloading

## Node.js Version

The workflows automatically use the Node.js version specified in `.nvmrc` file (currently 22.14.0). Update the `.nvmrc` file to change the Node.js version across all workflows.

## Local Testing

To run the same checks locally before pushing:

```bash
# Linting
npm run lint

# Unit tests
npm run test:unit

# API tests (requires environment variables)
npm run test:api

# E2E tests
npm run test:e2e

# Build
npm run build
```

## Codecov Integration (Optional)

The unit test job includes Codecov integration for coverage reporting. To enable:

1. Sign up at [codecov.io](https://codecov.io)
2. Connect your GitHub repository
3. The workflow will automatically upload coverage reports
4. Set `fail_ci_if_error: true` if you want to enforce coverage requirements

## Troubleshooting

### Tests Failing in CI but Passing Locally

- Check that all required secrets are configured
- Ensure the Node.js version matches (check `.nvmrc`)
- Review the full logs in the Actions tab

### E2E Tests Timing Out

- E2E tests have a 30-second timeout per test
- Check the Playwright report artifact for details
- Screenshots are captured on failure

### Build Artifacts Not Available

- Artifacts are only created when the job completes
- Check retention periods (7-30 days)
- Failed jobs may not produce artifacts

## Extending the Workflow

### Adding a New Job

Add a new job to `.github/workflows/ci.yml`:

```yaml
my-new-job:
  name: My New Job
  runs-on: ubuntu-latest
  needs: [lint]  # Optional: depend on other jobs
  
  steps:
    - name: Checkout code
      uses: actions/checkout@v6
    
    - name: Setup Node.js
      uses: actions/setup-node@v6
      with:
        node-version-file: '.nvmrc'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run my script
      run: npm run my-script
```

### Adding Environment Variables

Add to the `env` section of the relevant job:

```yaml
env:
  MY_VAR: ${{ secrets.MY_VAR }}
  NODE_ENV: production
```

### Creating a New Workflow

Create a new `.yml` file in `.github/workflows/` directory with the workflow definition.

## Actions Used

This workflow uses the following verified GitHub Actions:

- [`actions/checkout@v6`](https://github.com/actions/checkout) - Check out repository code
- [`actions/setup-node@v6`](https://github.com/actions/setup-node) - Set up Node.js environment
- [`actions/upload-artifact@v6`](https://github.com/actions/upload-artifact) - Upload build artifacts
- [`codecov/codecov-action@v5`](https://github.com/codecov/codecov-action) - Upload coverage reports

All actions are pinned to major versions and are regularly updated.
