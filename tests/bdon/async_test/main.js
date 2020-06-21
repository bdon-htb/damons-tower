const posts = [
  { title: 'Post One', body: 'This is post one'},
  { title: 'Post Two', body: 'This is post two'}
];

/* CALLBACKS */
/*
function getPosts() {
  setTimeout(() => {
    let output = '';
    posts.forEach((post, index) => {
      output += `<li>${post.title}</li>`;
    });
    document.body.innerHTML = output;
  }, 1000);
}

function createPost(post, callback) {
  setTimeout(() => {
    posts.push(post);
    callback();
  }, 2000);
}

createPost({ title: 'Post Three', body: 'This is post three' }, getPosts);
*/

/* PROMISES */
/*
function getPosts() {
  setTimeout(() => {
    let output = '';
    posts.forEach((post, index) => {
      output += `<li>${post.title}</li>`;
    });
    document.body.innerHTML = output;
  }, 1000);
}

function createPost(post) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      posts.push(post);

      const error = false;

      if(!error) {
        resolve();
      } else {
        reject('Error: Something went wrong.')
      }
  }, 2000);
  });
}

createPost({ title: 'Post Three', body: 'This is the third post'})
  .then(getPosts)
  .catch(err => console.log(err));

/* ASYNC / AWAIT */
async function init() {
  await createPost({ title: 'Post Three', body: 'This is post three'});
  getPosts();
}

init();
