"""
Kyron 2.0 — Unit and Integration Tests for RQ6 Adaptive Red-Team Evaluation (C14)
"""

import json
from pathlib import Path
from eval.adaptive_redteam import (
    run_adaptive_redteam_evaluation,
    evaluate_aa1_homoglyphs,
    evaluate_aa2_split_payload,
    evaluate_aa3_semantic_paraphrasing,
    evaluate_aa4_base64_covert,
    evaluate_aa5_toctou_swap,
    evaluate_aa6_sharded_micro_egress,
)


def test_individual_adaptive_attacks():
    # AA-1: Homoglyph injection
    aa1 = evaluate_aa1_homoglyphs()
    assert aa1["scanner_only"]["attack_outcome"] == "SUCCESS", "Scanner should fail on Cyrillic homoglyphs"
    assert aa1["kyron_full_stack"]["attack_outcome"] == "BLOCKED", "Kyron TRUSTDESC must block homoglyphs"

    # AA-2: Split payload
    aa2 = evaluate_aa2_split_payload()
    assert aa2["scanner_only"]["attack_outcome"] == "SUCCESS"
    assert aa2["kyron_full_stack"]["attack_outcome"] == "BLOCKED"

    # AA-3: Semantic paraphrasing
    aa3 = evaluate_aa3_semantic_paraphrasing()
    assert aa3["scanner_only"]["attack_outcome"] == "SUCCESS"
    assert aa3["kyron_full_stack"]["attack_outcome"] == "BLOCKED"

    # AA-4: Base64 covert instructions
    aa4 = evaluate_aa4_base64_covert()
    assert aa4["scanner_only"]["attack_outcome"] == "SUCCESS"
    assert aa4["kyron_full_stack"]["attack_outcome"] == "BLOCKED"

    # AA-5: TOCTOU swap
    aa5 = evaluate_aa5_toctou_swap()
    assert aa5["scanner_only"]["attack_outcome"] == "SUCCESS"
    assert aa5["kyron_full_stack"]["attack_outcome"] == "BLOCKED"

    # AA-6: Sharded micro-egress
    aa6 = evaluate_aa6_sharded_micro_egress()
    assert aa6["scanner_only"]["attack_outcome"] == "SUCCESS"
    assert aa6["kyron_full_stack"]["attack_outcome"] == "BLOCKED"


def test_full_adaptive_redteam_suite_and_artifacts():
    report = run_adaptive_redteam_evaluation()

    assert report["hypothesis_confirmed"] is True
    assert report["metrics"]["kyron_full_stack"]["attack_success_rate_pct"] == 0.0
    assert report["metrics"]["scanner_only"]["attack_success_rate_pct"] >= 80.0
    assert report["metrics"]["comparative_advantage"]["model_tokens_spent_on_hot_path"] == 0

    json_path = Path("eval/adaptive_redteam_results.json")
    assert json_path.exists(), "Results JSON must be written"
    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)
        assert data["evaluation_name"] == "RQ6: Adaptive Red-Team Adversarial Resilience Evaluation"

    md_path = Path("eval/ADAPTIVE_REDTEAM.md")
    assert md_path.exists(), "Markdown report must be written"
    content = md_path.read_text(encoding="utf-8")
    assert "RQ6 Empirical Report" in content
    assert "HYPOTHESIS CONFIRMED" in content
