export default function contentTypeMiddleware(req, res, next) {
  // Skip for GET requests (no body)
  if (req.method === 'GET') {
    return next();
  }
  
  // Check Content-Type header
  const contentType = req.get('Content-Type');
  
  // Only allow application/json for POST, PUT, PATCH requests
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    if (!contentType || !contentType.includes('application/json')) {
      return res.status(415).json({
        message: 'Unsupported Media Type. Only application/json is allowed.'
      });
    }
  }
  
  next();
}
