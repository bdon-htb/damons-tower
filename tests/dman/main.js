/*
<script>
	console.log("Hello World")
</script>
*/

// This will print 'Hello World' on the page's console

/* That was a single-line comment and
this is a multi-line comment fk u bro
*/


// Gonna put this at the top cuz ik imma forget it
// Add item to end of array -> .push
// Remove item from and of an array -> .pop
// Remove item from beginning of array -> .shift
// Add item to beginning of array -> .unshift
// Find index of item in array -> .indexOf
// Remove item by index position -> .splice(pos)
// Pretty sure that's mostly what i'll need

//Data Types and Variables

/* Data types include:
the same shit in python dumbass
int called number
undefined - hasn't been set yet
null - set it to be something and something is nothing
symbol - immutable value that is unique uhhh
*/

var myName = "Damian" // Everywhere in program
myName = 27

let ourName = "Jomama" // Used only within scope

const pi = 3.14 // Can never change

var a; // Declaring Variable
var b = 2; // Declaring and Assigning

a = 7; // Assigned
b = a // b is now what was in a

/* console.log(a)
   7
*/

// Initialize these 3 variables
var a = 5;
var b = 10;
var c = "I am a";

// Do not change code directly below line

a = a + 1; // 6
b = b + 5; // 15
c = c + " String!"; // "I am a String!"

//JS is case sensitive
console.log(a)

//quick increment

var myVar = 24;
myVar++; // Now myVar = 25
myVar--; // Now myVar = 24

// % modulus is still a thing

var myStr = "I am a \"double quoted\" string inside \"double quotes\""
console.log(myStr) // prints: "I am a "double quoted" string inside "double quotes""

var name = "Jomama";
lengthOfName = name.length;
// ^ How to find length of a string

firstLetter = name[0];
//will return "J"

//Strings are immutable in JS

var myStr = "Jello World"
// Can't change just one letter
myStr = "Hello World"

// Function Example

function functionName() {
	console.log("Hello World");
}

functionName();
/* Everytime this function is called, it prints "Hello World to the console"
it runs the code that is within the braces.
*/

//perameters are the same as in python

function ourFunctionWithArgs(a, b) {
	console.log(a - b);
}

ourFunctionWithArgs(10, 5); // Outputs 5

function hello(a, b) {
    diff = a - b;

}

/*
hello(10, 5)
console.log(diff)
*/

function ourTrueOrFalse(isItTrue) {
    if (isItTrue) {
        return "Yes, it's True";
    }
    return "No, it's False";
}


function trueOrFalse(wasThatTrue) {
  if (wasThatTrue) {
      return "Ye";
  }
  return "nah";

}



// console.log(trueOrFalse(true));
var bob = 1 + 2
console.log(bob)
console.log(bob == "3")

// && means AND operator for some reason -_-

// || means OR operator lol wtf


// This how else statement is used
if (val > 5){
	result = "Bigger than 5"
}   else {
	result = "5 or smaller"
}
// This looks stupid
if (val > 5) {
	result = "Bigger than 5"
}   else if (val < 5) {
	result = "smaller than 5"
}   else{
	result = "It's 5 ahlie"
}

// Switch Statements
function switchOfStuff(val) {
	var answer = ""
	switch (val) {
	case "a":
		answer = "apple";
		break;
	case "b":
		answer = "bird";
		break;
	case "c":
		answer = "cat";
		break;
	default: // For when "a", "b", or "c" is not passed through
		answer = "stuff"
		break;
}
	return answer;
}

console.log(switchOfStuff("a")); // Returns "apple"

/*
When you want a switch statement that will return multiple values,
omit the break statement so the program goes to the next statement
automatically
*/

function sequentialSizes(val) {
	var answer = ""
	switch (val) {
		case 1:
		case 2:
		case 3:
			answer = "Low";
			break;
		case 4:
		case 5:
		case 6:
			answer = "Mid";
			break;
		case 7:
		case 8:
		case 9:
			answer = "High";
			break;
}
	return answer;
}

// Change this value to test
console.log(sequentialSizes(2)); // Should return Low


// Building objects in JS

var ourDog = {
	"name": "Camper",
	"legs": 4,
	"tails": 1,
	"friends": ["everything"]
};

var myDog = {
	"name": "Jomama",
	"legs": 3,
	"tails": 2,
	"friends": []
};

// These are objects? ^^^

// Setup Dot Notation
var testObj = {
	"hat": "ballcap",
	"shirt": "jersey",
	"shoes": "cleats"
};

// Only change code below this line

var hatValue = testObj.hat; // Change this line
var shirtValue = testObj.shirt; // Change this line

// Now hatValue = "ballcap" and shirtValue = "jersey"

// Setup Bracket Notation
// Bracket Notation is required if name has a space in it

