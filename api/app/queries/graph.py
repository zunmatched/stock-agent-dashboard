from app.db import query


def all_nodes() -> list[dict]:
    return query("SELECT id, label, display_name FROM dashboard.v_graph_nodes")


def all_edges() -> list[dict]:
    return query(
        "SELECT source_id, target_id, rel_type, edge_label, magnitude, rationale "
        "FROM dashboard.v_graph_edges"
    )
