# =============================================================
# data.py contains all classes representing in-game structures.
# basically contains all the non-widget stuff.
# =============================================================
from typing import Tuple, Optional, List
import math
from . import cfg

class LevelData:
    def __init__(self, file: dict):
        self.levelJson = file
        self.currentLevel = list(file[cfg.LEVEL_KEY].keys())[0] # This is the name of the first level in dictionary.

    def _getDefaultName(self, levelName: Optional[str]) -> str:
        """Return self.currentLevel if levelName is None otherwise
        return levelName as it already is.
        """
        if levelName is None:
            return self.currentLevel
        return levelName

    def getMapSize(self, tileSize: int, levelName=None) -> tuple:
        """ Return the dimensions of the level / map in pixels.
        """
        levelName = self._getDefaultName(levelName)
        width = self.getLevel(levelName)["width"]
        height = self.getLevel(levelName)["height"]
        return width * tileSize, height * tileSize

    def getTilePos(self, index: int, tileSize: int, levelName=None) -> tuple:
        """Return the true position of a particular tile.
        """
        levelName = self._getDefaultName(levelName)
        array_width = self.getLevel(levelName)["width"]
        pos = self.get2DFrom1D(index, array_width)
        x = pos[0]
        y = pos[1]
        return x * tileSize, y * tileSize

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

    def get1DFrom2D(self, x: int, y: int, array_width: int) -> int:
        """Convert the coords of a 2d array to its 1d index equivalent.

        A direction translation of js-roguelite's
        convertCoordsToIndex() in engine.js
        """
        return (y * array_width) + x

    def getLevelJson(self) -> str:
        return self.levelJson

    def getLevel(self, levelName=None) -> dict:
        """Return the dictionary of a particular level in levelData

        if levelName is set to false, it will return the currently
        set level.
        """
        levelName = self._getDefaultName(levelName)
        return self.levelJson[cfg.LEVEL_KEY][levelName]

    def getLevelNames(self) -> Tuple[str]:
        """Return the names of all levels in the file.
        """
        return tuple(self.levelJson[cfg.LEVEL_KEY].keys())

    def getSpriteURL(self, levelName=None) -> str:
        """Return the url of the specified level's spritesheet
        """
        levelName = self._getDefaultName(levelName)
        spriteSheet = self.getLevel(levelName)["spriteSheet"]
        return cfg.get_assetURL(cfg.sprite_dir, spriteSheet, '.png')

    def getTileData(self, levelName=None) -> list:
        levelName = self._getDefaultName(levelName)
        return self.getLevel(levelName)["tileData"]

    def getWidth(self, levelName=None) -> int:
        levelName = self._getDefaultName(levelName)
        return self.getLevel(levelName)["width"]

    def getHeight(self, levelName=None) -> int:
        levelName = self._getDefaultName(levelName)
        return self.getLevel(levelName)["height"]

    def setCurrentLevel(self, levelName: str):
        self.currentLevel = levelName

    # ==========================
    # LEVEL MANIPULATION METHODS
    # ==========================
    def setWidth(self, new_width: int, levelName=None):
        levelName = self._getDefaultName(levelName)
        self.getLevel(levelName)["width"] = new_width

    def setHeight(self, new_height: int, levelName=None):
        levelName = self._getDefaultName(levelName)
        self.getLevel(levelName)["height"] = new_height

    def setTileData(self, tile_data: List[str], levelName=None):
        """Set self.levelJson["tileData"] = tile_data

        Precondition: tile_data is properly formatted.
        """
        self.getLevel(levelName)["tileData"] = tile_data

    def setTile(self, tile_index: int, new_id: str, levelName=None):
        level = self.getLevel(levelName)
        level["tileData"][tile_index] = new_id

    def eraseTile(self, tile_index: int, levelName=None):
        empty_id = '0-0-{}'.format(cfg.EMPTY_TILE_ID)
        self.setTile(tile_index, empty_id, levelName)

    def fillTiles(self, tile_index: int, new_id: str, levelName=None, fill_indexes=(0, cfg.TILE_ARRAY_SIZE)):
        """Recursively fill the tiles of the array.

        levelName is an optional parameter to specify the level being filled. (default is active level).

        fill_indexes is an optional pair of integers in the format (start, end)
        that tells the function to only checks and replaces within those indexes.

        If fill_indexes is not specified then the function just checks that the
        full ids are equal.
        """
        array_width, array_height = self.getMapSize(1)
        fill_start, fill_end = fill_indexes
        source_id = None
        new_id = new_id.split('-')

        in_map = lambda x, y : 0 <= x and x < array_width and 0 <= y and y < array_height
        can_fill = lambda source_id, tile_id : source_id[fill_start:fill_end] == tile_id[fill_start:fill_end]
        get_id = lambda levelName, tile_index : self.getTileData(levelName)[tile_index].split('-')

        stack = [tile_index]
        history = set()

        while stack:

            tile_index = stack.pop()
            tile_id = get_id(levelName, tile_index)
            if source_id is None:
                source_id = tile_id.copy()
                # Filling empty tiles are a special case.
                if source_id[2] == cfg.EMPTY_TILE_ID:
                    can_fill = lambda source_id, tile_id : source_id[2] == tile_id[2]
                    fill_start, fill_end = (0, cfg.TILE_ARRAY_SIZE)

            # We only replace indexes specified in fill_indexes
            tile_id[fill_start:fill_end] = new_id[fill_start:fill_end]
            tile_id = '-'.join(tile_id)

            self.setTile(tile_index, tile_id, levelName)

            x, y = self.get2DFrom1D(tile_index, array_width)
            history.add((x, y))

            adjacents = [(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)]
            for pos in adjacents:
                if pos not in history and in_map(pos[0], pos[1]):
                    tile_index = self.get1DFrom2D(pos[0], pos[1], array_width)
                    tile_id = get_id(levelName, tile_index)
                    if can_fill(source_id, tile_id):
                        stack.append(tile_index)

    def resizeTileArray(self, anchorPoint: str, newWidth: int, newHeight: int):
        #These are variables needed to resize the level
        anchorPointSplit = anchorPoint.split()
        tiles = self.getTileData()
        width = self.getWidth()
        height = self.getHeight()
        changeHeight = newHeight - height
        changeWidth = newWidth - width

        #Resize the height first, resizing from the middle is done by resizing the top then bottom
        if anchorPointSplit[0].capitalize() == "Middle":
            addTop = math.ceil(changeHeight / 2)
            addBottom = (changeHeight // 2)
            if changeHeight < 0:
                addTop, addBottom = addBottom, addTop
            topHeight = height + addTop
            newTiles = self.resizeArray("Top", addTop, width, topHeight, tiles)
            bottomHeight = height + addBottom
            newTiles = self.resizeArray("Bottom", addBottom, width, bottomHeight, newTiles)
        else:
            newTiles = self.resizeArray(anchorPointSplit[0], changeHeight, width, newHeight, tiles)
        self.setHeight(newHeight)

        #Resize the width, resizing from the centre is done by resizing left then right
        if anchorPointSplit[1].capitalize() == "Centre":
            addRight = (changeWidth // 2)
            addLeft = math.ceil(changeWidth / 2)
            if changeWidth < 0:
                addRight, addLeft = addLeft, addRight
            leftWidth = width + addLeft
            newTiles = self.resizeArray("Left", addLeft, newHeight, leftWidth, newTiles)
            rightWidth = width + addRight + addLeft
            newTiles = self.resizeArray("Right", addRight, newHeight, rightWidth, newTiles)
        else:
            newTiles = self.resizeArray(anchorPointSplit[1], changeWidth, newHeight, newWidth, tiles)
        self.setWidth(newWidth)

        #Replace tiles
        self.setTileData(newTiles)

    def resizeArray(self, anchorPoint: str, changeDim: int, dimension: int, newDim: int, tiles: list):
        #Create new array of new size
        newSize = dimension * newDim
        changeDifference = dimension * changeDim
        newTiles = [None] * (newSize)

        #Check which side of level we are added tiles to
        if anchorPoint.capitalize() == "Top":
            newTiles[:len(tiles)] = tiles
            newTiles[len(tiles):] = ['0-0-{}'.format(cfg.EMPTY_TILE_ID)] * changeDifference
        elif anchorPoint.capitalize() == "Bottom":
            newTiles[:changeDifference] = ['0-0-{}'.format(cfg.EMPTY_TILE_ID)] * changeDifference
            if changeDifference < 0:
                newTiles[changeDifference:] = tiles[abs(changeDifference):]
            else:
                newTiles[changeDifference:] = tiles
        elif anchorPoint.capitalize() == "Right":
            for i in range(newSize):
                if i % newDim < changeDim:
                    newTiles[i] = '0-0-{}'.format(cfg.EMPTY_TILE_ID)
                elif changeDim > 0:
                    newTiles[i] = tiles[i - abs(changeDim) * ((i // newDim) + 1)]
                else:
                    newTiles[i] = tiles[i + abs(changeDim) * ((i // newDim) + 1)]
        else:
            for i in range(newSize):
                if i % newDim >= newDim - changeDim:
                    newTiles[i] = '0-0-{}'.format(cfg.EMPTY_TILE_ID)
                elif changeDim > 0:
                    newTiles[i] = tiles[i - abs(changeDim) * (i // newDim)]
                else:
                    newTiles[i] = tiles[i + abs(changeDim) * (i // newDim)]
        return newTiles

class AbstractTile:
    """An abstract tile class.
    """
    def __init__(self, metaData: dict):
        self.metaData = metaData

    def getMetaData(self):
        return self.metaData