var testObj = {
	"an entree": "Hamburger",
	"my side": "Veggies",
	"the drink": "Water"
};

// Only change code below this line

var entreeValue = testObj["an entree"]; // Change this line
var drinkValue = testObj['the drink']; // Change this line

// Accessing object properties with variables

//Setup
var testObj = {
	12: "Namath",
	16: "Montana"
	19: "Unitas"
};

// Only change code below this line

var playerNumber = 16; // Change this line
var player = testObj[playerNumber]; // Change this line
// Now player is set to "Montana"

// Updating Object Properties

//Setup
var myDog = {
	"name": "Coder",
	"legs": 4,
	"tails": 1,
	"friends": ["Jomama Isgay"]
};

// Only change code below this line

myDog.name = "Happy Coder";

// Add new properties to an object

//Setup
var myDog = {
	"name": "Happy Coder",
	"legs": 4,
	"tails": 1,
	"friends": ["Jomama Isgay"]
};

// Only change code below this line

myDog.bark = "woof!" // dot notation
myDog["bark"] = "woof!" // bracket notation

// Delete properties from an object

//Setup
var myDog = {
	"name": "Happy Coder",
	"legs": 4,
	"tails": 1,
	"friends": ["Jomama Isgay"],
	"bark": "woof!"
};

// Only change code below this line

delete myDog.bark;

var myDog = {
	"name": "Happy Coder",
	"legs": 4,
	"tails": 1,
	"friends": ["Jomama Isgay"],
	"bark": "woof!"
};

// Looking up with objects

// Setup
function phoneticLookup(val) {
	var result = "";

	var lookup {
	"alpha": "Adams",
	"bravo": "Boston",
	"charlie": "Chicago",
	"delta": "Denver",
	"echo": "Easy",
	"foxtrot": "Frank"
};
	result = lookup[val]
	return result
}

console.log(phoneticLookup("charlie"));
// Returns "Chicago"

// Testing Objects for Properties

// Setup
var myObj = {
	gift: "Pony",
	pet: "Kitten",
	bed: "Sleigh"
};

function checkObj(checkProp) {
	// Your Code Here
	if (myObj.hasOwnProperty(checkProp)) {
		return myObj[checkProp]
		else {
		return "Not Found"
	}
}



console.log(checkObj("gift")); // Returns "Pony"
console.log(checkObj("hello")); // Returns "Not Found"

// Finally loops and shit

// Iterating with While Loop
var myArray = [];
var i = 0
while (i < 5) {
	myArray.push(i);
	i++;
}

// will print [0, 1, 2, 3, 4]

// Iterating with For Loop
var myArray = [];
// for (initialization, conditions, final expression)
for (var i = 1, i < 6, i++) {
	myArray.push(i)
}

// Will print [1, 2, 3, 4, 5]

// Iterate through an array with a for loop
let myArr = [2, 3, 4, 5, 6];
let total = 0;

for (let i = 0; i < myArr.length; i++) {
	total += myArr[i];
}

// Will print 20 :)

// do while loops check atleast one time and then check the conditions

var myArray = [];
var i = 10
do {
	myArray.push(i);
	i++;
}   while (i < 5)

console.log(i, myArray); // This will print 11, [10]

// That was fast lol

// Generate Random Fractions

function randomFraction() {


	return Math.random();
}

// Will return a random decimal # Example -> 0.23813741879825767
// Always between 0 and 1 but cannot be 1 (Can be 0)

// Generate random whole numbers

let randomNumBetween0and19 = Math.floor(Math.random() * 20);
// Will round down to 19 since Math.random cannot be 1

function randomWholeNum() {

	return Math.floor(Math.random() * 10);
}

// Gives random number between 0 and 9

// Generate nums within a range

function randomRange(min, max) {

	return Math.floor(Math.random() * (max - min + 1)) + min
}

// ParseInt function makes int into an integer

parseInt("34") // Returns as an int


// OOP Crash Course

// Constructor Function
function Person(firstName, lastName, dob) {
	this.firstName = firstName;
	this.lastName = lastName
	this.dob = dob;
	this.getBirthYear = function() {    // Method gang
	return this.dob.getFullYear();
}
}

// Instantiate object
const person1 = new Person('John', 'Doe', '4-3-1980');
// new operator lets developers create an instance of a user-defined
// object type or of one of the built-in object types that has a
// constructor function
const person2 = new Person('Damian', 'Carbone', 9-11-2001)

console.log(person2.firstName); // This will print Damian

// Method
console.log(person1.getBirthYear());

// Actual Class Now

class Person {
	constructor(firstName, lastName, dob) {
		this.firstName = firstName;
		this.lastName = lastName
		this.dob = dob;
}
// Methods
}
