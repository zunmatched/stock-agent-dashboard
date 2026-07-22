from fastapi import APIRouter

from app.queries import graph as q
from app.schemas.graph import Graph

router = APIRouter(prefix="/api/graph", tags=["graph"])


@router.get("", response_model=Graph)
def get_graph():
    return Graph(nodes=q.all_nodes(), edges=q.all_edges())
