# =======================================================
# widget.py contains all GUI-related methods and classes.
# =======================================================

# PyQt imports
from PyQt5.QtGui import QIcon, QPainter, QPixmap, QPen, QColor, QFont
from PyQt5.QtCore import Qt, QSize, QLineF, QLine, QRect
from PyQt5.QtWidgets import (QMainWindow, QLabel, QAction, QWidget,
QVBoxLayout, QHBoxLayout, QGridLayout, QPushButton, QGraphicsView, QGraphicsScene,
QGraphicsProxyWidget, QGraphicsPixmapItem, QFileDialog, QFrame, QListView,
QScrollArea)

# Other python imports
import math, random

# Custom imports
from . import cfg
from .file import load_config_file, update_config_file, load_json

SETTINGS = load_config_file(cfg.settings_file) # Currently does nothing
print(SETTINGS)

class MainWindow(QMainWindow):
    def __init__(self, parent):
        super().__init__()
        self.parent = parent
        self.name = cfg.__name__
        self.version = cfg.__version__
        self.initUI()

        self.level = None

    def initUI(self):
        self.setWindowTitle(f'{self.name} - v{self.version}')
        self.setMinimumSize(1000, 600)
        self.centralWidget = QWidget()
        self.layout = QHBoxLayout()

        self.setupMenuBar()
        self.statusBar = self.statusBar()
        self.addWidgets()
        self.setCentralWidget(self.centralWidget)
        self.centralWidget.setLayout(self.layout)

    def addWidgets(self):
        self.mapView = MapView(self)
        self.toolBar = ToolBar()

        self.layout.addWidget(self.mapView)
        self.layout.addWidget(self.toolBar)

    # ====================
    # MENUBAR RELATED METHODS
    # ====================
    def setupMenuBar(self):
        self.menubar = self.menuBar()

        self.fileMenu = self.menubar.addMenu('&' + 'File')
        self.configureFileMenu()

        self.editMenu = self.menubar.addMenu('&' + 'Edit')
        self.configureEditMenu()

        self.viewMenu = self.menubar.addMenu('&' + 'View')
        self.configureViewMenu()

        self.settingsMenu = self.menubar.addMenu('&' + 'Settings')
        self.configureSettingsMenu()

        self.levelNameLabel = QLabel('No level opened') # Corner widget.
        self.menubar.setCornerWidget(self.levelNameLabel)

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

    def configureViewMenu(self):
        gridAct = QAction('&' + 'Grid', self)
        gridAct.setCheckable(True)

        self.viewMenu.addAction(gridAct)

        self.gridAct = gridAct

    def configureSettingsMenu(self):
        pass

    def newLevel(self):
        print('New level')

    def openLevel(self):
        directory = cfg.level_dir if SETTINGS['inRepo'] == 'true' else cfg.main_dir
        file_tuple = QFileDialog.getOpenFileName(None, 'Open Level', directory, 'Level data file (*.json)')
        file = load_json(file_tuple[0]) if file_tuple[0] else None
        if file: # Check if filename isn't blank
            self.loadLevel(file)

    def loadLevel(self, file: dict):
        print(file['levelData']['testLevel'])
        # TODO: Make this more elaborate. perhaps bring up a menu to ask to select a specific level.
        self.level = LevelData(file['levelData']['testLevel'])
        self.levelNameLabel.setText(self.level.name)
        self.mapView.drawLevel(self.level)

    def saveLevel(self):
        print('Save level')

    def undoAction(self):
        print('Undo')

    def redoAction(self):
        print('Redo')


