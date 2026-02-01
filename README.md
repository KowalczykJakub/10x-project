# 10x-cards

An intelligent flashcard application that leverages AI to automatically generate educational flashcards from text input, helping users save time while creating high-quality study materials.

## Table of Contents

- [Project Description](#project-description)
- [Tech Stack](#tech-stack)
- [Getting Started Locally](#getting-started-locally)
- [Available Scripts](#available-scripts)
- [Project Scope](#project-scope)
- [Project Status](#project-status)
- [License](#license)

## Project Description

10x-cards is designed to solve the problem of time-consuming manual flashcard creation. The application enables users to quickly generate and manage educational flashcard sets by:

- **AI-Powered Generation**: Paste any text (e.g., textbook excerpts) and let the application generate flashcard suggestions using LLM models via API
- **Manual Creation**: Create flashcards manually with custom front and back content
- **Spaced Repetition**: Integrate with spaced repetition algorithms for effective learning
- **User Management**: Secure authentication and user accounts with GDPR-compliant data handling

The goal is to reduce the time needed to create quality questions and answers while simplifying the process of managing study materials.

## Tech Stack

### Frontend
- **Astro 5** - Fast, efficient web framework with minimal JavaScript
- **React 19** - Interactive components where needed
- **TypeScript 5** - Static typing for better code quality and IDE support
- **Tailwind 4** - Utility-first CSS framework for styling
- **Shadcn/ui** - Accessible React component library

### Backend
- **Supabase** - Backend-as-a-Service solution providing:
  - PostgreSQL database
  - Multi-language SDK
  - Built-in user authentication
  - Open-source, self-hostable option

### AI Integration
- **OpenRouter.ai** - Access to multiple LLM models (OpenAI, Anthropic, Google, etc.) with:
  - Cost-effective model selection
  - API key spending limits

### DevOps
- **GitHub Actions** - CI/CD pipelines
- **DigitalOcean** - Application hosting via Docker

## Getting Started Locally

### Prerequisites

- **Node.js**: Version 22.14.0 (specified in `.nvmrc`)
  - If using `nvm`, run: `nvm use`
- **npm**: Comes with Node.js

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd 10x-project
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
   - Create a `.env` file in the root directory
   - Add required environment variables for:
     - Supabase (database URL, anon key, service role key)
     - OpenRouter.ai (API key)
     - Other service configurations

4. Start the development server:
```bash
npm run dev
```

5. Open your browser and navigate to `http://localhost:4321` (or the port shown in the terminal)

## CI/CD

This project uses GitHub Actions for continuous integration and deployment. The CI pipeline automatically runs on every push to `master` and on all pull requests.

### Pipeline Jobs

1. **Lint** - Code quality checks with ESLint
2. **Unit Tests** - Vitest unit tests with coverage reporting
3. **API Tests** - Integration tests for API endpoints
4. **E2E Tests** - End-to-end tests with Playwright
5. **Build** - Production build verification

### Required Secrets

To run the CI pipeline, configure these secrets in GitHub repository settings:

- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `OPENROUTER_API_KEY` - OpenRouter API key

See [`.github/workflows/README.md`](.github/workflows/README.md) for detailed documentation.

## Available Scripts

### Development
- `npm run dev` - Start the Astro development server
- `npm run build` - Build the application for production
- `npm run preview` - Preview the production build locally
- `npm run astro` - Run Astro CLI commands

### Code Quality
- `npm run lint` - Run ESLint to check for code issues
- `npm run lint:fix` - Run ESLint and automatically fix issues
- `npm run format` - Format code using Prettier

### Testing
- `npm run test` - Run tests in watch mode
- `npm run test:unit` - Run unit tests
- `npm run test:api` - Run API integration tests
- `npm run test:e2e` - Run end-to-end tests with Playwright
- `npm run test:e2e:ui` - Run E2E tests in UI mode
- `npm run test:e2e:headed` - Run E2E tests in headed mode
- `npm run test:coverage` - Generate test coverage report
- `npm run test:all` - Run all tests (unit + E2E)

## Project Scope

### MVP Features (In Scope)

- ✅ AI-powered flashcard generation from text input (1000-10,000 characters)
- ✅ Manual flashcard creation and editing
- ✅ User authentication (registration and login)
- ✅ Flashcard management (view, edit, delete)
- ✅ Integration with spaced repetition algorithm
- ✅ Secure data storage with user isolation
- ✅ GDPR-compliant data handling
- ✅ Flashcard generation statistics

### Out of Scope (Future Considerations)

- ❌ Custom advanced spaced repetition algorithm (using open-source solution)
- ❌ Gamification features
- ❌ Mobile applications (web-only for MVP)
- ❌ Document import (PDF, DOCX, etc.)
- ❌ Public API
- ❌ Flashcard sharing between users
- ❌ Advanced notification system
- ❌ Advanced keyword search

## Project Status

**Current Version**: 0.0.1

This project is currently in **active development** (MVP stage). The application is being built according to the Product Requirements Document (PRD) with a focus on core functionality:

- Core features are being implemented
- User stories are being developed incrementally
- The project follows modern web development best practices
- Code quality is maintained through ESLint and Prettier

### Success Metrics (Target)

- 75% of AI-generated flashcards accepted by users
- At least 75% of new flashcards created using AI (vs. manual creation)
- Monitoring of generation statistics for quality analysis

## License

License information will be added once determined.

