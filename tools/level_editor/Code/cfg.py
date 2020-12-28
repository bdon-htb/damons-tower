# ========================================================
# cfg.py contains file paths and general app information.
# ========================================================

import os

__version__ = '0.0.0'
__name__ = 'js-roguelite Level Editor'

TILESIZE = 32

main_dir = os.path.abspath(os.path.join(os.path.dirname( __file__ ), '..'))
code_dir = os.path.abspath(os.path.join(main_dir, 'Code'))
assets_dir = os.path.abspath(os.path.join(main_dir, 'Assets'))
data_dir = os.path.abspath(os.path.join(main_dir, 'Data'))
icons_dir = os.path.abspath(os.path.join(assets_dir, 'Icons'))

icons = {}
# Load all icon files.
for file in os.scandir(icons_dir):
    if file.path.endswith('.png'):
        name = file.name[:-4] # Without extension
        icons[name] = os.path.abspath(os.path.join(icons_dir, file.name))

settings_file = os.path.abspath(os.path.join(data_dir, 'settings.cfg'))
settings_default = '0'

colors = {
    'grey light': '#999999',
    'grey lighter': '#EEEEEE',
    'white': '#FFFFFF',
    'cobalt': '#0050EF',
    'dark cobalt': '#00356A'
}

# IMPORTANT!
# These assume that cfg.py is in its original place in the repo. Use with caution.
repo_dir = os.path.abspath(os.path.join(os.path.dirname( __file__ ), '../../..'))
level_dir = os.path.abspath(os.path.join(repo_dir, 'src', 'data'))
sprite_dir = os.path.abspath(os.path.join(repo_dir, 'img'))
