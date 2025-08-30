module.exports = (req, res, next) => {
  if ((req.method === 'POST' || req.method === 'PATCH') && Math.random() < 0.1) {
    res.status(500).send('Internal Server Error');
  } else {
    next();
  }
};
