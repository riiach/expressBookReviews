const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");
const regd_users = express.Router();

let users = [];

const isValid = (username)=>{ //returns boolean
    return !users.some(user => user.username === username);
}

const authenticatedUser = (username,password)=>{
       let validUsers = users.filter((user) => {
        return user.username === username && user.password === password;
    });
    return validUsers.length > 0;
}

//only registered users can login
regd_users.post("/login", (req,res) => {
    const { username, password } = req.body;

    // 1. 입력값 확인
    if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
    }

    // 2. 기존 사용자 확인
    if (authenticatedUser(username, password)) {

        // 3. JWT 생성
        let accessToken = jwt.sign(
            { data: password },
            "access",            // JWT Secret Key
            { expiresIn: 60 * 60 } // 1 hour
        );

        // 4. 세션에 저장
        req.session.authorization = {
            accessToken,
            username
        };

        return res.status(200).json({ 
            message: "Login successful!",
            accessToken
         });
    } else {
        return res.status(403).json({ message: "Invalid username or password" });
    }
});

// Add a book review
regd_users.put("/auth/review/:isbn", (req, res) => {
    const isbn = req.params.isbn;
    const review = req.body.review;

    // 로그인 사용자 정보는 req.session.authorization.user 로부터 가져오기
    const username = req.session.authorization?.username;

    if (!username) {
        return res.status(401).json({ message: "User not logged in" });
    }

    if (!review) {
        return res.status(400).json({ message: "Review is required" });
    }

    // 책 존재 여부 확인
    if (!books[isbn]) {
        return res.status(404).json({ message: "Book not found" });
    }

    // 리뷰 저장
    books[isbn].reviews[username] = review;

    return res.status(200).json({
        message: "Review added/updated successfully",
        reviews: books[isbn].reviews
    });
});

// Delete a book review
regd_users.delete("/auth/review/:isbn", (req, res) => {
    const isbn = req.params.isbn;

    // 로그인한 사용자명 (세션에서 가져옴)
    const username = req.session.authorization?.username;

    if (!username) {
        return res.status(403).json({ message: "User not logged in" });
    }

    if (!books[isbn]) {
        return res.status(404).json({ message: "Book not found" });
    }

    if (!books[isbn].reviews[username]) {
        return res.status(404).json({ message: "No review found for this user" });
    }

    delete books[isbn].reviews[username];

    return res.status(200).json({
        message: "Review deleted successfully",
        reviews: books[isbn].reviews
    });
});


module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;
