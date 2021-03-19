# =============================================================
# data.py contains all classes representing in-game structures.
# basically contains all the non-widget stuff.
# =============================================================
from typing import Tuple, Optional
import math
from . import cfg

class LevelData:
    def __init__(self, file: dict, filename: str):

        if filename.endswith('.json'):
            filename = filename.replace('.json', '') # Trim off .json extension just in case.

        self.filename = filename
        self.levelJson = file
        self.currentLevel = list(file["levelData"].keys())[0] # This is the name of the first level in dictionary.

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

    def getFileName(self) -> str:
        return self.filename

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
        return self.levelJson["levelData"][levelName]

    def getLevelNames(self) -> Tuple[str]:
        """Return the names of all levels in the file.
        """
        return tuple(self.levelJson["levelData"].keys())

    def getSpriteURL(self, levelName=None) -> str:
        """Return the url of the specified level's spritesheet
        """
        levelName = self._getDefaultName(levelName)
        spriteSheet = self.getLevel(levelName)["spriteSheet"]
        return cfg.get_assetURL(cfg.sprite_dir, spriteSheet, '.png')

    def getTileData(self, levelName=None) -> list:
        levelName = self._getDefaultName(levelName)
        return self.getLevel(levelName)["tileData"]

    def setCurrentLevel(self, levelName: str):
        self.currentLevel = levelName

    # ==========================
    # LEVEL MANIPULATION METHODS
    # ==========================
    def setTile(self, tile_index: int, new_id: str, levelName=None):
        level = self.getLevel(levelName)
        level["tileData"][tile_index] = new_id

    def eraseTile(self, tile_index: int, levelName=None):
        empty_id = '0-0-{}'.format(cfg.EMPTY_TILE_ID)
        self.setTile(tile_index, empty_id, levelName)

    def fillTiles(self, tile_index: int, source_id: str, new_id: str, levelName=None, fill_indexes=None):
        """Recursively fill the tiles of the array.

        fill_indexes is an optional pair of integers in the format (start, end)
        that tells the function to only check if source_id and tile_id are equal
        within those indexes (the indexes are split by the hyphens '-').

        If fill_indexes is not specified then the function just checks that the
        full ids are equal.
        """

        tile_id = self.getTileData(levelName)[tile_index]
        tile_id = tile_id.split('-')
        source_id = source_id.split('-')
        new_id = new_id.split('-')

        if fill_indexes: # Assume fill_indexes is a tuple.
            start, end = fill_indexes
            can_fill = (source_id[start:end] == tile_id[start:end])

            # We only replace indexes specified in fill_indexes
            replacement_tile = tile_id.copy()
            replacement_tile[start:end] = new_id[start:end]
            replacement_tile = '-'.join(replacement_tile)
        else:
            can_fill = (source_id == tile_id)
            replacement_tile = new_id

        tile_id = '-'.join(tile_id)
        source_id = '-'.join(source_id)
        new_id = '-'.join(new_id)

        array_width, array_height = self.getMapSize(1)
        x, y = self.get2DFrom1D(tile_index, array_width)
        if source_id != new_id and can_fill:
            self.setTile(tile_index, replacement_tile, levelName)
            if y - 1 >= 0:
                index_above = self.get1DFrom2D(x, y - 1, array_width)
                self.fillTiles(index_above, source_id, new_id, levelName, fill_indexes)
            if x + 1 <= array_width - 1:
                index_right = self.get1DFrom2D(x + 1, y, array_width)
                self.fillTiles(index_right, source_id, new_id, levelName, fill_indexes)
            if y + 1 <= array_height - 1:
                index_below = self.get1DFrom2D(x, y + 1, array_width)
                self.fillTiles(index_below, source_id, new_id, levelName, fill_indexes)
            if x - 1 >= 0:
                index_left = self.get1DFrom2D(x - 1, y, array_width)
                self.fillTiles(index_left, source_id, new_id, levelName, fill_indexes)
