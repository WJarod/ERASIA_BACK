import express from "express"; 
import faceit from "../core/app/service/faceit.js";

const router = express.Router();

router.route("/matches/:player_id").get(async (req, res, next) => {
    try {
        const matches = await faceit.getMatches(req.params.player_id);
        res.json(matches);
    } catch (err) {
        next(err);
    }
});

router.route("/match-stats/:match_id").get(async (req, res, next) => {
    try {
        const matchStats = await faceit.getMatchStats(req.params.match_id);
        res.json(matchStats);
    } catch (err) {
        next(err);
    }
}); 

router.route("/match-stats/player/:match_id/:player_id").get(async (req, res, next) => {
    try {
        const matchStatsPlayer = await faceit.getMatchStatsPlayer(req.params.match_id, req.params.player_id);
        res.json(matchStatsPlayer);
    } catch (err) {
        next(err);
    }
});

router.route("/week-stats/:player_id").get(async (req, res, next) => {
    try {
        const weekStats = await faceit.getWeekStats(req.params.player_id);
        res.json(weekStats);
    } catch (err) {
        next(err);
    }
});

router.route("/week-stats-graph/:player_id").get(async (req, res, next) => {
    try {
        const weekStatsGraph = await faceit.getWeekStatsGraph(req.params.player_id);
        res.json(weekStatsGraph);
    } catch (err) {
        next(err);
    }
});

export default router;
