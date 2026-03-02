# langchain-with-nodejs
[![LangChain TypeScript](https://img.shields.io/badge/LangChain-TypeScript-3178C6?logo=typescript&logoColor=white)](https://js.langchain.com)

This artifact has the journey of building an RAG agent using Langchain with Typescript conversing with AWS Bedrock.

### 🛠️Setup
1. Install Git
    1. For Windows - Install [Git Bash](https://git-scm.com/downloads)
    2. For MacOS X
        1. Install **brew** by executing `/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"`
        2. Install git - `brew install git`
2. Install [NodeJS](https://nodejs.org/en) >=18 - based on your platform.
3. Execute`git clone` - to clone the repo.
4. Install [Cursor](https://appstore.cisco.com/details/cursor) an AI coding agent and open the cloned repo in it.
5. Execute `npm i` - to install all dependencies
6. Create `.env` at root dir with below variables in it
   ```env
   AWS_REGION=xxxx
   AWS_PROFILE=xxxx
   ```
> [!NOTE]
> If conversing with different model provider, change the `.env` variables accordingly.

### ⏯️Execution
`npx tsx <relative_path_of_file>`
> [!WARNING]
> If using Windows, set IDE terminal to Git Bash and execute.

## Agent Chat UI
It's an user interface to converse with an agent
1. Deploy langgraph app on local - `npx langgraphjs dev`
2. Open `agent-chat-ui` repo
    1. `corepack enable`
    2. Install all dependencies - `pnpm install`
    3. `cp .env.example .env` modify the env variables if required
    4. Stream UI - `pnpm dev`
> [!TIP]
> To keep updated with latest changes, remove `agent-chat-ui` repo and clone it again by https://github.com/langchain-ai/agent-chat-ui.git
