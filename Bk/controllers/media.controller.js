const axios = require("axios");
const https = require("https");

const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const JIKAN_BASE_URL = "https://api.jikan.moe/v4";

// High Reliability Agent
// maxSockets: 1 forces Node to send requests one-by-one, avoiding TMDB's burst protection
const secureAgent = new https.Agent({ 
    keepAlive: true, 
    keepAliveMsecs: 1000,
    maxSockets: 1, 
    maxFreeSockets: 1,
    timeout: 30000,
    family: 4
});

const apiClient = axios.create({
    timeout: 30000,
    httpsAgent: secureAgent,
    headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
        "Accept": "application/json",
        "Accept-Encoding": "gzip, deflate, br"
    }
});

const getTmdbKey = () => {
    const key = process.env.TMDB_API_KEY;
    if (!key) throw new Error("TMDB_API_KEY is missing");
    return key;
};

/**
 * Enhanced request wrapper with queuing behavior and backoff
 */
const makeRequest = async (url, retries = 3) => {
    try {
        // Small initial delay to prevent instant bursts when called in parallel
        await new Promise(r => setTimeout(r, Math.random() * 200));
        
        const response = await apiClient.get(url);
        return response.data;
    } catch (error) {
        const isNetworkError = !error.response && 
            (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED');
        
        if (isNetworkError && retries > 0) {
            const delay = (Math.pow(2, 3 - retries) * 1500) + (Math.random() * 1000);
            console.warn(`⚠️ [${error.code}] Retrying in ${Math.round(delay)}ms...`);
            await new Promise(r => setTimeout(r, delay));
            return makeRequest(url, retries - 1);
        }
        
        console.error("❌ Final Failure:", error.message, "| Code:", error.code);
        throw error;
    }
};

// Anime Controllers
exports.getTopAnime = async (req, res) => {
    try {
        const { page = 1 } = req.query;
        const data = await makeRequest(`${JIKAN_BASE_URL}/top/anime?filter=airing&page=${page}&sfw=true`);
        res.json(data);
    } catch (error) {
        res.status(error.response?.status || 500).json({ error: error.message });
    }
};

exports.getTrendingAnime = async (req, res) => {
    try {
        const { page = 1 } = req.query;
        const data = await makeRequest(`${JIKAN_BASE_URL}/anime?order_by=popularity&sort=desc&page=${page}&sfw=true`);
        res.json(data);
    } catch (error) {
        res.status(error.response?.status || 500).json({ error: error.message });
    }
};

exports.getRecentHighRatedAnime = async (req, res) => {
    try {
        const { page = 1 } = req.query;
        const data = await makeRequest(`${JIKAN_BASE_URL}/anime?order_by=score&sort=desc&min_score=8&start_date=2023-01-01&page=${page}&sfw=true`);
        res.json(data);
    } catch (error) {
        res.status(error.response?.status || 500).json({ error: error.message });
    }
};

exports.searchAnime = async (req, res) => {
    try {
        const { q, page = 1 } = req.query;
        const data = await makeRequest(`${JIKAN_BASE_URL}/anime?q=${q}&order_by=score&sort=desc&page=${page}&sfw=true`);
        res.json(data);
    } catch (error) {
        res.status(error.response?.status || 500).json({ error: error.message });
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
        const data = await makeRequest(`${JIKAN_BASE_URL}/genres/anime`);
        res.json(data);
    } catch (error) {
        res.status(error.response?.status || 500).json({ error: error.message });
    }
};

exports.getAnimeByGenre = async (req, res) => {
    try {
        const { genreId, page = 1 } = req.query;
        const data = await makeRequest(`${JIKAN_BASE_URL}/anime?genres=${genreId}&order_by=score&sort=desc&page=${page}&sfw=true`);
        res.json(data);
    } catch (error) {
        res.status(error.response?.status || 500).json({ error: error.message });
    }
};

exports.getAnimeRecommendations = async (req, res) => {
    try {
        const { id } = req.params;
        const data = await makeRequest(`${JIKAN_BASE_URL}/anime/${id}/recommendations`);
        res.json(data);
    } catch (error) {
        res.status(error.response?.status || 500).json({ error: error.message });
    }
};

// Movie Controllers
exports.getPopularMovies = async (req, res) => {
    try {
        const key = getTmdbKey();
        const { page = 1 } = req.query;
        const data = await makeRequest(`${TMDB_BASE_URL}/movie/popular?api_key=${key}&page=${page}&include_adult=false`);
        res.json(data);
    } catch (error) {
        res.status(error.response?.status || 500).json({ error: error.message });
    }
};

exports.searchMovies = async (req, res) => {
    try {
        const key = getTmdbKey();
        const { query, page = 1 } = req.query;
        const data = await makeRequest(`${TMDB_BASE_URL}/search/movie?api_key=${key}&query=${query}&page=${page}&include_adult=false`);
        res.json(data);
    } catch (error) {
        res.status(error.response?.status || 500).json({ error: error.message });
    }
};

exports.getMovieDetails = async (req, res) => {
    try {
        const key = getTmdbKey();
        const { id } = req.params;
        const data = await makeRequest(`${TMDB_BASE_URL}/movie/${id}?api_key=${key}&append_to_response=videos,credits`);
        res.json(data);
    } catch (error) {
        res.status(error.response?.status || 500).json({ error: error.message });
    }
};

exports.getMovieGenres = async (req, res) => {
    try {
        const key = getTmdbKey();
        const data = await makeRequest(`${TMDB_BASE_URL}/genre/movie/list?api_key=${key}`);
        res.json(data);
    } catch (error) {
        res.status(error.response?.status || 500).json({ error: error.message });
    }
};

exports.getMoviesByGenre = async (req, res) => {
    try {
        const key = getTmdbKey();
        const { genreId, page = 1, sortBy = "popularity.desc" } = req.query;
        const data = await makeRequest(`${TMDB_BASE_URL}/discover/movie?api_key=${key}&with_genres=${genreId}&sort_by=${sortBy}&vote_count.gte=100&vote_average.gte=5&page=${page}&include_adult=false`);
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