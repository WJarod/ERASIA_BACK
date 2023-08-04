// Fonction pour générer un contrôleur pour un modèle spécifique
const controller = (model) => ({
  // Méthode pour obtenir tous les éléments
  get: async (req, res, next) => {
    try {
      const data = await model.find({});
      res.json(data);
    } catch (err) {
      next(err);
    }
  },
  
  // Méthode pour obtenir un élément spécifique
  getOne: async (req, res, next) => {
    try {
      const data = await model.findById(req.params.id);
      res.json(data);
    } catch (err) {
      next(err);
    }
  },
  
  // Méthode pour créer un nouvel élément
  post: async (req, res, next) => {
    try {
      const newData = new model(req.body);
      await newData.save();
      res.json(newData);
    } catch (err) {
      next(err);
    }
  },
  
  // Méthode pour mettre à jour un élément spécifique
  put: async (req, res, next) => {
    try {
      const data = await model.findByIdAndUpdate(req.params.id, req.body, { new: true });
      res.json(data);
    } catch (err) {
      next(err);
    }
  },
  
  // Méthode pour supprimer un élément spécifique
  delete: async (req, res, next) => {
    try {
      const data = await model.findByIdAndDelete(req.params.id);
      res.json(data);
    } catch (err) {
      next(err);
    }
  },
});

// Exportation de la fonction controller
export default controller;
