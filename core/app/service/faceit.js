import dotenv from "dotenv";
import log from "../log/logger.js";
import axios from "axios";

dotenv.config();

const faceitConfig = {
    headers: {
        Authorization: `Bearer ${process.env.FACEIT_API_KEY}`,
    },
};

const faceitTeam = [
    "0e89b6b7-1977-4f10-8c3e-009869d44898",
    "77ee655c-f477-4986-9aab-13f75c5c33d6",
    "f78b280f-1134-4260-b33b-42e9b06e0e74",
    "b08b1d18-2961-4331-92ed-c8c0c42a8bc8",
    "0d5fb588-750c-4e96-aaee-ff78702420b7",
]

const faceit = {
    api_key: process.env.FACEIT_API_KEY,

    getMatches: async (player_id) => {
        const start = Math.floor((Date.now() - 604800000) / 1000);
        const end = Math.floor(Date.now() / 1000);
        const url = `https://open.faceit.com/data/v4/players/${player_id}/history?game=csgo&from=${start}&to=${end}&offset=0&limit=20`;
        const config = faceitConfig;
        try {
            const response = await axios.get(url, config);
            return response.data.items;
        } catch (err) {
            log.error(err);
        }
    },

    getMatchStats: async (match_id) => {
        const url = `https://open.faceit.com/data/v4/matches/${match_id}/stats`;
        const config = faceitConfig;
        try {
            const response = await axios.get(url, config);
            return response.data.rounds;
        } catch (err) {
            log.error(err);
        }
    },

    getMatchStatsPlayer: async (match_id, player_id) => {
        const url = `https://open.faceit.com/data/v4/matches/${match_id}/stats`;
        const config = faceitConfig;
        try {
            const response = await axios.get(url, config);
            const matchData = response.data;

            // Trouver le joueur avec le player_id spécifié dans les rounds du match
            const playerRound = matchData.rounds.find((round) =>
                round.teams.some((team) => team.players.some((player) => player.player_id === player_id))
            );

            if (!playerRound) {
                console.log("Le joueur n'a pas participé à ce match.");
                return null;
            }

            // Trouver le joueur dans l'équipe du match
            const playerTeam = playerRound.teams.find((team) =>
                team.players.some((player) => player.player_id === player_id)
            );

            // Trouver les statistiques du joueur dans l'équipe
            const playerStats = playerTeam.players.find((player) => player.player_id === player_id).player_stats;

            return playerStats;
        } catch (err) {
            console.error(err);
            return null;
        }
    },

    getWeekStats: async (player_id) => {
        const start = Math.floor((Date.now() - 604800000) / 1000);
        const end = Math.floor(Date.now() / 1000);
        const url = `https://open.faceit.com/data/v4/players/${player_id}/history?game=csgo&from=${start}&to=${end}&offset=0&limit=50`;
        const config = faceitConfig;
        try {
            const matchResponse = await axios.get(url, config);
            const matches = matchResponse.data.items;
            const matchIds = matches.map((match) => match.match_id);
            const matchStatsPlayer = await Promise.all(
                matchIds.map((matchId) => faceit.getMatchStatsPlayer(matchId, player_id))
            );           

            const stats = {
                wins: 0,
                losses: 0,
                kills: 0,
                deaths: 0,
                assists: 0,
                headshots: 0,
                "headshots %": 0,
                "K/D Ratio": 0,
                "K/R Ratio": 0,
                mvps: 0,
                tripleKills: 0,
                quadroKills: 0,
                pentaKills: 0,
            };

            matchStatsPlayer.forEach((match) => {
                if (match) {
                    stats.wins += parseInt(match.Result);
                    stats.kills += parseInt(match.Kills);
                    stats.deaths += parseInt(match.Deaths);
                    stats.assists += parseInt(match.Assists);
                    stats.headshots += parseInt(match.Headshots);
                    stats.mvps += parseInt(match.MVPs);
                    stats.tripleKills += parseInt(match["Triple Kills"]);
                    stats.quadroKills += parseInt(match["Quadro Kills"]);
                    stats.pentaKills += parseInt(match["Penta Kills"]);
                }
            }
            );

            stats["headshots %"] = Math.round((stats.headshots / stats.kills) * 100);
            stats["K/D Ratio"] = (stats.kills / stats.deaths).toFixed(2);
            stats["K/R Ratio"] = ((stats.kills + stats.assists) / stats.deaths).toFixed(2);
            stats.wins = stats.wins;
            stats.losses = matchStatsPlayer.length - stats.wins;
            
            return stats;
        }
        catch (err) {
            log.error(err);
        }
    },

    getTeamStats: async () => {
        try {
            // Récupérer les statistiques des joueurs de l'équipe
            const playerStats = await Promise.all(
                faceitTeam.map((playerId) => faceit.getWeekStats(playerId))
            );

            const teamStats = {
                wins: 0,
                losses: 0,
                kills: 0,
                deaths: 0,
                assists: 0,
                headshots: 0,
                "headshots %": 0,
                "K/D Ratio": 0,
                "K/R Ratio": 0,
                mvps: 0,
                tripleKills: 0,
                quadroKills: 0,
                pentaKills: 0,
            };

            playerStats.forEach((player) => {
                teamStats.wins += player.wins;
                teamStats.losses += player.losses;
                teamStats.kills += player.kills;
                teamStats.deaths += player.deaths;
                teamStats.assists += player.assists;
                teamStats.headshots += player.headshots;
                teamStats.mvps += player.mvps;
                teamStats.tripleKills += player.tripleKills;
                teamStats.quadroKills += player.quadroKills;
                teamStats.pentaKills += player.pentaKills;
            }
            );

            teamStats["headshots %"] = Math.round((teamStats.headshots / teamStats.kills) * 100);
            teamStats["K/D Ratio"] = (teamStats.kills / teamStats.deaths).toFixed(2);
            teamStats["K/R Ratio"] = (teamStats.kills + teamStats.assists) / teamStats.deaths;
            teamStats.wins = teamStats.wins / faceitTeam.length;
            teamStats.losses = teamStats.losses / faceitTeam.length;

            return teamStats ;
        }
        catch (err) {
            log.error(err);
        }
    },

};

export default faceit;