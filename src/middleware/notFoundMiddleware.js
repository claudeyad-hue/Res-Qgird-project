export function notFoundHandler(req, res, next) {
  res.status(404).json({
    success: false,
    message: 'API route not found',
    error: {
      code: 'ROUTE_NOT_FOUND',
    },
  });
}

export default notFoundHandler;
