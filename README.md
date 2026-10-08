# tp-q18-three-branches

A throwaway test fixture for TurboPanel. It is a tiny Node app with no dependencies that answers every request with JSON naming its branch, a version number, and which database environment variables are set (names and true/false only, never values). The `main`, `branch-a` and `branch-b` branches differ only in the `BRANCH` and `VERSION` constants in `server.js`. It will be deleted after the test run.
