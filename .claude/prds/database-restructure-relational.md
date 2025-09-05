---
name: database-restructure-relational
description: Restructure database to enable relational data model with normalized entities for artists, venues, and concerts
status: backlog
created: 2025-09-05T10:19:23Z
---

# PRD: Database Restructure for Relational Data Model

## Executive Summary

This PRD outlines the restructuring of the SoundChecks database from a flat, denormalized structure to a fully relational model with separate entities for Artists, Venues, and Concerts. This change will enable data deduplication, aggregation capabilities, and integration with external music APIs while maintaining backward compatibility and data integrity.

## Problem Statement

### Current Issues
The current database structure stores concert information in a flat format where each `ConcertLog` contains artist, venue, and city as plain text strings. This approach creates several critical problems:

1. **Data Duplication**: Every concert log duplicates artist and venue information
2. **Inconsistent Data**: "Madison Square Garden" vs "MSG" vs "Madison Sq Garden" are treated as different venues
3. **No Aggregation**: Cannot easily answer questions like "How many times have I seen Radiohead?" or "What concerts have I attended at this venue?"
4. **Limited Discovery**: Cannot find other users who attended the same concert
5. **API Integration Challenges**: Cannot effectively use Spotify, Setlist.fm, or other APIs without proper entity IDs
6. **Poor Search**: Text-based search is unreliable with inconsistent naming

### Why Now?
- User base is growing and data quality issues are multiplying
- Integration requirements (Spotify, Setlist.fm) demand proper entity management
- Aggregation features are highly requested by users
- Early implementation prevents massive migration challenges later

## User Stories

### Primary User: Concert Logger
**As a** music fan logging concerts  
**I want** the system to automatically recognize artists and venues  
**So that** I don't create duplicates and can see aggregate statistics  

**Acceptance Criteria:**
- When I type "Madison Square Garden", system recognizes it as existing venue
- Auto-complete suggests matching artists/venues as I type
- Can see "You've been to this venue 3 times before"
- Can view all concerts by a specific artist

### Secondary User: Concert Explorer
**As a** user browsing the platform  
**I want** to discover concerts by artist, venue, or actual event  
**So that** I can find people with similar tastes and discover new music  

**Acceptance Criteria:**
- Can click on an artist to see all concerts by that artist
- Can view venue pages with all concerts at that location
- Can find other attendees of the same concert
- Can see aggregate statistics (most logged artist, popular venues)

### Technical User: API Integration
**As a** developer integrating external services  
**I want** proper entity IDs and relationships  
**So that** I can match our data with Spotify artists and Setlist.fm concerts  

**Acceptance Criteria:**
- Artists have external IDs (Spotify, MusicBrainz)
- Venues have location data and external IDs
- Concerts can be matched to Setlist.fm entries
- Data model supports API enrichment

## Requirements

### Functional Requirements

#### 1. New Data Models

**Artist Entity**
- Unique ID (cuid)
- Name (canonical)
- Aliases array (alternative names)
- Image URL
- Genres array
- External IDs (Spotify, MusicBrainz, etc.)
- Verified status
- Created/Updated timestamps

**Venue Entity**
- Unique ID (cuid)
- Name (canonical)
- Aliases array
- Address
- City
- State/Province
- Country
- Latitude/Longitude
- Capacity
- External IDs
- Created/Updated timestamps

**Concert Entity**
- Unique ID (cuid)
- Artist ID (relation)
- Venue ID (relation)
- Date
- Tour name (optional)
- Setlist (optional)
- External IDs (Setlist.fm, etc.)
- Created/Updated timestamps

**ConcertLog** (already exists)
- Unique ID (cuid)
- Profile ID (relation)
- Concert ID (relation)
- Rating
- Notes
- Photos array
- Created/Updated timestamps

#### 2. Smart Matching System

**Duplicate Prevention**
- Fuzzy string matching for artist/venue names
- Alias resolution
- Location-based venue matching
- Date proximity checking for concerts

**Auto-complete**
- Real-time search as user types
- Ranked by popularity/frequency
- Show additional context (location for venues, genres for artists)

**Merge Capabilities**
- Admin tools to merge duplicate entities
- Automatic redirect from merged entities
- Maintain history of merges

#### 3. Migration Strategy

**Phase 1: Schema Addition**
- Add new tables without removing old ones
- No breaking changes to existing code

**Phase 2: Data Migration**
- Extract unique artists from ConcertLog
- Extract unique venues from ConcertLog
- Create Concert entities from unique combinations
- Link ConcertAttendance to new entities

**Phase 3: Code Update**
- Update API endpoints to use new models
- Update UI to use new data structure
- Maintain backward compatibility layer

**Phase 4: Cleanup**
- Remove deprecated fields
- Archive migration code
- Update documentation

### Non-Functional Requirements

#### Performance
- Artist/venue search must return in < 200ms
- Auto-complete suggestions in < 100ms
- Migration must not cause downtime
- Indexed searches on all entity names

#### Scalability
- Support 1M+ artists
- Support 100K+ venues
- Support 10M+ concerts
- Efficient aggregation queries

#### Data Quality
- 95% accuracy in duplicate prevention
- Automated data cleanup processes
- Regular validation of external IDs
- Audit trail for all merges

#### Security
- User data isolation maintained
- No exposure of private concert attendance
- Rate limiting on entity creation
- Admin-only access to merge tools

## Success Criteria

### Immediate Success (Launch)
- Zero data loss during migration
- All existing features continue working
- No performance degradation
- Successful entity extraction from existing data

