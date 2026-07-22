from pydantic import BaseModel


class GraphNode(BaseModel):
    id: str
    label: str
    display_name: str


class GraphEdge(BaseModel):
    source_id: str
    target_id: str
    rel_type: str
    edge_label: str | None


class Graph(BaseModel):
    nodes: list[GraphNode]
    edges: list[GraphEdge]
