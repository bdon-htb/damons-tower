# =======================================================
# widget.py contains all GUI-related methods and classes.
# =======================================================

# PyQt imports
from PyQt5.QtGui import QIcon, QPainter, QPixmap, QPen, QColor, QFont, QBrush
from PyQt5.QtCore import Qt, QSize, QLineF, QLine, QRect
from PyQt5.QtWidgets import (QMainWindow, QLabel, QAction, QWidget,
QVBoxLayout, QHBoxLayout, QGridLayout, QPushButton, QGraphicsView, QGraphicsScene,
QGraphicsProxyWidget, QGraphicsPixmapItem, QFileDialog, QFrame, QListView,
QScrollArea, QButtonGroup, QComboBox)

# Other python imports
import math, random

# Custom imports
from . import cfg
from .file import load_config_file, update_config_file, load_json

SETTINGS = load_config_file(cfg.settings_file) # Currently does nothing
print(SETTINGS)

def is_level(d: dict) -> bool:
    """Simply checks that the first key is 'levelData'
    For preventing the loading of non-level data .json files.
    """
    return list(d.keys())[0] == 'levelData'

# =========================
# FUNCTIONAL WIDGET CLASSES
# =========================
class MainWindow(QMainWindow):
    def __init__(self, parent):
        super().__init__()
        self.parent = parent
        self.name = cfg.__name__
        self.version = cfg.__version__

        self.level = None
        self.allCursorModes = [
            'select',
            'fill',
            'draw',
            'erase',
            'drag'
        ]

        self.cursorShortcuts = {
            'm': 'select',
            'g': 'fill',
            'b': 'draw',
            'e': 'erase',
            'd': 'drag'
        }

        self.cursorMode = 'select'
        self.tileSize = cfg.TILESIZE

        self.initUI() # Should be done last always!

    # =================
    # OVERRIDEN METHODS
    # =================
    def keyPressEvent(self, event):
        shortcutKey = event.text().lower()
        if shortcutKey in self.cursorShortcuts:
            new_mode = self.cursorShortcuts[shortcutKey]
            self.changeCursorMode(new_mode)

    # =================
    # ESSENTIAL METHODS
    # =================
    def initUI(self):
        self.setWindowTitle(f'{self.name} - v{self.version}')
        self.setMinimumSize(1000, 600)
        self.centralWidget = QWidget()
        self.layout = QGridLayout()

        self.setupMenuBar()
        self.setupStatusBar()
        self.addWidgets() # Important: must be before menubar sets up.
        self.setCentralWidget(self.centralWidget)
        self.centralWidget.setLayout(self.layout)

    def addWidgets(self):
        self.levelMenu = LevelMenuBar(self)
        self.mapView = MapView(self)
        self.toolBar = ToolBar(self)

        self.layout.addWidget(self.levelMenu, 0, 0, 1, 2) # Span both cols.
        self.layout.addWidget(self.mapView, 1, 0)
        self.layout.addWidget(self.toolBar, 1, 1)

    def setupStatusBar(self):
        self.statusBar = self.statusBar()
        self.statusComponents = {
            'levelName': QLabel('No level open'),
            'levelSize': QLabel('0x0'),
            'mousePos': QLabel('(0, 0)'),
            'zoom': QLabel('100%')
        }

        last_component = list(self.statusComponents.keys())[-1]
        for component in self.statusComponents:
            self.statusBar.addPermanentWidget(self.statusComponents[component])
            if component != last_component:
                self.statusBar.addPermanentWidget(VLine())

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
        gridAct.toggled.connect(self.repaintMapView) # Force a repaint of the window immediately after press.
        self.viewMenu.addAction(gridAct)

        self.gridAct = gridAct

    def configureSettingsMenu(self):
        pass

    # ====================
    # FILE RELATED METHODS
    # ====================
    def newLevel(self):
        print('New level')

    def openLevel(self):
        directory = cfg.level_dir if SETTINGS['inRepo'] == 'true' else cfg.main_dir
        file_tuple = QFileDialog.getOpenFileName(None, 'Open Level', directory, 'Level data file (*.json)')
        file = load_json(file_tuple[0]) if file_tuple[0] else None
        if file and is_level(file): # Check if filename isn't blank
            if self.level:
                self.clearLevel()
            self.loadLevel(file)

    def loadLevel(self, file: dict):
        print(file['levelData']['testLevel'])
        # TODO: Make this more elaborate. perhaps bring up a menu to ask to select a specific level.
        self.level = LevelData(file['levelData']['testLevel'])
        self.statusComponents['levelName'].setText(self.level.name)
        self.mapView.drawLevel(self.level)
        self.toolBar.tileMenu.loadTiles(self.level.spriteURL)

    def saveLevel(self):
        print('Save level')

    # ====================
    # EDIT RELATED METHODS
    # ====================
    def undoAction(self):
        print('Undo')

    def redoAction(self):
        print('Redo')

    # =============
    # WIDGET-RELATED METHODS
    # =============
    def repaintMapView(self):
        """ Precondition: self.mapView is already loaded.
        """
        self.mapView.updateScene()

    def changeCursorMode(self, new_mode):
        """ Change self.cursorMode and check the corresponding button
        in self.toolBar
        """
        if new_mode in self.allCursorModes:
            self.toolBar.buttons[new_mode].setChecked(True)
            self.cursorMode = new_mode
            self.mapView.updateScene()

    def clearLevel(self):
        self.toolBar.tileMenu.clearTiles()
        self.level = None

    # =============
    # MISC. METHODS
    # =============
    def getMapSize(self):
        """ Return the dimensions of the level / map in pixels.
        Precondition: level is not None
        """
        level = self.level
        return (level.width * cfg.TILESIZE, level.height * cfg.TILESIZE)

