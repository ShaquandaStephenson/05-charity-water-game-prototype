// Continent/country data and simple persistence for the game
// Now a single, flattened canonical "countries" list used by the UI.

/* countries: list of actual mission locations (country-level) */
const countries = [
    // Asia
    {
        id: 'india',
        name: 'India',
        flag: '🇮🇳',
        description: 'Rural Maharashtra villages need clean water access',
        population: '1,380',
        withoutWater: '6 hours',
        waitTime: '4 hours',
        missionText: 'A drought in rural Maharashtra: 1,380 people need your help to bring clean water to their community.',
        gameType: 'pacman',
        levels: 5,
        colors: { primary: '#ff6b35', secondary: '#f7931e' }
    },
    {
        id: 'bangladesh',
        name: 'Bangladesh',
        flag: '🇧🇩',
        description: 'Coastal communities face saltwater contamination',
        population: '2,100',
        withoutWater: '1 year',
        waitTime: '3 hours',
        missionText: 'Bangladesh coastal communities need access to clean drinking water.',
        gameType: 'clicker',
        levels: 4,
        colors: { primary: '#0077b6', secondary: '#00b4d8' }
    },
    {
        id: 'nepal',
        name: 'Nepal',
        flag: '🇳🇵',
        description: 'Himalayan villages travel long distances for water',
        population: '650',
        withoutWater: '7 hours',
        waitTime: '5 hours',
        missionText: 'Nepal mountain villages require dangerous journeys for water. Help bring clean water closer.',
        gameType: 'platformer',
        levels: 3,
        colors: { primary: '#006400', secondary: '#32cd32' }
    },

    // Africa
    {
        id: 'ethiopia',
        name: 'Ethiopia',
        flag: '🇪🇹',
        description: 'Amhara region needs sustainable water systems',
        population: '850',
        withoutWater: '8 months',
        waitTime: '6 hours',
        missionText: 'Ethiopia’s Amhara region needs sustainable water systems.',
        gameType: 'puzzle',
        levels: 4,
        colors: { primary: '#8b4513', secondary: '#daa520' }
    },
    {
        id: 'uganda',
        name: 'Uganda',
        flag: '🇺🇬',
        description: 'Refugee settlements need safe water access',
        population: '2,100',
        withoutWater: '1 year',
        waitTime: '6 hours',
        missionText: 'Uganda refugee settlements need reliable water access.',
        gameType: 'matching',
        levels: 3,
        colors: { primary: '#8b0000', secondary: '#ff4500' }
    },
    {
        id: 'kenya',
        name: 'Kenya',
        flag: '🇰🇪',
        description: 'Rural communities walk long distances for water',
        population: '1,500',
        withoutWater: '9 months',
        waitTime: '4 hours',
        missionText: 'Kenyan rural communities walk hours for contaminated water.',
        gameType: 'pacman',
        levels: 5,
        colors: { primary: '#8b4513', secondary: '#f4a460' }
    },

    // Central America
    {
        id: 'guatemala',
        name: 'Guatemala',
        flag: '🇬🇹',
        description: 'Highland villages face seasonal shortages',
        population: '1,800',
        withoutWater: '6 months',
        waitTime: '3 hours',
        missionText: 'Guatemalan highland villages face seasonal water shortages.',
        gameType: 'matching',
        levels: 3,
        colors: { primary: '#006400', secondary: '#32cd32' }
    },
    {
        id: 'honduras',
        name: 'Honduras',
        flag: '🇭🇳',
        description: 'Rural communities need reliable access',
        population: '1,200',
        withoutWater: '8 months',
        waitTime: '4 hours',
        missionText: 'Honduran rural communities need reliable water access.',
        gameType: 'clicker',
        levels: 4,
        colors: { primary: '#0066cc', secondary: '#00aaff' }
    },
    {
        id: 'elsalvador',
        name: 'El Salvador',
        flag: '🇸🇻',
        description: 'Coastal communities travel for clean water',
        population: '950',
        withoutWater: '5 months',
        waitTime: '2 hours',
        missionText: 'El Salvador coastal areas require improved water systems.',
        gameType: 'puzzle',
        levels: 3,
        colors: { primary: '#2e8b57', secondary: '#66cdaa' }
    },

    // South America
    {
        id: 'peru',
        name: 'Peru',
        flag: '🇵🇪',
        description: 'Andean communities need water infrastructure',
        population: '1,200',
        withoutWater: '3 years',
        waitTime: '5 hours',
        missionText: 'Peruvian Andean communities have been drinking contaminated water for years.',
        gameType: 'clicker',
        levels: 5,
        colors: { primary: '#dc143c', secondary: '#ff1493' }
    },
    {
        id: 'bolivia',
        name: 'Bolivia',
        flag: '🇧🇴',
        description: 'Altiplano regions need resilient water systems',
        population: '1,600',
        withoutWater: '2 years',
        waitTime: '6 hours',
        missionText: 'Bolivian Altiplano regions walk long distances for water.',
        gameType: 'platformer',
        levels: 4,
        colors: { primary: '#8b0000', secondary: '#ff4500' }
    },
    {
        id: 'colombia',
        name: 'Colombia',
        flag: '🇨🇴',
        description: 'Rural highlands need sustainable solutions',
        population: '1,100',
        withoutWater: '1 year',
        waitTime: '3 hours',
        missionText: 'Colombian rural highlands need sustainable water solutions.',
        gameType: 'matching',
        levels: 3,
        colors: { primary: '#0066cc', secondary: '#00aaff' }
    }
];

// Player data structure (persisted)
let playerData = {
    totalScore: 0,
    communitiesHelped: 0,
    currentCountry: null,
    currentLevel: 1,
    unlockedCountries: ['india', 'kenya'], // small set unlocked at start
    completedLevels: {},
    lives: 3
};

// Game state
let gameState = {
    isPlaying: false,
    currentGame: null,
    score: 0,
    level: 1
};

// Load player data from localStorage or initialize
function loadPlayerData() {
    const saved = localStorage.getItem('waterHeroesPlayerData');
    if (saved) {
        try {
            playerData = { ...playerData, ...JSON.parse(saved) };
        } catch (e) {
            console.warn('Failed to parse saved player data', e);
        }
    }
}

// Save player data
function savePlayerData() {
    try {
        localStorage.setItem('waterHeroesPlayerData', JSON.stringify(playerData));
    } catch (e) {
        console.warn('Failed to save player data', e);
    }
}