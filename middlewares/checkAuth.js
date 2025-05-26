
const jwt=require('jsonwebtoken');

// middleware :check Authentification
module.exports=function async (req, res, next){
    // get token from headers.authorisation
    console.log(req.headers)
    const token = req.headers.authorization;
   
    if (token) {
      //const onlyToken = token.slice(7, token.length);
      //decode json web token
      
      try {
        // Vérifie et décode le token avec la clé secrète
        const decoded = jwt.decode(token, process.env.JWT_SECRET);
  
        // Ajoute les infos de l'utilisateur à la requête
        req.user = decoded;
  
        console.log('Decoded token:', decoded);
  
        // Passe au middleware suivant
        next();
      } catch (err) {
        console.error('Token invalide :', err.message);
        return res.status(401).json({ message: 'Invalid Token' });
      }
        
      
      
    } else {
      //token doesn't exist
      return res.status(401).send({ message: 'Token is not supplied.' });
    }
  };