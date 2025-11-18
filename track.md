# AI Project Builder - Bolt.new Clone

## COMPLETED ✅
- **Phase 1-6**: Foundation, DB, LM Studio, UI, File Ops, Editor
- **Phase 7.1**: DuckDuckGo search with caching
- **Phase 7.2**: Code Parser & AST Analysis with DB storage
- **Phase 7.3**: Cross-File Dependency Tracking
- **Phase 7.4**: Smart Code Editing (AST-based partial updates)

---

## IN PROGRESS
**Phase 7.5**: Database Schema Awareness
- [ ] Parse migrations & detect table structures
- [ ] Extract columns, types, relations
- [ ] Detect ORM models (Eloquent, TypeORM, etc.)
- [ ] Link code entities to DB tables
- [ ] API: GET /api/code/schema

---

## TODO (High Priority)
**Phase 8**: Research & Planning Agent
- PlannerAgent: Break down user requests
- ResearchAgent: Web search for best practices
- Auto-detect affected files

**Phase 9**: Multi-Agent Orchestration
- Agent types: Planner, Researcher, Coder, DB, Reviewer, Tester
- Message queue & task handoff
- Workflow coordination

**Phase 10**: Vector Search & Semantic Understanding
- Embedding system (pgvector/chromadb)
- Semantic code search by meaning
- Find similar functions/patterns

---

## TODO (Future)
- Phase 11: Auto-Workplan & Task Breakdown
- Phase 12: Web Search Integration
- Phase 13: Performance & Optimization
- Phase 14: Advanced Features (Templates, Tests, Docs)
- Phase 15: Security & Polish

---

## KEY FILES
- `lib/code-parser/`: JS/PHP AST parsing
- `lib/code-editor/`: Smart editing (add/modify functions, imports)
- `lib/dependency-tracker.ts`: Build dependency graphs
- `app/api/code/`: All code analysis endpoints

## CURRENT STATUS
**Phase:** 7.5 - Database Schema Awareness (NEXT)
**Last Done:** 7.4 - Smart Code Editing
