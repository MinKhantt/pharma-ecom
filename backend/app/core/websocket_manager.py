from fastapi import WebSocket
from uuid import UUID
import json


class ConnectionManager:
    def __init__(self):
        # conversation_id -> list of websockets (customer in that conversation)
        self.conversation_connections: dict[str, list[WebSocket]] = {}
        # admin user_id -> websocket (admin connected after login)
        self.admin_connections: dict[str, WebSocket] = {}

    # ── Admin ─────────────────────────────────────────────────────────────────

    async def connect_admin(self, admin_id: UUID, websocket: WebSocket):
        await websocket.accept()
        self.admin_connections[str(admin_id)] = websocket

    def disconnect_admin(self, admin_id: UUID):
        self.admin_connections.pop(str(admin_id), None)

    # ── Customer ──────────────────────────────────────────────────────────────

    async def connect_customer(self, conversation_id: UUID, websocket: WebSocket):
        await websocket.accept()
        key = str(conversation_id)
        if key not in self.conversation_connections:
            self.conversation_connections[key] = []
        self.conversation_connections[key].append(websocket)

    def disconnect_customer(self, conversation_id: UUID, websocket: WebSocket):
        key = str(conversation_id)
        if key in self.conversation_connections:
            self.conversation_connections[key].remove(websocket)
            if not self.conversation_connections[key]:
                del self.conversation_connections[key]

    # ── Broadcast ─────────────────────────────────────────────────────────────

    async def send_to_conversation(self, conversation_id: UUID, payload: dict):
        """Send message to all websockets in a conversation (customer side)."""
        key = str(conversation_id)
        disconnected = []
        for ws in self.conversation_connections.get(key, []):
            try:
                await ws.send_text(json.dumps(payload, default=str))
            except Exception:
                disconnected.append(ws)
        for ws in disconnected:
            self.conversation_connections[key].remove(ws)

    async def send_to_admin(self, admin_id: UUID, payload: dict):
        """Send message to a specific admin."""
        ws = self.admin_connections.get(str(admin_id))
        if ws:
            try:
                await ws.send_text(json.dumps(payload, default=str))
            except Exception:
                self.disconnect_admin(admin_id)

    async def broadcast_to_all_admins(self, payload: dict):
        """Send message to ALL connected admins."""
        disconnected = []
        for admin_id, ws in self.admin_connections.items():
            try:
                await ws.send_text(json.dumps(payload, default=str))
            except Exception:
                disconnected.append(admin_id)
        for admin_id in disconnected:
            self.admin_connections.pop(admin_id, None)


manager = ConnectionManager()
