// Importation des modules nécessaires
import inquirer from "inquirer";
import fs from "fs/promises";
import chalk from "chalk";
import simpleGit from "simple-git";
import boxen from "boxen";

// Fonction pour exécuter l'interface de ligne de commande
async function runCLI() {
    try {
        const questions = [
            {
                type: "input",
                name: "message",
                message: "Quel est le message du commit ?",
                validate: function (value) {
                    const valid = value.length > 0;
                    return valid || "Veuillez entrer un message valide.";
                },
            },
            {
                type: "input",
                name: "branch",
                message: "Sur quelle branche voulez-vous pusher ?",
                default: "main",
            },
            {
                type: "confirm",
                name: "dev",
                message: "Est-ce que vous êtes en développement ?",
                default: false,
            },
            {
                type: "confirm",
                name: "push",
                message: "Voulez-vous pusher les modifications ?",
                default: false,
            },
        ];

        const { message, branch, dev, push } = await inquirer.prompt(questions);

        // Supprimer les fichiers dans le dossier models sauf User.js si on est en développement
        if (dev) {
            const files = await fs.readdir("./models");
            try {
                for (const file of files) {
                    if (file !== "User.js") {
                        await fs.unlink(`./models/${file}`);
                    }
                }
                console.log(
                    chalk.green(
                        `Les fichiers dans le dossier models et le dossier test ont été supprimés avec succès.`
                    )
                );
            }
            catch (err) {
                console.error(
                    chalk.red(
                        `Erreur lors de la suppression des fichiers dans le dossier models : ${err}`
                    )
                );
                process.exit(1);
            }
            // Supprimer le dossier test si on est en développement
            const testDirPath = "./test";
            try {
                await fs.rm(testDirPath, { recursive: true, force: true });
                console.log(chalk.green(`Le dossier test a été supprimé avec succès.`));
            } catch (err) {
                console.error(
                    chalk.red(`Erreur lors de la suppression du dossier test : ${err}`)
                );
                process.exit(1);
            }
        }

        // Exécuter la commande git add && git commit
        const git = simpleGit();
        await git.add(".");
        await git.commit(message);

        console.log(
            chalk.green(
                `La commande git add && git commit s'est terminée avec succès.`
            )
        );

        // Vérifier si on veut effectuer un git push
        if (push) {
            await git.push("origin", branch);
            console.log(
                chalk.green(
                    `Le push sur la branche ${branch} s'est terminé avec succès.`
                )
            );
        }

        const consoleMessage = chalk.bold("La commande git s'est terminée avec succès !");

        const boxenOptions = {
            padding: 1,
            margin: 1,
            borderStyle: "round",
            borderColor: "green",
        };

        const msgBox = boxen(consoleMessage, boxenOptions);

        console.log(msgBox);

        process.exit(0);
    } catch (error) {
        console.error(
            chalk.red(`Erreur lors de l'exécution de la commande : ${error}`)
        );
        process.exit(1);
    }
}

runCLI();
