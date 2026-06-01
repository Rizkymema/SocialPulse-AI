import os
import sys

sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.utils.comments import (
    normalize_comment_text,
    comment_identity,
    canonicalize_comment,
    merge_raw_comments,
    comments_from_row,
    merge_post_comment_state,
)

def test_normalize_comment_text():
    assert normalize_comment_text("  hello   world  ") == "hello world"
    assert normalize_comment_text(None) == ""
    print("OK - test_normalize_comment_text passed")

def test_comment_identity():
    c1 = {"id": "1", "parent": "root", "author": "user1", "timestamp": "123", "text": "Hello!"}
    c2 = {"id": "1", "parent": "root", "author": "user1", "timestamp": "123", "text": "hello!  "}
    assert comment_identity(c1) == comment_identity(c2)
    print("OK - test_comment_identity passed")

def test_canonicalize_comment():
    raw = {"id": "1", "text": "   Some text  ", "timestamp": "1620000000", "like_count": "10", "parent": ""}
    canonical = canonicalize_comment(raw)
    assert canonical["text"] == "Some text"
    assert canonical["timestamp"] == 1620000000
    assert canonical["like_count"] == 10
    assert canonical["parent"] == "root"
    print("OK - test_canonicalize_comment passed")

def test_merge_raw_comments():
    group1 = [
        {"id": "1", "text": "Comment 1", "timestamp": 1000},
        {"id": "2", "text": "Comment 2", "timestamp": 2000},
    ]
    group2 = [
        {"id": "2", "text": "Comment 2", "timestamp": 2000}, # duplicate
        {"id": "3", "text": "Comment 3", "timestamp": 3000},
    ]
    merged = merge_raw_comments(group1, group2)
    assert len(merged) == 3
    assert merged[0]["id"] == "1"
    assert merged[1]["id"] == "2"
    assert merged[2]["id"] == "3"
    print("OK - test_merge_raw_comments passed")

def test_merge_post_comment_state():
    existing = {
        "comments": 5,
        "scraped_comments_count": 2,
        "raw_data": {
            "comments": [
                {"id": "1", "text": "Old comment 1"},
                {"id": "2", "text": "Old comment 2"},
            ]
        }
    }
    latest = {
        "comments": 10,
        "raw_data": {
            "comments": [
                {"id": "2", "text": "Old comment 2"}, # duplicate
                {"id": "3", "text": "New comment 3"},
            ]
        }
    }
    merged = merge_post_comment_state(existing, latest)
    assert merged["comments"] == 10
    assert merged["scraped_comments_count"] == 3
    assert len(merged["raw_data"]["comments"]) == 3
    ids = [c["id"] for c in merged["raw_data"]["comments"]]
    assert "1" in ids
    assert "2" in ids
    assert "3" in ids
    print("OK - test_merge_post_comment_state passed")

def main():
    print("Running comments unit tests...")
    test_normalize_comment_text()
    test_comment_identity()
    test_canonicalize_comment()
    test_merge_raw_comments()
    test_merge_post_comment_state()
    print("All tests passed successfully!")

if __name__ == "__main__":
    main()
