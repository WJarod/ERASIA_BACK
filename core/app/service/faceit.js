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
];

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
        round.teams.some((team) =>
          team.players.some((player) => player.player_id === player_id)
        )
      );
  
      if (!playerRound) {
        console.log("Le joueur n'a pas participé à ce match.");
        return null;
      }
  
      // Recuperer le nombre de rounds joués dans le match
      const roundsPlayed = playerRound.round_stats.Rounds;
  
      // Trouver le joueur dans l'équipe du match
      const playerTeam = playerRound.teams.find((team) =>
        team.players.some((player) => player.player_id === player_id)
      );
  
      // Trouver les statistiques du joueur dans l'équipe
      const playerStats = playerTeam.players.find(
        (player) => player.player_id === player_id
      ).player_stats;
  
      // Ajouter la propriété roundsPlayed aux statistiques du joueur
      playerStats.RoundsPlayed = roundsPlayed;

      //Kills Rating (Kills/Rounds)/0.679
      playerStats.KillRating = ((playerStats.Kills / playerStats.RoundsPlayed) / 0.679);

      //survival rating ((Rounds-Deaths)/Rounds)/0.317
      playerStats.SurvivalRating = ((playerStats.RoundsPlayed - playerStats.Deaths) / playerStats.RoundsPlayed) / 0.317;

      //Multikill Rating ((1K+(4*2K)+(9*3K)+(16*4K)+ (25*5K))/Rounds)/1.277

      var multiplicateur;
      
      if (playerStats["K/R Ratio"] < 0.5) {
        multiplicateur = 1.70;
      }else if (playerStats["K/R Ratio"] < 0.75) {
        multiplicateur = 1.50;
      } else if (playerStats["K/R Ratio"] < 1) {
        multiplicateur = 1.20;
      } else if (playerStats["K/R Ratio"] < 1.25) {
        multiplicateur = 1.1;
      } else if (playerStats["K/R Ratio"] < 1.5) {
        multiplicateur = 1.05;
      } 

      playerStats.MultikillRating = (((playerStats.Kills * multiplicateur) + (9 * playerStats["Triple Kills"]) + (16 * playerStats["Quadro Kills"]) + (25 * playerStats["Penta Kills"])) / playerStats.RoundsPlayed) / 1.277;

      // Combining the Variables (KillRating+(0.7*SurvivalRating) +MultikillRating)/2.7
      playerStats.CombinedRating = (playerStats.KillRating + (0.7 * playerStats.SurvivalRating) + playerStats.MultikillRating) / 2.7;
      
      // string to number
      playerStats.Rating = parseFloat(playerStats.CombinedRating.toFixed(2));

      return playerStats;
    } catch (err) {
      console.error(err);
      return null;
    }
  },

  getWeekStats: async (player_id) => {
    // Get the current date
    const currentDate = new Date();
    // Calculate the start of the current week (Monday)
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay() + 1); // Set to Monday
    startOfWeek.setHours(0, 0, 0, 0); // Set to start of day

    // Calculate the end of the current week (Sunday)
    const endOfWeek = new Date(currentDate);
    endOfWeek.setDate(currentDate.getDate() - currentDate.getDay() + 7); // Set to Sunday
    endOfWeek.setHours(23, 59, 59, 999); // Set to end of day

    // Convert the dates to Unix timestamps (seconds since epoch)
    const start = Math.floor(startOfWeek.getTime() / 1000);
    const end = Math.floor(endOfWeek.getTime() / 1000);

    const url = `https://open.faceit.com/data/v4/players/${player_id}/history?game=csgo&from=${start}&to=${end}&offset=0&limit=50`;
    const config = faceitConfig;

    try {
      const matchResponse = await axios.get(url, config);
      const matches = matchResponse.data.items;
      const matchIds = matches.map((match) => match.match_id);
      const matchStatsPlayer = await Promise.all(
        matchIds.map((matchId) =>
          faceit.getMatchStatsPlayer(matchId, player_id)
        )
      );

      const stats = {
        wins: 0,
        losses: 0,
        kills: 0,
        deaths: 0,
        assists: 0,
        headshots: 0,
        "headshots %": 0,// Headshots per kill %
        "K/D Ratio": 0,// Kills per death
        "K/R Ratio": 0,// Kills per round
        mvps: 0,
        tripleKills: 0,
        quadroKills: 0,
        pentaKills: 0,
        rating: 0,
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
          stats.rating += parseFloat(match.Rating);
        }
      });

      stats["headshots %"] = Math.round((stats.headshots / stats.kills) * 100);
      stats["K/D Ratio"] = (stats.kills / stats.deaths).toFixed(2);
      stats["K/R Ratio"] = (
        (stats.kills + stats.assists) /
        stats.deaths
      ).toFixed(2);
      stats.wins = stats.wins;
      stats.losses = matchStatsPlayer.length - stats.wins;
      stats.rating = ((stats.rating / matchStatsPlayer.length)+4).toFixed(2);

      return stats;
    } catch (err) {
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
      });

      teamStats["headshots %"] = Math.round(
        (teamStats.headshots / teamStats.kills) * 100
      );
      teamStats["K/D Ratio"] = (teamStats.kills / teamStats.deaths).toFixed(2);
      teamStats["K/R Ratio"] =
        (teamStats.kills + teamStats.assists) / teamStats.deaths;
      teamStats.wins = teamStats.wins / faceitTeam.length;
      teamStats.losses = teamStats.losses / faceitTeam.length;

      return teamStats;
    } catch (err) {
      log.error(err);
    }
  },
};

export default faceit;
