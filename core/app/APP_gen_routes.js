import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import generic_routes from "../../routes/routes.js";
import log from "../app/log/logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const gen_routes = () => {
  return new Promise((resolve, reject) => {
    const routes = [];
    const modelsPath = path.resolve(__dirname, '../../models');

    fs.readdir(modelsPath, async (err, files) => {
      if (err) {
        log.error(`Error reading directory: ${err.message}`);
        reject(err);
        return;
      }

      await Promise.all(
        files.map(async (file) => {
          try {
            const model_name = file.split(".")[0];
            const model_uri = (await import(`../../models/${model_name}.js`)).default;
            const route = generic_routes(model_uri, model_name);
            routes.push({ name: model_name.toLowerCase(), route });
            log.info(`Route generated for model ${file}`);
          } catch (err) {
            log.error(`Error generating routes for model ${file}: ${err.message}`);
          }
        })
      );

      resolve(routes);
    });
  });
};

export default gen_routes;
