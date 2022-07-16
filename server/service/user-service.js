const UserModel = require("../models/user-model.js");
const bcrypt = require("bcrypt");
const uuid = require("uuid");
const mailService = require("./mail-service");

const tokenService = require("./token-service");

const UserDto = require("../dtos/user-dto");
const ApiError = require("../exceptions/api-error");

class UserService {
  async registration(email, password) {
    const candidate = await UserModel.findOne({ email });
    if (candidate) {
      throw ApiError.BadRequest(`Пользователь с мылом ${email} есть`);
    }
    const hashPassword = await bcrypt.hash(password, 3);
    const activationLink = uuid.v4();
    const user = await UserModel.create({
      email,
      password: hashPassword,
      activationLink,
    });

    const userDto = new UserDto(user);
    const tokens = tokenService.gererateTokens({ ...userDto });
    await tokenService.saveToken(userDto.id, tokens.refreshToken);

    await mailService.sendActivationMail(
      email,
      process.env.API_URL + "/api/activate/" + activationLink
    );

    return {
      ...tokens,
      user: userDto,
    };
  }

  async activate(activationLink) {
    const user = await UserModel.findOne({ activationLink });
    if (!user) {
      throw ApiError.BadRequest("Некорректная ссылка активации");
    }
    user.isActivated = true;
    await user.save();
  }

  async login(email, password) {
    // console.log(email);
    // console.log(password);
    const user = await UserModel.findOne({ email });
    if (!user) {
      throw ApiError.BadRequest("Email не найден");
    }
    const isPassEquals = await bcrypt.compare(
      password,
      user.password
    );
    if (!isPassEquals) {
      //console.log("Пароль не верен");
      throw ApiError.BadRequest("Пароль не верен");
    }
    const userDto = new UserDto(user);
    const tokens = tokenService.gererateTokens({ ...userDto });
    await tokenService.saveToken(userDto.id, tokens.refreshToken);

    return { ...tokens, user: userDto };
  }

  async logout(refreshToken) {
    const token = await tokenService.removeToken(refreshToken);
    return token;
  }

  async refresh(refreshToken) {
    if (!refreshToken) {
      throw ApiError.UnauthorizedError();
    }
    const userData = tokenService.validateRefreshToken(refreshToken);
    const tokenFromDb = await tokenService.findToken(refreshToken);
    if (!userData || !tokenFromDb) {
      throw ApiError.UnauthorizedError();
    }

    const user = await UserModel.findById(userData.id);
    const userDto = new UserDto(user);
    const tokens = tokenService.gererateTokens({ ...userDto });
    await tokenService.saveToken(userDto.id, tokens.refreshToken);

    return { ...tokens, user: userDto };
  }

  async getAllUsers() {
    const users = UserModel.find();
    return users;
  }
}

module.exports = new UserService();
