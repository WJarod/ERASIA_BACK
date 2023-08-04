import express from "express";
import controller from "../controller/controller.js";

const router = (model, model_name) => {
  try {
    const Router = express.Router();
    const Controller = controller(model);

    // Routes génériques pour CRUD
    Router.route("/").get(Controller.get).post(Controller.post);
    Router.route("/:id").get(Controller.getOne).put(Controller.put).delete(Controller.delete);

    // Routes personnalisées pour la logique métier
    if (model.businessLogic) {
      for (const [key, value] of Object.entries(model.businessLogic)) {
        Router.route(value.route)[value.method](value.handler);
      }
    }

    return Router;
  } catch (err) {
    console.error(`Error defining routes for model ${model_name}: ${err.message}`);
  }
};


export default router;
