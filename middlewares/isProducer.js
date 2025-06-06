

module.exports=function (req, res, next) {
    // check Admin
    if (req.user && req.user.role == "producer") {
      return next();
    }
    // not an Admin unauthorized
    return res.status(401).send({ message: 'Producer Token is not valid.' });
  };