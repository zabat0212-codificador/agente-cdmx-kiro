# Requirements Document

## Introduction

The hackathon-team-bootstrap feature scaffolds a shared repository for a hackathon team with three roles: agent, data and UI. The Bootstrap_Script creates the folder layout, a .gitignore, a copy of ECC skills and agents, a team steering file (protocolo-equipo.md), a starter type contract (src/types/contract.ts), placeholder files for empty role folders, and an initialized Git repository pushed to a remote.

## Glossary

- **Bootstrap_Script**: The automated procedure that scaffolds the repository in the workspace root.
- **Workspace_Root**: The directory /Users/zabat0212/Desktop/hackathon.
- **Role_Folder**: A directory dedicated to one team role (agent, data or UI) under the Workspace_Root.
- **ECC_Source**: The existing location of ECC skills and agents that the Bootstrap_Script copies from.
- **Steering_File**: The file .kiro/steering/protocolo-equipo.md describing the team protocol.
- **Contract_File**: The file src/types/contract.ts that holds the shared TypeScript interfaces.
- **Gitkeep_File**: An empty file named .gitkeep placed in a directory so Git tracks the directory.
- **Remote_Origin**: The Git remote named origin that the Bootstrap_Script pushes to.
- **Bootstrap_Report**: The summary the Bootstrap_Script prints listing each step as succeeded, skipped or failed.

## Requirements

### Requirement 1: Folder structure

**User Story:** As a team member, I want the folder structure created automatically, so that each role has a defined place to work.

#### Acceptance Criteria

1. WHEN the Bootstrap_Script runs, THE Bootstrap_Script SHALL create one Role_Folder each for the agent, data and UI roles under the Workspace_Root.
2. WHEN the Bootstrap_Script runs, THE Bootstrap_Script SHALL create the directory src/types under the Workspace_Root.
3. WHEN the Bootstrap_Script runs, THE Bootstrap_Script SHALL create the directory .kiro/steering under the Workspace_Root.
4. IF a target directory already exists, THEN THE Bootstrap_Script SHALL leave the existing directory and its contents unchanged.

### Requirement 2: Gitignore file

**User Story:** As a team member, I want a .gitignore file, so that generated and sensitive files stay out of version control.

#### Acceptance Criteria

1. WHEN the Bootstrap_Script runs, THE Bootstrap_Script SHALL create a .gitignore file at the Workspace_Root.
2. THE Bootstrap_Script SHALL include in the .gitignore file entries for node_modules, .env files, build output directories and operating system metadata files.
3. IF a .gitignore file already exists at the Workspace_Root, THEN THE Bootstrap_Script SHALL keep the existing entries and append only the missing required entries.

### Requirement 3: ECC skills and agents copy

**User Story:** As a team member, I want the ECC skills and agents copied into the repository, so that everyone starts with the same tooling.

#### Acceptance Criteria

1. WHEN the ECC_Source is available, THE Bootstrap_Script SHALL copy the ECC skills and agents into the Workspace_Root.
2. IF the ECC_Source is missing or the copy fails, THEN THE Bootstrap_Script SHALL record the failure in the Bootstrap_Report and continue with the remaining steps.
3. IF a file to be copied already exists at the destination, THEN THE Bootstrap_Script SHALL keep the existing file.

### Requirement 4: Team steering file

**User Story:** As a team member, I want a steering file describing the team protocol, so that every role and AI assistant follows the same rules.

#### Acceptance Criteria

1. WHEN the Bootstrap_Script runs, THE Bootstrap_Script SHALL create the Steering_File at .kiro/steering/protocolo-equipo.md.
2. THE Steering_File SHALL state that src/types/contract.ts is the single source of truth for types shared between roles.
3. THE Steering_File SHALL describe the responsibilities of the agent, data and UI roles.
4. THE Steering_File SHALL be written in Spanish.
5. IF the Steering_File already exists, THEN THE Bootstrap_Script SHALL keep the existing file unchanged.

### Requirement 5: Starter type contract

**User Story:** As a team member, I want a starter type contract, so that the three roles can integrate against shared interfaces from the first commit.

#### Acceptance Criteria

1. WHEN the Bootstrap_Script runs, THE Bootstrap_Script SHALL create the Contract_File at src/types/contract.ts.
2. THE Contract_File SHALL export one placeholder interface for the agent role, one for the data role and one for the UI role.
3. THE Contract_File SHALL contain only minimal placeholder members in each interface.
4. THE Contract_File SHALL compile without errors under the TypeScript compiler.
5. IF the Contract_File already exists, THEN THE Bootstrap_Script SHALL keep the existing file unchanged.

### Requirement 6: Placeholder files for empty role folders

**User Story:** As a team member, I want empty role folders tracked by Git, so that the structure is preserved after cloning.

#### Acceptance Criteria

1. WHEN a Role_Folder contains no files after scaffolding, THE Bootstrap_Script SHALL create a Gitkeep_File in that Role_Folder.
2. WHILE a Role_Folder contains at least one file other than a Gitkeep_File, THE Bootstrap_Script SHALL omit the Gitkeep_File from that Role_Folder.

### Requirement 7: Git initialization and push

**User Story:** As a team member, I want the repository initialized, committed and pushed, so that the team can start collaborating immediately.

#### Acceptance Criteria

1. WHEN the scaffolding steps are complete, THE Bootstrap_Script SHALL initialize a Git repository at the Workspace_Root if none exists.
2. WHEN the Git repository is initialized, THE Bootstrap_Script SHALL name the default branch main.
3. WHEN the Git repository is initialized, THE Bootstrap_Script SHALL create an initial commit containing all scaffolded files.
4. WHERE a remote URL is provided, THE Bootstrap_Script SHALL configure Remote_Origin with that URL.
5. WHERE a remote URL is provided, THE Bootstrap_Script SHALL push the main branch to Remote_Origin.
6. IF the push fails because of missing credentials or a nonexistent remote, THEN THE Bootstrap_Script SHALL record the failure and the manual push command in the Bootstrap_Report and finish with the local commit intact.
7. IF no remote URL is provided, THEN THE Bootstrap_Script SHALL skip the push and record the skip in the Bootstrap_Report.

### Requirement 8: Bootstrap report and idempotence

**User Story:** As a team member, I want a clear report of what happened, so that I know which steps need manual follow-up.

#### Acceptance Criteria

1. WHEN the Bootstrap_Script finishes, THE Bootstrap_Script SHALL print the Bootstrap_Report listing each step as succeeded, skipped or failed.
2. WHEN the Bootstrap_Script is run a second time on the same Workspace_Root, THE Bootstrap_Script SHALL complete without overwriting existing files.
