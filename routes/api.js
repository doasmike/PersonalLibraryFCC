/*
*
*
*       Complete the API routing below
*       
*       
*/

'use strict';
require('dotenv').config()
const { default: mongoose, mongo } = require('mongoose');

module.exports = function (app) {

  mongoose.connect(process.env.MONGO_URI);

  const bookSchema = new mongoose.Schema({
    book_title: { type: String, required: true },
    comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }]
  });

  let Book = mongoose.model('Book', bookSchema);

  const commentSchema = new mongoose.Schema({
    comment: { type: String, required: true },
    bookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true }
  });

  let Comment = mongoose.model('Comment', commentSchema);

  const findAllBooks = async () => {
    try {
      const books = await Book.aggregate([
        {
          $lookup: {
            from: 'comments',
            localField: '_id',
            foreignField: 'bookId',
            as: 'comments'
          }
        },
        {
          $addFields: {
            commentcount: { $size: '$comments' }
          }
        },
        {
          $project: {
            _id: 1,
            title: '$book_title',
            comments: {
              $map: {
                input: '$comments',
                as: 'comment',
                in: '$$comment.comment'
              }
            },
            commentcount: 1,
            __v: 1
          }
        }
      ]);
  
      // console.log('Books found: ', books);  
  
      return books.map(book => ({
        comments: book.comments,
        _id: book._id,
        title: book.title,
        commentcount: book.commentcount,
        __v: book.__v
      }));
    } catch (error) {
      console.log('Error finding book', error);
      return null;
    }
  };

  const findBookById = async (bookId) => {
    try {
      const book = await Book.findById(bookId).populate('comments');  // Populacja z kolekcji 'Comment'

      if (!book) {
        return null;
      }

      const formattedBook = {
        comments: book.comments.map(comment => comment.comment), // Zwracamy tekst komentarzy
        _id: book._id,
        title: book.book_title,
        commentcount: book.comments.length,
        __v: book.__v,
      };

      return formattedBook;
    } catch (error) {
      console.log('Error finding book', error);
      return null
    }
  }

  const findBookAndComment = async (bookId, commentText) => {
    try {
      // Tworzenie nowego komentarza w bazie danych
      const newComment = new Comment({ comment: commentText, bookId });

      // Zapisanie komentarza w kolekcji 'Comment'
      const savedComment = await newComment.save();

      // Znalezienie książki i dodanie do niej nowego komentarza (dodajemy ID komentarza, a nie obiekt)
      const updatedBook = await Book.findByIdAndUpdate(bookId, {
        $push: { comments: savedComment._id }, // Zapisujemy tylko ID komentarza, nie cały obiekt
      }, { new: true });

      if (!updatedBook) {
        return null;
      }

      // Zwracamy sformatowaną odpowiedź
      const formattedBook = {
        comments: await Promise.all(updatedBook.comments.map(async (commentId) => {
          // Dla każdego ID komentarza, odnajdujemy odpowiedni komentarz w bazie i zwracamy jego treść
          const comment = await Comment.findById(commentId);
          return comment ? comment.comment : null;
        })),
        _id: updatedBook._id,
        title: updatedBook.book_title,
        commentcount: updatedBook.comments.length,
        __v: updatedBook.__v,
      };

      return formattedBook;
    } catch (error) {
      console.log('Error finding/updating book'/* , error */);
      return null
    }
  }

  const createBook = async (book_title) => {
    try {
      const createdBook = new Book({ book_title });
      const savedBook = await createdBook.save();
      return savedBook;
    } catch (error) {
      console.log('Error creating book'/* , error */);
      return null
    }
  }


  app.route('/api/books')
    .get(async function (req, res) {
      //response will be array of book objects
      //json res format: [{"_id": bookid, "title": book_title, "commentcount": num_of_comments },...]
      try {
        const books = await findAllBooks();
        if (books) {
          res.json(books);
        } else {
          res.json({ message: 'Error finding books' });
        }
      } catch (error) {
        console.error('Error while using api GET /api/books/'/* , error */);
      }
    })

    .post(async function (req, res) {
      let title = req.body.title;
      if (!title) {
        res.send('missing required field title')
      }
      try {
        const newBook = await createBook(title);
        if (newBook) {
          res.json({ _id: newBook._id, title: newBook.book_title });
        } else {
          res.json({ message: 'Error creating book' });
        }
      } catch (error) {
        console.error('Error while using api POST /api/books'/* , error */);
      }
      //response will contain new book object including atleast _id and title
    })

    .delete(async function (req, res) {
      try {
        const deletedBooks = await Book.deleteMany();
        await Comment.deleteMany();

        if (deletedBooks) {
          res.send('complete delete successful')
        } else {
          res.send('no book exists')
        }

      } catch (error) {
        console.error('Error while using api DELETE /api/books'/* , error */);
      }
      //if successful response will be 'complete delete successful'
    })


  app.route('/api/books/:id')
    .get(async function (req, res) {
      let bookid = req.params.id;

      try {
        const book = await findBookById(bookid);
        if (book) {
          res.json(book)
        } else {
          res.send('no book exists')
        }
      } catch (error) {
        console.error('Error while using api GET /api/books/'/* , error */)
      }
      //json res format: {"_id": bookid, "title": book_title, "comments": [comment,comment,...]}
    })

    .post(async function (req, res) {
      let bookid = req.params.id;
      let comment = req.body.comment;
      if (!comment) {
        res.send('missing required field comment')
      }
      try {
        const updatedBook = await findBookAndComment(bookid, comment);
        if (updatedBook) {
          res.json(updatedBook)
        } else {
          res.send('no book exists')
        }
      } catch (error) {
        console.error('Error while using api POST /api/books/{id}'/* , error */)
      }

      //json res format same as .get
    })

    .delete(async function (req, res) {
      let bookid = req.params.id;
      try {
        
        const deletedBook = await Book.findByIdAndDelete(bookid);

        await Comment.deleteMany({ bookId: bookid });

        if (!deletedBook) {
          res.send('no book exists');
        } else {
          res.send('delete successful');
        }

      } catch (error) {
        console.error('Error while using api DELETE /api/books/{id}'/* , error */);
      }
      //if successful response will be 'delete successful'
    });

};
