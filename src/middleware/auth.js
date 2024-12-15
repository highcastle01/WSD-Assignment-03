const jwt = require('jsonwebtoken');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: '인증이 필요합니다.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 토큰에서 추출한 userId를 req.user 객체에 저장
    req.user = {
      userId: decoded.userId
    };
    
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ message: '토큰이 만료되었습니다.' });
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ message: '유효하지 않은 토큰입니다.' });
    }
    console.error('Auth middleware error:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};


module.exports = authMiddleware;