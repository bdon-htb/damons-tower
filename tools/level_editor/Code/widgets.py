# =======================================================
# widget.py contains all GUI-related methods and classes.
# =======================================================

# PyQt imports
from PyQt5.QtGui import QIcon, QPainter, QPixmap, QPen, QColor, QFont
from PyQt5.QtCore import Qt, QSize
from PyQt5.QtWidgets import (QMainWindow, QLabel, QAction, QWidget,
QVBoxLayout, QHBoxLayout, QPushButton, QGraphicsView)

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
        self.centralWidget = QWidget()
        self.layout = QHBoxLayout()

        self.setupMenuBar()
        self.addWidgets()
        self.setCentralWidget(self.centralWidget)
        self.centralWidget.setLayout(self.layout)

    # ====================
    # MENUBAR RELATED METHODS
    # ====================
    def setupMenuBar(self):
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
        undoAct = QAction('&' + 'Undo', self)
        undoAct.triggered.connect(self.undoAction)
        undoAct.setShortcut('Ctrl+Z')

        redoAct = QAction('&' + 'Undo', self)
        redoAct.triggered.connect(self.redoAction)
        redoAct.setShortcut('Ctrl+Shift+Z')

        self.editMenu.addAction(undoAct)
        self.editMenu.addAction(redoAct)

    def configureSettingsMenu(self):
        pass

    def newLevel(self):
        print('New level')

    def openLevel(self):
        print('Open level')

    def saveLevel(self):
        print('Save level')

    def undoAction(self):
        print('Undo')

    def redoAction(self):
        print('Redo')

    # ======================
    # WIDGET RELATED METHODS
    # ======================

    def addWidgets(self):
        self.canvas = Canvas(self)
        self.toolBar = ToolBar()

        self.layout.addWidget(self.canvas)
        self.layout.addWidget(self.toolBar)

class Canvas(QGraphicsView):
    def __init__(self, parent):
        super().__init__()
        self.layout = QHBoxLayout()
        self.text = 'Test'

        self.setStyleSheet(f"border: none; background-color: {cfg.colors['dark cobalt']};")
        self.setLayout(self.layout)

    '''
    def paintEvent(self, event):
        qp = QPainter()
        qp.begin(self)
        self.drawText(event, qp)
        qp.end()
        painter = QPainter()

    def drawText(self, event, qp):
        qp.setPen(QColor(168, 34, 3))
        qp.setFont(QFont('Decorative', 10))
        qp.drawText(event.rect(), Qt.AlignCenter, self.text)
    '''


class ToolBar(QWidget):
    def __init__(self):
        super().__init__()
        self.layout = QVBoxLayout()
        self.selectBtn = ToolButton(cfg.icons['cursor'])
        self.fillBtn = ToolButton(cfg.icons['fill'])
        self.drawBtn = ToolButton(cfg.icons['paint-brush'])
        self.eraseBtn = ToolButton(cfg.icons['eraser'])
        self.dragBtn = ToolButton(cfg.icons['drag'])

        buttons = [
            self.selectBtn, self.fillBtn, self.drawBtn,
            self.eraseBtn, self.dragBtn
        ]

        for b in buttons:
            self.layout.addWidget(b)

        self.setLayout(self.layout)

class ToolButton(QPushButton):
    def __init__(self, iconURL):
        super().__init__()
        self.icon = QIcon(iconURL)
        self.iconSize = QSize(24, 24)

        self.setIcon(QIcon(iconURL))
        self.setIconSize(self.iconSize)
        self.setStyleSheet(f"border: none; background-color: {cfg.colors['white']};")
