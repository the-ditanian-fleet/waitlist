import queue
from threading import Lock
from typing import List, Tuple, Set, Dict, Any
import json

MessageType = Tuple[str, str]


class Messager:
    def __init__(self) -> None:
        self.queue_id = 0
        self.lock = Lock()
        self.queues: Dict[int, Tuple["queue.Queue[MessageType]", List[str]]] = {}
        self.by_bucket: Dict[str, Set["queue.Queue[MessageType]"]] = {}

    def subscribe(self, buckets: List[str]) -> Tuple[int, "queue.Queue[MessageType]"]:
        bus: "queue.Queue[MessageType]" = queue.Queue()

        with self.lock:
            queue_id = self.queue_id
            self.queue_id = self.queue_id + 1
            self.queues[queue_id] = (bus, [*buckets])
            for bucket in buckets:
                self.by_bucket.setdefault(bucket, set()).add(bus)

        return queue_id, bus

    def unsubscribe(self, queue_id: int) -> None:
        with self.lock:
            bus, buckets = self.queues[queue_id]
            del self.queues[queue_id]
            for bucket in buckets:
                self.by_bucket[bucket].remove(bus)
                if not self.by_bucket[bucket]:
                    del self.by_bucket[bucket]

    def send(self, buckets: List[str], event: str, data: str) -> None:
        targets = set()
        with self.lock:
            for bucket in buckets:
                targets |= self.by_bucket.get(bucket, set())
        for bus in targets:
            try:
                bus.put_nowait((event, data))
            except queue.Full:
                pass

    def send_json(self, buckets: List[str], event: str, data: Any) -> None:
        return self.send(buckets, event, json.dumps(data))


MESSAGER = Messager()
