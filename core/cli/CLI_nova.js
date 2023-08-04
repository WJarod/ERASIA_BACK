#!/usr/bin/env node

import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { spawn } from "child_process";
import chalk from "chalk";
import boxen from "boxen";

const scripts = {
    start: "./app.js",
    dev: "./app.js",
    init: "./core/cli/CLI_init.js",
    model: "./core/cli/CLI_model.js",
    deploy: "./core/cli/CLI_deploy.js",
    git: "./core/cli/CLI_git.js",
    gen_test: "./core/cli/CLI_gen_test.js",
    test: "./core/cli/CLI_test.js",
};

const usage = boxen(
    chalk.bold("Usage: nova <command> [options]"),
    {
        padding: 1,
        margin: 1,
        borderStyle: "round",
        borderColor: "green",
    }
);

function executeCommand(command) {
    const scriptPath = scripts[command];

    if (!scriptPath) {
        console.error(chalk.red(`Commande inconnue : ${command}.`));
        process.exit(1);
    }

    const child = spawn("node", [scriptPath], { stdio: "inherit" });

    child.on("close", (code) => {
        if (code === 0) {
            console.log(chalk.green(`La commande "${command}" s'est terminée avec succès.`));
        } else {
            console.error(chalk.red(`La commande "${command}" a échoué avec le code de sortie ${code}.`));
        }
        process.exit(code);
    });
}

yargs(hideBin(process.argv))
    .usage(usage)
    .command(
        "start",
        "Start the server",
        () => executeCommand("start")
    )
    .command(
        "init",
        "Initialize a new project",
        () => executeCommand("init")
    )
    .command(
        "model",
        "Generate a new model",
        () => executeCommand("model")
    )
    .command(
        "deploy",
        "Deploy the server",
        () => executeCommand("deploy")
    )
    .command(
        "git",
        "Execute git commands",
        () => executeCommand("git")
    )
    .command(
        "gen_test",
        "Generer un fichier de test pour un modele",
        () => executeCommand("gen_test")
    ) 
    .command(
        "test",
        "Execute les tests",
        () => executeCommand("test")
    )
    .demandCommand(1, "Veuillez fournir une commande.")
    .help(
        "help",
        "Afficher l'aide"
    )
    .version(
        "version",
        "Afficher le numéro de version",
        "0.0.1"
    )
    .argv;
