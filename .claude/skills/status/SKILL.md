---
name: status
description: Reports where the build stands and which step is next. Use when the user asks where we are.
---
Change nothing. Run: git branch --show-current, git log --oneline -5,
gh issue list --state open, gh pr list --state open, and list docs/specs/ and docs/gates/.
Reply in this shape:
Phase <n> · <name>
Done: <step ids>
In progress: <step id> · <branch> · PR <state>
Next: <step id> · <name> · <model>
Blocked: <none, or what and why>
Then list which Status cells to change in the playbook tracker.
