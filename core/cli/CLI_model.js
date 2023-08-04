// Importation des modules nécessaires
import inquirer from "inquirer";
import fs from "fs/promises";
import chalk from "chalk";
import boxen from "boxen";

// Fonction pour obtenir les modèles existants
async function getExistingModels() {
    try {
        const files = await fs.readdir("./models");
        return files.map((file) => file.replace(".js", ""));
    } catch (err) {
        console.error(chalk.red("Erreur lors de la lecture du répertoire 'models'. Veuillez vous assurer que le répertoire existe et que vous disposez des autorisations appropriées."));
        process.exit(1);
    }
}

// Validation du nom du modèle
function validateModelName(modelName) {
    const validModelName = /^[a-zA-Z0-9_]+$/;
    if (!validModelName.test(modelName)) {
        return "Veuillez entrer un nom de modèle valide (caractères alphanumériques et underscores uniquement).";
    }
    return true;
}

// Fonction pour vérifier si un modèle existe déjà
async function isModelExists(modelName) {
    const existingModels = await getExistingModels();
    return existingModels.includes(modelName);
}

// Fonction pour exécuter l'interface de ligne de commande
async function runCLI() {
    try {
        const existingModels = await getExistingModels();

        const questions = [
            {
                type: "input",
                name: "modelName",
                message: "Quel est le nom du modèle Mongoose ?",
                validate: validateModelName,
            },
            {
                type: "input",
                name: "fieldCount",
                message: "Combien de champs souhaitez-vous ajouter au modèle ?",
                validate: function (value) {
                    const valid = !isNaN(parseFloat(value));
                    return valid || "Veuillez entrer un nombre valide.";
                },
                filter: Number,
            },
        ];

        const { modelName, fieldCount } = await inquirer.prompt(questions);

        // Vérification si le modèle existe déjà
        if (await isModelExists(modelName)) {
            console.error(chalk.red(`Le modèle "${modelName}" existe déjà. Veuillez choisir un autre nom.`));
            process.exit(1);
        }

        const fields = [];

        const validTypes = [
            "String",
            "Number",
            "Date",
            "Boolean",
            "[String]",
            "[Number]",
            "[Date]",
            "[Boolean]",
            "Schema.Types.ObjectId",
            "[Schema.Types.ObjectId]",
            ...existingModels,
        ];

        for (let i = 0; i < fieldCount; i++) {
            const field = await inquirer.prompt([
                {
                    type: "input",
                    name: "fieldName",
                    message: `Nom du champ ${i + 1} :`,
                },
                {
                    type: "list",
                    name: "fieldType",
                    message: `Type du champ ${i + 1} :`,
                    choices: validTypes,
                },
                {
                    type: "confirm",
                    name: "isRequired",
                    message: "Ce champ est-il requis ?",
                    default: false,
                },
            ]);

            fields.push(field);
        }

        const modelContent = `
import mongoose from "mongoose";

const ${modelName}Schema = new mongoose.Schema({
  ${fields
            .map((field) => {
                if (existingModels.includes(field.fieldType)) {
                    return `${field.fieldName}: { type: mongoose.Schema.Types.ObjectId, ref: '${field.fieldType}', required: ${field.isRequired} }`;
                } else if (
                    field.fieldType === "Schema.Types.ObjectId" ||
                    field.fieldType === "[Schema.Types.ObjectId]"
                ) {
                    return `${field.fieldName}: { type: mongoose.${field.fieldType}, required: ${field.isRequired} }`;
                } else {
                    return `${field.fieldName}: { type: ${field.fieldType}, required: ${field.isRequired} }`;
                }
            })
            .join(",\n  ")}
});

const ${modelName} = mongoose.model("${modelName}", ${modelName}Schema);

export default ${modelName};
`;

        await fs.writeFile(`models/${modelName}.js`, modelContent);

        const modelConsoleView = `
${chalk.bold("Modèle généré avec succès !")}
${chalk.bold(`${modelName} {`)}
${fields
            .map((field) => {
                return `${field.fieldName} (${field.fieldType})${field.isRequired ? " (requis)" : ""
                    }`;
            })
            .join("\n")}
${chalk.bold(`}`)}
`;
        console.log(
            boxen(modelConsoleView, {
                padding: 1,
                margin: 1,
                borderStyle: "round",
                borderColor: "green",
            })
        );
    } catch (err) {
        console.error(chalk.red(`Erreur lors de la génération du modèle : ${err.message}`));
        process.exit(1);
    } finally {
        process.exit(0);
    }
}

runCLI();
