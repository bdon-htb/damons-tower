# ===============================================
# file.py contains all file manipulation methods.
# ===============================================

from typing import Dict, Union
import json, re

from . import cfg

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
