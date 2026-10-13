"""Publication safety: immutable versions and ambiguous failures."""

from copy import deepcopy
from pathlib import Path
import subprocess
import unittest
from unittest.mock import patch

import manage


class PublicationTests(unittest.TestCase):
    def setUp(self):
        self.manifest = {'name': 'io.github.example/task', 'version': '1.0.0',
                         'description': 'A task', 'packages': [{'identifier': 'task.mcpb'}]}
        self.response = {'server': deepcopy(self.manifest),
                         '_meta': {manage.OFFICIAL_META: {'status': 'active'}}}

    def test_existing_identical_version_is_not_republished(self):
        with patch.object(manage, 'read_json', return_value=self.response), patch.object(manage.subprocess, 'run') as run:
            result = manage.publish_one(Path('server.json'), self.manifest, 'publisher')
            self.assertEqual(result['action'], 'already-published')
            run.assert_not_called()

    def test_changed_existing_version_is_rejected(self):
        self.response['server']['description'] = 'Different content'
        with patch.object(manage, 'read_json', return_value=self.response), patch.object(manage.subprocess, 'run') as run:
            with self.assertRaises(ValueError):
                manage.publish_one(Path('server.json'), self.manifest, 'publisher')
            run.assert_not_called()

    def test_failed_preflight_does_not_publish(self):
        with patch.object(manage, 'read_json', side_effect=TimeoutError), patch.object(manage.subprocess, 'run') as run:
            with self.assertRaises(TimeoutError):
                manage.publish_one(Path('server.json'), self.manifest, 'publisher')
            run.assert_not_called()

    def test_new_version_requires_successful_readback(self):
        with patch.object(manage, 'read_json', side_effect=[None, self.response]), patch.object(manage.subprocess, 'run') as run:
            result = manage.publish_one(Path('server.json'), self.manifest, 'publisher')
            self.assertEqual(result['action'], 'published')
            run.assert_called_once()
        self.response['server']['remotes'] = [{'type': 'streamable-http', 'url': 'https://example.com/mcp'}]
        with self.assertRaises(ValueError):
            manage.verify(self.manifest, self.response)

    def test_failed_write_is_not_automatically_retried(self):
        with patch.object(manage, 'read_json', return_value=None), patch.object(manage.subprocess, 'run', side_effect=subprocess.CalledProcessError(1, 'publisher')) as run:
            with self.assertRaises(subprocess.CalledProcessError):
                manage.publish_one(Path('server.json'), self.manifest, 'publisher')
            run.assert_called_once()


if __name__ == '__main__':
    unittest.main()
