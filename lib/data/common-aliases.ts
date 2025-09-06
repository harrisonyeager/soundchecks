/**
 * Common aliases database for artists, venues, and locations
 * Used by the alias resolution system to map common abbreviations and variations
 * to their canonical forms.
 */

export interface AliasEntry {
  canonical: string
  aliases: string[]
  category: 'artist' | 'venue' | 'city'
}

/**
 * Artist aliases database - maps common abbreviations and variations to canonical names
 */
export const ARTIST_ALIASES: Record<string, string> = {
  // Iconic artists with common abbreviations
  'prince': 'The Artist Formerly Known As Prince',
  'the artist formerly known as prince': 'Prince',
  'tafkap': 'The Artist Formerly Known As Prince',
  'symbol': 'The Artist Formerly Known As Prince',
  
  // Rock bands
  'gnr': 'Guns N\' Roses',
  'guns n roses': 'Guns N\' Roses',
  'guns and roses': 'Guns N\' Roses',
  'rhcp': 'Red Hot Chili Peppers',
  'red hot chilli peppers': 'Red Hot Chili Peppers',
  'chili peppers': 'Red Hot Chili Peppers',
  'acdc': 'AC/DC',
  'ac dc': 'AC/DC',
  'led zep': 'Led Zeppelin',
  'zeppelin': 'Led Zeppelin',
  'pink floyd': 'Pink Floyd',
  'floyd': 'Pink Floyd',
  
  // Hip-hop artists
  'eminem': 'Eminem',
  'slim shady': 'Eminem',
  'marshall mathers': 'Eminem',
  'jay z': 'Jay-Z',
  'jay-z': 'Jay-Z',
  'hov': 'Jay-Z',
  'biggie': 'The Notorious B.I.G.',
  'notorious big': 'The Notorious B.I.G.',
  'biggie smalls': 'The Notorious B.I.G.',
  'tupac': '2Pac',
  '2pac': '2Pac',
  'makaveli': '2Pac',
  
  // Pop artists
  'madonna': 'Madonna',
  'material girl': 'Madonna',
  'queen of pop': 'Madonna',
  'mj': 'Michael Jackson',
  'king of pop': 'Michael Jackson',
  'the king': 'Elvis Presley',
  'elvis': 'Elvis Presley',
  
  // Electronic/Dance
  'daft punk': 'Daft Punk',
  'robots': 'Daft Punk',
  'deadmau5': 'deadmau5',
  'the mouse': 'deadmau5',
  
  // Alternative/Indie
  'radiohead': 'Radiohead',
  'the bends': 'Radiohead',
  'nirvana': 'Nirvana',
  'smells like teen spirit': 'Nirvana',
  'foo fighters': 'Foo Fighters',
  'foos': 'Foo Fighters',
  
  // R&B/Soul
  'beyonce': 'Beyoncé',
  'queen b': 'Beyoncé',
  'sasha fierce': 'Beyoncé',
  'aretha': 'Aretha Franklin',
  'queen of soul': 'Aretha Franklin',
  
  // Country
  'dolly': 'Dolly Parton',
  'johnny cash': 'Johnny Cash',
  'man in black': 'Johnny Cash',
  
  // Jazz/Blues
  'miles': 'Miles Davis',
  'bb king': 'B.B. King',
  'king of blues': 'B.B. King',
  
  // Classical
  'beethoven': 'Ludwig van Beethoven',
  'mozart': 'Wolfgang Amadeus Mozart',
  'bach': 'Johann Sebastian Bach'
}

/**
 * Venue aliases database - maps common abbreviations to canonical venue names
 */
export const VENUE_ALIASES: Record<string, string> = {
  // Iconic venues
  'msg': 'Madison Square Garden',
  'the garden': 'Madison Square Garden',
  'madison sq garden': 'Madison Square Garden',
  'radio city': 'Radio City Music Hall',
  'carnegie': 'Carnegie Hall',
  'carnegie hall': 'Carnegie Hall',
  
  // Theaters
  'apollo': 'Apollo Theater',
  'apollo theater': 'Apollo Theater',
  'beacon': 'Beacon Theatre',
  'beacon theater': 'Beacon Theatre',
  'beacon theatre': 'Beacon Theatre',
  'lincoln center': 'Lincoln Center',
  
  // Arenas & Stadiums
  'yankee stadium': 'Yankee Stadium',
  'the stadium': 'Yankee Stadium',
  'citi field': 'Citi Field',
  'shea': 'Shea Stadium',
  'shea stadium': 'Shea Stadium',
  'barclays': 'Barclays Center',
  'barclays center': 'Barclays Center',
  
  // Concert Venues
  'bowery ballroom': 'Bowery Ballroom',
  'mercury lounge': 'Mercury Lounge',
  'webster hall': 'Webster Hall',
  'terminal 5': 'Terminal 5',
  't5': 'Terminal 5',
  'hammerstein': 'Hammerstein Ballroom',
  'hammerstein ballroom': 'Hammerstein Ballroom',
  
  // Clubs
  'cbgb': 'CBGB',
  'cbgbs': 'CBGB',
  'blue note': 'Blue Note',
  'village vanguard': 'Village Vanguard',
  'vanguard': 'Village Vanguard',
  
  // International venues
  'royal albert hall': 'Royal Albert Hall',
  'albert hall': 'Royal Albert Hall',
  'wembley': 'Wembley Stadium',
  'wembley stadium': 'Wembley Stadium',
  'o2': 'The O2 Arena',
  'o2 arena': 'The O2 Arena',
  'red rocks': 'Red Rocks Amphitheatre',
  'red rocks amphitheatre': 'Red Rocks Amphitheatre',
  'hollywood bowl': 'Hollywood Bowl',
  'the bowl': 'Hollywood Bowl'
}

