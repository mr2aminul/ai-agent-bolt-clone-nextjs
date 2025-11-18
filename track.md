# AI Project Builder - Bolt.new Clone

## COMPLETED ✅
- **Phase 1-6**: Foundation, DB, LM Studio, UI, File Ops, Editor
- **Phase 7.1**: DuckDuckGo search with caching
- **Phase 7.2.1**: Language parsers installed

---

## PHASE 7: INTELLIGENT CODE UNDERSTANDING

### 7.2 Code Parser & AST Analysis
#### 7.2.1 Install Parsers
- [x] @babel/parser, @babel/traverse for JS/TS
- [x] php-parser for PHP

#### 7.2.2 Build Parser Service
- [ ] Create lib/code-parser/ directory

#### 7.2.3 Build Parser Service
- [ ] JS/TS parser class
- [ ] PHP parser class

#### 7.2.4 Extract Code Structure
- [ ] Extract functions, classes, imports, exports
- [ ] Identify function boundaries

#### 7.2.5 DB Storage
- [ ] Migration: code_entities table
- [ ] Store parsed data

#### 7.2.6 API Endpoint
- [ ] POST /api/code/analyze

### 7.3 Cross-File Dependency Tracking
- [ ] Build import/export graph
- [ ] Track function calls across files
- [ ] Identify database schema references in code
- [ ] Create dependency map (which files affect which)
- [ ] API: GET /api/code/dependencies?file=path
- [ ] Store in DB: file_dependencies table

### 7.4 Smart Code Editing (Partial Updates)
- [ ] Edit specific functions without rewriting entire file
- [ ] Add/remove imports automatically
- [ ] Insert code at correct position (after imports, inside class, etc)
- [ ] Update function signatures and all call sites
- [ ] API: POST /api/code/edit with operations: add_function, modify_function, add_import
- [ ] Use AST to find exact positions

### 7.5 Database Schema Awareness
- [ ] Parse DB migrations/schema files
- [ ] Extract table structure (columns, types, relations)
- [ ] Detect ORM models (Eloquent, TypeORM, SQLAlchemy)
- [ ] Link code entities to DB tables
- [ ] Store schema in DB: schema_info table
- [ ] API: GET /api/code/schema

---

## PHASE 8: RESEARCH & PLANNING AGENT

### 8.1 Pre-Code Analysis
- [ ] Create PlannerAgent that runs BEFORE coding
- [ ] Analyze user request and break into tasks
- [ ] Search web for best practices
- [ ] Identify all affected files automatically
- [ ] Check if DB changes needed
- [ ] Generate step-by-step plan
- [ ] API: POST /api/plan/analyze

### 8.2 Impact Analysis
- [ ] Find all files that import/use target function
- [ ] Detect DB schema changes needed
- [ ] Identify test files that need updates
- [ ] Check for breaking changes
- [ ] Estimate complexity and time
- [ ] Present plan to user for approval

### 8.3 Auto File Discovery
- [ ] Use vector search to find related files
- [ ] Search by semantic similarity
- [ ] Find files with similar patterns
- [ ] Detect related UI components
- [ ] API: POST /api/code/find-related

---

## PHASE 9: MULTI-AGENT ORCHESTRATION

### 9.1 Agent Types
- [ ] **PlannerAgent**: Analyzes request, creates plan
- [ ] **ResearchAgent**: Searches web, finds best practices
- [ ] **CoderAgent**: Writes/modifies code
- [ ] **DBAgent**: Handles schema changes, migrations
- [ ] **ReviewerAgent**: Reviews changes, finds issues
- [ ] **TesterAgent**: Generates and runs tests

### 9.2 Agent Communication
- [ ] Create agent message queue
- [ ] Implement task handoff protocol
- [ ] Build agent coordination system
- [ ] Add agent status tracking
- [ ] Store agent actions in DB: agent_actions table

### 9.3 Workflow Example (Add Birthday Feature)
```
User: "Add birthday field to user profile"

1. PlannerAgent analyzes:
   - Need DB migration (add birthday column)
   - Update User model
   - Modify profile form UI
   - Update API validation
   - Add tests

2. ResearchAgent searches:
   - Best date picker libraries
   - Birthday validation patterns
   - Privacy considerations

3. DBAgent creates:
   - Migration file
   - Updates schema

4. CoderAgent updates:
   - User model (adds birthday field)
   - Profile form (adds date input)
   - API validation (adds birthday rules)
   - All using AST for precise edits

5. TesterAgent generates:
   - Unit tests for model
   - API endpoint tests
   - UI component tests

6. ReviewerAgent checks:
   - All related files updated
   - No breaking changes
   - Code quality
```

---

## PHASE 10: VECTOR SEARCH & SEMANTIC UNDERSTANDING

### 10.1 Embedding System
- [ ] Install chromadb or pgvector
- [ ] Generate embeddings for all files (use LM Studio)
- [ ] Store embeddings in DB
- [ ] Update embeddings on file change
- [ ] API: POST /api/embeddings/generate

### 10.2 Semantic Code Search
- [ ] Search code by meaning, not keywords
- [ ] Find similar functions/patterns
- [ ] Discover related components
- [ ] Auto-include relevant context for LLM
- [ ] API: POST /api/search/semantic

---

## PHASE 11: AUTO-WORKPLAN & TASK BREAKDOWN

### 11.1 Workplan Generator
- [ ] API: POST /api/workplan/generate
- [ ] Break complex request into subtasks
- [ ] Identify dependencies between tasks
- [ ] Assign agents to each task
- [ ] Store in DB: workplans table
- [ ] UI component to show plan before execution

### 11.2 Task Execution
- [ ] Execute tasks in dependency order
- [ ] Show progress in real-time
- [ ] Allow user to approve each step
- [ ] Handle failures and rollback
- [ ] Store execution logs

---

## PHASE 12: WEB SEARCH INTEGRATION

### 12.1 Auto-Trigger Search
- [ ] Detect when search needed (unknown libraries, new concepts)
- [ ] Trigger ResearchAgent automatically
- [ ] Show search results inline in chat
- [ ] Cache results in DB
- [ ] Add citation to responses

### 12.2 Manual Search
- [ ] Add "Search Web" button in chat
- [ ] Search for: code examples, docs, best practices
- [ ] Format results for LLM context

---

## PHASE 13: PERFORMANCE & OPTIMIZATION

### 13.1 Caching
- [ ] File content cache
- [ ] AST parse cache
- [ ] Search result cache
- [ ] LLM response cache for common queries

### 13.2 Lazy Loading
- [ ] Chat history pagination
- [ ] File tree virtualization
- [ ] Incremental file scanning

---

## PHASE 14: ADVANCED FEATURES

### 14.1 Project Templates
- [ ] Next.js, React, PHP Laravel, WordPress templates
- [ ] Template instantiation with config

### 14.2 Test Generation
- [ ] Auto-generate unit tests
- [ ] Integration test scaffolding
- [ ] Run tests via terminal

### 14.3 Documentation
- [ ] Auto-generate JSDoc/PHPDoc comments
- [ ] Create API documentation
- [ ] Generate README

---

## PHASE 15: SECURITY & POLISH

### 15.1 Security
- [ ] Dependency vulnerability scanning
- [ ] Code security analysis
- [ ] Input validation

### 15.2 UI/UX
- [ ] Dark/light mode
- [ ] Mobile responsive
- [ ] Accessibility improvements

---

## CURRENT STATUS
**Phase:** 7.2.2 - Build Parser Service (NEXT)
**Completed:** 7.2.1 - Parsers installed
**Next:** Create parser service classes for JS/TS/PHP
