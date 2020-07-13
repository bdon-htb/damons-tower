from kivy.app import App
from kivy.uix.boxlayout import BoxLayout
from kivy.uix.dropdown import DropDown

# Level Editor specific widgets.
class MainApp(App):
    def build(self):
        return MainWindow()

class MainWindow(BoxLayout):
    pass

class FileDropDown(DropDown):
    pass

class FileMenu(BoxLayout):
    '''dropdown_menus data format:
        name: [object, is_open]
    '''
    filedropdown = FileDropDown()

class MapCanvas(BoxLayout):
    pass

class MapDataView(BoxLayout):
    pass
