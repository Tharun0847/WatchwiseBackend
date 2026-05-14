const axios = require("axios");
const https = require("https");

const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const JIKAN_BASE_URL = "https://api.jikan.moe/v4";

// Caching Configuration
const cache = new Map();
const pendingRequests = new Map();
const DEFAULT_CACHE_TTL = 15 * 60 * 1000; // 15 minutes
const GENRE_CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

// Strict Rate Limiter for Jikan (Shared across all requests)
let lastJikanRequestTime = 0;
const JIKAN_MIN_INTERVAL = 1100; // 1.1s between requests to respect 3 req/sec limit safely

// Hardcoded Fallback for Anime Genres
const FALLBACK_ANIME_GENRES = {
    data: [
        { mal_id: 1, name: "Action" }, { mal_id: 2, name: "Adventure" }, { mal_id: 4, name: "Comedy" },
        { mal_id: 8, name: "Drama" }, { mal_id: 10, name: "Fantasy" }, { mal_id: 14, name: "Horror" },
        { mal_id: 7, name: "Mystery" }, { mal_id: 22, name: "Romance" }, { mal_id: 24, name: "Sci-Fi" },
        { mal_id: 36, name: "Slice of Life" }, { mal_id: 30, name: "Sports" }, { mal_id: 37, name: "Supernatural" },
        { mal_id: 41, name: "Suspense" }
    ]
};

// Larger Fallback for Top Anime
const FALLBACK_TOP_ANIME = {
    data: [
        { mal_id: 5114, title: "Fullmetal Alchemist: Brotherhood", score: 9.1, year: 2009, images: { jpg: { image_url: "https://cdn.myanimelist.net/images/anime/1208/94745.jpg" } } },
        { mal_id: 9253, title: "Steins;Gate", score: 9.0, year: 2011, images: { jpg: { image_url: "https://cdn.myanimelist.net/images/anime/1935/127974.jpg" } } },
        { mal_id: 28977, title: "Gintama°", score: 9.0, year: 2015, images: { jpg: { image_url: "https://cdn.myanimelist.net/images/anime/3/72078.jpg" } } },
        { mal_id: 38524, title: "Shingeki no Kyojin Season 3 Part 2", score: 9.0, year: 2019, images: { jpg: { image_url: "https://cdn.myanimelist.net/images/anime/1517/100633.jpg" } } },
        { mal_id: 11061, title: "Hunter x Hunter (2011)", score: 9.0, year: 2011, images: { jpg: { image_url: "https://cdn.myanimelist.net/images/anime/1337/99013.jpg" } } },
        { mal_id: 4181, title: "Clannad: After Story", score: 8.9, year: 2008, images: { jpg: { image_url: "https://cdn.myanimelist.net/images/anime/13/24647.jpg" } } },
        { mal_id: 1535, title: "Death Note", score: 8.6, year: 2006, images: { jpg: { image_url: "https://cdn.myanimelist.net/images/anime/9/9453.jpg" } } },
        { mal_id: 1575, title: "Code Geass", score: 8.7, year: 2006, images: { jpg: { image_url: "https://cdn.myanimelist.net/images/anime/5/67357.jpg" } } },
        { mal_id: 21, title: "One Piece", score: 8.7, year: 1999, images: { jpg: { image_url: "https://cdn.myanimelist.net/images/anime/1244/138851.jpg" } } },
        { mal_id: 1735, title: "Naruto: Shippuuden", score: 8.2, year: 2007, images: { jpg: { image_url: "https://cdn.myanimelist.net/images/anime/1565/111305.jpg" } } },
        { mal_id: 40748, title: "Jujutsu Kaisen", score: 8.6, year: 2020, images: { jpg: { image_url: "https://cdn.myanimelist.net/images/anime/1171/109222.jpg" } } },
        { mal_id: 31964, title: "Boku no Hero Academia", score: 7.9, year: 2016, images: { jpg: { image_url: "https://cdn.myanimelist.net/images/anime/10/78745.jpg" } } }
    ],
    pagination: { has_next_page: false }
};

// High Reliability Agent
const secureAgent = new https.Agent({ 
    keepAlive: false, 
    timeout: 60000,
});

const apiClient = axios.create({
    timeout: 45000, // Increased timeout to 45s
    httpsAgent: secureAgent,
    headers: { 
        "Accept": "application/json",
        "User-Agent": "WatchWise/1.0 (Personal Media Discovery App)"
    }
});

const getTmdbKey = () => {
    return process.env.TMDB_API_KEY;
};

