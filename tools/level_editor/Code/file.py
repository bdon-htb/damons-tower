# ===============================================
# file.py contains all file manipulation methods.
# ===============================================

from typing import Dict, Union
import shutil, os
import json, re

from . import cfg

def file_exists(filename: str) -> bool:
    """Checks if file exixts
    """
    return os.path.isfile(filename)

def load_stylesheet(filename: str) -> str:
    """Load and return a qss file. Converts calls to color variables
    in cfg.py to their actual values.
    """
    f = open(filename, 'r').read()
    pattern = re.compile(r'cfg\.colors\[.*\]')
    for match in set(pattern.findall(f)):
        color = match[match.index('[\'') + 2: match.index('\']')]
        f = f.replace(match, cfg.colors[color])
    return f

def load_json(filename: str) -> Union[Dict, None]:
    """Load a json file using python's json library.
    If an error occurs while loading, None is returned.
    Otherwise return a dictionary.
    """
    f = open(filename, 'r')
    try:
        return json.load(f)
    except Exception as e:
        print(f'Error while opening {filename}\nError message: {e}')
        return None

def _get_pretty_tile_data(level_name: str, file: dict, indent: int) -> str:
    """Return a string representation of a level's tileData in a
    more readable format.
    """
    level_data = file["levelData"][level_name]
    width = level_data["width"]
    height = level_data["height"]
    tile_data = level_data["tileData"]
    # If formatted properly, tileData should be 3 levels in.
    S = '"tileData": ['
    for index in range(width * height):
        if index % width == 0:
            S += '\n' + ' ' * (indent * 4)

        S += '"' + tile_data[index] + '"'

        if index != (width * height) - 1: # last index in array
            S += ', '

    S += '\n' + ' ' * (indent * 3) + ']'
    return S


def write_level_json(filename: str, file: dict):
    """Write the contents of file to filename's path.

    Precondition: file dict is properly formatted.
    """
    # TODO: Write json to file in the same way I write them.
    # i.e. if a level's width is 12, the array is neatly organized
    # so that it write's a new line every 12 items.

    # this puts the whole thing in memory but the files probably won't be crazy large.
    INDENTATION = 2
    pretty_string = json.dumps(file, ensure_ascii=False, indent=INDENTATION)

    # prettify how arrays are displayed.
    for level_name in list(file["levelData"].keys()):
        file_pattern = re.compile(f'"{level_name}"' + r':[^\]]*]')
        level_match = file_pattern.search(pretty_string).group()
        array_pattern = re.compile(r'"tileData": \[[^\]]*]', re.S)

        array_width = int(file["levelData"][level_name]["width"])
        array_height = int(file["levelData"][level_name]["height"])

        tile_data = array_pattern.search(level_match).group()
        pretty_tile_data = _get_pretty_tile_data(level_name, file, INDENTATION)

        pretty_string = pretty_string.replace(tile_data, pretty_tile_data)

    open(filename, 'w').write(pretty_string) # Write contents to file.