### Short-term Success (3 months)
- 90% reduction in duplicate entities
- 50% of concerts have Setlist.fm data
- 80% of artists have Spotify IDs
- User satisfaction score increases by 20%

### Long-term Success (1 year)
- Becomes the data foundation for all new features
- Powers recommendation engine
- Enables venue and artist partnerships
- Reduces support tickets about data quality by 75%

## Constraints & Assumptions

### Technical Constraints
- Must use PostgreSQL (current database)
- Must maintain Prisma as ORM
- Cannot require database downtime
- Must work within Vercel limits

### Resource Constraints
- 2-developer team
- 4-week implementation timeline
- No additional infrastructure budget
- Limited QA resources

### Assumptions
- Users will accept one-time data cleanup
- External APIs will remain available
- Current data can be reasonably de-duplicated
- Performance will improve with proper indexing

## Out of Scope

The following items are explicitly NOT part of this PRD:
- User-generated venue creation (admin only initially)
- Editing artist/venue information (future feature)
- Complex tour tracking
- Opening act relationships
- Festival modeling (multi-artist events)
- Ticket integration
- Social features around entities
- Recommendation algorithm

## Dependencies

### External Dependencies
- **Spotify Web API**: Artist enrichment, genres, images
- **Setlist.fm API**: Concert setlists, tour information
- **MusicBrainz API**: Artist metadata, relationships
- **Google Maps API**: Venue geocoding, location data
- **OpenAI API**: Smart matching and deduplication

### Internal Dependencies
- Database team approval for schema changes
- Frontend team for UI updates
- DevOps for migration execution
- Product team for feature prioritization

### Technical Dependencies
- Prisma migration tools
- PostgreSQL 14+ features
- Node.js backend updates
- React Query cache invalidation

## Risk Mitigation

### Data Loss Risk
- **Mitigation**: Complete backup before migration
- **Mitigation**: Staged rollout with validation
- **Mitigation**: Rollback plan prepared

### Performance Risk
- **Mitigation**: Load testing before deployment
- **Mitigation**: Gradual migration approach
- **Mitigation**: Query optimization and indexing

### User Disruption Risk
- **Mitigation**: Transparent communication
- **Mitigation**: Backward compatibility layer
- **Mitigation**: Phased feature rollout

## Technical Design Considerations

### Database Schema

```prisma
model Artist {
  id            String   @id @default(cuid())
  name          String
  aliases       String[]
  imageUrl      String?
  genres        String[]
  spotifyId     String?  @unique
  musicBrainzId String?  @unique
  verified      Boolean  @default(false)
  
  concerts      Concert[]
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  @@index([name])
  @@index([spotifyId])
}

model Venue {
  id            String   @id @default(cuid())
  name          String
  aliases       String[]
  address       String?
  city          String
  state         String?
  country       String
  latitude      Float?
  longitude     Float?
  capacity      Int?
  
  concerts      Concert[]
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  @@index([name])
  @@index([city, country])
}

model Concert {
  id            String   @id @default(cuid())
  artistId      String
  artist        Artist   @relation(fields: [artistId], references: [id])
  venueId       String
  venue         Venue    @relation(fields: [venueId], references: [id])
  date          DateTime
  tourName      String?
  setlistFmId   String?  @unique
  
  attendees     ConcertAttendance[]
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  @@unique([artistId, venueId, date])
  @@index([date])
  @@index([artistId])
  @@index([venueId])
}

model ConcertLog {
  id            String   @id @default(cuid())
  profileId     String
  profile       Profile  @relation(fields: [profileId], references: [id])
  concertId     String
  concert       Concert  @relation(fields: [concertId], references: [id])
  rating        Float?
  notes         String?
  photos        String[]
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  @@unique([profileId, concertId])
  @@index([profileId])
  @@index([concertId])
}
```

### API Endpoints

**New Endpoints:**
- GET /api/artists - Search/list artists
- GET /api/artists/[id] - Get artist details
- GET /api/venues - Search/list venues
- GET /api/venues/[id] - Get venue details
- GET /api/concerts - Search/list concerts
- GET /api/concerts/[id] - Get concert details
- POST /api/log - Log concert attendance

**Updated Endpoints:**
- POST /api/concerts - Create concert with entity relations
- GET /api/profile/[username]/concerts - Use new data model

## Implementation Timeline

### Week 1: Design & Setup
- Finalize schema design
- Set up migration framework
- Create test data sets
- Design matching algorithms

### Week 2: Core Implementation
- Implement new models
- Build migration scripts
- Create entity extraction logic
- Develop matching system

### Week 3: Integration
- Update API endpoints
- Integrate external APIs
- Build admin tools
- Implement auto-complete

### Week 4: Testing & Deployment
- Data migration testing
- Performance testing
- User acceptance testing
- Staged production rollout

## Appendix

### Example Queries Enabled

```sql
-- All concerts by an artist
SELECT * FROM concerts WHERE artist_id = ?

-- All concerts at a venue
SELECT * FROM concerts WHERE venue_id = ?

-- User's concert count by artist
SELECT artist_id, COUNT(*) FROM ConcertLog 
WHERE profile_id = ? GROUP BY artist_id

-- Find concert twins (same concert attendees)
SELECT profile_id FROM ConcertLog 
WHERE concert_id = ?
```

### External API Integration Points

**Spotify API:**
- Artist search
- Artist metadata
- Genre classification
- Artist images

**Setlist.fm API:**
- Concert setlists
- Tour information
- Historical concerts
- Venue details

**MusicBrainz:**
- Artist disambiguation
- Recording relationships
- Release information

**Google Maps:**
- Venue geocoding
- Location search
- Distance calculations