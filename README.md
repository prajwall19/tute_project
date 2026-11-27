CityFix — Building Better Cities

A civic technology solution developed for the TuteDude Buildathon to make urban living better, safer, smarter, and more accessible.

1. Project Overview

CityFix aims to help citizens identify and address real-world urban challenges such as poor infrastructure, waste management, traffic, public safety, and accessibility to public services.

Our goal is to build a functional, user-friendly solution that connects citizens with civic problems and encourages meaningful community participation.

Buildathon: TuteDude Buildathon
Project: CityFix
Team size: 4 members
Project status: Under development

2. Problem Statement

Many urban problems remain unresolved because citizens lack convenient ways to report them, track their progress, or understand how their communities are responding.

CityFix aims to make civic problem-solving more accessible by providing a platform where citizens can report issues and engage with their communities.

3. Project Objectives

- Identify and address a meaningful urban problem.
- Develop a working civic technology solution.
- Make the platform simple and accessible to citizens.
- Encourage community participation and awareness.
- Demonstrate a practical solution with potential real-world impact.

4. Team Responsibilities

Member| Responsibility
Member 1| Frontend development and user interface
Member 2| Backend development, database, and API
Member 3| Research, branding, landing page, and media
Member 4 — Team Lead| Integration, GitHub management, testing, and final submission

Member 1 — Frontend Development

Responsible for building the user-facing interface.

Tasks:

- Develop responsive and accessible pages.
- Implement the issue reporting interface.
- Display reported issues and their statuses.
- Connect the frontend with the backend.
- Handle loading, success, and error states.

Branch: "feature/member1-frontend"

Member 2 — Backend Development

Responsible for backend functionality and data management.

Tasks:

- Design the database structure.
- Implement API endpoints.
- Handle issue submission and retrieval.
- Implement validation and error handling.
- Provide API documentation and setup instructions.

Branch: "feature/member2-backend"

Member 3 — Research, Branding, and Media

Responsible for project research and communication.

Tasks:

- Research the selected urban problem.
- Identify affected users and existing solutions.
- Create the project logo, color palette, and typography.
- Prepare landing-page content.
- Create the launch film and explainer video.
- Prepare at least five original social media posts.

Branch: "feature/member3-brand-content"

Member 4 — Integration and GitHub Management

Responsible for coordinating the development process and preparing the final product.

Tasks:

- Create and maintain the GitHub repository.
- Coordinate branch creation and collaboration.
- Review pull requests.
- Integrate frontend and backend.
- Resolve merge conflicts with the relevant member.
- Test the complete application.
- Maintain README and project documentation.
- Prepare the final submission.

Branch: "main" for integration and release.

5. Technology Stack

The final technology stack will be confirmed by the team.

Component| Technology
Frontend| To be finalized
Backend| To be finalized
Database| To be finalized
Version Control| Git and GitHub
Design| Figma or equivalent
Deployment| To be finalized

All members must coordinate before adding new libraries, frameworks, or dependencies.

6. Repository Structure

The following structure is a proposed organization for the project:

CityFix/
│
├── frontend/
│   └── Frontend application
│
├── backend/
│   └── Backend application
│
├── docs/
│   ├── problem-research.md
│   ├── api-documentation.md
│   └── technical-documentation.md
│
├── assets/
│   ├── logo/
│   └── images/
│
├── .gitignore
├── .env.example
└── README.md

The final folder structure may change depending on the selected technology stack.

7. Git and GitHub Collaboration

We use Git and GitHub to allow all members to work independently while maintaining one integrated project.

Branch Structure

main
│
├── feature/member1-frontend
├── feature/member2-backend
└── feature/member3-brand-content

- "main" is the stable integration branch.
- Each member works on their own feature branch.
- Changes are integrated through pull requests.
- No member should directly push unfinished work to "main".

Getting Started

Clone the repository:

git clone https://github.com/OWNER/REPOSITORY.git

Enter the project folder:

cd REPOSITORY

Check your current branch:

git branch

Create Your Feature Branch

For Member 1:

git switch main
git pull origin main
git switch -c feature/member1-frontend

For Member 2:

git switch main
git pull origin main
git switch -c feature/member2-backend

For Member 3:

git switch main
git pull origin main
git switch -c feature/member3-brand-content

Each member should create and use only their assigned branch.

Save and Push Your Work

After making changes:

git status
git add .
git commit -m "feat: describe your changes"
git push -u origin YOUR-BRANCH-NAME

Replace "YOUR-BRANCH-NAME" with your actual branch name.

Pull Request Workflow

1. Push your changes to GitHub.
2. Open the repository and select Pull requests.
3. Click New pull request.
4. Select "main" as the base branch.
5. Select your feature branch as the compare branch.
6. Explain what you changed and how you tested it.
7. Request review from Member 4.
8. Merge only after approval and successful testing.

8. Commit Message Guidelines

Use clear and meaningful commit messages.

Examples:

feat: add issue reporting form
feat: implement issue listing API
fix: resolve frontend validation error
docs: update project setup instructions
style: improve mobile layout

Avoid unclear messages such as:

changes
final
updated
new code

9. Collaboration Rules

1. Every member must work in their assigned branch.
2. Always pull the latest "main" before starting new work.
3. Commit and push changes regularly.
4. Do not modify another member's files without coordination.
5. Communicate before changing shared components or API contracts.
6. Never commit passwords, API keys, tokens, or private information.
7. Do not merge untested code into "main".
8. Report blockers and integration issues to Member 4.
9. Keep the README and technical documentation updated.

10. Running the Project

The exact commands will be added after the technology stack is finalized.

Frontend

cd frontend
# Install dependencies
# Start the development server

Backend

cd backend
# Create and activate the environment
# Install dependencies
# Start the backend server

Refer to the frontend and backend setup instructions for the exact commands.

11. Project Deliverables

Our final submission will include:

- A working civic technology solution.
- Problem research and validation.
- Technical documentation and source code.
- A publicly accessible landing page.
- A brand kit containing the logo, colors, and typography.
- A 60–90 second launch film.
- A 2–3 minute explainer video with a working demonstration.
- At least five original social media posts.
- Links to the project and supporting materials.

12. Responsible Development

- Use original work created during the Buildathon.
- Disclose AI tools, libraries, APIs, and datasets used.
- Clearly label synthetic or demo data.
- Respect user privacy and applicable laws.
- Do not claim official government affiliation without authorization.
- Obtain permission before filming in private spaces.
- Keep all claims about real-world impact truthful and evidence-based.

13. Project Deadline

Final submission deadline: Saturday, 28 November 2026, 11:59 PM.

All team members must complete their assigned work, coordinate integration, and verify submission links before the deadline.

14. Contact and Team Coordination

For project-related discussions, use the team's designated communication group.

Every member should communicate progress, blockers, and completed tasks regularly so the team can integrate work efficiently.

---

CityFix — Building better cities, together.
