// Small helpers shared by the admin endpoints.
export function fail(res, err) {
  const status = err.status && err.status < 600 ? err.status : 500;
  if (status >= 500) console.error(err);
  res.status(status).json({ error: status >= 500 && !err.expose ? (err.message || 'Something went wrong.') : err.message, head: err.head });
}
export const only = (req, res, method) => {
  if (req.method === method) return true;
  res.setHeader('Allow', method);
  res.status(405).json({ error: 'Method not allowed.' });
  return false;
};
