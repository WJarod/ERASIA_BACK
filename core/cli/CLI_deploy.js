// Importation des modules nécessaires
import inquirer from "inquirer";
import fs from "fs/promises";
import dotenv from "dotenv";
import chalk from "chalk";
import boxen from "boxen";

// Fonction pour exécuter l'interface de ligne de commande
async function runCLI() {
    dotenv.config();
    try {
        const questions = [
            {
                type: "confirm",
                name: "docker",
                message: "Voulez-vous utiliser Docker ? (y/n)",
                default: false,
            }];

        const { docker } = await inquirer.prompt(questions);

        if (docker) {
            const dockerfileContent = generateDockerfileContent();
            await fs.writeFile("Dockerfile", dockerfileContent);
            console.log(chalk.green("Le fichier Dockerfile a été créé avec succès."));
        }

        const message = chalk.bold("Projet prêt !");
        const boxenOptions = {
            padding: 1,
            margin: 1,
            borderStyle: "round",
            borderColor: "green",
        };
        const msgBox = boxen(message, boxenOptions);
        console.log(msgBox);

    } catch (error) {
        console.error(chalk.red(`Erreur lors de la création du Dockerfile : ${error}`));
    } finally {
        process.exit(0);
    }
}

// Fonction pour générer le contenu du Dockerfile
function generateDockerfileContent() {
    const { DATABASE_URL, PORT } = process.env;

    if (!DATABASE_URL || !PORT) {
        console.error(chalk.red("Les variables d'environnement DATABASE_URL et PORT doivent être définies."));
        process.exit(1);
    }

    return `FROM node:14-alpine
ENV DATABASE_URL=${DATABASE_URL}
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE ${PORT}
CMD [ "npm", "start" ]`;
}

runCLI();
