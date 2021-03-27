#!/usr/bin/env python3

# ==============================================================
# Use this script to quickly run a local server for playtesting.
#
# Optionally accepts a port as an argument. If no additional
# arguments are passed it will just default to 8000.
# ==============================================================
import subprocess, os, sys, socket

def main():
    repo_dir = os.path.abspath(os.path.join(os.path.dirname( __file__ ), '..', 'src'))
    errors = []

    if len(sys.argv) > 1 and sys.argv[1].isdigit():
        port = sys.argv[1]
    else:
        port = '8000'

    args = ['python', '-m', 'http.server', '-d', repo_dir, port]

    print(f'Starting local server at port {port}...')
    try:
        subprocess.run(args)
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.connect_ex(('127.0.0.1',port))
    except Exception as e:
        errors.append(e)
        print('Failed to start server with python. Trying python3...')
        args[0] = 'python3'
        try:
            subprocess.run(args)
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.connect_ex(('127.0.0.1',port))
        except Exception as e:
            errors.append(e)
            print('Failed to start with python3. Printing error messages...')
            for e in errors:
                print(e, '\n')

if __name__ == '__main__':
    main()
