# =======================================================
# widget.py contains all GUI-related methods and classes.
# =======================================================

# PyQt imports
from PyQt5.QtWidgets import (QMainWindow, QLabel, QAction)

# Custom imports
from . import cfg

class MainWindow(QMainWindow):
    def __init__(self, parent):
        super().__init__()
        self.parent = parent
        self.name = cfg.__name__
        self.version = cfg.__version__
        self.initUI()

    def initUI(self):
        self.setWindowTitle(f'{self.name} - v{self.version}')
        self.setMinimumSize(800, 600)
        self.setupMenu()

    def setupMenu(self):
        self.menubar = self.menuBar()
        self.fileMenu = self.menubar.addMenu('&' + 'File')
        self.configureFileMenu()
        self.editMenu = self.menubar.addMenu('&' + 'Edit')
        self.configureEditMenu()
        self.settingsMenu = self.menubar.addMenu('&' + 'Settings')
        self.configureSettingsMenu()
        # self.menubar.setCornerWidget(QLabel(self.name))

    def configureFileMenu(self):
        newAct = QAction('&' + 'New Level', self)
        newAct.triggered.connect(self.newLevel)
        newAct.setShortcut('Ctrl+N')

        openAct = QAction('&' + 'Open Level', self)
        openAct.triggered.connect(self.openLevel)
        openAct.setShortcut('Ctrl+O')

        saveAct = QAction('&' + 'Save', self)
        saveAct.triggered.connect(self.saveLevel)
        saveAct.setShortcut('Ctrl+S')

        exitAct = QAction('&' + 'Exit', self)
        exitAct.triggered.connect(self.close)

        self.fileMenu.addAction(newAct)
        self.fileMenu.addAction(openAct)
        self.fileMenu.addAction(saveAct)
        self.fileMenu.addAction(exitAct)

    def configureEditMenu(self):
        pass

    def configureSettingsMenu(self):
        pass

    def newLevel(self):
        print('New level')

    def openLevel(self):
        print('Open level')

    def saveLevel(self):
        print('Save level')
