
import mongoose from "mongoose";

const DispoSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  dispo: { type: [], required: true },
  week: { type: Date, required: true }
});

const Dispo = mongoose.model("Dispo", DispoSchema);

Dispo.businessLogic = {
  //get by week
  findByWeek: {
    route: "/findByWeek/:week",
    method: "get",
    handler: async (req, res, next) => {
      try {
        const dispo = await Dispo.find({
          week: req.params.week
        });
        res.json(dispo);
      } catch (err) {
        next(err);
      }
    },
  },
};

export default Dispo;
