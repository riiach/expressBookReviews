const express = require('express');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();


public_users.post("/register", (req,res) => {
    const { username, password } = req.body;

    // 1. username 또는 password가 없는 경우
    if (!username || !password) {
        return res.status(400).json({
            message: "Username and password are required",
        });
    }

    // 2. 이미 존재하는 유저인지 확인
    let existingUser = users.find((user) => user.username === username);

    if (existingUser) {
        return res.status(409).json({
            message: "User already exists",
        });
    }

    // 3. 새로운 유저 등록
    users.push({
        username,
        password,
    });

    return res.status(200).json({
        message: "User registered successfully!",
    });
});

// Get the book list available in the shop
public_users.get('/', async (req, res) => {
    try {
        const fetchBooks = async () => {
            return books;
        };

        const allBooks = await fetchBooks();
        return res.status(200).json(allBooks);
    } catch (error) {
        return res.status(500).json({ message: "Error retrieving books" });
    }
});


// Get book details based on ISBN
public_users.get('/isbn/:isbn', (req, res) => {
    let isbn = req.params.isbn;

    new Promise((resolve, reject) => {
        let book = books[isbn];
        if (book) {
            resolve(book);
        } else {
            reject("Book not found");
        }
    })
        .then((book) => {
            return res.status(200).json(book);
        })
        .catch((error) => {
            return res.status(404).json({ message: error });
        });
});

  
// Get book details based on author
public_users.get('/author/:author', async (req, res) => {
    try {
        const author = req.params.author;

        const fetchBooksByAuthor = async () => {
            let filteredBooks = [];
            for (let isbn in books) {
                if (books[isbn].author === author) {
                    filteredBooks.push(books[isbn]);
                }
            }
            return filteredBooks;
        };

        const booksByAuthor = await fetchBooksByAuthor();

        if (booksByAuthor.length > 0) {
            return res.status(200).json(booksByAuthor);
        } else {
            return res.status(404).json({ message: "No books found for this author" });
        }
    } catch (error) {
        return res.status(500).json({ message: "Error retrieving book details" });
    }
});

// Get all books based on title
public_users.get('/title/:title', async (req, res) => {
    try {
        const title = req.params.title;

        const fetchBooksByTitle = async () => {
            return Object.values(books).filter(book => book.title === title);
        };

        const results = await fetchBooksByTitle();

        if (results.length > 0) {
            return res.status(200).json(results);
        } else {
            return res.status(404).json({ message: "No books found for this title" });
        }
    } catch (error) {
        return res.status(500).json({ message: "Error retrieving books by title" });
    }
});

//  Get book review
public_users.get('/review/:isbn',function (req, res) {
    const isbn = req.params.isbn;

    if (books[isbn]) {
        return res.status(200).json(books[isbn].reviews);
    } else {
        return res.status(404).json({ message: "Book not found" });
    }
});

module.exports.general = public_users;
