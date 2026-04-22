from pathlib import Path
from datetime import datetime


class Logger:
    def __init__(self, log_file=None):
        self.logs = []
        self.log_file = Path(log_file) if log_file else None

    def _timestamp(self):
        return datetime.now().isoformat(timespec="seconds")

    def _save(self, event, **data):
        entry = {
            "event": event,
            "timestamp": self._timestamp(),
            "data": data,
        }
        self.logs.append(entry)

        if self.log_file:
            self.log_file.parent.mkdir(parents=True, exist_ok=True)
            with self.log_file.open("a", encoding="utf-8") as f:
                f.write(f"{entry['timestamp']} | {entry['event']} | {entry['data']}\n")

    def log_insert(self, key, node_id):
        self._save("INSERT", key=key, node_id=node_id)

    def log_lookup(self, key, path, hop_count):
        self._save("LOOKUP", key=key, path=path, hop_count=hop_count)

    def log_join(self, node_id):
        self._save("JOIN", node_id=node_id)

    def log_leave(self, node_id):
        self._save("LEAVE", node_id=node_id)

    # aliases for compatibility
    def record_insert(self, key, node_id):
        self.log_insert(key, node_id)

    def record_lookup(self, key, path, hops):
        self.log_lookup(key, path, hops)

    def record_join(self, node_id):
        self.log_join(node_id)

    def record_leave(self, node_id):
        self.log_leave(node_id)

    def get_logs(self):
        return self.logs

    def clear(self):
        self.logs.clear()


log = Logger()