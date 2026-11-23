## Instructions - AI Agents Template repository

I want to make a initializer that works for all AI Agents that i use
currently:

- Open Code
- Antigravity
- Claude
- Codex
- Cursor

And all technologies

The idea is to have a NX monorepo with one package called initializer
that will take care of the initialization of the project based on the
purposes of it and its languages/package-manager/

### JS/TS Package Managers

- Yarn
- Npm
- Pnpm
- Bun

### Available Languages

- Typescript
- Go Lang
- Rust
- Solidity

### Applications & Packages

- Just a screen where the user will add the apps and packages that the
  repository will contain.

### Frameworks and Setup

Typescript:

- Ink - React Framework for building command line interfaces
- NextJS - React Framework for Building Static Webpages
- React Vite - Simple Barebones React Setup
- NuxtJS - Vue Framework for building Websites
- Tauri - Rust & React Desktop Apps
- React Native - Mobile Applications
- Lynx - Mobile Applications and More
- Elysia - Rest API Framework (only w/ bun)
- Express - Rest API Framework
- Koa - Rest API Framework
- Fastify - Rest API Framework
- Hono - Rest API Framework
- Vitest - Test Runner
- Jest - Test Runner
- Playwright - E2E Headless Browser Testing Suite
- ESLint - Linter
- Biome - Linter
- OXC - Linter
- Prettier - Formatter
- Kysely - SQL ORM
- Drizzle - SQL ORM
- TypeORM - Typesafe ORM SQL / NoSQL
- Mongoose - MongoDB ODM

Web Marketing Design System Components:

- Acceternity UI
- Inspira UI
- Magic UI

Web Design System Components:

- ShadCN
- Inspira UI
- Park UI

Vue Animations:

- Motion & Motion AI

React Web Animations:

- Framer Motion
- Motion & Motion AI

Mobile CSS:

- Native Wind
- StyleSheets
- UniWind
- UniStyles
- Tamagui

CSS:

- TailwindCSS
- StyleX
- Styled Components
- Sass
- Pure CSS
- ...

GoLang:

- Fiber - Rest API Framework
- Gin - Rest API Framework
- Chi - Rest API Framework
- Echo - Rest API Framework

Rust:

- Anchor: Solana Smart Contracts
- SorobanSDK: Stellar Smart Contracts
- NearSDK: Near Smart Contracts
- StylusSDK: Arbitrum EVM Smart Contracts
- Axum - Rest API Framework
- Hyper - Rest API Framework

Solidity:

- Foundry
- Hardhat

### Additional Tools & Skills

- AI Memory - https://github.com/akitaonrails/ai-memory
- CommitLint + Husky + Prettier
- Security Checker - OpenGrep + GitLeaks
- Spaghetti Checker -
  https://github.com/StrangeDaysTech/arborist-metrics
- O(1) Complexity Checker - Checker to see how complex a code is to
  execute, flags that so we can fix the issue
- N+1 SQL Queries Checker - Counts SQL Quereies number at a execution
  layer, its a code analyzer and codesmell for catching issues
- Commit Separately - A simple skill that will check the current code
  and split in separate commits to better visualize the changes on PR.

### AI Definitions and Guidance Rules

NOTE: Important! The ecosystem should be the same for all AI Agents, we
need to make a simple universal setup that works with everything

- Quality Gating
- Security
- Test Driven
- Regression Testing
- E2E Testing
- Web Anti Patterns
- Backend Anti Patterns
- Go Anti Patterns
- Rust Anti Patterns
- Project Architecture
- Project Overview
- Web UI Components inside packages/ui
- Mobile UI Components inside packages/ui-mobile
- Docs Sync - If any implementation changes check documentation to be
  automatically updated that includes all markdowns infos for the project
  and new users (AI Agents Docs, Skills, Readme, Contributing)

## CLI Workflows

#### Update helper

This workflow is a idea that i had where the user could run this command to ensure that all packages are in their latest versions and make sure that all versions that we are adding are audited and safe to use.

#### Normalize Setup

1. User Selects the agent that will perform the normalization based on the choices of Tools Skills missing
2. Detect Current tools and what the user currently has creates a form where the user can choose what to add and keep based on initialize setup selectors
3. Updates and make sure that all selected tools are installed

#### CORE: Initialize Setup

1. Informations Step

User informs:

- Repo Name: Github repository name with no spaces
- Description: Github repository description and package description
- Author: Github user handle
- Setup CODEOWNERS?

2. User Selects the Stack informations

I wanted to let the user to choose the tools they need such as:

- Languages Selection
- Is a Monorepo
  - Use Makefiles for non Javascript Projects?
- Frameworks Selection
- Additional Tools Selection

3. Architecture & Project Structure Editor

4. Architecture & Project Structure Selector

Allow users to configure project architecture and file organization during project initialization.

Architecture Pattern

- **Standard** — Simple project structure with minimal abstraction.
- **Layered** — Organize code by responsibilities (controllers, services, repositories).
- **Modular** — Independent modules with explicit boundaries.
- **Ports & Adapters (Hexagonal)** — Separate domain logic from external dependencies.
- **Clean Architecture** — Organize code around entities, use cases, interfaces, and infrastructure.
- **Vertical Slice** — Group code by individual features and use cases.

Folder Organization

- **Flat** — Minimal folder hierarchy.
- **Layer-based** — Group files by technical responsibility.
- **Feature-based** — Group files by feature.
- **Module-based** — Group files into independent modules.

File Naming Convention

- **Kebab-case (default)** — `this-pattern-for-file-names.test.ext`
- **CamelCase** — `thisPatternForFileNames.test.ext`
- **PascalCase** — `ThisPatternForFileNames.test.ext`
- **Snake_case** — `this_pattern_for_file_names.test.ext`

Test File Organization

- **Colocated** — Tests alongside source files (`user.service.test.ts`).
- **Dedicated `__tests__` folders** — Tests inside feature/module-specific `__tests__/` directories.
- **Root `tests/` directory** — Centralized test structure mirroring the source tree.

Additional Options

- **Strict Architecture Boundaries** — Enforce dependency and module import rules.
- **Path Aliases** — Generate aliases for internal imports.
- **Barrel Exports** — Generate `index.ts` entry points where applicable.
- **Example Module** — Generate an example following the selected architecture.

Requirements

- Only display architecture options compatible with the selected language/framework.
- Allow compatible architecture and folder organization combinations.
- Show a folder structure preview before project generation.
- Persist all selections in the project's bootstrap configuration.
- Apply the selected conventions to future CLI-generated files and modules.
- Use language-specific file extensions and naming conventions.

## CLI Project Stack

- Vitest
- Typescript
- React Ink

## Landing & Docs - Page

Create Docs Page for the project as well, and a cool landing page

Stack:

- NextJS
- Typecript
- Tailwind
- ShadCN
- AcceternityUI, with pro and keys on .env

## Readme

Create a cool opensource project readme where we can have lots of informations

## Important things

- Since this project is a intitializer, let's use all the tools and rules and agents stuff for this project
- This will initialize other projects lets ensure that we can make sure that we only use audited versions and let's pin all versions for the projects
- I want you to oneshot all features based on the design kit attached

## Design References

I want this repo Design to be Liquid Glassy for landing page, using futurama references:

- Planet Express Ship
- Bender for the Mascot

Make a cool landing page with that vision dark/light mode ask well
https://asciiart.website/art/4158 - Planet Express in Ascii
https://gitlab.com/christosangel/ascii-matrix/-/tree/main - Use Bender ASCII
