# =======================================================
# widget.py contains all GUI-related methods and classes.
# =======================================================

# PyQt imports
from PyQt5.QtWidgets import QMainWindow

# Custom imports
from . import cfg

class MainWindow(QMainWindow):
    def __init__(self, parent):
        super().__init__()
