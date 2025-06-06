

module.exports=function (req, res, next) {
    // check Admin
    if (req.user && req.user.role == "consumer") {
      return next();
    }
    // not an Admin unauthorized
    return res.status(401).send({ message: 'Consumer Token is not valid.' });
  };