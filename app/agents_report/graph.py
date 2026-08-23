"""Report agent graph."""
from langgraph.graph import StateGraph, START, END
from app.agents_report.state import ReportAgentState
from app.agents_report.nodes.gather_data import gather_data
from app.agents_report.nodes.analyze_progress import analyze_progress
from app.agents_report.nodes.compose_report import compose_report

def build_report_agent_graph() -> StateGraph:
    """Build the report agent graph."""
    workflow = StateGraph(ReportAgentState)
    
    workflow.add_node("gather_data", gather_data)
    workflow.add_node("analyze_progress", analyze_progress)
    workflow.add_node("compose_report", compose_report)
    
    workflow.add_edge(START, "gather_data")
    workflow.add_edge("gather_data", "analyze_progress")
    workflow.add_edge("analyze_progress", "compose_report")
    workflow.add_edge("compose_report", END)
    
    return workflow.compile()

# Module-level instance
report_agent = build_report_agent_graph()