class MapView(QGraphicsView):
    def __init__(self, parent):
        super().__init__()
        self.parent = parent
        self.checkerTileSize = 16
        self.mousePos = None
        self.bg_color = cfg.colors['mauve']
        self._emptyTileID = '00'
        self.setScene(QGraphicsScene())
        self.setupView()

    # =================
    # OVERRIDEN METHODS
    # =================
    def drawBackground(self, painter, rect):
        self.drawSceneBackground(painter)
        if self.parent.level:
            self.drawCheckerGrid(painter)

    def drawForeground(self, painter, rect):
        if self.parent.gridAct.isChecked() and self.parent.level:
            self.drawGrid(painter)

        if self.parent.cursorMode == 'select' and self.mousePos:
            self.drawSelectOutline(painter)

        self.updateSceneSize() # Call this once everything is drawn.

    def mouseMoveEvent(self, event):
        pos = self.mapToScene(event.pos())
        s = f'({int(pos.x())},{int(pos.y())})'
        self.parent.statusComponents['mousePos'].setText(s)
        self.mousePos = (pos.x(), pos.y())
        self.updateScene()

    def mousePressEvent(self, event):
        print('Press detected!')
        print(self.parent.level)

    def leaveEvent(self, event):
        self.mousePos = None
        self.updateScene()

    # ==============
    # CUSTOM METHODS
    # ==============
    def setupView(self):
        self.setAlignment(Qt.AlignTop | Qt.AlignLeft)
        self.setMouseTracking(True)

    def updateScene(self):
        self.scene().update()

    def updateSceneSize(self):
        self.scene().setSceneRect(self.scene().itemsBoundingRect())

    def getNearestTopLeft(self, pos_x, pos_y) -> tuple:
        """ Return the top left coordinates of the nearest grid square relative to
        pos_x and pos_y
        """
        tileSize = self.parent.tileSize
        x = pos_x - (pos_x % tileSize)
        y = pos_y - (pos_y % tileSize)
        return (x, y)

    # =====================
    # SCENE DRAWING METHODS
    # =====================
    def drawSceneBackground(self, painter):
        """ Draw the background of the view / scene.
        """
        if self.parent.level:
            mapSize = self.parent.getMapSize()
        else:
            mapSize = (0, 0)

        width = max(self.viewport().width(), mapSize[0])
        height = max(self.viewport().height(), mapSize[1])

        color = QColor(self.bg_color)

        painter.setPen(color)
        painter.setBrush(QBrush(color, Qt.SolidPattern))
        painter.drawRect(0, 0, width, height)

    def drawSelectOutline(self, painter):
        """ Draws a rectangular outline of the nearest grid square.
        Used to indicate the grid square the cursor is currently hovering over.
        """
        topLeft = self.getNearestTopLeft(self.mousePos[0], self.mousePos[1])
        tileSize = self.parent.tileSize

        painter.setPen(QColor(cfg.colors['light teal']))
        painter.drawRect(topLeft[0], topLeft[1], tileSize, tileSize)

    def drawCheckerGrid(self, painter):
        """ Draws a pattern of grey and white squares into the scene.
        Used to represent transparency in the background.

        Precondition: self.parent.level is not None
        """
        mapSize = self.parent.getMapSize()
        width, height = mapSize[0], mapSize[1]

        tileSize = self.checkerTileSize

        yrange = math.ceil(height / tileSize)
        xrange = math.ceil(width / tileSize)
        for y in range(yrange):
            for x in range(xrange):
                if (x + y) % 2 == 0: # Make every other square light grey.
                    color = QColor(cfg.colors['grey light'])
                else:
                    color = QColor(cfg.colors['grey lighter'])

                painter.setPen(color)
                painter.setBrush(QBrush(color, Qt.SolidPattern))
                if (x == xrange) and (xrange * tileSize) - width != 0:
                    tileWidth = (xrange * tileSize) - width
                else:
                    tileWidth = tileSize

                if (y == yrange) and (yrange * tileSize) - height != 0:
                    tileHeight = (yrange * tileSize) - height
                else:
                    tileHeight = tileSize
                painter.drawRect(x * tileSize, y * tileSize, tileWidth, tileHeight)


    def drawGrid(self, painter):
        """ Draws a grid by drawing a series of lines into the scene.
        Precondition: self.grid is None and self.parent.level is not NOne
        """
        mapSize = self.parent.getMapSize()
        width, height = mapSize[0], mapSize[1]

        painter.setPen(QColor(cfg.colors['cobalt']))
        tileSize = self.parent.tileSize

        for y in range(round(height / tileSize) + 1):
            h_line = QLine(0, y * tileSize, width, y * tileSize)
            painter.drawLine(h_line)
            for x in range(round(width / tileSize) + 1):
                v_line = QLine(x * tileSize, 0, x * tileSize, height)
                painter.drawLine(v_line)

    def drawLevel(self, level):
        """ Draws in the tiles of a level. Should only be called once
        everytime the level is updated.
        """
        tileData = level.tileData
        tileSize = self.parent.tileSize
        for index in range(len(tileData)):
            data = [int(n) for n in tileData[index].split('-')[:-1]]
            id = tileData[index].split('-')[-1]
            if id != self._emptyTileID:
                slice = QRect(data[0] * tileSize, data[1] * tileSize, tileSize, tileSize)
                tile = QPixmap(level.spriteURL).copy(slice)
                pos = level.getTilePos(index, tileSize)

                # For some reason the pixmap was originally off 1 pixel. Probably has something to
                # do with the scene being nested in the view? Band-aid fix.
                self.scene().addPixmap(tile).setPos(pos[0] + 1, pos[1] + 1)

