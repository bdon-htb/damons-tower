# =======================================================
# widget.py contains all GUI-related methods and classes.
# =======================================================

# PyQt imports
from PyQt5.QtGui import QIcon, QPainter, QPixmap, QPen, QColor, QFont, QBrush, QTransform
from PyQt5.QtCore import Qt, QSize, QLineF, QLine, QRect, QRectF
from PyQt5.QtWidgets import (QMainWindow, QLabel, QAction, QWidget,
QVBoxLayout, QHBoxLayout, QGridLayout, QPushButton, QGraphicsView, QGraphicsScene,
QGraphicsProxyWidget, QGraphicsPixmapItem, QFileDialog, QFrame, QListView,
QScrollArea, QButtonGroup, QComboBox, QTabWidget, QSizePolicy, QFormLayout,
QLineEdit, QCheckBox, QDialog, QMessageBox)

# Other python imports
import math
from typing import Tuple, Optional

# Custom imports
from . import cfg
from .file import load_json, load_stylesheet, write_level_json, get_filename_from_path
from .data import LevelData

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
        self.zoom = 1
        self.workingDirectory = None

        self.levelData = None

        # Arrays containing previous states of the current level's tileData
        self.undoHistory = []
        self.redoHistory = []

        self.allCursorModes = [
            'draw',
            'fill',
            'erase'
        ]

        self.cursorShortcuts = {
            'b': 'draw',
            'g': 'fill',
            'e': 'erase'
        }

        self.cursorMode = 'draw'
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
        self.setupStyleSheet()

    def addWidgets(self):
        self.levelMenu = LevelMenuBar(self)
        self.mapView = MapView(self)
        self.toolBar = ToolBar(self)

        leftPolicy = QSizePolicy(QSizePolicy.Preferred, QSizePolicy.Preferred)
        rightPolicy = QSizePolicy(QSizePolicy.Preferred, QSizePolicy.Preferred)
        leftPolicy.setHorizontalStretch(2)
        rightPolicy.setHorizontalStretch(1)

        self.mapView.setSizePolicy(leftPolicy)
        self.toolBar.setSizePolicy(rightPolicy)

        self.layout.addWidget(self.levelMenu, 0, 0, 1, 2) # Span both cols.
        self.layout.addWidget(self.mapView, 1, 0)
        self.layout.addWidget(self.toolBar, 1, 1)

    def setupStatusBar(self):
        self.statusBar = self.statusBar()
        self.statusComponents = {
            'levelName': QLabel(' No level open '),
            'levelSize': QLabel(' 0x0 '),
            'mousePos': QLabel(' (0, 0) '),
            'zoom': QLabel(' 100% ' )
        }

        last_component = list(self.statusComponents.keys())[-1]
        for component in self.statusComponents:
            self.statusBar.addPermanentWidget(self.statusComponents[component])

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

    def configureFileMenu(self):
        newAct = QAction('&' + 'New Level', self)
        newAct.triggered.connect(self.newLevel)
        newAct.setShortcut('Ctrl+N')

        openAct = QAction('&' + 'Open Level', self)
        openAct.triggered.connect(self.openLevelAction)
        openAct.setShortcut('Ctrl+O')

        saveAct = QAction('&' + 'Save', self)
        saveAct.triggered.connect(self.saveAction)
        saveAct.setShortcut('Ctrl+S')

        saveAsAct = QAction('&' + 'Save As', self)
        saveAsAct.triggered.connect(self.saveAsAction)
        saveAsAct.setShortcut('Ctrl+Shift+S')

        exitAct = QAction('&' + 'Exit', self)
        exitAct.triggered.connect(self.close)

        self.fileMenu.addAction(newAct)
        self.fileMenu.addAction(openAct)
        self.fileMenu.addAction(saveAct)
        self.fileMenu.addAction(saveAsAct)
        self.fileMenu.addAction(exitAct)

    def configureEditMenu(self):
        undoAct = QAction('&' + 'Undo', self)
        undoAct.triggered.connect(self.undoAction)
        undoAct.setShortcut('Ctrl+Z')

        redoAct = QAction('&' + 'Redo', self)
        redoAct.triggered.connect(self.redoAction)
        redoAct.setShortcut('Ctrl+Shift+Z')

        self.editMenu.addAction(undoAct)
        self.editMenu.addAction(redoAct)

    def configureViewMenu(self):
        self.gridAct = QAction('&' + 'Grid', self)
        self.gridAct.setCheckable(True)
        self.gridAct.toggled.connect(self.repaintMapView) # Force a repaint of the window immediately after press.

        zoomInAct = QAction('&' + 'Zoom In', self)
        zoomInAct.triggered.connect(self.zoomInAction)
        zoomInAct.setShortcut('Ctrl+=')

        zoomOutAct = QAction('&' + 'Zoom Out', self)
        zoomOutAct.triggered.connect(self.zoomOutAction)
        zoomOutAct.setShortcut('Ctrl+-')

        defaultZoomAct = QAction('&' + 'Reset Zoom', self)
        defaultZoomAct.triggered.connect(self.setDefaultZoom)

        self.viewMenu.addAction(self.gridAct)
        self.viewMenu.addAction(zoomInAct)
        self.viewMenu.addAction(zoomOutAct)
        self.viewMenu.addAction(defaultZoomAct)

    # ====================
    # FILE RELATED METHODS
    # ====================
    def setupStyleSheet(self):
        self.parent.setStyleSheet(load_stylesheet(cfg.stylesheet_file))

    def newLevel(self):
        NewLevelWindow(self).show()

    def createLevelData(self, levelName: str, spriteSheet: str, width: int,
        height: int, newFile=False, newLevelDialog=None):
        """Create level data from scratch with the given parameters.
        if this is called from a NewLevelWindow, newLevelDialog can be optionally
        passed to have it close once the operation is completed.
        """

        data_dict = {
            'name': levelName,
            'spriteSheet': spriteSheet,
            'width': int(width),
            'height': int(height),
            'tileData': ['0-0-00' for n in range(width * height)]
            }

        if newFile:
            file = {'levelData': {levelName: data_dict}}
            self.workingDirectory = None
        else:
            file = self.levelData.getLevelJson()

            if levelName in file['levelData']: # Check if level already exists.
                msg = f'Detected an existing level in file with name {levelName}. Do you want to overwrite this data?'
                if QMessageBox.question(self, 'Message', msg, QMessageBox.Yes | QMessageBox.No) == QMessageBox.No:
                    return

            file['levelData'][levelName] = data_dict

        if newLevelDialog:
            newLevelDialog.close()

        self.loadLevelData(file)

        if newFile:
            self.clearHistory()
        else:
            self.levelMenu.setLevel(levelName)

    def clearHistory(self):
        self.undoHistory.clear()
        self.redoHistory.clear()

    def getLevelData(self):
        return self.levelData

    def loadLevelData(self, file: dict):
        """Load in level data from a given file (json.load() dictionary).
        """
        self.levelData = LevelData(file)
        self.levelMenu.enableLevelSelect()
        self.levelMenu.updateLevelSelect(self.levelData.getLevelNames())

    def loadLevel(self, levelName: str):
        """Load in specified level from level data file.
        """
        self.statusComponents['levelName'].setText(' ' + levelName + ' ')
        self.mapView.drawLevel()

        spriteURL = self.levelData.getSpriteURL()
        self.toolBar.tileTabMenu.loadTiles(spriteURL)
        self.setDefaultZoom()

    def saveLevelData(self):
        """Save levelData to file specified in self.workingDirectory.

        Precondition: self.workingDirectory is not None
        """
        file = self.levelData.getLevelJson()
        print('SAVED!')
        s = write_level_json(self.workingDirectory, file)

    def openLevelAction(self):
        directory = cfg.level_dir if cfg.SETTINGS['inRepo'] else cfg.main_dir
        path = QFileDialog.getOpenFileName(None, 'Open Level', directory, 'Level data file (*.json)')[0]
        self.workingDirectory = path
        file = load_json(path) if path != '' else None
        if file and is_level(file): # Check if filename isn't blank
            self.loadLevelData(file)
            self.clearHistory()
        elif file and not is_level(file):
            QMessageBox.information(None, ' ', 'Not a valid level file.')

    def saveAction(self):
        if self.levelData and self.workingDirectory:
            self.saveLevelData()
        elif self.levelData and self.workingDirectory is None:
            self.saveAsAction()
        else:
            QMessageBox.information(None, ' ', 'Nothing to save.')

    def saveAsAction(self):
        if self.levelData:
            directory = cfg.level_dir if cfg.SETTINGS['inRepo'] else cfg.data_dir
            path = QFileDialog.getSaveFileName(None, 'Save Level', directory, '(*.json)')[0]
            if path == '':
                return
            self.workingDirectory = path
            self.saveLevelData()
        else:
            QMessageBox.information(None, ' ', 'Nothing to save.')

    # ====================
    # EDIT RELATED METHODS
    # ====================
    def _applyHistory(self, stack1, stack2):
        """Appends a copy of current tileData to stack1
        and removes it from stack2.

        This is just a general function for undo / redo
        because the logic is the same.
        """
        if self.levelData and stack2:
            stack1.append(self.levelData.getTileData().copy())
            self.levelData.setTileData(stack2.pop())
            self.mapView.redrawLevel()

    def undoAction(self):
        if self.levelData and self.undoHistory:
            self._applyHistory(self.redoHistory, self.undoHistory)

    def redoAction(self):
        if self.levelData and self.redoHistory:
            self._applyHistory(self.undoHistory, self.redoHistory)

    def zoomInAction(self):
        if self.levelData and self.zoom < 2:
            self.mapView.scale(1.25, 1.25)
            self.zoom *= 1.25
            self.statusComponents['zoom'].setText(f' {int(self.zoom * 100)}% ')

    def zoomOutAction(self):
        if self.levelData and self.zoom > 0.7:
            self.mapView.scale(0.8, 0.8)
            self.zoom *= 0.8
            self.statusComponents['zoom'].setText(f' {int(self.zoom * 100)}% ')

    def setDefaultZoom(self):
        if self.levelData:
            self.mapView.setTransform(QTransform())
            self.zoom = 1
            self.statusComponents['zoom'].setText(f' {int(self.zoom * 100)}% ')

    # =============
    # WIDGET-RELATED METHODS
    # =============
    def repaintMapView(self):
        """Precondition: self.mapView is already loaded.
        """
        self.mapView.updateScene()

    def changeCursorMode(self, new_mode):
        """Change self.cursorMode and check the corresponding button
        in self.toolBar
        """
        if new_mode in self.allCursorModes:
            self.toolBar.buttons[new_mode].setChecked(True)
            self.cursorMode = new_mode
            self.mapView.updateScene()


    def clearLevel(self):
        """Clear anything associated with the current level.

        Note: It does NOT touch self.levelData
        """
        self.toolBar.tileTabMenu.clearTiles()
        self.mapView.clearScene(True)

