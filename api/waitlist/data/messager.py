import queue
from threading import Thread, Lock
from typing import List, Tuple, Set, Dict, Any
import json

MessageType = Tuple[str, str]
Instruction = Tuple[str, Any]


class MessageWorker:
    def __init__(self) -> None:
        self.queue: "queue.Queue[Instruction]" = queue.Queue(256)

    def start(self) -> None:
        Thread(target=self.run).start()

    def end(self) -> None:
        self.queue.put(("break", None))

    def run(self) -> None:
        by_id: Dict[int, Tuple["queue.Queue[MessageType]", List[str]]] = {}
        by_bucket: Dict[str, Set["queue.Queue[MessageType]"]] = {}

        while True:
            action, args = self.queue.get()
            if action == "send":
                buckets, message = args
                for bucket in buckets:
                    if not bucket in by_bucket:
                        continue
                    for bus in by_bucket[bucket]:
                        try:
                            bus.put_nowait(message)
                        except queue.Full:
                            pass  # Okay whatever

            elif action == "subscribe":
                queue_id, bus, buckets = args
                by_id[queue_id] = (bus, buckets)
                for bucket in buckets:
                    by_bucket.setdefault(bucket, set()).add(bus)

            elif action == "unsubscribe":
                queue_id = args
                bus, buckets = by_id[
                    queue_id
                ]  # Should never error unless we unsubscribe twice
                del by_id[queue_id]

                for bucket in buckets:
                    by_bucket[bucket].remove(bus)
                    if not by_bucket[bucket]:
                        del by_bucket[bucket]

            elif action == "end":
                break

    def put(self, item: Instruction) -> None:
        self.queue.put_nowait(item)


class Messager:
    def __init__(self) -> None:
        self.queue_id = 0
        self.id_lock = Lock()
        self.worker = MessageWorker()
        self.worker.start()

    def subscribe(self, buckets: List[str]) -> Tuple[int, "queue.Queue[MessageType]"]:
        bus: "queue.Queue[MessageType]" = queue.Queue(5)

        with self.id_lock:
            queue_id = self.queue_id
            self.queue_id = self.queue_id + 1

        self.worker.put(("subscribe", (queue_id, bus, buckets)))
        return queue_id, bus

    def unsubscribe(self, queue_id: int) -> None:
        self.worker.put(("unsubscribe", queue_id))

    def send(self, buckets: List[str], event: str, data: str) -> None:
        self.worker.put(("send", (buckets, (event, data))))

    def send_json(self, buckets: List[str], event: str, data: Any) -> None:
        return self.send(buckets, event, json.dumps(data))


MESSAGER = Messager()