class ToolBar(QWidget):
    def __init__(self, parent):
        super().__init__()
        self.parent = parent
        self.allCursorModes = parent.allCursorModes
        self.layout = QVBoxLayout()

        self.buttonGroup = QButtonGroup()
        self.buttonGroup.buttonClicked.connect(self.changeCursorMode)

        invShortcuts = {name: shortcut for shortcut, name in parent.cursorShortcuts.items()}
        self.selectBtn = ToolButton(cfg.icons['cursor'], 'select', invShortcuts['select'])
        self.selectBtn.setChecked(True)
        self.fillBtn = ToolButton(cfg.icons['fill'], 'fill', invShortcuts['fill'])
        self.drawBtn = ToolButton(cfg.icons['paint-brush'], 'draw', invShortcuts['draw'])
        self.eraseBtn = ToolButton(cfg.icons['eraser'], 'erase', invShortcuts['erase'])
        self.dragBtn = ToolButton(cfg.icons['drag'], 'drag', invShortcuts['drag'])

        self.separator = QFrame()
        self.separator.setFrameShape(QFrame.HLine)
        self.separator.setLineWidth(2)

        self.tileMenu = TileMenu()

        btns = [
            self.selectBtn, self.fillBtn, self.drawBtn,
            self.eraseBtn, self.dragBtn
        ]

        self.buttons = {} # button reference.
        for b in btns:
            self.buttons[b.name] = b
            self.buttonGroup.addButton(b)
            self.layout.addWidget(b)

        self.layout.addWidget(self.separator)
        self.layout.addWidget(self.tileMenu)
        self.setLayout(self.layout)

    def getCheckedButton(self):
        return self.buttonGroup.checkedButton()

    def changeCursorMode(self):
        btn = self.getCheckedButton()
        if btn.name in self.allCursorModes:
            self.parent.changeCursorMode(btn.name)

    def selectButton(self, name):
        pass

