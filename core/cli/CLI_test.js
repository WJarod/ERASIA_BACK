// Importation des modules nécessaires
import { exec } from "child_process";
import chalk from "chalk";
import boxen from "boxen";

// Fonction pour exécuter les tests
function runCLI() {
    exec("./node_modules/.bin/mocha --recursive ./test", (error, stdout, stderr) => {
        if (error) {
            console.error(chalk.red(`Erreur lors de l'exécution des tests : ${error.message}`));
            process.exit(1);
        }
        if (stderr) {
            console.error(chalk.red(`Erreur lors de l'exécution des tests : ${stderr}`));
            process.exit(1);
        }
        console.log(
            boxen(`Résultats des tests :\n${stdout}`, {
                padding: 1,
                margin: 1,
                borderStyle: "round",
                borderColor: "green",
            })
        );
        process.exit(0);
    });
}

runCLI();
