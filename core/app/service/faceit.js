import dotenv from "dotenv";
import log from "../log/logger.js";
import axios from "axios";

dotenv.config();

const faceitConfig = {
  headers: {
    Authorization: `Bearer ${process.env.FACEIT_API_KEY}`,
  },
};

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

      var mapplayed = playerRound.round_stats.Map;

      var winner = playerRound.round_stats.Winner;

      // find the team of the player
      const playeurTeamId = playerRound.teams.find((team) =>
        team.players.some((player) => player.player_id === player_id)
      ).team_id;

      var message = " ";

      if (winner == playeurTeamId) {
        message = "win";
      } else {
        message = "lose";
      }

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
      } else if (playerStats["K/R Ratio"] < 0.75) {
        multiplicateur = 1.50;
      } else if (playerStats["K/R Ratio"] < 1) {
        multiplicateur = 1.20;
      } else if (playerStats["K/R Ratio"] < 1.25) {
        multiplicateur = 1.1;
      } else if (playerStats["K/R Ratio"] < 1.5) {
        multiplicateur = 1.05;
      } else if (playerStats["K/R Ratio"] < 1.75) {
        multiplicateur = 1;
      } else if (playerStats["K/R Ratio"] < 2) {
        multiplicateur = 0.95;
      } else if (playerStats["K/R Ratio"] < 2.25) {
        multiplicateur = 0.9;
      } else if (playerStats["K/R Ratio"] < 2.5) {
        multiplicateur = 0.85;
      } else if (playerStats["K/R Ratio"] < 2.75) {
        multiplicateur = 0.8;
      } else if (playerStats["K/R Ratio"] < 3) {
        multiplicateur = 0.75;
      } else if (playerStats["K/R Ratio"] < 3.25) {
        multiplicateur = 0.7;
      }

      playerStats.MultikillRating = (((playerStats.Kills * multiplicateur) + (9 * playerStats["Triple Kills"]) + (16 * playerStats["Quadro Kills"]) + (25 * playerStats["Penta Kills"])) / playerStats.RoundsPlayed) / 1.277;

      // Combining the Variables (KillRating+(0.7*SurvivalRating) +MultikillRating)/2.7
      playerStats.CombinedRating = (playerStats.KillRating + (0.7 * playerStats.SurvivalRating) + playerStats.MultikillRating) / 2.7;

      // string to number
      playerStats.Rating = parseFloat(playerStats.CombinedRating.toFixed(2));

      mapplayed = mapplayed.substring(3);

      // Add the map played with score 
      playerStats.Map = (mapplayed + "-" + message);

      return playerStats;
    } catch (err) {
      console.error(err);
      return null;
    }
  },

  getWeekStats: async (player_id) => {
    const today = new Date();
    function getFirstDayOfWeek(d) {
      const date = new Date(d);
      const day = date.getDay();

      const diff = date.getDate() - day + (day === 0 ? -6 : 1);

      return new Date(date.setDate(diff));
    }

    const firstDay = getFirstDayOfWeek(today);

    const lastDay = new Date(firstDay);
    lastDay.setDate(lastDay.getDate() + 6);

    firstDay.setHours(0, 0, 0, 0);
    lastDay.setHours(23, 59, 59, 999);

    // Convert the dates to Unix timestamps (seconds since epoch)
    const start = Math.floor(firstDay.getTime() / 1000);
    const end = Math.floor(lastDay.getTime() / 1000);

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
      stats.rating = ((stats.rating / matchStatsPlayer.length) + 0.04).toFixed(2);

      return stats;
    } catch (err) {
      log.error(err);
    }
  },

  //match stats for graph
  getWeekStatsGraph: async (player_id) => {
    const today = new Date();
    function getFirstDayOfWeek(d) {
      const date = new Date(d);
      const day = date.getDay();

      const diff = date.getDate() - day + (day === 0 ? -6 : 1);

      return new Date(date.setDate(diff));
    }

    const lastDay = today;
    const firstDay = new Date("2021-08-01T00:00:00.000Z");

    // Convert the dates to Unix timestamps (seconds since epoch)
    const start = Math.floor(firstDay.getTime() / 1000);
    const end = Math.floor(lastDay.getTime() / 1000);

    const url = `https://open.faceit.com/data/v4/players/${player_id}/history?game=csgo&from=${start}&to=${end}&offset=0&limit=50`;
    const config = faceitConfig;

    //function pour savoir combien de game j'ai jouer sur une map 
    var mapplayed = [
      { map: "dust2", played: 0, win: 0, lose: 0 },
      { map: "inferno", played: 0, win: 0, lose: 0 },
      { map: "mirage", played: 0, win: 0, lose: 0 },
      { map: "nuke", played: 0, win: 0, lose: 0 },
      { map: "overpass", played: 0, win: 0, lose: 0 },
      { map: "anubis", played: 0, win: 0, lose: 0 },
      { map: "vertigo", played: 0, win: 0, lose: 0 },
      { map: "ancient", played: 0, win: 0, lose: 0 },
    ];

    // function pour savoir combien de game j'ai jouer sur une map attention apres le nom de la map il y a un -win ou -lose
    function mapplayedfunction(map) {
      if (map == "dust2-win") {
        mapplayed[0].played += 1;
        mapplayed[0].win += 1;
      } else if (map == "dust2-lose") {
        mapplayed[0].played += 1;
        mapplayed[0].lose += 1;
      } else if (map == "inferno-win") {
        mapplayed[1].played += 1;
        mapplayed[1].win += 1;
      } else if (map == "inferno-lose") {
        mapplayed[1].played += 1;
        mapplayed[1].lose += 1;
      } else if (map == "mirage-win") {
        mapplayed[2].played += 1;
        mapplayed[2].win += 1;
      } else if (map == "mirage-lose") {
        mapplayed[2].played += 1;
        mapplayed[2].lose += 1;
      } else if (map == "nuke-win") {
        mapplayed[3].played += 1;
        mapplayed[3].win += 1;
      } else if (map == "nuke-lose") {
        mapplayed[3].played += 1;
        mapplayed[3].lose += 1;
      } else if (map == "overpass-win") {
        mapplayed[4].played += 1;
        mapplayed[4].win += 1;
      } else if (map == "overpass-lose") {
        mapplayed[4].played += 1;
        mapplayed[4].lose += 1;
      } else if (map == "anubis-win") {
        mapplayed[5].played += 1;
        mapplayed[5].win += 1;
      } else if (map == "anubis-lose") {
        mapplayed[5].played += 1;
        mapplayed[5].lose += 1;
      } else if (map == "vertigo-win") {
        mapplayed[6].played += 1;
        mapplayed[6].win += 1;
      } else if (map == "vertigo-lose") {
        mapplayed[6].played += 1;
        mapplayed[6].lose += 1;
      } else if (map == "ancient-win") {
        mapplayed[7].played += 1;
        mapplayed[7].win += 1;
      } else if (map == "ancient-lose") {
        mapplayed[7].played += 1;
        mapplayed[7].lose += 1;
      }
    }

    try {
      const matchResponse = await axios.get(url, config);
      const matches = matchResponse.data.items;
      const matchIds = matches.map((match) => match.match_id);
      const matchStatsPlayer = await Promise.all(
        matchIds.map((matchId) =>
          faceit.getMatchStatsPlayer(matchId, player_id)
        )
      );
      matchStatsPlayer.reverse();
      matchStatsPlayer.forEach((match) => {
        if (match) {
          mapplayedfunction(match.Map);
        }
      });
      mapplayed.sort(function (a, b) {
        return b.played - a.played;
      });
      return {
        mapplayed: mapplayed,
        matchStatsPlayer: matchStatsPlayer,
      };
    } catch (err) {
      log.error(err);
      return null;
    }
  },

  getPlayer: async (player_id) => {
    const url = `https://open.faceit.com/data/v4/players/${player_id}`;
    const config = faceitConfig;
    try {
      const response = await axios.get(url, config);

      const faceitLevel = {
        1: {
          rank: "1",
          min: 0,
          max: 800,
        },
        2: {
          rank: "2",
          min: 801,
          max: 950,
        },
        3: {
          rank: "3",
          min: 951,
          max: 1100,
        },
        4: {
          rank: "4",
          min: 1101,
          max: 1250,
        },
        5: {
          rank: "5",
          min: 1251,
          max: 1400,
        },
        6: {
          rank: "6",
          min: 1401,
          max: 1550,
        },
        7: {
          rank: "7",
          min: 1551,
          max: 1700,
        },
        8: {
          rank: "8",
          min: 1701,
          max: 1850,
        },
        9: {
          rank: "9",
          min: 1851,
          max: 2000,
        },
        10: {
          rank: "10",
          min: 2001,
          max: 2150,
        }
      }
      //check how many elo to up rank 
      const eloToUp = (faceitLevel[response.data.games.csgo.skill_level].max - response.data.games.csgo.faceit_elo) + 1;

      //change {language} to fr https://www.faceit.com/{lang}/players/WNova
      const faceitUrl = response.data.faceit_url;
      const faceitUrlFr = faceitUrl.replace("{lang}", "fr");

      //custom data
      const playeurData = {
        nickname: response.data.nickname,
        level: response.data.games.csgo.skill_level,
        elo: response.data.games.csgo.faceit_elo,
        eloToUp: eloToUp,
        faceitUrl: faceitUrlFr,
      }

      return playeurData;
    } catch (err) {
      log.error(err);
    }
  },

  getMoyenStats: async (player_id) => {
    console.log(player_id);
    const userStats = await faceit.getWeekStatsGraph(player_id);

    // Variables to store the sum for the average calculations
    let sumKDRatio = 0;
    let sumKRRatio = 0;
    let sumHeadshotsPercentage = 0;
    let sumRating = 0;

    // Variables to store the sum for the other stats
    let otherStatsSum = {};

    const totalGamesPlayed = userStats.matchStatsPlayer.length;

    for (let match of userStats.matchStatsPlayer) {
      if (match) { // Vérifiez si match n'est pas null ou undefined
        sumKDRatio += parseFloat(match["K/D Ratio"]) || 0;
        sumKRRatio += parseFloat(match["K/R Ratio"]) || 0;
        sumHeadshotsPercentage += parseFloat(match["Headshots %"]) || 0;
        sumRating += parseFloat(match["Rating"]) || 0;
    
        // List of stats to sum up
        const statsToSum = ["Kills", "Deaths", "Assists", "Headshots", "RoundsPlayed", "Triple Kills", "Quadro Kills", "Penta Kills"];
    
        for (let stat of statsToSum) {
          if (!otherStatsSum[stat]) otherStatsSum[stat] = 0;
          otherStatsSum[stat] += parseFloat(match[stat]) || 0;
        }
      }
    }

    // Calculate the averages
    const averageKDRatio = sumKDRatio / totalGamesPlayed;
    const averageKRRatio = sumKRRatio / totalGamesPlayed;
    const averageHeadshotsPercentageRaw = sumHeadshotsPercentage / totalGamesPlayed;
    const averageHeadshotsPercentage = Math.round(averageHeadshotsPercentageRaw);
    const averageRating = sumRating / totalGamesPlayed;

    return {
      player_id: player_id,
      totalGames: totalGamesPlayed,
      averages: {
        "K/D Ratio": averageKDRatio.toFixed(2),
        "K/R Ratio": averageKRRatio.toFixed(2),
        "Headshots %": averageHeadshotsPercentage,
        "Rating": averageRating.toFixed(2),
      },
      sums: otherStatsSum
    };
  }



};

export default faceit;