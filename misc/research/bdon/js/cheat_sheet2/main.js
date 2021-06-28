/* DOM SELECTORS */
// Basically getting information from the html document.
// Single element selectors.
// console.log(document.getElementById('my-form'));
// console.log(document.querySelector('.container'));

// Multiple element selectors.
// console.log(document.querySelectorAll('.item')); <- recommended.
// console.log(document.getElementsByClassName('item'));
// console.log(document.getElementsByTagName('li'));

// const items = document.querySelectorAll('.item');
// items.forEach((item) => console.log(item));

const ul = document.querySelector('.items');
// ul.lastElementChild.remove();
ul.firstElementChild.textContent = 'Hello';
ul.children[1].innerText = 'Bruh'
ul.lastElementChild.innerHTML = '<h4>Yee</h4>'

const btn = document.querySelector('.btn');
btn.style.background = 'red';

btn.addEventListener('click', (e) => {
  e.preventDefault();
  console.log(e.target);
});
