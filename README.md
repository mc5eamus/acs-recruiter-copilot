# acs-recruiter-copilot

## Overview

This accelerator faciliates an audio/video/chat conversation between a recruiter and a candidate providing the former a transcript and some basic AI-backed analytics of the conversation history.

(Architecture diagram: Work in progress)

### Frontend
React-based app leveraging [Azure Communication Services UI Library] (https://github.com/Azure/communication-ui-library) for recruiters and candidates.

### Backend
API for managing A/V group calls, chat conversations and Web PubSub connections, called by the frontend.

### Copilot
Aggregates the conversation history, utilizes Azure OpenAI chat completions and routes the results back to the recruiter's Copilot pane.

## Deployment
Mostly automated deployment with a few manual steps to be found [here](deployment/README.md).

## Running it locally
Work in progress, please bear with us.

