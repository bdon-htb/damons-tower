# Damon's Tower &middot; [![GPLv3 license](https://img.shields.io/badge/License-GPLv3-blue.svg)](http://perso.crans.org/besson/LICENSE.html) [![No Maintenance Intended](http://unmaintained.tech/badge.svg)](http://unmaintained.tech/)

Formally known as js-roguelite. This repo contains all the work I have completed
towards what would have been a 2D action game with procedurally generated dungeons (a.k.a roguelite).

In addition to the game's full source code, the repo includes a custom level editor
and other miscellaneous code research projects.

## Developing

### Built With
Damon's Tower is built from the ground up in vanilla JavaScript and uses the Pixi.js
library for its graphics backend.

It's tools are coded in python3.

### Prerequisites
All tools require python3 installed to run.

In order to use the custom level editor to create levels you will also need
the PyQt5 library. The PyQt5 library can be installed with pip:
```
pip install PyQt5
```

### Setting up Dev
Clone the repo:
```
git clone https://github.com/bdon-htb/damons-tower.git
```
And then run a local server. I use python's built in http.server:
```
cd damons-tower/src
python -m http.server 8000
```
Then open your browser of choice (I suggest in private browsing), navigate to
localhost:8000 and the game should load.

## Preview Images
![Screenshot of Main Menu](https://github.com/bdon-htb/damons-tower/blob/master/misc/preview_images/game_preview1.png)

![Screenshot of Settings Menu](https://github.com/bdon-htb/damons-tower/blob/master/misc/preview_images/game_preview2.png)

![Gameplay Screenshot](https://github.com/bdon-htb/damons-tower/blob/master/misc/preview_images/game_preview3.png)

![Level Editor Screenshot](https://github.com/bdon-htb/damons-tower/blob/master/misc/preview_images/editor_preview.png)

## Licensing
Damon's Tower is licensed under the GPL License.
