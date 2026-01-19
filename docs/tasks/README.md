# Task Tracking

This directory contains all task tracking and todo management for the Axori project.

## Files

- **`TODO.md`** - Active tasks, todos, and development work organized by priority
- **`COMPLETED.md`** - Archive of completed tasks with dates and notes

## Workflow

1. **Adding Tasks**
   - Add new tasks to `TODO.md` in the appropriate priority section
   - Include context, acceptance criteria, and related issues/ADRs
   - Break large tasks into smaller, actionable items

2. **Working on Tasks**
   - Mark tasks as `[IN PROGRESS]` when you start working
   - Update task description with progress notes if needed
   - Reference task in commit messages when possible

3. **Completing Tasks**
   - Move completed tasks from `TODO.md` to `COMPLETED.md`
   - Include completion date and brief notes about what was done
   - Link to related PRs, commits, or ADRs if applicable

4. **Reviewing Tasks**
   - Review `TODO.md` regularly (weekly/monthly)
   - Archive or update stale tasks
   - Re-prioritize as needed based on project goals

## Task Priority Levels

- **🎯 High Priority** - Critical features, bugs, or blockers
- **📋 Medium Priority** - Important improvements and enhancements
- **🔄 Refactoring & Technical Debt** - Code quality and maintainability
- **📊 Data & Analytics** - Reporting and data features
- **🔐 Security & Authentication** - Security improvements
- **📱 Mobile & Responsive** - Mobile experience improvements
- **🧪 Testing** - Test coverage and quality assurance
- **📚 Documentation** - Documentation improvements
- **🔍 Research & Exploration** - Research and investigation tasks

## Best Practices

- **Be Specific**: Write clear, actionable task descriptions
- **Link Context**: Reference related ADRs, plans, or issues
- **Track Progress**: Update tasks as work progresses
- **Archive Regularly**: Move completed items promptly
- **Review Monthly**: Clean up and reorganize as needed

## Integration with Other Docs

Tasks may reference:

- **Architecture Plans** (`../architecture/plans/`) - Long-term planning documents
- **ADRs** (`../architecture/*.md`) - Architectural decision records
- **Execution Docs** (`../architecture/plans/*/EXECUTION.md`) - Implementation tracking

When creating tasks from plans or ADRs, link back to the source document.
