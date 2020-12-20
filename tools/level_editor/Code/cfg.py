# ========================================================
# cfg.py contains file paths and general app information.
# ========================================================

import os

__version__ = '0.0.0'
__name__ = 'js-roguelite Level Editor'

main_dir = os.path.abspath(os.path.join(os.path.dirname( __file__ ), '..'))
code_dir = os.path.abspath(os.path.join(main_dir, 'Code'))
assets_dir = os.path.abspath(os.path.join(main_dir, 'Assets'))
icons_dir = os.path.abspath(os.path.join(assets_dir, 'Icons'))

icons = {}

for file in os.scandir(icons_dir):
    if file.path.endswith('.png'):
        name = file.name[:-4] # Without extension
        icons[name] = os.path.abspath(os.path.join(icons_dir, file.name))

colors = {
    'grey light': '#999999',
    'grey lighter': '#EEEEEE',
    'white': '#FFFFFF'
}
