import argparse
from dotenv import load_dotenv
from .core import Request, Vinta


def main():
    load_dotenv()
    parser = argparse.ArgumentParser(description='Vinta — Ara OS 12')
    parser.add_argument('action', choices=['write', 'summarize', 'translate', 'rewrite', 'adapt', 'chat'])
    parser.add_argument('text')
    parser.add_argument('--target-language')
    parser.add_argument('--user-id', default='default')
    parser.add_argument('--instructions')
    args = parser.parse_args()
    result = Vinta().process(Request(action=args.action, text=args.text, user_id=args.user_id, target_language=args.target_language, instructions=args.instructions))
    print(result.result)


if __name__ == '__main__':
    main()