/**
 * Enhanced request wrapper with caching, de-duplication, and strict Jikan rate limiting
 */
const makeRequest = async (url, retries = 2, isGenre = false) => {
    const ttl = isGenre ? GENRE_CACHE_TTL : DEFAULT_CACHE_TTL;
    
    const cached = cache.get(url);
    if (cached && (Date.now() - cached.timestamp < ttl)) {
        return cached.data;
    }

    if (pendingRequests.has(url)) return pendingRequests.get(url);

    const isJikan = url.includes("jikan.moe");
    const requestTimeout = isJikan ? 15000 : 45000; 

    const executeRequest = async (currentUrl, currentRetries) => {
        try {
            if (isJikan) {
                const now = Date.now();
                const timeSinceLast = now - lastJikanRequestTime;
                if (timeSinceLast < JIKAN_MIN_INTERVAL) {
                    await new Promise(r => setTimeout(r, JIKAN_MIN_INTERVAL - timeSinceLast + (Math.random() * 200)));
                }
                lastJikanRequestTime = Date.now();
            } else {
                await new Promise(r => setTimeout(r, Math.random() * 300));
            }
            
            console.log(`📡 Fetching: ${currentUrl.split('?')[0]}`);
            const response = await apiClient.get(currentUrl, { timeout: requestTimeout });
            
            cache.set(currentUrl, { data: response.data, timestamp: Date.now() });
            return response.data;
        } catch (error) {
            const status = error.response?.status;
            const isRetryable = status === 429 || status >= 500 || !status || error.code === 'ECONNABORTED' || error.code === 'ECONNRESET';

            if (isRetryable && currentRetries > 0) {
                const delay = status === 429 ? 5000 : 3000; 
                console.warn(`⚠️ [${status || error.code}] Retrying (${currentRetries} left): ${currentUrl.split('?')[0]}`);
                await new Promise(r => setTimeout(r, delay));
                return executeRequest(currentUrl, currentRetries - 1);
            }
            
            if (isJikan) {
                if (isGenre || currentUrl.includes("/genres/")) return FALLBACK_ANIME_GENRES;
                if (currentUrl.includes("/top/anime") || currentUrl.includes("/anime")) return FALLBACK_TOP_ANIME;
            }

            console.error("❌ API Failure:", error.message, "| URL:", currentUrl.split('?')[0]);
            throw error;
        }
    };

    const requestPromise = executeRequest(url, retries).finally(() => {
        pendingRequests.delete(url);
    });

    pendingRequests.set(url, requestPromise);
    return requestPromise;
};

// Anime Controllers
exports.getTopAnime = async (req, res) => {
    try {
        const { page = 1 } = req.query;
        const data = await makeRequest(`${JIKAN_BASE_URL}/top/anime?page=${page}&sfw=true`);
        res.json(data);
    } catch (error) {
        res.json(FALLBACK_TOP_ANIME);
    }
};

exports.getTrendingAnime = async (req, res) => {
    try {
        const { page = 1 } = req.query;
        const data = await makeRequest(`${JIKAN_BASE_URL}/anime?order_by=popularity&sort=asc&page=${page}&sfw=true`);
        res.json(data);
    } catch (error) {
        res.json(FALLBACK_TOP_ANIME);
    }
};

exports.getRecentHighRatedAnime = async (req, res) => {
    try {
        const { page = 1 } = req.query;
        const data = await makeRequest(`${JIKAN_BASE_URL}/anime?order_by=score&sort=desc&min_score=8&start_date=2023-01-01&page=${page}&sfw=true`);
        res.json(data);
    } catch (error) {
        res.json(FALLBACK_TOP_ANIME);
    }
};

exports.searchAnime = async (req, res) => {
    try {
        const { q, page = 1 } = req.query;
        if (!q) return res.json({ data: [], pagination: { has_next_page: false } });
        const data = await makeRequest(`${JIKAN_BASE_URL}/anime?q=${encodeURIComponent(q)}&order_by=score&sort=desc&page=${page}&sfw=true`);
        res.json(data);
    } catch (error) {
        res.json(FALLBACK_TOP_ANIME);
    }
};

exports.getAnimeDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const data = await makeRequest(`${JIKAN_BASE_URL}/anime/${id}/full`);
        res.json(data);
    } catch (error) {
        res.status(error.response?.status || 500).json({ error: error.message });
    }
};

