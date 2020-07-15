from kivy.app import App
from kivy.uix.button import Button
from kivy.uix.boxlayout import BoxLayout
from kivy.uix.spinner import Spinner
from kivy.clock import Clock

# Generic custom widgets
class CustomSpinner(Spinner):
    def __init__(self, **kwargs):
        super(CustomSpinner, self).__init__(**kwargs)
        self.name_set = False
        self.current_value = None
        self.methods = {} # A dictionary of values and their respective function call.

    def get_value(self):
        return self.current_value

    def _on_dropdown_select(self, instance, data, *largs):
        self.current_value = data
        self.is_open = False
        if self.current_value in self.methods:
            self.methods[self.current_value]()

# Level Editor specific widgets.
class MainApp(App):
    def build(self):
        return MainWindow()

class MainWindow(BoxLayout):
    pass

class FileMenu(BoxLayout):
    def new_file(self, *args):
        print('YO')

class MapCanvas(BoxLayout):
    pass

class MapDataView(BoxLayout):
    pass