class ToolButton(QPushButton):
    def __init__(self, iconURL, name, shortcut=None):
        super().__init__()
        self.icon = QIcon(iconURL)
        self.iconSize = QSize(24, 24)
        self.name = name

        self.setIcon(QIcon(iconURL))
        self.setIconSize(self.iconSize)

        toolTip = name.title() + ' Tool'
        if shortcut:
            toolTip += f' ({shortcut.capitalize()})'
        self.setToolTip(toolTip)
        self.setCheckable(True)

class TileMenu(QScrollArea):
    def __init__(self):
        super().__init__()
        self.layout = QGridLayout()
        self.cols = 5
        self._lastRow = 0
        self._lastCol = 0

        self.buttonGroup = QButtonGroup()
        self.buttonGroup.buttonClicked.connect(self.selectTile)
        self.selectedTile = None # Currently selected tile button.
        self.setLayout(self.layout)

    def getSelectedTile(self):
        return self.selectedTile

    def selectTile(self, tile):
        # Basically these if statements allow NO tiles to be selected at a time.
        if tile.isChecked() and self.selectedTile == tile:
            self.buttonGroup.setExclusive(False)
            tile.setChecked(False)
            self.selectedTile = None
        else:
            if not self.buttonGroup.exclusive():
                self.buttonGroup.setExclusive(True)
            tile.setChecked(True)
            self.selectedTile = tile

    def loadTiles(self, spriteSheetURL):
        """Load the tiles of a spriteSheet into the tileMenu.
        Precondition: Assumes each 32x32 square in the sheet is occupied
        and that 32 divides the area of the spriteSheet evenly.
        """
        spriteSheet = QPixmap(spriteSheetURL)
        col = 0
        row = 0
        for y in range(0, spriteSheet.height(), cfg.TILESIZE):
            for x in range(0, spriteSheet.width(), cfg.TILESIZE):
                slice = QRect(x, y, cfg.TILESIZE, cfg.TILESIZE)
                tileSprite = spriteSheet.copy(slice)
                tile = TileButton(tileSprite)
                self.addTile(tile)
                col += 1

    def addTile(self, tile):
        if self._lastCol > self.cols:
            self._lastRow += 1 # Move on to next row.
            self._lastCol = 0 # Go back to first column

        self.layout.addWidget(tile, self._lastRow, self._lastCol)
        self.buttonGroup.addButton(tile)

        self._lastCol += 1

    def clearTiles(self):
        self.selectedTile = None
        self._lastRow = 0
        self._lastCol = 0

        # Thank you stack overflow! this helped: https://stackoverflow.com/questions/4528347/clear-all-widgets-in-a-layout-in-pyqt
        for i in reversed(range(self.layout.count())):
            widget = self.layout.itemAt(i).widget()
            self.buttonGroup.removeButton(widget)
            widget.setParent(None)

class TileButton(QPushButton):
    def __init__(self, pixmap):
        super().__init__()
        self.icon = QIcon(pixmap)
        self.iconSize = QSize(32, 32)

        self.setIcon(QIcon(pixmap))
        self.setIconSize(self.iconSize)
        self.setCheckable(True)

class LevelMenuBar(QWidget):
    def __init__(self, parent):
        super().__init__()
        self.parent = parent
        self.layout = QVBoxLayout()

        self.levelSelectBtn = QComboBox()
        self.levelSelectBtn.addItem("No level loaded")
        self.levelSelectBtn.setEnabled(False)
        self.layout.addWidget(self.levelSelectBtn)
        self.setLayout(self.layout)

# ==================
# NON-WIDGET CLASSES
# ==================
class LevelData:
    def __init__(self, file: dict):
        self.name = file['name']
        self.spriteSheet = file['spriteSheet']
        self.width = file['width']
        self.height = file['height']
        self.tileData = file['tileData']

        self.spriteURL = cfg.get_assetURL(cfg.sprite_dir, self.spriteSheet, '.png')

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
        x = index % array_width
        y = math.floor(index / array_width)
        return (x, y)

# ========================
# AESTHETIC WIDGET CLASSES
# ========================
# TODO: Make this less ugly. Maybe add a horizontal frame too.
class VLine(QFrame):
    """a simple VLine, like the one you get from designer
    Thanks stack overflow.
    """
    def __init__(self):
        super(VLine, self).__init__()
        self.setFrameShape(self.VLine|self.Sunken)
