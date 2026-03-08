# DevConnect

DevConnect is a social network for developers where users can share content, ask technical questions, showcase projects, and receive feedback. It combines features similar to LinkedIn and StackOverflow, with a strong focus on technical profiles and user interactions.

## Features

### User System
- **Registration & Login:** JWT-based authentication with refresh tokens.
- **Public Profile:** Avatar, biography, favorite technologies, and user level (junior, mid, senior).

### Posts (LinkedIn-style)
- Create text posts, share code, and GitHub links.
- Add tags like `angular`, `node`, `python`.
- Interactions: likes, comments, shares.

### Questions & Answers (StackOverflow-style)
- Ask questions, answer, vote, and mark solutions.
- Demonstrates advanced business logic.

### Technical User Profile
- Show technologies used, projects, statistics, and reputation.
- Example stats:
  - Questions asked
  - Accepted answers
  - Likes received
  - Reputation level

### Follow System
- Follow other users
- Personalized feed
- Demonstrates relationships between users

## Architecture

### Microservices
- **Auth Service (Node.js):** handles registration, login, JWTs, and refresh tokens. Uses SQL database.
- **User Service:** manages profiles, followers, and technologies. Uses SQL database.
- **Post Service:** manages posts, comments, likes. Uses NoSQL (MongoDB).
- **Question Service:** manages questions, answers, votes. Uses MongoDB.
- **Notification Service:** manages likes, comments, new followers, and question responses. Uses MongoDB.

### Databases
- **SQL (PostgreSQL or MySQL):** structured data (users, followers, roles, auth)
- **NoSQL (MongoDB):** dynamic content (posts, comments, questions, answers, notifications)

## Frontend (Angular)
- **Auth:** login, registration
- **Feed:** view posts and interactions
- **Questions:** list, detail, and answer questions
- **Profile:** public profile and statistics
- **Explorer:** search users and technologies

## Testing
- Unit tests for components, services, and pipes using [Vitest](https://vitest.dev/)
- Examples:
  - API service test
  - Login component test
  - Feed component test

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will reload automatically if you change any source files.

```bash
ng serve
