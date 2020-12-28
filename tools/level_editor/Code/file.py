# ===============================================
# file.py contains all file manipulation methods.
# ===============================================

from typing import Dict, Union
import shutil, os, json

from . import cfg

def file_len(filename: str) -> int:
    """Return the total number of lines in a file.
    """
    file = open(filename)
    num_lines = sum([1 for line in file])
    file.close()
    return num_lines

def load_config_file(filename: str) -> Dict[str, str]:
    """Load a ltmi custom .cfg file and return a dictionary of its contents.
    Ignores comments
    """
    D = {}
    with open(filename) as f:
        multi_line = False # Flag for multi_line parse.
        words = []
        for line in f:
            if not line.startswith('//') and line != "\n": # Ensure that it's not a comment or empty line.
                if line.count('"') == 1 and not multi_line: # Found start of multiline
                    multi_line = True
                    line.replace('"', '') # Remove quote character
                    split_index = line.index(':') # Only split at first colon
                    quote_index = line.index('"')
                    words = [line[:split_index].strip(), line[quote_index + 1:].strip()]
                elif multi_line: # If line is part of the multiline.
                    words[1] += " " + line.strip() # append to string.
                    if line.count('"'): # If line is the end of the multiline.
                        multi_line = False
                        quote_index = words[1].rfind('"')
                        words[1] = words[1][:quote_index] # Cut off quotation mark.
                        D[words[0]] = words[1]
                else: # Line is not a multline
                    split_index = line.index(':') # Only split at first colon
                    words = [line[:split_index].strip(), line[split_index + 1:].strip()]
                    D[words[0]] = words[1]
    return D

def update_config_file(D: Dict[str, str], filename: str) -> None:
    """Write the information in D to a .cfg to the file of name filename.
    Ignores comments.

    Precondition: filename is the name of a file that already exists and
    is properly formatted.
    """
    temp_dir = os.path.join(cfg.data_dir, 'temp.cfg')
    newfile = open(temp_dir, 'w') # Create a temporary copy.
    with open(filename, 'r') as f:
        for line in f:
            if not line.startswith('//') and line != "\n" and line.count(':'): # Check if line is a setting.
                split_index = line.index(':') # Only split at first colon
                words = [line[:split_index].strip(), line[split_index:].strip()]
                key = words[0]
                value = D[words[0]].strip()
                newfile.write(f'{key}: {value}\n')
            else:
                newfile.write(line)
    newfile.close()
    shutil.move(temp_dir, filename)

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
