"""
ユーティリティモジュールのテスト
"""

import json
import pytest
from io import StringIO
from unittest.mock import patch

from src.utils.output import output_result, output_error


class TestOutputResult:
    """output_resultのテスト"""

    def test_正常な結果を出力できる(self):
        with patch("sys.stdout", new_callable=StringIO) as mock_stdout:
            output_result({"games": [{"id": 1}]})
            output = mock_stdout.getvalue()
            parsed = json.loads(output)

            assert "fetched_at" in parsed
            assert "games" in parsed
            assert len(parsed["games"]) == 1

    def test_エラー付きの結果を出力できる(self):
        with patch("sys.stdout", new_callable=StringIO) as mock_stdout:
            errors = [{"source": "test", "message": "テストエラー"}]
            output_result({"status": "error"}, errors)
            output = mock_stdout.getvalue()
            parsed = json.loads(output)

            assert "errors" in parsed
            assert len(parsed["errors"]) == 1
            assert parsed["errors"][0]["source"] == "test"

    def test_日本語が正しく出力される(self):
        with patch("sys.stdout", new_callable=StringIO) as mock_stdout:
            output_result({"message": "横浜エクセレンス"})
            output = mock_stdout.getvalue()

            assert "横浜エクセレンス" in output


class TestOutputError:
    """output_errorのテスト"""

    def test_エラーメッセージをstderrに出力する(self):
        with patch("sys.stderr", new_callable=StringIO) as mock_stderr:
            output_error("テストエラー", "test_source")
            output = mock_stderr.getvalue()
            parsed = json.loads(output)

            assert parsed["error"] is True
            assert parsed["message"] == "テストエラー"
            assert parsed["source"] == "test_source"
            assert "timestamp" in parsed
