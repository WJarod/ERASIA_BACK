import log from '../log/logger.js';

// Middleware pour la gestion des erreurs
const errorHandler = (err, req, res, next) => {
  // Log the error details
  log.error(`Error: ${err.message}`);
  log.error(`Request URL: ${req.originalUrl}`);
  log.error(`Request Method: ${req.method}`);
  log.error(`Request Headers: ${JSON.stringify(req.headers)}`);
  log.error(`Request Body: ${JSON.stringify(req.body)}`);
  log.error(`Stack Trace: ${err.stack}`);

  // Send response with error message
  res.status(500).json({ message: err.message });
};

// Exportation du middleware
export default errorHandler;
