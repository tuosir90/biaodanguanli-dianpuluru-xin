from __future__ import annotations

import os
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import dev_server


class VerifyWebEnvTests(unittest.TestCase):
    def _write_env(self, directory: str, mongodb_uri: str) -> None:
        env_path = Path(directory) / ".env.local"
        env_path.write_text(f"MONGODB_URI={mongodb_uri}\n", encoding="utf-8")

    def test_rejects_wrong_database_name_in_env_file(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            self._write_env(
                temp_dir,
                "mongodb://root:secret@dbconn.sealosbja.site:39056/otherdb?directConnection=true",
            )

            with patch.object(dev_server, "WEB_DIR", Path(temp_dir)):
                with patch.dict(os.environ, {}, clear=False):
                    with self.assertRaisesRegex(RuntimeError, "数据库名"):
                        dev_server.verify_web_env()

    def test_rejects_wrong_database_name_in_system_env_override(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            self._write_env(
                temp_dir,
                "mongodb://root:secret@dbconn.sealosbja.site:39056/test?directConnection=true",
            )

            with patch.object(dev_server, "WEB_DIR", Path(temp_dir)):
                with patch.dict(
                    os.environ,
                    {
                        "MONGODB_URI": (
                            "mongodb://root:secret@dbconn.sealosbja.site:39056/"
                            "otherdb?directConnection=true"
                        )
                    },
                    clear=False,
                ):
                    with self.assertRaisesRegex(RuntimeError, "数据库名"):
                        dev_server.verify_web_env()


if __name__ == "__main__":
    unittest.main()
