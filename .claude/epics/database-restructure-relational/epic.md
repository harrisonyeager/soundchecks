---
name: database-restructure-relational
status: in-progress
created: 2025-09-05T10:28:51Z
updated: 2025-09-05T18:04:54Z
progress: 10%
prd: .claude/prds/database-restructure-relational.md
github: https://github.com/harrisonyeager/soundchecks/issues/12
---

# Epic: Database Restructure for Relational Data Model

## Overview
Implement a phased database restructuring to transition from flat string-based concert logging to a normalized relational model with separate Artist, Venue, and Concert entities. This will enable deduplication, aggregation queries, and API integrations while maintaining backward compatibility.

## Architecture Decisions

### Key Technical Decisions
1. **Incremental Migration**: Add new tables alongside existing ones to avoid breaking changes
2. **Reuse ConcertLog**: Keep existing ConcertLog table but add concertId relation (avoiding rename to minimize changes)
3. **Fuzzy Matching**: Use simple Levenshtein distance algorithm for duplicate detection (no external AI initially)
4. **Cache-First Search**: Implement React Query caching for entity searches to minimize database hits
5. **Simplified Schema**: Start with core fields only, add external IDs and enrichment later

### Technology Choices
- **Prisma**: Continue using for schema management and migrations
- **PostgreSQL**: Leverage existing database with new indexes
- **React Query**: Handle client-side caching and optimistic updates
- **Zod**: Validate entity data at API boundaries

### Design Patterns
- **Repository Pattern**: Abstract database operations for entities
- **Service Layer**: Business logic for matching and deduplication
- **Progressive Enhancement**: New features work alongside old ones

## Technical Approach

### Frontend Components
**Minimal UI Changes**
- Modify concert creation form to use entity selectors
- Add autocomplete components for artist/venue selection
- Keep existing UI working with compatibility layer
- Simple entity pages (artist/venue detail views)

**State Management**
- React Query for entity caching
- Optimistic updates for smooth UX
- Background sync for entity enrichment

### Backend Services
**Core API Endpoints**
- `/api/entities/artists` - Search and create artists
- `/api/entities/venues` - Search and create venues
- `/api/entities/concerts` - Find or create concert entities
- Modify existing `/api/concerts` to handle both old and new format

**Business Logic**
- Entity matching service with fuzzy search
- Deduplication logic with confidence scoring
- Migration service for existing data
- Backward compatibility adapters

### Infrastructure
**Database Changes**
- Add Artist, Venue, Concert tables via Prisma migration
- Add concertId to existing ConcertLog table
- Create necessary indexes for performance
- No downtime required with additive changes

**Deployment Strategy**
- Feature flag for gradual rollout
- Database migration runs automatically
- No breaking changes to existing APIs

## Implementation Strategy

### Development Phases
1. **Phase 1**: Schema and migration (Week 1)
2. **Phase 2**: Core services and APIs (Week 2)
3. **Phase 3**: UI integration and testing (Week 3)
4. **Phase 4**: Data migration and cleanup (Week 4)

### Risk Mitigation
- Keep all existing functionality working
- Test migration on copy of production data
- Implement rollback capability
- Monitor performance metrics closely

### Testing Approach
- Unit tests for matching algorithms
- Integration tests for migration logic
- E2E tests for user workflows
- Load testing for performance validation

## Task Breakdown Preview

High-level tasks to implement this epic (max 10):

- [ ] **Task 1: Database Schema** - Create Prisma schema for Artist, Venue, Concert entities with migrations
- [ ] **Task 2: Entity Services** - Build matching/deduplication service with fuzzy search logic
- [ ] **Task 3: Entity APIs** - Implement CRUD endpoints for artists, venues, and concerts
- [ ] **Task 4: Migration Script** - Create script to extract and deduplicate entities from existing data
- [ ] **Task 5: Autocomplete Components** - Build React components for entity selection with search
- [ ] **Task 6: Update Concert Form** - Modify concert creation to use entity selectors
- [ ] **Task 7: Compatibility Layer** - Ensure existing APIs work with both old and new data models
- [ ] **Task 8: Entity Pages** - Create simple detail pages for artists and venues
- [ ] **Task 9: Testing Suite** - Write comprehensive tests for migration and new features
- [ ] **Task 10: Production Migration** - Execute migration plan with monitoring and rollback

## Dependencies

### External Service Dependencies
- PostgreSQL database (existing)
- Prisma CLI for migrations
- No external APIs required for MVP (Spotify/Setlist.fm integration deferred)

### Internal Dependencies
- Existing ConcertLog functionality must continue working
- User authentication system (Clerk)
- React Query setup (existing)

### Prerequisite Work
- Database backup before migration
- Feature flag system for gradual rollout (simple environment variable)

## Success Criteria (Technical)

### Performance Benchmarks
- Entity search < 200ms response time
- Autocomplete < 100ms response time
- Migration completes in < 30 minutes for current data volume
- No increase in page load times

### Quality Gates
- 95% accuracy in entity deduplication
- Zero data loss during migration
- All existing features remain functional
- Test coverage > 80% for new code

### Acceptance Criteria
- Users can log concerts with entity selection
- Duplicate entities are automatically prevented
- Can view all concerts for an artist/venue
- Existing concert logs display correctly

## Estimated Effort

### Overall Timeline
- **Duration**: 4 weeks
- **Team Size**: 1-2 developers
- **Complexity**: Medium

### Resource Requirements
- 1 full-stack developer (primary)
- 1 developer for code review and testing
- No additional infrastructure needed

### Critical Path Items
1. Schema design and migration (Week 1)
2. Entity extraction from existing data (Week 2)
3. UI integration (Week 3)
4. Production migration (Week 4)

## Simplifications from PRD

To deliver faster with fewer resources:
1. **No external API integrations initially** - Focus on core relational structure
2. **Simple fuzzy matching** - Use basic string similarity instead of AI
3. **Admin tools deferred** - Manual merge capabilities added later
4. **Limited entity fields** - Start with name/location, enrich later
5. **Reuse existing tables** - Keep ConcertLog name to minimize code changes

## Notes

This epic prioritizes getting the relational structure in place with minimal disruption. External integrations and advanced features can be added incrementally once the foundation is solid. The focus is on maintaining stability while enabling future capabilities.

## Tasks Created
- [ ] #13 - Database Schema Creation (parallel: true)
- [ ] #14 - Entity Matching and Deduplication Service (parallel: true)
- [ ] #15 - CRUD API Endpoints for Entities (parallel: false)
- [ ] #16 - Data Migration Script (parallel: false)
- [ ] #17 - React Autocomplete Components (parallel: true)
- [ ] #18 - Concert Form Entity Integration (parallel: false)
- [ ] #19 - Backward Compatibility Layer (parallel: true)
- [ ] #20 - Artist and Venue Detail Pages (parallel: true)
- [ ] #21 - Comprehensive Testing Suite (parallel: false)
- [ ] #22 - Production Migration Execution (parallel: false)

Total tasks: 10
Parallel tasks: 5 (can be worked on simultaneously)
Sequential tasks: 5 (have dependencies)
