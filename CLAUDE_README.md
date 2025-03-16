# Claude-Optimized Repository Structure

This repository has been optimized for working with Claude, with specialized directories and formats that help Claude better understand, navigate, and maintain the codebase.

## Directory Structure

### `.claude/metadata/`
- Contains normalized information about the codebase
- Component dependency graphs in machine-readable format
- File classification metadata (implementation vs interface vs test)
- Database of error patterns and solutions

### `.claude/code_index/`
- Pre-analyzed semantic relationships
- Function-to-function call graphs
- Type relationships and interface implementations
- Intent classification for code sections

### `.claude/debug_history/`
- Log of debugging sessions with error-solution pairs
- Categorized by component and error type
- Context and code versions for each fix

### `.claude/patterns/`
- Canonical implementation patterns
- Interface patterns with uncertainty handling
- Error handling patterns with context preservation
- Composition patterns for reliability metrics

### `.claude/cheatsheets/`
- Quick-reference guides for components
- Common operations on each component
- Known pitfalls and edge cases
- Component-specific "gotchas"

### `.claude/qa/`
- Previously solved problems
- Indexed by component, file, and error type
- Context from the fix process
- Reasoning used to solve each problem

### `.claude/delta/`
- Semantic change logs between versions
- API changes and their implications
- Behavior changes not obvious from diffs
- Reasoning behind significant changes

## Memory Anchors
Throughout the codebase, you'll find special "memory anchor" comments that help Claude reference specific points:
- UUID-based anchors for precise reference
- Semantic structure to anchors for ease of reference
- Consistent anchoring patterns across the codebase

## Model-Friendly Documentation Format
Key files include explicit sections for:
- Purpose (what the component does)
- Schema (data structures and their relationships)
- Patterns (common usage patterns)
- Interfaces (all public interfaces)
- Invariants (what must remain true)
- Error states (possible error conditions)