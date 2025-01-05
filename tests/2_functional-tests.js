/*
*
*
*       FILL IN EACH FUNCTIONAL TEST BELOW COMPLETELY
*       -----[Keep the tests in the same order!]-----
*       
*/

const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

let savedID;

suite('Functional Tests', function () {

  /*
  * ----[EXAMPLE TEST]----
  * Each test should completely test the response of the API end-point including response status code!
  */
  test('#example Test GET /api/books', function (done) {
    chai.request(server)
      .get('/api/books')
      .end(function (err, res) {
        assert.equal(res.status, 200);
        assert.isArray(res.body, 'response should be an array');
        assert.property(res.body[0], 'commentcount', 'Books in array should contain commentcount');
        assert.property(res.body[0], 'title', 'Books in array should contain title');
        assert.property(res.body[0], '_id', 'Books in array should contain _id');
        done();
      });
  });
  /*
  * ----[END of EXAMPLE TEST]----
  */

  suite('Routing tests', function () {


    suite('POST /api/books with title => create book object/expect book object', function () {

      test('Test POST /api/books with title', function (done) {
        chai.request(server)
          .post('/api/books')
          .send({ title: 'Testowy' })
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.isObject(res.body, 'response is an JSON object');
            assert.property(res.body, 'title', 'Books in array should contain title');
            assert.property(res.body, '_id', 'Books in array should contain _id');
            savedID = res.body._id.toString();
            done();
          })
        //done();
      });

      test('Test POST /api/books with no title given', function (done) {
        chai.request(server)
          .post('/api/books')
          .send('')
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.equal(res.text, 'missing required field title');
            done();
          });
        //done();
      });

    });


    suite('GET /api/books => array of books', function () {

      test('Test GET /api/books', function (done) {
        chai.request(server)
          .get('/api/books')
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.equal(res.type, 'application/json', 'Response should be json');
            // console.log(res)
            let bookTable = res.body;
            bookTable.forEach(element => {
              assert.property(element, 'title', 'Books in array should contain title');
              assert.property(element, '_id', 'Books in array should contain _id');
              assert.property(element, 'comments', 'Books in array should contain comments')
              assert.property(element, 'commentcount', 'Books in array should contain commentcount')
              assert.property(element, '__v', 'Books in array should contain __v')
            });
            done();
          })
        //done();
      });

    });


    suite('GET /api/books/[id] => book object with [id]', function () {

      test('Test GET /api/books/[id] with id not in db', function (done) {
        chai.request(server)
          .get(`/api/books/010101010101010101010101`)
          .end((err, res) => {
            // console.log('Type of savedID: ', typeof(savedID), ' and savedID: ', savedID)
            assert.equal(res.status, 200);
            assert.equal(res.text, 'no book exists');

            done();
          })
        //done();
      });

      test('Test GET /api/books/[id] with valid id in db', function (done) {
        chai.request(server)
          .get(`/api/books/${savedID}`)
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.equal(res.type, 'application/json', 'Response should be json');
            assert.property(res.body, 'title', 'Books in array should contain title');
            assert.property(res.body, '_id', 'Books in array should contain _id');
            assert.property(res.body, 'comments', 'Books in array should contain comments')
            assert.property(res.body, 'commentcount', 'Books in array should contain commentcount')
            assert.property(res.body, '__v', 'Books in array should contain __v')

            done();
          })
        //done();
      });

    });


    suite('POST /api/books/[id] => add comment/expect book object with id', function () {

      test('Test POST /api/books/[id] with comment', function (done) {
        chai.request(server)
          .post(`/api/books/${savedID}`)
          .send({ comment: 'nice' })
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.equal(res.type, 'application/json', 'Response should be json');
            assert.property(res.body, 'title', 'Books in array should contain title');
            assert.property(res.body, '_id', 'Books in array should contain _id');
            assert.property(res.body, 'commentcount', 'Books in array should contain commentcount')
            assert.property(res.body, '__v', 'Books in array should contain __v')
            // console.log(res.body.comments)
            assert.equal(res.body.comments[res.body.comments.length - 1], 'nice', 'Last comment should be that from request')
            done();
          });
        //done();
      });

      test('Test POST /api/books/[id] without comment field', function (done) {
        chai.request(server)
          .post(`/api/books/${savedID}`)
          .send({ comment: '' })
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.equal(res.text, 'missing required field comment');
            done();
          });
        //done();
      });

      test('Test POST /api/books/[id] with comment, id not in db', function (done) {
        chai.request(server)
          .post(`/api/books/010101010101010101010101`)
          .send({ comment: 'notnice' })
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.equal(res.text, 'no book exists');
            done();
          });
        //done();
      });

    });

    suite('DELETE /api/books/[id] => delete book object id', function () {

      test('Test DELETE /api/books/[id] with valid id in db', function (done) {
        chai.request(server)
        .delete(`/api/books/010101010101010101010101`)
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.equal(res.text, 'no book exists');
          done();
        });
        //done();
      });

      test('Test DELETE /api/books/[id] with  id not in db', function (done) {
        chai.request(server)
        .delete(`/api/books/${savedID}`)
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.equal(res.text, 'delete successful');
          done();
        });
        //done();
      });

    });

  });

});
