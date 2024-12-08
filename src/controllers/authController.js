const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { Op } = require('sequelize');

const authController = {
  async register(req, res) {
    try {
      const { email, password, name, phone } = req.body;

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

      // 토큰 생성
      const accessToken = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      const refreshToken = jwt.sign(
        { userId: user.id },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: '7d' }
      );

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
      res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
  },

  async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;

      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      const user = await User.findByPk(decoded.userId);

      if (!user) {
        return res.status(401).json({ message: '유효하지 않은 토큰입니다.' });
      }

      const accessToken = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      res.json({ accessToken });
    } catch (error) {
      res.status(401).json({ message: '토큰이 만료되었습니다.' });
    }
  },

  async updateProfile(req, res) {
    try {
      const { name, phone, career, skillSet } = req.body;
      const userId = req.user.userId;

      const user = await User.findByPk(userId);
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
      res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
  }
};

module.exports = authController;