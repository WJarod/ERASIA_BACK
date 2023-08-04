import dotenv from "dotenv";
import mongoose from "mongoose";
import log from "./log/logger.js";

dotenv.config();

const bd_connect = async () => {
    const DATABASE_URL = process.env.DATABASE_URL || "mongodb://localhost:27017";
    try {
        await mongoose.connect(DATABASE_URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        log.info("Connexion à la base de données MongoDB réussie !");
    } catch (err) {
        log.error(`Erreur de connexion à la base de données MongoDB : ${err.message}`);
    }
};

export default bd_connect;
