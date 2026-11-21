// Comprehensive list of music genres from around the world
export const allGenres = [
  // African Genres
  { name: "Afrobeats", region: "Africa", color: "from-green-500 to-emerald-600" },
  { name: "Amapiano", region: "Africa", color: "from-emerald-500 to-emerald-600" },
  { name: "Afro-House", region: "Africa", color: "from-teal-500 to-green-600" },
  { name: "Afro-Soul", region: "Africa", color: "from-emerald-500 to-emerald-600" },
  { name: "Afropop", region: "Africa", color: "from-yellow-500 to-orange-600" },
  { name: "Highlife", region: "Africa", color: "from-amber-500 to-yellow-600" },
  { name: "Jùjú", region: "Africa", color: "from-orange-500 to-red-600" },
  { name: "Fuji", region: "Africa", color: "from-red-500 to-teal-600" },
  { name: "Kwaito", region: "Africa", color: "from-indigo-500 to-teal-600" },
  { name: "Gqom", region: "Africa", color: "from-cyan-500 to-teal-600" },
  { name: "Sgija", region: "Africa", color: "from-emerald-500 to-teal-600" },
  { name: "Maskandi", region: "Africa", color: "from-green-600 to-teal-700" },
  { name: "Kasi Rap", region: "Africa", color: "from-gray-600 to-slate-700" },
  { name: "Bongo Flava", region: "Africa", color: "from-lime-500 to-green-600" },
  { name: "Gengetone", region: "Africa", color: "from-green-500 to-teal-600" },
  { name: "Zimdancehall", region: "Africa", color: "from-emerald-500 to-green-600" },
  { name: "Kuduro", region: "Africa", color: "from-orange-600 to-red-700" },
  { name: "Lekompo", region: "Africa", color: "from-emerald-600 to-teal-700" },
  { name: "Bacardi", region: "Africa", color: "from-blue-500 to-indigo-600" },
  { name: "Afro-Fusion", region: "Africa", color: "from-green-500 to-emerald-600" },
  
  // Hip-Hop & Rap
  { name: "Hip-Hop", region: "Global", color: "from-orange-500 to-red-600" },
  { name: "Trap", region: "Global", color: "from-amber-500 to-orange-600" },
  { name: "Drill", region: "Global", color: "from-red-600 to-teal-700" },
  { name: "UK Drill", region: "Europe", color: "from-slate-600 to-gray-700" },
  { name: "Mumble Rap", region: "North America", color: "from-emerald-500 to-teal-600" },
  { name: "Boom Bap", region: "North America", color: "from-amber-600 to-orange-700" },
  { name: "Southern Hip-Hop", region: "North America", color: "from-red-500 to-orange-600" },
  { name: "West Coast", region: "North America", color: "from-blue-500 to-cyan-600" },
  { name: "East Coast", region: "North America", color: "from-gray-500 to-slate-600" },
  { name: "Gangsta Rap", region: "North America", color: "from-black to-gray-800" },
  { name: "Conscious Rap", region: "Global", color: "from-green-500 to-emerald-600" },
  { name: "Grime", region: "Europe", color: "from-indigo-600 to-teal-700" },
  { name: "French Rap", region: "Europe", color: "from-blue-600 to-indigo-700" },
  { name: "German Rap", region: "Europe", color: "from-yellow-500 to-amber-600" },
  { name: "Spanish Rap", region: "Europe", color: "from-red-500 to-teal-600" },
  
  // Electronic & Dance
  { name: "EDM", region: "Global", color: "from-cyan-500 to-blue-600" },
  { name: "House", region: "Global", color: "from-blue-500 to-indigo-600" },
  { name: "Deep House", region: "Global", color: "from-indigo-500 to-blue-600" },
  { name: "Tech House", region: "Global", color: "from-gray-500 to-zinc-600" },
  { name: "Progressive House", region: "Global", color: "from-cyan-400 to-blue-500" },
  { name: "Afro House", region: "Africa", color: "from-orange-500 to-amber-600" },
  { name: "Soulful House", region: "Global", color: "from-emerald-400 to-emerald-500" },
  { name: "Techno", region: "Europe", color: "from-gray-600 to-slate-700" },
  { name: "Trance", region: "Europe", color: "from-emerald-500 to-teal-600" },
  { name: "Dubstep", region: "Europe", color: "from-emerald-600 to-teal-700" },
  { name: "Drum and Bass", region: "Europe", color: "from-orange-600 to-red-700" },
  { name: "Jungle", region: "Europe", color: "from-green-600 to-emerald-700" },
  { name: "UK Garage", region: "Europe", color: "from-blue-400 to-cyan-500" },
  { name: "Breakbeat", region: "Global", color: "from-yellow-500 to-amber-600" },
  { name: "Hardstyle", region: "Europe", color: "from-red-600 to-teal-700" },
  { name: "Psytrance", region: "Global", color: "from-green-500 to-teal-600" },
  { name: "Minimal", region: "Europe", color: "from-zinc-500 to-gray-600" },
  { name: "Electro", region: "Global", color: "from-yellow-400 to-amber-500" },
  { name: "Synthwave", region: "Global", color: "from-green-500 to-teal-600" },
  { name: "Future Bass", region: "Global", color: "from-cyan-400 to-teal-500" },
  { name: "Tropical House", region: "Global", color: "from-teal-400 to-cyan-500" },
  { name: "Bass House", region: "Global", color: "from-emerald-500 to-indigo-600" },
  { name: "Lo-Fi", region: "Global", color: "from-emerald-400 to-teal-500" },
  { name: "Chillwave", region: "Global", color: "from-green-400 to-teal-500" },
  { name: "Ambient", region: "Global", color: "from-blue-300 to-cyan-400" },
  { name: "IDM", region: "Global", color: "from-gray-400 to-slate-500" },
  
  // Pop
  { name: "Pop", region: "Global", color: "from-green-500 to-teal-600" },
  { name: "K-Pop", region: "Asia", color: "from-green-400 to-emerald-500" },
  { name: "J-Pop", region: "Asia", color: "from-emerald-400 to-emerald-500" },
  { name: "C-Pop", region: "Asia", color: "from-red-400 to-teal-500" },
  { name: "Synth Pop", region: "Global", color: "from-emerald-400 to-teal-500" },
  { name: "Indie Pop", region: "Global", color: "from-teal-400 to-cyan-500" },
  { name: "Electropop", region: "Global", color: "from-green-400 to-emerald-500" },
  { name: "Dance Pop", region: "Global", color: "from-cyan-400 to-blue-500" },
  { name: "Teen Pop", region: "Global", color: "from-green-300 to-teal-400" },
  { name: "Power Pop", region: "Global", color: "from-orange-400 to-amber-500" },
  
  // R&B & Soul
  { name: "R&B", region: "Global", color: "from-emerald-500 to-teal-600" },
  { name: "Neo-Soul", region: "Global", color: "from-amber-500 to-yellow-600" },
  { name: "Soul", region: "Global", color: "from-emerald-600 to-emerald-700" },
  { name: "Funk", region: "Global", color: "from-orange-500 to-red-600" },
  { name: "Motown", region: "North America", color: "from-blue-500 to-indigo-600" },
  { name: "Quiet Storm", region: "North America", color: "from-emerald-400 to-teal-500" },
  { name: "New Jack Swing", region: "North America", color: "from-green-500 to-teal-600" },
  { name: "Contemporary R&B", region: "Global", color: "from-indigo-400 to-teal-500" },
  { name: "PBR&B", region: "Global", color: "from-gray-400 to-slate-500" },
  
  // Rock
  { name: "Rock", region: "Global", color: "from-slate-500 to-gray-700" },
  { name: "Alternative Rock", region: "Global", color: "from-green-500 to-emerald-600" },
  { name: "Indie Rock", region: "Global", color: "from-orange-400 to-amber-500" },
  { name: "Punk Rock", region: "Global", color: "from-red-500 to-teal-600" },
  { name: "Pop Punk", region: "Global", color: "from-green-500 to-emerald-600" },
  { name: "Hard Rock", region: "Global", color: "from-gray-600 to-slate-700" },
  { name: "Metal", region: "Global", color: "from-black to-gray-900" },
  { name: "Heavy Metal", region: "Global", color: "from-zinc-700 to-gray-800" },
  { name: "Death Metal", region: "Global", color: "from-red-900 to-teal-950" },
  { name: "Black Metal", region: "Global", color: "from-gray-900 to-black" },
  { name: "Thrash Metal", region: "Global", color: "from-yellow-600 to-amber-700" },
  { name: "Progressive Rock", region: "Global", color: "from-emerald-500 to-indigo-600" },
  { name: "Psychedelic Rock", region: "Global", color: "from-green-500 to-teal-600" },
  { name: "Grunge", region: "North America", color: "from-emerald-600 to-green-700" },
  { name: "Post-Rock", region: "Global", color: "from-blue-400 to-indigo-500" },
  { name: "Shoegaze", region: "Europe", color: "from-green-400 to-teal-500" },
  { name: "Emo", region: "Global", color: "from-slate-600 to-gray-700" },
  { name: "Metalcore", region: "Global", color: "from-red-600 to-teal-700" },
  { name: "Post-Hardcore", region: "Global", color: "from-emerald-600 to-teal-700" },
  
  // Latin
  { name: "Latin", region: "Latin America", color: "from-red-500 to-orange-600" },
  { name: "Reggaeton", region: "Latin America", color: "from-yellow-500 to-orange-600" },
  { name: "Latin Trap", region: "Latin America", color: "from-emerald-500 to-emerald-600" },
  { name: "Salsa", region: "Latin America", color: "from-red-500 to-teal-600" },
  { name: "Bachata", region: "Latin America", color: "from-green-500 to-teal-600" },
  { name: "Merengue", region: "Latin America", color: "from-orange-500 to-amber-600" },
  { name: "Cumbia", region: "Latin America", color: "from-yellow-400 to-amber-500" },
  { name: "Norteño", region: "Latin America", color: "from-green-500 to-emerald-600" },
  { name: "Banda", region: "Latin America", color: "from-red-600 to-teal-700" },
  { name: "Corrido", region: "Latin America", color: "from-amber-600 to-yellow-700" },
  { name: "Mariachi", region: "Latin America", color: "from-red-500 to-orange-600" },
  { name: "Dembow", region: "Caribbean", color: "from-cyan-500 to-teal-600" },
  { name: "Samba", region: "Latin America", color: "from-green-400 to-emerald-500" },
  { name: "Bossa Nova", region: "Latin America", color: "from-teal-400 to-cyan-500" },
  { name: "MPB", region: "Latin America", color: "from-yellow-400 to-amber-500" },
  { name: "Funk Carioca", region: "Latin America", color: "from-green-500 to-teal-600" },
  
  // Caribbean
  { name: "Reggae", region: "Caribbean", color: "from-green-600 to-lime-700" },
  { name: "Dancehall", region: "Caribbean", color: "from-yellow-500 to-green-600" },
  { name: "Dub", region: "Caribbean", color: "from-green-500 to-teal-600" },
  { name: "Soca", region: "Caribbean", color: "from-orange-400 to-yellow-500" },
  { name: "Calypso", region: "Caribbean", color: "from-cyan-400 to-teal-500" },
  { name: "Kompa", region: "Caribbean", color: "from-blue-500 to-indigo-600" },
  { name: "Zouk", region: "Caribbean", color: "from-green-400 to-teal-500" },
  
  // Jazz & Blues
  { name: "Jazz", region: "Global", color: "from-yellow-600 to-amber-700" },
  { name: "Smooth Jazz", region: "Global", color: "from-amber-400 to-yellow-500" },
  { name: "Bebop", region: "North America", color: "from-orange-500 to-amber-600" },
  { name: "Swing", region: "North America", color: "from-yellow-500 to-amber-600" },
  { name: "Cool Jazz", region: "North America", color: "from-blue-400 to-cyan-500" },
  { name: "Free Jazz", region: "Global", color: "from-emerald-500 to-teal-600" },
  { name: "Fusion", region: "Global", color: "from-orange-400 to-red-500" },
  { name: "Blues", region: "Global", color: "from-blue-600 to-indigo-700" },
  { name: "Chicago Blues", region: "North America", color: "from-indigo-500 to-blue-600" },
  { name: "Delta Blues", region: "North America", color: "from-amber-600 to-yellow-700" },
  { name: "Electric Blues", region: "Global", color: "from-blue-500 to-indigo-600" },
  
  // Country & Folk
  { name: "Country", region: "North America", color: "from-amber-600 to-yellow-700" },
  { name: "Country Pop", region: "North America", color: "from-green-400 to-teal-500" },
  { name: "Country Rock", region: "North America", color: "from-orange-500 to-amber-600" },
  { name: "Bluegrass", region: "North America", color: "from-green-500 to-emerald-600" },
  { name: "Americana", region: "North America", color: "from-amber-500 to-orange-600" },
  { name: "Folk", region: "Global", color: "from-green-400 to-teal-500" },
  { name: "Indie Folk", region: "Global", color: "from-teal-400 to-cyan-500" },
  { name: "Folk Rock", region: "Global", color: "from-orange-400 to-amber-500" },
  
  // Classical & Orchestral
  { name: "Classical", region: "Global", color: "from-stone-500 to-neutral-700" },
  { name: "Baroque", region: "Europe", color: "from-amber-500 to-yellow-600" },
  { name: "Romantic", region: "Europe", color: "from-emerald-400 to-emerald-500" },
  { name: "Contemporary Classical", region: "Global", color: "from-gray-400 to-slate-500" },
  { name: "Orchestral", region: "Global", color: "from-indigo-400 to-teal-500" },
  { name: "Opera", region: "Europe", color: "from-red-500 to-teal-600" },
  { name: "Chamber Music", region: "Global", color: "from-amber-400 to-yellow-500" },
  { name: "Choral", region: "Global", color: "from-blue-400 to-indigo-500" },
  { name: "Neoclassical", region: "Global", color: "from-gray-500 to-slate-600" },
  
  // World & Traditional
  { name: "World Music", region: "Global", color: "from-teal-500 to-cyan-600" },
  { name: "Arabic", region: "Middle East", color: "from-amber-500 to-orange-600" },
  { name: "Indian Classical", region: "Asia", color: "from-orange-500 to-red-600" },
  { name: "Bollywood", region: "Asia", color: "from-green-500 to-emerald-600" },
  { name: "Bhangra", region: "Asia", color: "from-yellow-500 to-amber-600" },
  { name: "Gamelan", region: "Asia", color: "from-green-500 to-emerald-600" },
  { name: "Enka", region: "Asia", color: "from-emerald-400 to-emerald-500" },
  { name: "Flamenco", region: "Europe", color: "from-red-500 to-orange-600" },
  { name: "Celtic", region: "Europe", color: "from-green-500 to-emerald-600" },
  { name: "Polka", region: "Europe", color: "from-red-400 to-teal-500" },
  { name: "Fado", region: "Europe", color: "from-blue-500 to-indigo-600" },
  { name: "Klezmer", region: "Europe", color: "from-emerald-400 to-teal-500" },
  { name: "Tarab", region: "Middle East", color: "from-amber-600 to-yellow-700" },
  { name: "Rai", region: "Africa", color: "from-orange-500 to-amber-600" },
  { name: "Gnawa", region: "Africa", color: "from-indigo-500 to-teal-600" },
  
  // Gospel & Religious
  { name: "Gospel", region: "Global", color: "from-yellow-500 to-amber-600" },
  { name: "Contemporary Christian", region: "Global", color: "from-blue-400 to-cyan-500" },
  { name: "Worship", region: "Global", color: "from-emerald-400 to-teal-500" },
  { name: "Spirituals", region: "North America", color: "from-amber-500 to-yellow-600" },
  
  // Experimental & Other
  { name: "Experimental", region: "Global", color: "from-emerald-500 to-emerald-600" },
  { name: "Noise", region: "Global", color: "from-gray-600 to-slate-700" },
  { name: "Industrial", region: "Global", color: "from-zinc-600 to-gray-700" },
  { name: "Vaporwave", region: "Global", color: "from-green-400 to-cyan-400" },
  { name: "Hyperpop", region: "Global", color: "from-green-400 to-emerald-500" },
  { name: "Phonk", region: "Global", color: "from-red-600 to-teal-700" },
  { name: "Chillhop", region: "Global", color: "from-orange-400 to-amber-500" },
  { name: "Bedroom Pop", region: "Global", color: "from-green-300 to-teal-400" },
  { name: "Slowcore", region: "Global", color: "from-gray-400 to-slate-500" },
  { name: "Math Rock", region: "Global", color: "from-cyan-500 to-teal-600" },
  { name: "Art Rock", region: "Global", color: "from-emerald-400 to-indigo-500" },
  { name: "New Wave", region: "Global", color: "from-green-500 to-teal-600" },
  { name: "Post-Punk", region: "Global", color: "from-gray-500 to-slate-600" },
  { name: "Darkwave", region: "Global", color: "from-emerald-700 to-teal-800" },
  { name: "Gothic", region: "Global", color: "from-gray-700 to-slate-800" },
  { name: "Ska", region: "Global", color: "from-yellow-400 to-orange-500" },
  { name: "Rocksteady", region: "Caribbean", color: "from-green-400 to-teal-500" },
  { name: "Two-Tone", region: "Europe", color: "from-gray-500 to-slate-600" },
  
  // Soundtrack & Score
  { name: "Soundtrack", region: "Global", color: "from-indigo-500 to-teal-600" },
  { name: "Film Score", region: "Global", color: "from-blue-500 to-indigo-600" },
  { name: "Video Game Music", region: "Global", color: "from-green-500 to-cyan-600" },
  { name: "Anime OST", region: "Asia", color: "from-green-400 to-emerald-500" },
  
  // Other
  { name: "Other", region: "Global", color: "from-gray-500 to-slate-600" },
];

// Get genres grouped by region
export const getGenresByRegion = () => {
  const grouped: Record<string, typeof allGenres> = {};
  allGenres.forEach(genre => {
    if (!grouped[genre.region]) {
      grouped[genre.region] = [];
    }
    grouped[genre.region].push(genre);
  });
  return grouped;
};

// Get just genre names for dropdowns
export const genreNames = allGenres.map(g => g.name);

// Search genres
export const searchGenres = (query: string) => {
  const lower = query.toLowerCase();
  return allGenres.filter(g => 
    g.name.toLowerCase().includes(lower) || 
    g.region.toLowerCase().includes(lower)
  );
};