exports.getAnimeGenres = async (req, res) => {
    try {
        const data = await makeRequest(`${JIKAN_BASE_URL}/genres/anime`, 1, true);
        res.json(data);
    } catch (error) {
        res.json(FALLBACK_ANIME_GENRES);
    }
};

exports.getAnimeByGenre = async (req, res) => {
    try {
        const { genreId, page = 1 } = req.query;
        const data = await makeRequest(`${JIKAN_BASE_URL}/anime?genres=${genreId}&order_by=score&sort=desc&page=${page}&sfw=true`);
        res.json(data);
    } catch (error) {
        res.json(FALLBACK_TOP_ANIME);
    }
};

exports.getAnimeRecommendations = async (req, res) => {
    try {
        const { id } = req.params;
        const data = await makeRequest(`${JIKAN_BASE_URL}/anime/${id}/recommendations`);
        res.json(data);
    } catch (error) {
        res.json({ data: [] });
    }
};

// Movie Controllers
exports.getPopularMovies = async (req, res) => {
    try {
        const key = getTmdbKey();
        const { page = 1, lang } = req.query;
        
        // Ensure lang is treated as undefined if it's an empty string
        const targetLang = (lang && lang.trim() !== "") ? lang : undefined;

        let url = targetLang 
            ? `${TMDB_BASE_URL}/discover/movie?api_key=${key}&page=${page}&include_adult=false&with_original_language=${targetLang}&sort_by=popularity.desc&vote_count.gte=${(targetLang === "te" || targetLang === "ta") ? 5 : 50}`
            : `${TMDB_BASE_URL}/movie/popular?api_key=${key}&page=${page}&include_adult=false`;
        
        const data = await makeRequest(url);
        res.json(data);
    } catch (error) {
        console.error("Popular Movies Error:", error.message);
        res.status(error.response?.status || 500).json({ error: error.message });
    }
};

exports.getMovieLanguages = async (req, res) => {
    try {
        const key = getTmdbKey();
        const data = await makeRequest(`${TMDB_BASE_URL}/configuration/languages?api_key=${key}`, 1, true);
        res.json(data);
    } catch (error) {
        res.status(error.response?.status || 500).json({ error: error.message });
    }
};

exports.searchMovies = async (req, res) => {
    try {
        const key = getTmdbKey();
        const { query, page = 1, lang } = req.query;
        if (!query) return res.json({ results: [], total_pages: 0 });
        let url = `${TMDB_BASE_URL}/search/movie?api_key=${key}&query=${encodeURIComponent(query)}&page=${page}&include_adult=false`;
        if (lang) url += `&language=${lang}`;
        const data = await makeRequest(url);
        res.json(data);
    } catch (error) {
        res.status(error.response?.status || 500).json({ error: error.message });
    }
};

exports.getMovieDetails = async (req, res) => {
    try {
        const key = getTmdbKey();
        const { id } = req.params;
        const data = await makeRequest(`${TMDB_BASE_URL}/movie/${id}?api_key=${key}&append_to_response=videos,credits,watch%2Fproviders`);
        res.json(data);
    } catch (error) {
        res.status(error.response?.status || 500).json({ error: error.message });
    }
};

exports.getMovieGenres = async (req, res) => {
    try {
        const key = getTmdbKey();
        const data = await makeRequest(`${TMDB_BASE_URL}/genre/movie/list?api_key=${key}`, 1, true);
        res.json(data);
    } catch (error) {
        res.status(error.response?.status || 500).json({ error: error.message });
    }
};

exports.getMoviesByGenre = async (req, res) => {
    try {
        const key = getTmdbKey();
        const { genreId, page = 1, sortBy = "popularity.desc", lang } = req.query;
        const minVotes = (lang === "te" || lang === "ta") ? 5 : 100;
        let url = `${TMDB_BASE_URL}/discover/movie?api_key=${key}&with_genres=${genreId}&sort_by=${sortBy}&vote_count.gte=${minVotes}&page=${page}&include_adult=false`;
        if (lang) url += `&with_original_language=${lang}`;
        const data = await makeRequest(url);
        res.json(data);
    } catch (error) {
        res.status(error.response?.status || 500).json({ error: error.message });
    }
};

exports.getMovieRecommendations = async (req, res) => {
    try {
        const key = getTmdbKey();
        const { id } = req.params;
        const data = await makeRequest(`${TMDB_BASE_URL}/movie/${id}/recommendations?api_key=${key}&include_adult=false`);
        res.json(data);
    } catch (error) {
        res.status(error.response?.status || 500).json({ error: error.message });
    }
};
