from chord.logger import Logger


def test_log_insert():
    logger = Logger()
    logger.log_insert("apple", 7)

    logs = logger.get_logs()
    assert len(logs) == 1
    assert logs[0]["event"] == "INSERT"
    assert logs[0]["data"]["key"] == "apple"
    assert logs[0]["data"]["node_id"] == 7


def test_log_lookup():
    logger = Logger()
    logger.log_lookup("banana", [7, 12, 21], 3)

    logs = logger.get_logs()
    assert len(logs) == 1
    assert logs[0]["event"] == "LOOKUP"
    assert logs[0]["data"]["key"] == "banana"
    assert logs[0]["data"]["path"] == [7, 12, 21]
    assert logs[0]["data"]["hop_count"] == 3


def test_log_join_and_leave():
    logger = Logger()
    logger.log_join(11)
    logger.log_leave(11)

    logs = logger.get_logs()
    assert len(logs) == 2
    assert logs[0]["event"] == "JOIN"
    assert logs[1]["event"] == "LEAVE"


def test_clear_logs():
    logger = Logger()
    logger.log_insert("x", 2)
    logger.clear()

    assert logger.get_logs() == []


def test_write_to_file(tmp_path):
    log_path = tmp_path / "events.txt"
    logger = Logger(log_file=log_path)

    logger.log_join(42)

    assert log_path.exists()
    content = log_path.read_text(encoding="utf-8")
    assert "JOIN" in content
    assert "42" in content