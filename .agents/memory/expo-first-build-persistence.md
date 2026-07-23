---
name: Expo first-build persistence
description: The project’s initial Expo app pattern for resident-facing workflows.
---

For the first version of an Expo app, favor a complete frontend experience with AsyncStorage persistence when the user has not explicitly requested a backend, database, or server-side feature.

**Why:** This keeps the first mobile build fast to preview and test while still making sign-in state and user-created content feel real between launches.

**How to apply:** Add server routes and generated API hooks only when the user asks for shared, remote, or multi-user data.