/**
 * City/location aliases database
 */
export const CITY_ALIASES: Record<string, string> = {
  // US Cities
  'nyc': 'New York City',
  'ny': 'New York City',
  'new york': 'New York City',
  'manhattan': 'New York City',
  'the big apple': 'New York City',
  'gotham': 'New York City',
  
  'la': 'Los Angeles',
  'los angeles': 'Los Angeles',
  'city of angels': 'Los Angeles',
  'hollywood': 'Los Angeles',
  
  'sf': 'San Francisco',
  'san fran': 'San Francisco',
  'frisco': 'San Francisco',
  'the city': 'San Francisco',
  
  'chi': 'Chicago',
  'chicago': 'Chicago',
  'windy city': 'Chicago',
  'chi-town': 'Chicago',
  
  'vegas': 'Las Vegas',
  'las vegas': 'Las Vegas',
  'sin city': 'Las Vegas',
  
  'miami': 'Miami',
  'the magic city': 'Miami',
  'south beach': 'Miami',
  
  'dc': 'Washington, D.C.',
  'washington dc': 'Washington, D.C.',
  'washington': 'Washington, D.C.',
  
  'philly': 'Philadelphia',
  'philadelphia': 'Philadelphia',
  'city of brotherly love': 'Philadelphia',
  
  'boston': 'Boston',
  'beantown': 'Boston',
  
  'detroit': 'Detroit',
  'motor city': 'Detroit',
  'motown': 'Detroit',
  
  'nashville': 'Nashville',
  'music city': 'Nashville',
  
  'nola': 'New Orleans',
  'new orleans': 'New Orleans',
  'the big easy': 'New Orleans',
  
  'atl': 'Atlanta',
  'atlanta': 'Atlanta',
  'hotlanta': 'Atlanta',
  
  // International cities
  'london': 'London',
  'the big smoke': 'London',
  
  'paris': 'Paris',
  'city of light': 'Paris',
  'city of lights': 'Paris',
  
  'tokyo': 'Tokyo',
  
  'berlin': 'Berlin',
  
  'amsterdam': 'Amsterdam',
  
  'rome': 'Rome',
  'eternal city': 'Rome',
  
  'sydney': 'Sydney',
  
  'toronto': 'Toronto',
  't-dot': 'Toronto',
  
  'montreal': 'Montreal',
  
  'vancouver': 'Vancouver'
}

/**
 * Combined aliases for easy lookup
 */
export const ALL_ALIASES = {
  ...ARTIST_ALIASES,
  ...VENUE_ALIASES,
  ...CITY_ALIASES
}

/**
 * Get all aliases for a specific category
 */
export function getAliasesForCategory(category: 'artist' | 'venue' | 'city'): Record<string, string> {
  switch (category) {
    case 'artist':
      return ARTIST_ALIASES
    case 'venue':
      return VENUE_ALIASES
    case 'city':
      return CITY_ALIASES
    default:
      return {}
  }
}

/**
 * Check if a term is an alias and return its canonical form
 */
export function resolveAlias(term: string, category?: 'artist' | 'venue' | 'city'): string | null {
  const normalizedTerm = term.toLowerCase().trim()
  
  if (category) {
    const categoryAliases = getAliasesForCategory(category)
    return categoryAliases[normalizedTerm] || null
  }
  
  return ALL_ALIASES[normalizedTerm] || null
}

/**
 * Get all possible aliases for a canonical name (reverse lookup)
 */
export function getAliasesForCanonical(canonical: string, category?: 'artist' | 'venue' | 'city'): string[] {
  const aliases: string[] = []
  const searchAliases = category ? getAliasesForCategory(category) : ALL_ALIASES
  
  for (const [alias, canonicalName] of Object.entries(searchAliases)) {
    if (canonicalName.toLowerCase() === canonical.toLowerCase()) {
      aliases.push(alias)
    }
  }
  
  return aliases
}