class MapView(QWidget):
    def __init__(self, parent):
        super().__init__()
        self.parent = parent
        self.layout = QHBoxLayout()
        self.scene = QGraphicsScene()
        self.view = QGraphicsView(self.scene, self)
        self.setupView()
        self.grid = None
        self.tileSize = cfg.TILESIZE
        self.tiles = []

        # self.setStyleSheet(f"border: none; background-color: {cfg.colors['grey light']};")
        # self.setCursor(Qt.CrossCursor)
        self.layout.addWidget(self.view)
        self.setLayout(self.layout)

    def paintEvent(self, event):
        self.clearGrid()
        if self.parent.gridAct.isChecked():
            self.drawGrid()

        self.updateSceneSize()

    def mouseMoveEvent(self, event):
        pos = self.view.mapToScene(event.pos())
        s = f'({int(pos.x())},{int(pos.y())})'
        self.parent.statusBar.showMessage(s)

    def updateSceneSize(self):
        self.scene.setSceneRect(self.scene.itemsBoundingRect())

    def setupView(self):
        self.view.setAlignment(Qt.AlignTop | Qt.AlignLeft)
        self.view.setMouseTracking(True)
        self.view.mouseMoveEvent = self.mouseMoveEvent # Override mouse move event.

    def clearScene(self):
        self.scene.clear()

    def clearGrid(self):
        if self.grid:
            self.scene.removeItem(self.grid)
            self.grid = None

    def drawGrid(self):
        """ Draws a grid by drawing a series of lines into the scene.
        Precondition: self.grid is None
        """
        width = self.view.viewport().width()
        height = self.view.viewport().height()

        grid = QPixmap(width, height)
        grid.fill(QColor('Transparent'))

        painter = QPainter()
        painter.begin(grid)
        painter.setPen(QColor(cfg.colors['cobalt']))

        for y in range(round(height / cfg.TILESIZE)):
            h_line = QLine(0, y * cfg.TILESIZE, width, y * cfg.TILESIZE)
            painter.drawLine(h_line)
            for x in range(round(width / cfg.TILESIZE)):
                v_line = QLine(x * cfg.TILESIZE, 0, x * cfg.TILESIZE, height)
                painter.drawLine(v_line)

        painter.end()

        self.grid = QGraphicsPixmapItem(grid)
        self.scene.addItem(self.grid)

    def drawLevel(self, level):
        """ Draws in the tiles of a level. Should only be called once
        everytime the level is updated.
        """
        tileData = level.tileData
        for index in range(len(tileData)):
            data = [int(n) for n in tileData[index].split('-')[:-1]]
            slice = QRect(data[0] * cfg.TILESIZE, data[1] * cfg.TILESIZE, cfg.TILESIZE, cfg.TILESIZE)
            tile = QPixmap(level.spriteURL).copy(slice)
            self.tiles.append(tile)
            pos = level.getTilePos(index, self.tileSize)
            self.scene.addPixmap(tile).setPos(pos[1], pos[0])


class ToolBar(QWidget):
    def __init__(self):
        super().__init__()
        self.layout = QVBoxLayout()

        self.selectBtn = ToolButton(cfg.icons['cursor'])
        self.fillBtn = ToolButton(cfg.icons['fill'])
        self.drawBtn = ToolButton(cfg.icons['paint-brush'])
        self.eraseBtn = ToolButton(cfg.icons['eraser'])
        self.dragBtn = ToolButton(cfg.icons['drag'])

        self.separator = QFrame()
        self.separator.setFrameShape(QFrame.HLine)
        self.separator.setLineWidth(2)

        self.tileMenu = TileMenu()

        buttons = [
            self.selectBtn, self.fillBtn, self.drawBtn,
            self.eraseBtn, self.dragBtn
        ]

        for b in buttons:
            self.layout.addWidget(b)

        self.layout.addWidget(self.separator)
        self.layout.addWidget(self.tileMenu)
        self.setLayout(self.layout)

class ToolButton(QPushButton):
    def __init__(self, iconURL):
        super().__init__()
        self.icon = QIcon(iconURL)
        self.iconSize = QSize(24, 24)

        self.setIcon(QIcon(iconURL))
        self.setIconSize(self.iconSize)
        # self.setStyleSheet(f"border: none; background-color: {cfg.colors['white']};")

class TileMenu(QScrollArea):
    def __init__(self):
        super().__init__()
        self.layout = QGridLayout()
        self.layout.addWidget(QLabel('test'))
        self.layout.addWidget(QLabel('test'))
        self.layout.addWidget(QLabel('test'))
        self.layout.addWidget(QLabel('test'))
        self.setLayout(self.layout)

class Tile(QPushButton):
    pass

class LevelData:
    def __init__(self, file: dict):
        self.name = file['name']
        self.spriteSheet = file['spriteSheet']
        self.width = file['width']
        self.height = file['height']
        self.tileData = file['tileData']

        self.spriteURL = cfg.get_assetURL(cfg.sprite_dir, self.spriteSheet, '.png')
        print(self.spriteURL)

    def getTilePos(self, index: int, tileSize: int) -> tuple:
        """Get the true position of a particular tile.
        """
        pos = self.get2DFrom1D(index, self.width)
        x = pos[0]
        y = pos[1]
        return (x * tileSize, y * tileSize)

    def get2DFrom1D(self, index: int, array_width: int) -> tuple:
        """Convert the index of a one-dimensional array to
        an 'x' and 'y' value that would correspond to the array's
        2d counterpart.

        This is a direct translation from js-roguelite's
        convertIndexToCoords() in engine.js
        """
        x = math.floor(index / array_width)
        y = index % array_width
        return (x, y)
