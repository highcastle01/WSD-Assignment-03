const bcrypt = require('bcrypt');
// const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { Op } = require('sequelize');
const { verifyRefreshToken, generateAccessToken, generateRefreshToken } = require('../utils/jwt');

const authController = {
  async register(req, res) {
    try {
      const { email, password, name, phone } = req.body;

      // 이메일 형식 검증
      const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: '유효하지 않은 이메일 형식입니다.' });
      }

      // 이메일 중복 체크
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ message: '이미 등록된 이메일입니다.' });
      }

      // 비밀번호 해시화
      const hashedPassword = await bcrypt.hash(password, 12);

      // 사용자 생성
      const user = await User.create({
        email,
        password: hashedPassword,
        name,
        phone
      });

      res.status(201).json({
        message: '회원가입이 완료되었습니다.',
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        }
      });
    } catch (error) {
      res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
  },

  async login(req, res) {
      try {
        const { email, password } = req.body;

        // 사용자 찾기
        const user = await User.findOne({ where: { email } });
        if (!user) {
          return res.status(401).json({ message: '이메일 또는 비밀번호가 일치하지 않습니다.' });
        }

        // 비밀번호 확인
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
          return res.status(401).json({ message: '이메일 또는 비밀번호가 일치하지 않습니다.' });
        }

        // utils의 함수를 사용하여 토큰 생성
        const accessToken = generateAccessToken(user.id);
        const refreshToken = generateRefreshToken(user.id);

        // 마지막 로그인 시간 업데이트
        await user.update({ lastLoginAt: new Date() });

        res.json({
          accessToken,
          refreshToken,
          user: {
            id: user.id,
            email: user.email,
            name: user.name
          }
        });
      } catch (error) {
        console.error('Login error:', error); // 에러 로깅 추가
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
      }
  },

  async refreshToken(req, res) {
      try {
        console.log('Received request body:', req.body);  // 전체 요청 바디 확인
        const { refreshToken } = req.body;
        console.log('Extracted refreshToken:', refreshToken);  // 추출된 토큰 확인
        
        if (!refreshToken) {
          return res.status(400).json({ message: '리프레시 토큰이 제공되지 않았습니다.' });
        }

        const decoded = verifyRefreshToken(refreshToken);
        const user = await User.findByPk(decoded.userId);

        if (!user) {
          return res.status(401).json({ message: '유효하지 않은 토큰입니다.' });
        }

        // generateAccessToken 유틸리티 함수 사용
        const accessToken = generateAccessToken(user.id);

        res.json({ accessToken });
      } catch (error) {
        console.log('Token verification error:', error);
        res.status(401).json({ message: '토큰이 만료되었습니다.' });
      }
  },

  async updateProfile(req, res) {
    try {
      console.log("req.user:", req.user);  // 추가
      const { name, phone, career, skillSet } = req.body;
      const userId = req.user.userId;
      console.log("userId:", userId);  // 추가

      const user = await User.findByPk(userId);
      console.log("Found user:", user);  // 추가

      if (!user) {
        return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
      }

      await user.update({
        name,
        phone,
        career,
        skillSet
      });

      res.json({
        message: '프로필이 업데이트되었습니다.',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          phone: user.phone,
          career: user.career,
          skillSet: user.skillSet
        }
      });
    } catch (error) {
      console.log("Error: ", error);
      res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
  }
};

module.exports = authController;