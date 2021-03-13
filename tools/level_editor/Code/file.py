# ===============================================
# file.py contains all file manipulation methods.
# ===============================================

from typing import Dict, Union
import json, re

from . import cfg

def file_exists(filename: str) -> bool:
    """Checks if file exixts
    """
    return os.path.isfile(filename)

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

def write_json(filename: str, file: dict):
    """Write the contents of file to filename's path.
    """
    # TODO: Write json to file in the same way I write them.
    # i.e. if a level's width is 12, the array is neatly organized
    # so that it write's a new line every 12 items.
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

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
