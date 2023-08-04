// Importation des modules nécessaires
import inquirer from "inquirer";
import fs from "fs/promises";
import chalk from "chalk";
import boxen from "boxen";

// Fonction pour valider une URL de base de données
function validateDatabaseUrl(url) {
    const urlPattern = /^(mongodb|mysql|postgresql|sqlite):\/\/[^\s/$.?#].[^\s]*$/;
    if (!urlPattern.test(url)) {
        return "Veuillez entrer une URL de base de données valide.";
    }
    return true;
}

// Fonction pour créer le fichier .env
async function createEnvFile(port, databaseUrl) {
    try {
        const env = `PORT=${port}\nDATABASE_URL=${databaseUrl}`;

        await fs.writeFile(".env", env);

        const message = chalk.bold("Fichier .env créé avec succès !");
        const boxenOptions = {
            padding: 1,
            margin: 1,
            borderStyle: "round",
            borderColor: "green",
        };
        const msgBox = boxen(message, boxenOptions);

        console.log(msgBox);
    } catch (error) {
        console.error(chalk.red(`Erreur lors de la création du fichier .env : ${error}`));
        process.exit(1);
    }
}

// Fonction pour exécuter l'interface de ligne de commande
async function runCLI() {
    try {
        const questions = [
            {
                type: "input",
                name: "port",
                message: "Quel est le port du projet ?",
                validate: function (value) {
                    const valid = !isNaN(parseFloat(value));
                    return valid || "Veuillez entrer un nombre valide.";
                },
            },
            {
                type: "input",
                name: "databaseUrl",
                message: "Quel est l'url de la base de données ?",
                validate: validateDatabaseUrl,
            },
        ];

        const { port, databaseUrl } = await inquirer.prompt(questions);

        await createEnvFile(port, databaseUrl);

        const message = chalk.bold("Initialisation du projet réussie !");

        const boxenOptions = {
            padding: 1,
            margin: 1,
            borderStyle: "round",
            borderColor: "green",
        };

        const msgBox = boxen(message, boxenOptions);

        console.log(msgBox);

    } catch (error) {
        console.error(`Error while running the init command : ${error}`);
    } finally {
        process.exit(0);
    }
}

runCLI();
