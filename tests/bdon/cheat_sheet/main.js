/* CONSOLE METHODS */
// console.log('Hello world!'); <- Displays message to console.
// console.error('Hello World!'); <- Displays red/error message to console.
// console.warn('Hello World!'); <- Displays yellow message to console.
// alert('Hello World!'); <- Displays message to browser.

/* SETTING VARIABLES */
// var x; <- var is GLOBALLY scoped.
// let x; <- let is BLOCK scoped.
// const x; <- const cannot be reassigned; BLOCK scoped.

/* DATA TYPES */
// String, Numbers, Boolean, null, undefined, Symbol

// const name = 'John'; <- accepts both single and double quotations.
// const age = 30;
// const rating = 4.5;
// const isCool = true; <- can be true or false.
// const x = null; <- represents NO value.
// const y = undefined; <- represents a value that has not been defined.
// let z; <- shorthand for undefined.

// console.log(typeof age); <- a good way to determine the type of a value.

/* STRINGS */
// console.log('a' + 'b'); <- Concatenation.

/* Template String */
// const name = 'bdon'
// console.log(`My name is ${name}`);

/* String Properties */
// console.log('Hello'.length);

/* String Methods */
// console.log('hello'.toUpperCase());
// console.log('HELLO'.toLowerCase());
// console.log('Hello'.substring(0,3));
// console.log('Hello'.split(''));

/* ARRAYS */
// const numbers = new Array(1,2,3,4,5);
// const numbers2 = [1,2,3,4,5];
// console.log(numbers2[1])''
// numbers2[5] = 6;

/* Array Methods */
// numbers2.push(6); <- Basically python append.
// numbers2.unshift(0); <- Basically python insert.
// five = numbers2.pop();
// numbers.isArray();
// numbers.indexOf(1);

/* Object Literals */
// const person = {firstName: 'John', lastName: 'Doe', age: 30, hobbies: ['music', 'movies', 'sports']}; <- Basically python dictionaries
// console.log(person.firstName)
// const { firstName, lastName } = person; <- basically extracts information from dictionary; called destruction.
// person.email = 'john@gmail.com' <- can directly add properties

/* ASIDE - Object Literal to JSON */
// const todos = [{id: 1, text: 'AH!', isCompleted: true}]
// const todoJSON = JSON.stringify(todos);
// console.log(todoJSON);

/* For Loops */
// Format: for ([assignment of iterator]; [condition]; [increments])
// for (let i = 0; i < 10; i++) {
//   console.log(i)
// }

/* While Loops */
// let i = 0;
// while(i <= 10) {
  // console.log(i)
  // i++
// }

let arr = [2, 4, 6, 4, 5]
// for (let i = 0; i < arr.length; i++){
  // console.log(arr[i])
// }

// for (let a of arr) {
  // console.log(a)
// }

/* Array Methods */
// For Each <- another way to iterate through an array. The guy from the crash course video recommends this.
// arr.forEach(function(a) {
  // console.log(a)
// });

// Map <- This basically just creates a new array from another array.
// const a2 = arr.map(function(a) {
  // return a;
// })

// Filter <- Makes an array based on array items that pass the conditional
// Side note: wtf why are javascript methods named so strangelly.
// const a2 = arr.filter(function(a) {
  // return !isNaN(a) && a <= 4
// });

/* Conditionals */
// Note: == matches value, === matches value AND data type.
// 10 == '10' in javascript lol.
// const x = 5;
// if (x === 10) {
  // console.log('x is 10');
// } else if(x > 10) {
  // console.log('x is greater than 10');
// }
// else {
  // console.log('x is less than 10');
// }

/* Ternary Operator */
// ? <- ternary operator; can be read as "then"
// : <- read as "else".
// const x = 10;
// const color = x > 10 ? 'red' : 'blue';

/* Switch Statements */
// const color = 'red'
// switch(color) {
  // case 'red':
    // console.log('color is red');
    // break;
  // case 'blue':
    // console.log('color is blue');
    // break;
  // default:
    // console.log('color is NOT red or blue');
    // break;
// }

/* Functions */
// function addNums(num1 = 1, num2 = 1) {
  // return num1 + num2;
// }

/* Arrow Functions */
// const addNums = (num1 = 1, num2 = 1) => {
  // return num1 + num2;
// }
// Short hand.
// const addNums = (num1 = 1, num2 = 1) => num1 + num2;
// const addNums = num1 => num1 + 5;

/* OOP */
function Person(firstName, lastName, dob) {
  this.firstName = firstName
}

console.log(':|')
