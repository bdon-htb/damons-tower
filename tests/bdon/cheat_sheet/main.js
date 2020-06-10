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

console.log(':|')