class MapView(QGraphicsView):
    def __init__(self, parent):
        super().__init__()
        self.parent = parent
        self.checkerTileSize = 16
        self.mousePos = None
        self.bg_color = cfg.colors['mauve']
        # self.setStyleSheet("background-color: '#76608A';")
        self.setScene(QGraphicsScene())
        self.setupView()

    # =================
    # OVERRIDEN METHODS
    # =================
    def drawBackground(self, painter, rect):
        if self.parent.levelData:
            self.drawCheckerGrid(painter)

    def drawForeground(self, painter, rect):
        if self.parent.levelData and self.parent.toolBar.tileTabMenu.getActiveMenu() == 'Tile Ids':
            self.drawTileIds(painter)

        if self.parent.gridAct.isChecked() and self.parent.levelData:
            self.drawGrid(painter)

        if self.parent.cursorMode in ('fill', 'draw', 'erase') and self.mousePos:
            self.drawSelectOutline(painter)

        self.updateSceneSize() # Call this once everything is drawn.

    def mouseMoveEvent(self, event):
        pos = self.mapToScene(event.pos())
        topleft = self.getNearestTopLeft(pos.x(), pos.y())
        s = f'({int(topleft[0] / cfg.TILESIZE)},{int(topleft[1] / cfg.TILESIZE)})'
        self.parent.statusComponents['mousePos'].setText(' ' + s + ' ')
        self.mousePos = (pos.x(), pos.y())
        self.updateScene()

    def mousePressEvent(self, event):
        level = self.parent.getLevelData()
        if level and self.mousePos:
            self.editMap()

    def leaveEvent(self, event):
        self.mousePos = None
        self.updateScene()

    # ==============
    # CUSTOM METHODS
    # ==============
    def setupView(self):
        self.setAlignment(Qt.AlignTop | Qt.AlignLeft)
        self.setMouseTracking(True)

    def clearScene(self, forceUpdate=True):
        self.scene().clear()
        if forceUpdate:
            self.updateScene()

    def updateScene(self):
        self.scene().update()

    def updateSceneSize(self):
        if self.parent.levelData:
            levelWidth, levelHeight = self.parent.levelData.getMapSize(cfg.TILESIZE)

            if levelWidth >= self.scene().width() or levelHeight >= self.scene().height():
                rect = QRectF(0, 0, levelWidth, levelHeight)
            else:
                rect = self.scene().itemsBoundingRect()

            self.scene().setSceneRect(rect)

    def getNearestTopLeft(self, pos_x, pos_y) -> tuple:
        """Return the top left coordinates of the nearest grid square relative to
        pos_x and pos_y
        """
        tileSize = cfg.TILESIZE
        x = pos_x - (pos_x % tileSize)
        y = pos_y - (pos_y % tileSize)
        return x, y

    def getNearestTileIndex(self, pos_x, pos_y) -> int:
        """Return the index of the nearest tile that the mouse is hovering
        over.

        i.e. if the mouse is close to the top left of the mapview it will
        return 0.

        Precondition: self.parent.levelData is not None and
        pos_x, and pos_y are valid positions.
        """
        levelData = self.parent.getLevelData()
        pos_x, pos_y = self.getNearestTopLeft(pos_x, pos_y)
        pos_x, pos_y = int(pos_x // cfg.TILESIZE), int(pos_y // cfg.TILESIZE)
        array_width = levelData.getLevel()["width"]
        return levelData.get1DFrom2D(pos_x, pos_y, array_width)

    def getMapSize(self):
        """Return level map size in pixels.
        Precondition: self.parent.levelData is not None
        """
        return self.parent.levelData.getMapSize(cfg.TILESIZE)

    # ==========================
    # LEVEL MANIPULATION METHODS
    # ==========================
    def editMap(self):
        """Handles all level manipulations done with the mapview.
        """
        cursorMode = self.parent.cursorMode
        levelData = self.parent.getLevelData()
        tileTabMenu = self.parent.toolBar.tileTabMenu
        levelWidth, levelHeight = levelData.getMapSize(cfg.TILESIZE)
        x, y = self.mousePos
        # We only care if it's in level bounds
        if x < levelWidth and y < levelHeight:
            oldTileData = levelData.getTileData().copy()
            index = self.getNearestTileIndex(x, y)
            activeTileMenu = tileTabMenu.getActiveMenu()
            selectedTile = tileTabMenu.getActiveSelection()
            # TODO: Implement
            tile_data = levelData.getTileData()[index].split('-')
            if cursorMode == 'draw' and activeTileMenu == 'Tile Sprites' and selectedTile:
                tile_data[0] = str(selectedTile.getMetaData()["sprite_x"])
                tile_data[1] = str(selectedTile.getMetaData()["sprite_y"])
                if tile_data[2] == cfg.EMPTY_TILE_ID:
                    tile_data[2] = 'FL' # Floor is the default value for anything not empty.
                tile_data = '-'.join(tile_data)
                levelData.setTile(index, tile_data)
            elif cursorMode == 'draw' and activeTileMenu == 'Tile Ids' and selectedTile:
                tile_data[2] = selectedTile.getMetaData()["id"]
                tile_data = '-'.join(tile_data)
                levelData.setTile(index, tile_data)
            elif cursorMode == 'erase':
                levelData.eraseTile(index)
            elif cursorMode == 'fill' and activeTileMenu == 'Tile Sprites' and selectedTile:
                source_id = '-'.join(tile_data)
                tile_data[0] = str(selectedTile.getMetaData()["sprite_x"])
                tile_data[1] = str(selectedTile.getMetaData()["sprite_y"])
                new_id = '-'.join(tile_data)
                levelData.fillTiles(index, source_id, new_id, fill_indexes=(0, 2))
            elif cursorMode == 'fill' and activeTileMenu == 'Tile Ids' and selectedTile:
                source_id = '-'.join(tile_data)
                tile_data[2] = str(selectedTile.getMetaData()["id"])
                new_id = '-'.join(tile_data)
                levelData.fillTiles(index, source_id, new_id, fill_indexes=(2, cfg.TILE_ARRAY_SIZE))

            # Checks if there was a change made.
            if oldTileData != levelData.getTileData():
                self.parent.undoHistory.append(oldTileData)
                self.parent.redoHistory.clear()
                self.redrawLevel()

    # =====================
    # SCENE DRAWING METHODS
    # =====================
    def drawSelectOutline(self, painter):
        """Draws a rectangular outline of the nearest grid square.
        Used to indicate the grid square the cursor is currently hovering over.
        """
        topLeft = self.getNearestTopLeft(self.mousePos[0], self.mousePos[1])
        tileSize = cfg.TILESIZE

        painter.setPen(QColor(cfg.colors['light teal']))
        painter.drawRect(topLeft[0], topLeft[1], tileSize, tileSize)

    def drawCheckerGrid(self, painter):
        """Draws a pattern of grey and white squares into the scene.
        Used to represent transparency in the background.

        Precondition: self.parent.level is not None
        """
        mapSize = self.getMapSize()
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

                # Shifting it one makes it look less jarring. Not sure why the tiles
                # are off.
                painter.drawRect(x * tileSize - 1, y * tileSize - 1, tileWidth, tileHeight)


    def drawGrid(self, painter):
        """Draws a grid by drawing a series of lines into the scene.
        Precondition: self.grid is None and self.parent.level is not NOne
        """
        mapSize = self.getMapSize()
        width, height = mapSize[0], mapSize[1]

        painter.setPen(QColor(cfg.colors['cobalt']))
        tileSize = cfg.TILESIZE

        for y in range(round(height / tileSize) + 1):
            h_line = QLine(0, y * tileSize, width, y * tileSize)
            painter.drawLine(h_line)
            for x in range(round(width / tileSize) + 1):
                v_line = QLine(x * tileSize, 0, x * tileSize, height)
                painter.drawLine(v_line)

    def drawTileIds(self, painter):
        """Draws the tile id over the tiles in the level.
        """
        levelData = self.parent.getLevelData()
        tileData = levelData.getTileData()
        tileSize = cfg.TILESIZE

        buttons = self.parent.toolBar.tileTabMenu.getMenu('Tile Ids').buttonGroup.buttons()
        tile_pixmap = {btn.metaData['id']: btn.icon().pixmap(tileSize) for btn in buttons}
        painter.setOpacity(0.50)
        for index in range(len(tileData)):
            id = tileData[index].split('-')[-1]
            pos = levelData.getTilePos(index, tileSize)
            painter.drawPixmap(pos[0], pos[1], tile_pixmap[id])
        painter.setOpacity(1)

    def drawLevel(self):
        """Draws in the tiles of a level. Should only be called once
        everytime the level is updated.
        """
        levelData = self.parent.getLevelData()
        tileData = levelData.getTileData()
        tileSize = cfg.TILESIZE
        for index in range(len(tileData)):
            data = [int(n) for n in tileData[index].split('-')[:-1]]
            id = tileData[index].split('-')[-1]
            if id != cfg.EMPTY_TILE_ID:
                slice = QRect(data[0] * tileSize, data[1] * tileSize, tileSize, tileSize)
                tile = QPixmap(levelData.getSpriteURL()).copy(slice)
                pos = levelData.getTilePos(index, tileSize)

                self.scene().addPixmap(tile).setPos(pos[0], pos[1])

    def redrawLevel(self):
        self.clearScene(True)
        self.drawLevel()

class ToolBar(QWidget):
    def __init__(self, parent):
        super().__init__()
        self.parent = parent
        self.allCursorModes = parent.allCursorModes
        self.layout = QVBoxLayout()

        self.buttonGroup = QButtonGroup()
        self.buttonGroup.buttonClicked.connect(self.changeCursorMode)

        invShortcuts = {name: shortcut for shortcut, name in parent.cursorShortcuts.items()}
        self.drawBtn = ToolButton(cfg.icons['paint-brush'], 'draw', invShortcuts['draw'])
        self.drawBtn.setChecked(True)
        self.fillBtn = ToolButton(cfg.icons['fill'], 'fill', invShortcuts['fill'])
        self.eraseBtn = ToolButton(cfg.icons['eraser'], 'erase', invShortcuts['erase'])

        self.tileTabMenu = TileTabMenu(self)

        btns = [
            self.drawBtn,
            self.fillBtn,
            self.eraseBtn,
        ]

        self.buttons = {} # button reference.
        for b in btns:
            self.buttons[b.name] = b
            self.buttonGroup.addButton(b)
            self.layout.addWidget(b)

        # self.layout.addWidget(self.separator)
        self.layout.addWidget(self.tileTabMenu)
        self.setLayout(self.layout)

    def getCheckedButton(self):
        return self.buttonGroup.checkedButton()

    def changeCursorMode(self):
        btn = self.getCheckedButton()
        if btn.name in self.allCursorModes:
            self.parent.changeCursorMode(btn.name)

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

class TileTabMenu(QTabWidget):
    """Contains all the tile menus.
    """
    def __init__(self, parent):
        super().__init__()
        self.parent = parent
        self.spriteMenu = TileSpriteMenu()
        self.idMenu = TileIDMenu()
        self.currentChanged.connect(self.parent.parent.repaintMapView)

        self.tileMenus = {
            'Tile Sprites': self.spriteMenu,
            'Tile Ids': self.idMenu
        }

        for menu_name, menu in self.tileMenus.items():
            self.insertTab(-1, menu, menu_name) # Append the widgets.


    def getMenu(self, key):
        return self.tileMenus[key]

    def loadTiles(self, spriteURL):
        """Loads the tiles for all menus.
        """
        self.spriteMenu.loadTiles(spriteURL)
        self.idMenu.loadTiles()

    def clearTiles(self):
        """Clears the tiles for all menus.
        """
        for menu in self.tileMenus.values():
            menu.clearTiles()

    def getActiveMenu(self) -> Optional[str]:
        """Get the name of the currently active menu.
        """
        active = self.currentWidget()
        for menu_name, menu in self.tileMenus.items():
            if menu == active:
                return menu_name
        return None

    def getActiveSelection(self) -> Optional['TileButton']:
        """Get the currently selected tile of the active
        menu.
        """
        active = self.getActiveMenu()
        if active:
            return self.tileMenus[active].getSelectedTile()
        return None

class TileMenu(QScrollArea):
    """Base class for the tile menus.
    """
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

    def loadTiles(self):
        """Load the tiles into the tileMenu. Needs to be implemented
        individually.
        """
        pass

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

class TileSpriteMenu(TileMenu):
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
                metaData = {
                    "type": "sprite",
                    # Refers to the location of this tile's  sprite in its spriteSheet
                    "sprite_x": int(x / cfg.TILESIZE),
                    "sprite_y": int(y / cfg.TILESIZE)
                    }
                tile = TileButton(tileSprite, metaData)
                self.addTile(tile)
                col += 1

class TileIDMenu(TileMenu):
    def _createTileImage(self, tile_id: str, bg_color: Optional[str]) -> 'QPixmap':
        """Construct and return a pixmap representing the tile_id
        """
        width, height = cfg.TILESIZE, cfg.TILESIZE
        image = QPixmap(width, height)
        painter = QPainter(image)

        bg_color = QColor(cfg.tile_type_colors[tile_id])
        painter.setPen(bg_color)
        painter.setBrush(QBrush(bg_color, Qt.SolidPattern))
        painter.drawRect(0, 0, width, height)
        painter.setPen(QColor(cfg.colors['yellow']))
        painter.drawText(image.rect(), Qt.AlignCenter, tile_id)
        return image

    def loadTiles(self):
        """Load all the tile types into the tileMenu according
        to the types listed in cfg.py
        """
        for tile_id, tile_color in cfg.tile_type_colors.items():
            tileSprite = self._createTileImage(tile_id, tile_color)
            metaData = {
                "type": "id",
                "id": tile_id
                }
            tile = TileButton(tileSprite, metaData)
            self.addTile(tile)

class TileButton(QPushButton):
    def __init__(self, pixmap, metadata: dict):
        super().__init__()
        self.metaData = metadata

        self.setIcon(QIcon(pixmap))
        self.setIconSize(QSize(32, 32))
        self.setCheckable(True)

    def getMetaData(self):
        return self.metaData

class LevelMenuBar(QWidget):
    def __init__(self, parent):
        super().__init__()
        self.parent = parent
        self.layout = QHBoxLayout()

        self.levelSelectBox = LevelSelectBox(self)
        self.layout.addWidget(self.levelSelectBox)
        self.setLayout(self.layout)

    def enableLevelSelect(self):
        self.levelSelectBox.setEnabled(True)

    def disableLevelSelect(self):
        self.levelSelectBox.setEnabled(False)

    def updateLevelSelect(self, options):
        self.levelSelectBox.updateLevelSelect(options)

    def setLevel(self, levelName):
        """Handle the setting and clearing of levelData.
        """
        self.parent.clearLevel()
        levelData = self.parent.getLevelData()
        if self.isEnabled() and levelData and levelName:
            levelData.setCurrentLevel(levelName)
            mapSize = levelData.getMapSize(1, levelName)
            mapSize = ' {}x{} '.format(mapSize[0], mapSize[1])
            self.parent.loadLevel(levelName)
            self.parent.statusComponents['levelSize'].setText(mapSize)

class LevelSelectBox(QComboBox):
    def __init__(self, parent):
        super().__init__()
        self.parent = parent
        self.setDefault()
        self.currentIndexChanged.connect(self.setLevel)

    def setDefault(self):
        """Set the default properties.
        """
        self.clear()
        self.addItem("No level loaded")
        self.setEnabled(False)

    def updateLevelSelect(self, options: Tuple[str]):
        """Set the items based on options
        """
        self.clear()
        for o in options:
            self.addItem(o)

    def setLevel(self, index):
        selected = self.itemText(index)
        self.parent.setLevel(selected)

# =========================
# NEW LEVEL RELATED WIDGETS
# =========================
class NewLevelWindow(QDialog):
    def __init__(self, parent):
        super().__init__(parent)
        self.parent = parent
        self.setWindowTitle('Create a new level')
        self.setFixedSize(500, 175)
        self.setModal(True)
        self.setWindowFlags(self.windowFlags() & ~Qt.WindowContextHelpButtonHint)
        self.layout = QFormLayout()

        self.nameInput = QLineEdit()
        self.spriteInput = SpriteInput()
        self.widthInput = QLineEdit()
        self.heightInput = QLineEdit()
        self.submitButton = QPushButton('Create')
        self.submitButton.clicked.connect(self.createNewLevel)
        self.levelGroupBox = QCheckBox()

        self.layout.addRow(QLabel('Name: '), self.nameInput)
        self.layout.addRow(QLabel('Spritesheet: '), self.spriteInput)
        self.layout.addRow(QLabel('Width: '), self.widthInput)
        self.layout.addRow(QLabel('Height: '), self.heightInput)
        self.layout.addRow(QLabel('Create new level file? '), self.levelGroupBox)
        self.layout.addRow(self.submitButton)
        self.setLayout(self.layout)

    def _dataIsValid(self) -> bool:
        """Check to see if the data is valid.
        """
        text_inputs = [
            str(self.nameInput.text()).strip(),
            str(self.spriteInput.textInput.text()).strip(),
            str(self.widthInput.text()).strip(),
            str(self.heightInput.text()).strip(),
        ]

        for index in range(len(text_inputs)):
            i = text_inputs[index]
            if len(i.strip().replace(' ', '')) <= 0: # Check that content isn't empty
                return False
            elif index in (2, 3): # Check that the width and height inputs are integers.
                try:
                    int(i)
                except ValueError as e:
                    print(e)
                    return False
        return True


    def createNewLevel(self):
        if self._dataIsValid():
            levelName = str(self.nameInput.text())
            spriteSheet = str(self.spriteInput.textInput.text())
            width = int(self.widthInput.text())
            height = int(self.heightInput.text())

            if not self.levelGroupBox.isChecked() and self.parent.levelData is None:
                msg = 'Cannot add a new level to a preexisting file without a level file opened.'
                QMessageBox.information(None, ' ', msg)
                return

            self.parent.createLevelData(levelName, spriteSheet, width, height, newFile=self.levelGroupBox.isChecked(), newLevelDialog=self)

        else:
            msg = 'Incorrect input detected. Please ensure level information is correct and try again.'
            QMessageBox.information(None, ' ', msg)


class SpriteInput(QWidget):
    def __init__(self):
        super().__init__()
        self.layout = QHBoxLayout()
        self.layout.setContentsMargins(0, 0, 0, 0)
        self.textInput = QLineEdit()
        self.browseBtn = QPushButton('Browse')
        self.browseBtn.clicked.connect(self.getSpriteSheet)

        self.layout.addWidget(self.textInput)
        self.layout.addWidget(self.browseBtn)
        self.setLayout(self.layout)

    def getSpriteSheet(self):
        directory = cfg.sprite_dir if cfg.SETTINGS['inRepo'] else cfg.data_dir
        path = QFileDialog.getOpenFileName(None, 'Choose a level spritesheet', directory, 'PNG (*.png)')[0]
        filename = get_filename_from_path(path).replace('.png', '')
        self.textInput.setText(filename)
