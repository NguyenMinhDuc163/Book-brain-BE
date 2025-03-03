const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { createResponse } = require('../utils/responseHelper');
class UserService {

    // Đăng ký người dùng
    static async registerUser(data) {
        try {
            data.password = await bcrypt.hash(data.password, 10);
            const user = await User.create(data);

            return createResponse(201, "Đăng ký thành công.", "success", user);
        } catch (error) {
            console.error("Lỗi khi đăng ký:", error.message);
            return createResponse(500, "Lỗi server khi đăng ký.", "fail", [], error.message);
        }
    }


    // Cập nhật thông tin người dùng
    static async updateUserInfo(userId, data) {
        try {
            // Kiểm tra ID hợp lệ
            userId = parseInt(userId, 10);
            if (isNaN(userId) || userId <= 0) {
                return createResponse(400, "ID người dùng không hợp lệ.", "fail", []);
            }

            // Kiểm tra người dùng có tồn tại không
            const user = await User.findByPk(userId);
            if (!user) {
                return createResponse(404, "Người dùng không tồn tại.", "fail", []);
            }

            // Cập nhật thông tin người dùng
            await user.update(data);
            return createResponse(200, "Cập nhật thông tin thành công.", "success", user);
        } catch (error) {
            console.error("Lỗi khi cập nhật thông tin người dùng:", error.message);
            return createResponse(500, "Lỗi server khi cập nhật thông tin.", "fail", [], error.message);
        }
    }


    // Đăng nhập người dùng
    static async loginUser(data) {
        try {
            const user = await User.findOne({ where: { email: data.email } });

            if (!user) {
                return createResponse(401, "Người dùng không tồn tại.", "fail", []);
            }

            const isPasswordValid = await bcrypt.compare(data.password, user.password);
            if (!isPasswordValid) {
                return createResponse(401, "Mật khẩu không chính xác.", "fail", []);
            }

            // Tạo JWT Token
            const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });

            return createResponse(200, "Đăng nhập thành công.", "success", { token, user });
        } catch (error) {
            console.error("Lỗi khi đăng nhập:", error.message);
            return createResponse(500, "Lỗi server khi đăng nhập.", "fail", [], error.message);
        }
    }

}

module.exports = UserService;
