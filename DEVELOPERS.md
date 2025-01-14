# Developer Guide

## Prerequisites

- Node.js 20.x
- npm 10.x

## Container Development Environment

The project provides a containerized development environment based on Ubuntu 24.04 with all necessary tools and dependencies pre-installed. This ensures consistent development experience across different machines and operating systems.

### Development Workflows

1. Regular Development (IDE on host system):
   - You can run your IDE (e.g., VS Code) directly on your Fedora system
   - Use `./container/run.sh` only when you need to run headed Playwright tests

2. Container-based Development (IDE in container):
   - Run your IDE through the container for full environment consistency
   - Place Cursor.AppImage in your home directory (automatically mounted by Toolbox)

   ```bash
   ./container/run.sh ~/Cursor.AppImage
   ```

3. Container Development (modifying container setup):
   - When modifying Dockerfile or container configuration
   - Use `rebuild-and-run.sh` to test your changes

   ```bash
   ./container/rebuild-and-run.sh ~/Cursor.AppImage
   ```

### Container Scripts

Two scripts are available in the `container/` directory:

#### `run.sh`

Quick start script for daily development. Uses an existing container without rebuilding it.

```bash
# Start an interactive shell in the container
./container/run.sh

# Run Cursor IDE from the container (when needed for headed tests)
# Note: Place Cursor.AppImage in your home directory
./container/run.sh ~/Cursor.AppImage

# Run Playwright tests with headed browsers
./container/run.sh npx playwright test --headed
```

#### `rebuild-and-run.sh`

Use this script when you need to rebuild the container from scratch (e.g., after Dockerfile changes or when the container is corrupted).

```bash
# Rebuild container and start an interactive shell
./container/rebuild-and-run.sh

# Rebuild container and start Cursor IDE
./container/rebuild-and-run.sh ~/Cursor.AppImage
```

### Playwright Testing in Container

When running Playwright tests that require browser interaction:

1. Use the container for consistent browser versions and dependencies
2. For debugging or visual inspection, use the `--headed` flag:

   ```bash
   ./container/run.sh npx playwright test --headed
   ./container/run.sh npx playwright test specific-test.spec.ts --headed
   ```

3. For debugging specific test cases:

   ```bash
   # Run with debug mode
   ./container/run.sh npx playwright test --debug

   # Run with UI mode for better test management
   ./container/run.sh npx playwright test --ui
   ```

### Technical Details

- The scripts automatically detect and use either `podman` or `docker` as the container runtime
- All GUI applications (browsers, IDE) are properly configured with display forwarding
- The container uses Toolbox which automatically mounts your home directory, making it easy to access files like Cursor.AppImage
- Error messages are properly directed to stderr for better debugging

## Setup

1. Clone the repository:

```bash
git clone <repository-url>
cd moje-spz.github.io
```

1. Install dependencies:

```bash
npm install
```

## Development

Most used command would be:

```bash
npm run dev
```

other commands:

- `npm run build` - Build for production
- `npm run preview` - Preview production build

Quality checks:

- `npm run test` - Run tests
- `npm run lint` - Run linting
- `npm run check` - Run type checking

## Visual Studio Code Setup

When you open the project in VS Code for the first time, you'll see a notification
about recommended extensions. You could also open Extensions sidebar and search for
`@recommended` to install all recommended extensions.

These extensions provide:

- Syntax highlighting and IntelliSense for Svelte
- Automatic code formatting on save
- Integrated test running and debugging
- Firefox debugging support

The project includes preconfigured:

- Launch configurations (.vscode/launch.json)
- Tasks (.vscode/tasks.json)
- Settings (.vscode/settings.json)

### Running the Application

Start debugging:

- Press `F5` or use "Run and Debug" sidebar
- Select "Launch Firefox" configuration
- The dev server will start and Firefox will open automatically
- Breakpoints in .ts and .svelte files will work

### Testing

1. Using VS Code UI:
   - Open "Testing" sidebar (beaker icon)
   - Two test suites are available:
     - Unit Tests (Vitest) - Component and utility tests
     - E2E Tests (Playwright) - Full application tests
   - Click play button next to suite to run
   - Results appear in Testing panel

2. Command line:

```bash
# Run unit tests
npm run test

# Run E2E tests
npm run playwright test
```

### Testing in Devcontainer

You can run Playwright tests in a devcontainer through Visual Studio Code on Linux
systems (tested on Ubuntu and Fedora):

1. Open the project in VS Code with the Dev Containers extension
2. Wait for the devcontainer to build and start
3. Use the Testing sidebar to run Playwright tests as described above

#### Debugging Playwright Tests

To debug Playwright tests and see the browser UI:

Install required browser dependencies on your host system:

```bash
sudo npx playwright install-deps
```

For more details about system requirements, consult the
[Playwright documentation](https://playwright.dev/docs/browsers#linux-dependencies).

Note: Browser UI debugging has been tested and confirmed working on Ubuntu. Fedora, for example, is not supported.

### Linting and Type Checking

The project uses ESLint for code linting and TypeScript for type checking.
To ensure code quality:

1. During development:

   ```bash
   # Run both linting and type checking
   npm run lint && npm run check

   # Fix auto-fixable linting issues
   npm run lint:fix
   ```

2. VS Code Integration:
   - TypeScript errors appear in real-time in the editor
   - Ensure you're using the workspace TypeScript version:
     1. Click on the TypeScript version in the bottom right
     2. Select "Use Workspace Version"
   - ESLint errors also appear in real-time with the ESLint extension

3. Common Issues:
   - If VS Code shows errors but `

All UI components are tested and optimized for these specific configurations to
ensure a consistent user experience.
