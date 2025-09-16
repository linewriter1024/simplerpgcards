---
applyTo: "**"
---

* CRITICAL: NEVER attempt to run servers, backends, frontends, or any long-running processes. They are asynchronous and will be non-functional in this environment.
* Do not try to run the servers. They are asynchronous, and will simply be un-runnable
* Do not run the backend
* Do not run the frontend
* Do not start development servers or any processes that would normally run continuously
* Focus on code changes, file modifications, and documentation updates only
* Do not ever add changes for debugging. I debug manually.
* Use modern Angular 20 constructs
* Use separate files for templates and styles in Angular
* Always store data in the database, never in e.g. uploaded files.