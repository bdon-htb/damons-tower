from Code import widgets, cfg
from PyQt5.QtWidgets import QApplication
import sys

def main():
    app = QApplication(sys.argv)
    window = widgets.MainWindow(app)
    window.show()
    sys.exit(app.exec_())

if __name__ == '__main__':
    main()
